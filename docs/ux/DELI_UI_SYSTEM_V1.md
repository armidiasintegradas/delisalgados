# DELI SALGADOS — UI SYSTEM V1 CANÔNICO
Fonte de verdade visual derivada das telas aprovadas no Stitch (Screens 01–16).

---

## 1. Cores Canônicas

| Token | Hex | Uso Observado no Stitch |
|---|---|---|
| `--color-coral-primary` | `#F56649` | Header gradient top, splash background, botões principais |
| `--color-coral-secondary` | `#EF6E54` | Header gradient bottom, badges de destaque |
| `--color-coral-accent` | `#E05A36` | Ícone ativo no Bottom Nav, badge do carrinho, destaques |
| `--color-brown-primary` | `#3C1F15` | Botões de ação (+ 100 un), barra flutuante do pedido, títulos principais |
| `--color-brown-dark` | `#4A3022` | Texto de títulos de seção, texto de preços, elementos estruturais escuros |
| `--color-brown-muted` | `#7A6357` | Descrições dos produtos, labels inativos no bottom nav, subtítulos |
| `--color-cream-base` | `#FFFDF9` | Fundo principal da aplicação |
| `--color-cream-card` | `#FEF0DF` | Fundo dos cards de produto |
| `--color-cream-chip` | `#FFF4E8` | Fundo de category chips inativos e badges secundários |
| `--color-sand-border` | `#F0E4D5` | Bordas de separação, divisórias e cart borders |
| `--color-whatsapp` | `#1FAA52` | Botão de envio WhatsApp (Screen 06) e tags de sucesso |
| `--color-text-white` | `#FFFFFF` | Título "Cardápio", texto na barra de pedido flutuante |

---

## 2. Tipografia Canônica

Fontes canônicas observadas:
- **Títulos Display / Marca**: Inter / Poppins / Serif acolhedora ("Cardápio" em negrito com drop shadow suave `#765244`)
- **Interface / Corpo / Dados**: Inter / System UI sans-serif com pesos refinados (400, 500, 600, 700, 800)

| Papel | Family | Weight | Size | Line-Height | Letter-Spacing | Cor |
|---|---|---|---|---|---|---|
| Header Screen Title ("Cardápio") | Serif / Sans Bold | 800 | 28px | 1.15 | -0.02em | `#FFFFFF` (shadow: 0 2px 4px rgba(74,48,34,0.35)) |
| Category Section Title ("Salgados & Fritos") | Sans | 800 | 20px | 1.2 | -0.02em | `#3C1F15` |
| Section Pill ("A PARTIR DE 100 UN.") | Sans | 700 | 10px | 1.0 | 0.05em | `#E05A36` (bg: `#FFF4E8`) |
| Product Name ("Coxinha") | Sans | 700 | 16px | 1.25 | -0.01em | `#3C1F15` |
| Product Description | Sans | 400 | 12.5px | 1.35 | normal | `#7A6357` |
| Product Price ("R$ 1,70 / UND") | Sans | 800 | 14.5px | 1.2 | -0.01em | `#3C1F15` |
| Product CTA Button ("+ 100 un") | Sans | 700 | 12px | 1.0 | 0.01em | `#FFFDF9` (bg: `#3C1F15`) |
| Category Rail Chip (Active) | Sans | 700 | 12.5px | 1.2 | normal | `#FFFDF9` (bg: `#3C1F15`) |
| Category Rail Chip (Inactive) | Sans | 600 | 12.5px | 1.2 | normal | `#614439` (bg: `#FFF4E8`) |
| Floating Cart Title ("Ver pedido") | Sans | 700 | 14px | 1.2 | -0.01em | `#FFFFFF` |
| Floating Cart Subtitle ("3 itens selecionados") | Sans | 500 | 11px | 1.2 | normal | `#E8D9CB` |
| Floating Cart Price ("R$ 445,00") | Sans | 800 | 16px | 1.1 | -0.02em | `#FFFFFF` |
| Bottom Nav Item Label ("CARDÁPIO") | Sans | 700 (active) / 600 (inactive) | 10px | 1.0 | 0.06em | `#E05A36` (active) / `#8C7367` (inactive) |

---

## 3. Geometria & Espaçamentos

| Elemento | Dimensão / Valor |
|---|---|
| Viewport Mobile Master | `390px × 844px` |
| Header Height | `84px` |
| Category Rail Height | `48px` |
| Category Chips Radius | `rounded-full` (9999px) |
| Product Card Radius | `rounded-2xl` (16px) |
| Product Card Padding | `14px 16px` |
| Product Card Gap | `10px` |
| Product Card Border | `1px solid #F2E5D6` |
| Button "+ 100 un" Radius | `rounded-full` (9999px) |
| Button "+ 100 un" Padding | `px-4 py-2` |
| Floating Cart Bar Radius | `rounded-full` (9999px) ou `rounded-2xl` (18px) |
| Floating Cart Bar Position | `bottom: 74px` (acima do bottom nav) |
| Bottom Navigation Height | `64px` |
| Bottom Navigation Border | `border-t 1px solid #EBDCCF` |

---

## 4. Ícones & Assets Canônicos
- **Ícones**: Lucide Icons (UtensilsCrossed, Sparkles, ClipboardList, User, Search, ShoppingBag, Plus, Check, ChevronRight).
- **Logo**: Símbolo do chef com chapéu e colher dentro de círculo claro (`src/components/public/Logo.tsx`).
- **Pattern**: Grãos e sutis formas de confeitaria/salgados com opacidade 0.04 no background.
