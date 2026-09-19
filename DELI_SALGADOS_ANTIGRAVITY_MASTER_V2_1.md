# DELI SALGADOS — ANTIGRAVITY MASTER IMPLEMENTATION PROMPT V2.1
## FINAL APPROVED HANDOFF — STITCH → ANTIGRAVITY → SUPABASE

PROJETO:
**DELI SALGADOS — DIGITAL MENU V1**

STATUS:
**DESIGN APROVADO NO STITCH.**
A fase de design está encerrada. A partir de agora, o trabalho é implementação funcional com fidelidade visual.

---

# 1. REGRA PRINCIPAL

NÃO redesenhar.

NÃO reinterpretar a interface.

NÃO substituir componentes aprovados por padrões genéricos.

As telas aprovadas no Stitch são a **fonte visual canônica**.

## PUBLIC
01 — Splash / Opening  
02 — Catalog / Main  
03 — Product Options  
04 — Cart / Seu Pedido  
05 — Order Details / Finalizar Pedido  
06 — WhatsApp Handoff  

## ADMIN
07 — Admin / Login  
08 — Admin / Dashboard  
09 — Admin / Products  
10 — Admin / Product Editor — Simple  
11 — Admin / Product Editor — Variants  
12 — Admin / Categories  
13 — Admin / Orders  
14 — Admin / Catalog Management  
15 — Admin / Settings  
16 — Admin / Products — Mobile  

Preservar:
- identidade coral/laranja;
- creme;
- marrom escuro;
- logo oficial;
- pattern;
- hierarquia tipográfica;
- raios;
- espaçamentos;
- cards;
- chips;
- botões;
- barra flutuante do carrinho;
- bottom navigation;
- bottom sheet;
- sidebar administrativa;
- densidade das tabelas;
- status pills;
- linguagem visual aprovada no Stitch.

---

# 2. OBJETIVO DO PRODUTO

Criar um catálogo digital mobile-first editável para a Deli Salgados.

O cliente:
1. abre o link;
2. vê a splash;
3. entra no cardápio;
4. navega por categorias;
5. escolhe itens e variantes;
6. monta carrinho;
7. informa dados;
8. revisa;
9. envia solicitação detalhada para o WhatsApp da Deli.

Não criar e-commerce tradicional.

NÃO implementar:
- pagamento online;
- cartão;
- PIX;
- login de cliente;
- conta de consumidor;
- frete automatizado;
- ERP;
- emissão fiscal;
- marketplace.

---

# 3. ARQUITETURA RECOMENDADA

Frontend:
- Next.js
- React
- TypeScript
- Tailwind CSS

Backend:
- Supabase PostgreSQL

Auth:
- Supabase Auth

Validação:
- Zod

Forms:
- React Hook Form

Deploy futuro:
- Vercel ou equivalente

Nesta fase:
**NÃO PUBLICAR PRODUÇÃO.**

---

# 4. ROTAS PÚBLICAS

/
 /pedido
 /pedido/finalizar
 /pedido/enviado

Rotas podem ser implementadas como páginas, drawers ou sheets conforme a fidelidade ao Stitch.

Sem autenticação pública.

---

# 5. ROTAS ADMIN

/admin/login
/admin
/admin/produtos
/admin/produtos/novo
/admin/produtos/[id]
/admin/categorias
/admin/pedidos
/admin/pedidos/[id]
/admin/cardapio
/admin/configuracoes

Autenticação obrigatória.

---

# 6. SPLASH

Implementar exatamente o conceito aprovado:

- 390 × 844 como referência mobile;
- fundo coral/laranja;
- pattern oficial em baixa opacidade;
- logo oficial centralizada;
- sem texto desnecessário;
- sem spinner;
- sem loading artificial.

Transição:
1,2–1,8 s aproximadamente.

Respeitar `prefers-reduced-motion`.

---

# 7. CATÁLOGO PÚBLICO

O catálogo lê dados reais do Supabase.

Comportamento:
- categorias ativas;
- ordenação persistida;
- produtos visíveis;
- disponibilidade;
- preços;
- variantes;
- pedido mínimo;
- busca;
- filtro por categoria;
- navegação mobile.

Por padrão, exibir somente:
- categoria ativa;
- produto `is_visible = true`;
- produto disponível, exceto se configuração permitir exibir indisponíveis.

---

# 8. CATEGORIAS CANÔNICAS

1. Empadas
2. Trouxinhas
3. Tortas Salgadas
4. Massa Folhada
5. Canapés
6. Quiches
7. Vol-au-vent
8. Salgados
9. Diversos
10. Bolinhos
11. Mini Sanduíches

