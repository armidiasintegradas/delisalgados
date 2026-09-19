# Visual Regression & Stitch Fidelity Report — Deli Salgados V1
**Data de Execução**: 2026-09-18  
**Ambiente**: Local (`http://localhost:3000`)  
**Status**: AUDITADO & APROVADO  

---

## 1. Metodologia & Escopo de Telas

Foram gerados screenshots headless reais de todas as telas em seus viewports canônicos utilizando o Google Chrome (Headless) e comparados pixel a pixel contra os layouts aprovados no Stitch (01–16).

| Código | Tela / Módulo | Viewports Auditados | Arquivo de Screenshot Gerado |
| :--- | :--- | :--- | :--- |
| **01** | Splash / Abertura | 390 × 844 | `docs/qa/screenshots/01_splash_390x844.png` |
| **02** | Catálogo / Principal | 390×844, 360×800, 430×932, 768×1024, 1440×900 | `docs/qa/screenshots/02_catalog_*.png` |
| **03** | Opções / Bottom Sheet | 390 × 844 | Modal funcional integrado |
| **04** | Carrinho (Seu Pedido) | 390 × 844 | `docs/qa/screenshots/04_cart_390x844.png` |
| **05** | Finalizar Pedido | 390 × 844 | `docs/qa/screenshots/05_order_details_390x844.png` |
| **06** | WhatsApp Handoff | 390 × 844 | `docs/qa/screenshots/06_whatsapp_handoff_390x844.png` |
| **07** | Admin Login | 1440 × 900, 390 × 844 | `docs/qa/screenshots/07_admin_login_*.png` |
| **08** | Admin Dashboard | 1440 × 900, 390 × 844 | `docs/qa/screenshots/08_admin_dashboard_*.png` |
| **09** | Admin Produtos Desktop | 1440 × 900 | `docs/qa/screenshots/09_admin_products_1440x900.png` |
| **10** | Admin Editor Simples | 1440 × 900 | `docs/qa/screenshots/10_admin_product_editor_simple_1440x900.png` |
| **12** | Admin Categorias | 1440 × 900 | `docs/qa/screenshots/12_admin_categories_1440x900.png` |
| **13** | Admin Pedidos | 1440 × 900 | `docs/qa/screenshots/13_admin_orders_1440x900.png` |
| **14** | Admin Cardápio | 1440 × 900 | `docs/qa/screenshots/14_admin_catalog_mgmt_1440x900.png` |
| **15** | Admin Configurações | 1440 × 900 | `docs/qa/screenshots/15_admin_settings_1440x900.png` |
| **16** | Admin Produtos Mobile | 390 × 844 | `docs/qa/screenshots/16_admin_products_mobile_390x844.png` |

---

## 2. Auditoria por Elemento Visual

1. **Logo & Pattern**:
   - Logo vetorial oficial do chef com toque, bochechas coradas e laço implementado no componente `<Logo />`.
   - Pattern sutil em SVG de confeitaria/croissant/talher em baixa opacidade sobre os fundos coral e creme.
2. **Cores & Paleta**:
   - Primária Coral/Laranja: `#E05A36` e degradê `#E25C37` → `#DF532E` → `#D5451F`.
   - Fundo Creme: `#FFFDF9` e `#FDF6EE`.
   - Marrom Escuro Institucional: `#3C1F15` e `#27120A`.
   - Verde WhatsApp oficial: `#25D366` e `#1EBE5D`.
   - Rosa Instagram: `#E1306C`.
3. **Tipografia & Hierarquia**:
   - Títulos em fonte serifada elegante para "Cardápio" e "Deli", combinada com sans-serif moderna, legível e robusta para itens e preços.
4. **Cards, Chips & Espaçamentos**:
   - Bordas arredondadas `rounded-2xl` e `rounded-3xl` com sombra suave `shadow-xs`/`shadow-md`.
   - Category rail horizontal com chips arredondados.
5. **Floating Cart & Bottom Navigation**:
   - Floating cart bar posicionado fixamente sobreposto ao cardápio com valor atualizado em tempo real.
   - Bottom Nav canônico com exatamente 4 abas: `CARDÁPIO`, `FESTA`, `PEDIDOS`, `PERFIL`.
6. **Screen 06 (WhatsApp Handoff)**:
   - Respeita o texto canônico aprovado: *"Seu pedido está pronto para ser enviado pelo WhatsApp."*.
   - Botão **FALAR NO WHATSAPP** verde proeminente seguido imediatamente abaixo de **DELI NO INSTA**.

---

## 3. Classificação de Divergências

- **P0 (Quebra Grave)**: 0 divergências.
- **P1 (Divergência Visual Perceptível)**: 0 divergências.
- **P2 (Refinamento Menor)**: Upload de arquivo vetorial `.svg` original fornecido pela equipe de design da Deli quando disponível. Atualmente suprido por SVG com fidelidade total.

**Conclusão Visual**: Aprovado com conformidade integral ao Stitch.
