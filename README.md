# Deli Salgados — Cardápio Digital & Painel Operacional

Sistema completo de Cardápio Digital Público e Painel Administrativo da **Deli Salgados**, construído com Next.js 15, React 19, TypeScript, Tailwind CSS e Supabase (PostgreSQL), com 100% de paridade visual (16/16 telas aprovadas) com as diretrizes aprovadas de design do Stitch.

🌐 **Deploy em Produção**: [https://delisalgados.vercel.app](https://delisalgados.vercel.app)  
📦 **Release**: `v2.5` | **Status**: 100% Aprovado em todos os 24 Quality Gates

---

## 🎯 Destaques do Projeto

- **Fidelidade Visual Stitch**: 16/16 telas aprovadas com zero defeitos P0/P1.
- **Autoridade Única do Banco de Dados**: Supabase / PostgreSQL como única fonte da verdade canônica para categorias, produtos, variantes, configurações operacionais e pedidos.
- **Proteção Server-Side**: Recalculação mandatória de preços no servidor — proteção contra tampering e spoofing de valores no checkout.
- **Categorias e Nomenclatura Canônica**:
  - `Salgados` (canônico)
  - `Empadas` (canônico)
  - 11 categorias canônicas organizadas e integradas.
- **Navegação Canônica Stitch**:
  - Cardápio Público Mobile: `CARDÁPIO`, `FESTA`, `PEDIDOS`, `PERFIL`
  - Painel Admin Desktop & Mobile: Visão Geral, Produtos, Categorias, Pedidos, Cardápio, Configurações
- **Handoff Humanizado para WhatsApp**: Geração de código público (`#DL-0042`) e mensagem formatada pronta para atendimento.
- **Testes & Qualidade**: 24/24 testes automatizados cobrindo integridade de catálogo, segurança contra spoofing, snapshot de pedidos históricos, CRUD administrativo, handshake social e auditoria de dados.

---

## 🚀 Como Executar Localmente

### 1. Clonar e Instalar Dependências
```bash
npm install
```

### 2. Configurar Variáveis de Ambiente
Copie o arquivo `.env.example` para `.env.local` e insira suas credenciais do Supabase:
```bash
cp .env.example .env.local
```

### 3. Rodar o Servidor de Desenvolvimento
```bash
npm run dev
```
Acesse `http://localhost:3000` para o cardápio público e `http://localhost:3000/admin` para o painel de gestão.

### 4. Executar Testes Automatizados e Auditoria de Qualidade
```bash
# Executa todos os 24 testes automatizados de segurança e integridade
npm test

# Validação estática de tipagem TypeScript
npm run typecheck

# Análise estática de código ESLint
npm run lint
```

---

## 📱 Matriz de Telas Aprovadas (16/16)

| # | Tela | Viewport | Status |
| :---: | :--- | :---: | :---: |
| 01 | Splash Screen | 390×844 | APPROVED |
| 02 | Catalog Main | 390×844 | APPROVED |
| 03 | Product Options (Modal) | 390×844 | APPROVED |
| 04 | Cart Review | 390×844 | APPROVED |
| 05 | Order Details / Checkout | 390×844 | APPROVED |
| 06 | WhatsApp Handoff | 390×844 | APPROVED |
| 07 | Admin Login | 1440×900 | APPROVED |
| 08 | Admin Dashboard | 1440×900 | APPROVED |
| 09 | Admin Products Management | 1440×900 | APPROVED |
| 10 | Admin Product Simple Editor | 1440×900 | APPROVED |
| 11 | Admin Product Variants Editor | 1440×900 | APPROVED |
| 12 | Admin Categories Operations | 1440×900 | APPROVED |
| 13 | Admin Orders Management | 1440×900 | APPROVED |
| 14 | Admin Catalog Presentation | 1440×900 | APPROVED |
| 15 | Admin Settings | 1440×900 | APPROVED |
| 16 | Admin Products Mobile | 390×844 | APPROVED |

---

## 🛡️ Segurança & Integridade de Dados

- **Zero Secrets no Client**: Validação estrita contra vazamento de `service_role_key` ou tokens sensíveis no bundle cliente.
- **RLS & Integridade**: Políticas ativas no PostgreSQL garantem leitura pública autorizada do cardápio e mutações restritas ao painel administrativo.
- **Snapshots Imutáveis**: Pedidos gravam snapshots de nome, preço e variação, protegendo históricos contábeis de alterações futuras no cardápio.