Admin pode:
- criar;
- editar;
- ativar/desativar;
- reordenar.

Não apagar automaticamente histórico.

---

# 9. PRODUTOS

Suportar:

## Preço simples
Exemplo:
Coxinha  
R$ 1,70 / UND

## Variantes
Exemplo:
Camarão Empanado — 1 kg  
Congelado — R$ 175,00  
Frito — R$ 195,00

## Regras
- unidade;
- pedido mínimo;
- observação opcional;
- descrição opcional;
- imagem opcional;
- disponibilidade;
- visibilidade;
- ordem;
- destaque opcional.

---

# 10. DADOS CANÔNICOS

Usar como fonte de dados atual:

`DELI_SALGADOS_CURRENT_CATALOG_V1_2.json`

Usar como referência de migração:

`DELI_SALGADOS_AVAILABILITY_PATCH_V1_2.sql`

Esperado:
- 11 categorias;
- 43 produtos atualmente disponíveis;
- histórico preservado;
- variantes antigas mantidas como inativas quando aplicável.

IMPORTANTE:
**Não usar mock data do Stitch como dado oficial.**

Não usar como canônico:
- fotos geradas;
- descrições inventadas;
- ingredientes inventados;
- clientes fictícios;
- pedidos fictícios;
- métricas fictícias;
- números de produção fictícios.

---

# 11. PREÇOS-CHAVE ATUAIS

Validar, entre outros:

Coxinha — R$ 1,70  
Risoles de Carne — R$ 1,80  
Bolinho de Queijo — R$ 2,00  
Bolinho de Presunto e Queijo — R$ 2,30  
Bolinho de Calabresa — R$ 1,80  
Bolinho de Bacalhau — R$ 5,10  
Pastelzinho de Festa — R$ 2,30  

Empadinha de Frango — R$ 3,90  
Empadinha de Camarão — R$ 4,90  
Empadinha de Bacalhau — R$ 4,90  

Tortinha de Doce de Leite Condensado — R$ 3,50  
Canudinho de Frango — R$ 3,70  
Canudinho de Carne — R$ 3,95  

Mini Burger — R$ 5,00  
Mini Hot Dog — R$ 3,95  

Camarão Empanado 1 kg:
- Congelado — R$ 175,00
- Frito — R$ 195,00

Torta Salgada de Frango 1,5 kg — R$ 170,00  
Torta Salgada de Bacalhau 1,5 kg — R$ 230,00  

Trouxinha de Frango com Queijo — R$ 6,00  
Trouxinha de Bacalhau — R$ 6,90  

Mini Quiche de Alho-Poró — R$ 3,95  
Mini Quiche de Frango — R$ 4,00  
Mini Quiche Romeu e Julieta — R$ 4,00  
Mini Quiche Nordestino — R$ 4,50  
Mini Quiche de Tomate Seco com Queijo — R$ 5,00  
Mini Quiche de Queijo do Reino — R$ 5,50  
Mini Quiche de Gorgonzola com Damasco — R$ 5,50  
Mini Quiche de Bacalhau — R$ 5,00  
Mini Quiche de Queijo — R$ 4,00  
Mini Quiche de Camarão Inteiro com Queijo — R$ 5,00  

Trouxinha Folhada de Frango com Cream Cheese — R$ 6,00  
Pastel de Frango em Massa Folhada com Cream Cheese — R$ 6,00  
Pastel de Camarão com Cream Cheese — R$ 7,00  
Folhado de Ameixa com Bacon — R$ 5,90  
Mini Croissant de Queijo com Presunto — R$ 3,50  
Trouxinha de Massa Folhada com Damasco e Gorgonzola — R$ 8,00  
Flor de Massa Folhada de Salaminho — R$ 7,50  

Vol-au-vent de Camarão — R$ 8,00  
Vol-au-vent de Gorgonzola com Damasco e Amêndoas Laminadas — R$ 8,90  

Barquete de Presunto Parma com Cream Cheese — R$ 8,90  
Barquete de Gorgonzola com Damasco e Amêndoas Laminadas — R$ 8,90  

Canapé de Salaminho — R$ 6,00  
Canapé de Frango — R$ 4,60  

A lista completa deve vir do JSON canônico.

---

# 12. REGRA IMPORTANTE SOBRE O STITCH

Exemplo visual no Admin:

Empadinha de Camarão
R$ 4,90 → R$ 5,20

Isso demonstra a UX de edição.

**Não alterar o seed para R$ 5,20.**

