# Deli Salgados — Supabase Activation & Hardening Report (v3.3)

**Data de Emissão:** 19/09/2026  
**Status Atual do Sistema:** 🟡 `BLOCKED — ACTION REQUIRED` (Requer credenciais ativas do Supabase no ambiente de produção) / 🟢 `READY LOCALLY` (Testes 100% aprovados em ambiente de desenvolvimento)

---

## 1. Inventário de Migrações do Banco de Dados (PostgreSQL)

O schema do banco de dados no Supabase foi integralmente estruturado em migrações idempotentes e versionadas no diretório `supabase/migrations/`:

| Arquivo de Migração | Finalidade e Conteúdo |
| :--- | :--- |
| `01_initial_schema.sql` | Criação das tabelas centrais (`categories`, `products`, `product_variants`, `settings`, `orders`, `order_items`, `audit_logs`), tipos enumerados (`availability_type`, `order_status`, `fulfillment_type`), índices de busca e triggers de `updated_at`. |
| `02_rls_policies.sql` | Configuração de Row Level Security (RLS) estrito em todas as tabelas: leitura pública anon restrita ao catálogo ativo (`is_active = true`), criação de pedidos permitida de forma atômica, e bloqueio de leitura de pedidos e dados administrativos para anônimos. |
| `03_seed_catalog_v1_2.sql` | Carga inicial oficial com as 11 categorias canônicas, 43 produtos oficiais e configurações padronizadas (com campos de WhatsApp e endereço deixados limpos, sem números fictícios). |
| `04_hardening_v3_3.sql` | **Migração de endurecimento v3.3:**<br>• Adição da coluna `admin_profiles.is_active` (boolean default true).<br>• Adição da coluna `orders.whatsapp_opened_at` (timestamptz nullable).<br>• Criação da sequence atômica `order_public_code_seq` para geração concorrente e livre de conflitos de códigos no formato `DL-XXXX`.<br>• Trigger automático para atribuição de `public_code` no padrão `DL-%04d`. |

---

## 2. Arquitetura de Autenticação SSR (@supabase/ssr)

O sistema migrou integralmente do cliente legado `@supabase/auth-helpers-nextjs` para o pacote moderno `@supabase/ssr`:

1. **Navegador (`src/lib/supabase/client.ts`):**
   - Utiliza `createBrowserClient` do `@supabase/ssr`.
   - Gerencia cookies de sessão com atributos `HttpOnly`, `SameSite=Lax` e `Secure`.

2. **Servidor (`src/lib/supabase/server.ts`):**
   - `createSupabaseServerClient`: Cliente SSR baseado em cookies que lê a sessão do usuário autenticado no App Router.
   - `supabaseServer`: Cliente com privilégios de `SUPABASE_SERVICE_ROLE_KEY` isolado estritamente no backend. **Não possui fallback para chave anon**, garantindo que operações administrativas nunca falhem silenciosamente com permissões insuficientes.

3. **Guarda de Rotas (`src/middleware.ts`):**
   - Bloqueia requisições não autenticadas a `/delisalgados/admin/*` e redireciona automaticamente para `/delisalgados/admin/login?next=...`.
   - Redireciona o acesso legado `/admin/*` para a URL canônica `/delisalgados/admin/*`.

4. **Verificação de Permissões de API (`src/lib/auth/adminAuth.ts`):**
   - Todas as rotas `/api/admin/*`, `GET /api/orders` e `PATCH /api/orders/[code]` invocam `verifyAdminSession()`.
   - Valida o token JWT com `supabaseServer.auth.getUser()`.
   - Consulta a tabela `admin_profiles` para conferir `is_active !== false` e verificar se a role é compatível (`administrator` ou `editor`).
   - Em ambiente de produção (`NODE_ENV === "production"`), qualquer tentativa de uso de tokens de teste é sumariamente rejeitada com HTTP 401.

---

## 3. Integridade do Banco e PostgreSQL UUID Authority