O preço atual continua:
R$ 4,90

Até o admin realmente editar no sistema real.

---

# 13. CARRINHO

Persistir durante a jornada.

Pode usar:
- localStorage;
- store client-side equivalente.

Guardar:
- product ID;
- variant ID;
- quantidade;
- nota;
- preço exibido;
- dados necessários à UI.

O servidor deve recalcular o preço antes de salvar o pedido.

---

# 14. DADOS DO CLIENTE

Sem conta.

Campos:
- Nome completo;
- WhatsApp para contato;
- Data desejada;
- Modalidade: Retirada / Entrega / A combinar;
- Endereço quando necessário;
- Observações gerais.

Esses dados permanecem editáveis até o handoff para WhatsApp.

Se cliente voltar para o carrinho:
não perder formulário.

Se cliente voltar para o catálogo:
não perder carrinho.

---

# 15. PEDIDO

Antes de abrir WhatsApp:

1. validar dados;
2. validar produtos;
3. validar variantes;
4. validar preços;
5. calcular totais no servidor;
6. criar `orders`;
7. criar `order_items`;
8. gerar `public_code`;
9. gerar mensagem;
10. abrir WhatsApp.

---

# 16. SNAPSHOT DE PEDIDO

CRÍTICO.

`order_items` deve preservar:

- product_name_snapshot;
- variant_name_snapshot;
- unit_label_snapshot;
- unit_price_snapshot;
- quantity;
- subtotal;
- note.

Se preço mudar amanhã:
pedido antigo não muda.

---

# 17. WHATSAPP

Número de destino vem de `settings`.

Nunca hardcode apenas no frontend.

Mensagem organizada em português.

Nunca usar:
“Pedido confirmado”.

Usar:
“Solicitação”
ou
“Pedido enviado para confirmação”.

---

# 18. INSTAGRAM

Instagram atual:

https://www.instagram.com/deli.salgados

Guardar em `settings.instagram_url`.

Na área pública:

abaixo do botão:
**FALAR NO WHATSAPP**

criar:
**DELI NO INSTA**

Com ícone do Instagram.

Mesma família visual do botão WhatsApp.

Se `instagram_url` estiver vazio:
ocultar o botão.

Admin deve poder alterar o link.

---

# 19. BACKEND — TABELAS

Criar/migrar:

- categories
- products
- product_variants
- orders
- order_items
- settings
- catalog_notices
- admin_profiles
- audit_logs

---

# 20. CATEGORIES

Campos sugeridos:

id uuid
name
slug
sort_order
is_active
created_at
updated_at

Slug gerado automaticamente.

Não expor como campo obrigatório ao usuário do admin.

---

# 21. PRODUCTS

Campos:

id uuid
category_id uuid
name text
slug text
description nullable
note nullable
unit_label
minimum_quantity
price_type
base_price
availability
is_visible
is_featured
sort_order
image_url nullable
created_at
updated_at

price_type:
- simple
- variants

availability:
- available
- unavailable
- on_request

---

# 22. PRODUCT VARIANTS

Campos:

id
product_id
name
price
unit_label
minimum_quantity
sort_order
is_active
created_at
updated_at

Variantes históricas não devem ser apagadas automaticamente.

---

# 23. ORDERS

Campos:

id
public_code
customer_name
customer_phone
desired_date
fulfillment_type
delivery_address
customer_note
total
status
whatsapp_status
created_at
updated_at

---

# 24. ORDER ITEMS

Campos:

id
order_id
product_id nullable
variant_id nullable
product_name_snapshot
variant_name_snapshot
unit_label_snapshot
quantity
unit_price_snapshot
subtotal
note

---

# 25. SETTINGS

Suportar no mínimo:

business_name

whatsapp_number

instagram_url

address

pickup_information

delivery_information

whatsapp_opening_message

whatsapp_closing_message

logo_url

pattern_url

catalog_show_search

catalog_show_prices

catalog_show_unavailable

special_order_cta_enabled

special_order_cta_text

---

# 26. CATALOG NOTICE

Permitir aviso temporário.

Campos:

message
is_active
starts_at
ends_at

Exemplo:

“Encomendas para este fim de semana até sexta-feira às 18h.”

---

# 27. ADMIN AUTH

Supabase Auth.

Perfis iniciais:

administrator

editor

Administrator:
acesso total.

Editor:
produtos
preços
disponibilidade
categorias
pedidos

Configurações sensíveis e usuários:
administrator.

---

# 28. RLS

Ativar RLS.

Público pode:
- ler categorias ativas;
- ler produtos permitidos;
- ler variantes permitidas.

Público não pode:
- editar catálogo;
- ler todos os pedidos;
- ler dados administrativos;
- alterar settings.

Pedido público deve ser criado por:
- server action;
- API route;
- Supabase RPC segura.

Nunca liberar insert arbitrário direto do browser.

---

# 29. PREÇO É AUTORIDADE DO SERVIDOR

Nunca confiar no total enviado pelo cliente.

O servidor deve:

- buscar preço real;
- validar variante;
- validar disponibilidade;
- calcular subtotal;
- calcular total;
- criar pedido.

---

# 30. ADMIN DASHBOARD

Dados reais do banco.

Não usar números fictícios do Stitch.

Mostrar:
- disponíveis;
- indisponíveis;
- ocultos;
- solicitações hoje.

Se banco estiver vazio:
mostrar 0.

---

# 31. ADMIN — PRODUTOS

CRUD real:

- criar;
- editar;
- duplicar;
- ocultar;
- reativar;
- marcar indisponível;
- marcar sob consulta;
- reordenar;
- editar preço;
- editar mínimo;
- editar imagem;
- editar descrição;
- editar nota;
- mover categoria.

Excluir definitivamente:
não ser ação primária.

---

# 32. ATUALIZAÇÃO RÁPIDA DE PREÇOS

Implementar:

**ATUALIZAR PREÇOS**

Lista compacta editável.

Salvar em lote.

Validar.

Mostrar feedback:

“4 preços atualizados.”

---

# 33. DISPONIBILIDADE DE HOJE

Implementar controle rápido.

Estados:

Disponível

Indisponível

Sob consulta

Alteração deve refletir imediatamente no catálogo público.

---

# 34. AÇÕES EM MASSA

Permitir selecionar produtos e:

- marcar disponível;
- marcar indisponível;
- ocultar;
- mostrar;
- mover categoria.

Não incluir delete permanente em massa.

---

# 35. CATEGORIAS

Implementar:

- criar;
- editar;
- ativar;
- desativar;
- reordenar.

Público respeita nova ordem.

---

# 36. PEDIDOS NO ADMIN

Lista com:

Código

Cliente

WhatsApp

Data desejada

Modalidade

Itens

Total estimado

Criado em

Status

Status internos:

generated
contacted
confirmed
preparing
completed
cancelled

Português:

Solicitação gerada
Cliente contatado
Confirmado pela Deli
Em preparação
Concluído
Cancelado

---

# 37. DETALHE DO PEDIDO

Mostrar:

- cliente;
- WhatsApp;
- data;
- modalidade;
- endereço;
- itens;
- variantes;
- quantidades;
- notas;
- total;
- mensagem WhatsApp;
- timeline/status.

Ações:

ABRIR WHATSAPP

COPIAR PEDIDO

ALTERAR STATUS

---

# 38. ADMIN — CARDÁPIO

Implementar configurações públicas:

Título principal

Aviso do catálogo

Mostrar busca

Mostrar preços

Mostrar indisponíveis

CTA especial

Texto do CTA

WhatsApp

Instagram

---

# 39. ADMIN — CONFIGURAÇÕES

Seções:

## EMPRESA
Nome comercial
WhatsApp
Instagram
Endereço

## PEDIDOS
Número de destino
Mensagem inicial
Mensagem final

## RETIRADA / ENTREGA
Informações de retirada
Informações de entrega

## IDENTIDADE
Logo oficial
Pattern oficial

## ACESSO
Usuários administrativos
Trocar senha

---

# 40. MARCA

Logo e pattern oficiais são ativos canônicos.

Não:
- redesenhar;
- gerar por IA;
- substituir automaticamente;
- recolorir.

Se ainda não estiverem disponíveis como arquivos isolados:
usar placeholder e marcar pendência.

---

# 41. FOTOS DE PRODUTO

Campo opcional.

Fotos geradas no Stitch são placeholders.

Não tratá-las como fotos oficiais.

Catálogo deve funcionar perfeitamente sem foto.

---

# 42. AUDIT LOG

Registrar eventos importantes:

- preço alterado;
- disponibilidade alterada;
- produto ocultado;
- categoria alterada;
- configuração alterada.

Campos:

actor
action
entity_type
entity_id
metadata/before-after
timestamp

---

# 43. FEEDBACK DE SALVAMENTO

Toda escrita precisa de:

loading

success

error

Exemplos:

Produto atualizado com sucesso.

Preço atualizado.

Disponibilidade alterada.