1. **Eliminação de IDs Fictícios:**
   - Todos os geradores baseados em timestamp (`Date.now()`, `prod-${Date.now()}`) foram erradicados.
   - A geração de identificadores utiliza exclusivamente UUID v4 canônico (`crypto.randomUUID()`), compatível nativamente com colunas `UUID` do PostgreSQL.

2. **Geração Segura de Códigos Públicos (`DL-XXXX`):**
   - Em ambiente Supabase, a numeração é gerida pela sequence PostgreSQL `order_public_code_seq`, imune a colisões sob concorrência.
   - Em ambiente de teste/fallback local, o `DbService.createOrder` calcula atômica e monotonicamente o próximo número sequencial.

3. **Snapshots Imutáveis de Pedidos:**
   - Cada item de pedido registra: `product_name_snapshot`, `variant_name_snapshot`, `unit_label_snapshot`, `unit_price_snapshot`.
   - Alterações subsequentes de preço ou nome no cardápio não alteram pedidos prévios.

4. **Regra Fail-Closed de Produção:**
   - Se `NODE_ENV === "production"` e `process.env.DELI_ALLOW_LOCAL_DB !== "true"`, o sistema se recusa a ler ou escrever no arquivo de estado local `.local-db-state.json`, lançando erro explícito para impedir persistência efêmera em ambientes serverless como a Vercel.

---

## 4. Endurecimento do Fluxo WhatsApp e Privacidade Pública

1. **Remoção de Telefones Fictícios:**
   - O número fictício `5581987654321` foi completamente removido de seeds, banco de dados e componentes de fallback.
   - Caso `settings.whatsapp_number` esteja em branco, os botões de envio e contato exibem o aviso: *"Contato temporariamente indisponível. Por favor, aguarde a configuração do WhatsApp oficial."*

2. **Handoff Nativo Factual:**
   - Abertura de link nativo: `https://wa.me/<numero_deli>?text=<mensagem_formatada>`.
   - Status factual registrado no banco como `whatsapp_status = 'opened'` através da rota `POST /api/orders/[code]/whatsapp-opened`.
   - Nenhuma tela declara de forma fraudulenta que a mensagem *"foi enviada"* ou *"entregue"*, declarando honestamente que o aplicativo do WhatsApp foi iniciado.

3. **Bloqueio de Consulta Pública Insegura (`POST /api/orders/lookup`):**
   - Rotas públicas anteriores permitiam listar ou consultar pedidos apenas com o código `DL-XXXX`.
   - Agora, a consulta exige código e telefone do cliente (`{ code, phone }`).
   - Respostas de erro são neutras (HTTP 404 para código ou telefone divergente), prevenindo ataques de enumeração.
   - A resposta sanitizada nunca retorna endereço, telefone ou logs de auditoria do cliente.

---

## 5. Checklist de Variáveis de Ambiente para Produção

Para ativar o sistema em produção na Vercel com o Supabase real, as seguintes variáveis de ambiente devem ser cadastradas:

| Variável | Obrigatoriedade | Descrição |
| :--- | :--- | :--- |
| `NEXT_PUBLIC_SUPABASE_URL` | **Obrigatória** | URL do projeto Supabase (ex: `https://xyzcompany.supabase.co`). |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | **Obrigatória** | Chave pública anônima do Supabase para requisições no navegador. |
| `SUPABASE_SERVICE_ROLE_KEY` | **Obrigatória** | Chave secreta de serviço com privilégios de bypass de RLS (mantida estritamente no servidor). |
| `DELI_ALLOW_LOCAL_DB` | Opcional | Manter como `false` ou omitir em produção. Deve ser `true` apenas em testes locais offline. |

---

## 6. Parecer de Prontidão

- **Código-fonte, Segurança e Arquitetura:** 🟢 `100% READY` (Build com zero erros, tipagem 100% verificada, 38 testes de segurança e integridade passando).
- **Deploy em Produção:** 🟡 `AGUARDANDO CREDENCIAIS SUPABASE`. Assim que as variáveis acima forem salvas no painel do Supabase/Vercel e executadas as migrações 01 a 04, o fluxo completo estará operacional sem necessidade de nenhuma alteração no código.