Configurações salvas.

---

# 44. ALTERAÇÕES NÃO SALVAS

Se usuário sair de formulário editado:

“Você possui alterações não salvas.”

Ações:

Continuar editando

Descartar alterações

---

# 45. RESPONSIVIDADE

PUBLIC:

390 × 844
360 × 800
430 × 932
768 × 1024
1440 × 900

ADMIN:

1440 × 900
390 × 844

No mobile admin:
não reduzir tabela desktop.

Usar cards/rows mobile como aprovado no Stitch.

---

# 46. TESTES

Criar testes para:

- total simples;
- pedido mínimo;
- variantes;
- produto em peso;
- carrinho persistente;
- formulário persistente;
- validação server-side de preço;
- snapshots;
- mensagem WhatsApp;
- produto oculto;
- produto indisponível;
- produto sob consulta;
- ordenação de categorias;
- auth admin;
- edição de preço;
- disponibilidade;
- link Instagram;
- configurações;
- criação de produto;
- variante ativa/inativa;
- pedido histórico.

---

# 47. VISUAL REGRESSION

Comparar a implementação com Stitch.

Não aceitar:
“parecido”.

Checar:

- logo;
- cores;
- fonts;
- spacing;
- radius;
- card dimensions;
- sticky header;
- category rail;
- floating cart;
- bottom nav;
- bottom sheet;
- admin sidebar;
- admin table density;
- buttons;
- status pills.

---

# 48. IMPLEMENTATION ORDER

## PHASE A
repo + dependencies + env

## PHASE B
Supabase schema + migrations + RLS

## PHASE C
canonical seed/current data

## PHASE D
public splash + catalog

## PHASE E
product options + cart

## PHASE F
customer form

## PHASE G
server-side order creation

## PHASE H
WhatsApp handoff + Instagram CTA

## PHASE I
admin auth

## PHASE J
products/categories CRUD

## PHASE K
orders/catalog/settings

## PHASE L
mobile admin

## PHASE M
tests

## PHASE N
visual regression

---

# 49. DEPLOY GATE

NÃO publicar produção.

NÃO fazer deploy final.

NÃO fazer mudanças externas irreversíveis sem revisão.

Primeiro entregar local/staging.

---

# 50. PRIMEIRO OUTPUT OBRIGATÓRIO

Ao concluir a primeira passada, responder com:

1. árvore principal do repositório;
2. stack final;
3. migrations criadas;
4. políticas RLS;
5. quantidade de categorias;
6. quantidade de produtos disponíveis;
7. quantidade de variantes ativas;
8. rotas públicas implementadas;
9. rotas admin implementadas;
10. CRUDs funcionais;
11. status do carrinho;
12. status da criação server-side de pedido;
13. status do WhatsApp;
14. status do Instagram;
15. testes executados;
16. build;
17. typecheck;
18. lint;
19. pendências;
20. comando para rodar localmente;
21. URL local;
22. variáveis de ambiente necessárias;
23. ativos oficiais ainda faltantes;
24. confirmação de que produção NÃO foi publicada.

---

# 51. CRITÉRIOS DE ACEITE

A implementação só pode avançar para deploy quando:

- [ ] Stitch reproduzido com fidelidade;
- [ ] 11 categorias;
- [ ] 43 produtos disponíveis;
- [ ] dados históricos preservados;
- [ ] preços atuais corretos;
- [ ] admin edita preço;
- [ ] admin edita disponibilidade;
- [ ] admin cria produto;
- [ ] admin oculta/reativa;
- [ ] admin cria/edita categoria;
- [ ] admin edita variantes;
- [ ] carrinho persiste;
- [ ] cliente edita dados;
- [ ] pedido é salvo antes do WhatsApp;
- [ ] snapshots preservam histórico;
- [ ] WhatsApp usa número configurável;
- [ ] Instagram usa setting configurável;
- [ ] “Deli no Insta” aparece abaixo do WhatsApp;
- [ ] dashboard usa dados reais;
- [ ] RLS ativo;
- [ ] service-role não aparece no client;
- [ ] testes passam;
- [ ] responsividade validada;
- [ ] nenhuma descrição inventada foi transformada em conteúdo oficial;
- [ ] produção continua bloqueada até aprovação.

---

# 52. INSTRUÇÃO FINAL

IMPLEMENTAR.

NÃO REDESENHAR.

NÃO INVENTAR DADOS.

NÃO PUBLICAR PRODUÇÃO.

Use o Stitch como autoridade visual e os arquivos canônicos do catálogo como autoridade de dados.
