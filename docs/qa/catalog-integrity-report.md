# Relatório de Integridade do Catálogo Canônico — Deli Salgados V1.2
**Data de Efetivação**: 2026-09-18  
**Autoridade de Dados**: `DELI_SALGADOS_CURRENT_CATALOG_V1_2.json` e `DELI_SALGADOS_AVAILABILITY_PATCH_V1_2.sql`  
**Status**: 100% CANÔNICO & VALIDADO  

---

## 1. Resumo Quantitativo

| Métrica | Valor Apurado no Banco | Status |
| :--- | :--- | :--- |
| **Categorias Canônicas Ativas** | **11** | Conforme |
| **Produtos Atualmente Disponíveis** | **43** | Conforme |
| **Variantes Ativas** | **4** | Conforme |
| **Variantes Históricas Desativadas (Preservadas)** | **18** | Conforme |
| **Produtos Ocultos / Fora de Linha** | Preservados via Snapshot | Conforme |

---

## 2. Categorias Canônicas Auditadas (Ordem Canônica)
1. `empadas` — Empadas (Ordem: 1)
2. `trouxinhas` — Trouxinhas (Ordem: 2)
3. `tortas-salgadas` — Tortas Salgadas (Ordem: 3)
4. `massa-folhada` — Massa Folhada (Ordem: 4)
5. `canapes` — Canapés (Ordem: 5)
6. `quiches` — Quiches (Ordem: 6)
7. `vol-au-vent` — Vol-au-vent (Ordem: 7)
8. `salgados` — Salgados (Ordem: 8)
9. `diversos` — Diversos (Ordem: 9)
10. `bolinhos` — Bolinhos (Ordem: 10)
11. `mini-sanduiches` — Mini Sanduíches (Ordem: 11)

---

## 3. Auditoria Explícita de Preços-Chave

| Item | Categoria | Unidade | Pedido Mínimo | Preço Canônico | Preço no Banco | Status |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Coxinha** | Salgados | UND | 100 | R$ 1,70 | **R$ 1,70** | Validado |
| **Risoles de Carne** | Salgados | UND | 100 | R$ 1,80 | **R$ 1,80** | Validado |
| **Bolinho de Queijo** | Bolinhos | UND | 100 | R$ 2,00 | **R$ 2,00** | Validado |
| **Bolinho de Presunto e Queijo**| Bolinhos | UND | 100 | R$ 2,30 | **R$ 2,30** | Validado |
| **Bolinho de Calabresa** | Bolinhos | UND | 100 | R$ 1,80 | **R$ 1,80** | Validado |
| **Bolinho de Bacalhau** | Bolinhos | UND | 100 | R$ 5,10 | **R$ 5,10** | Validado |
| **Empadinha de Frango** | Empadas | UND | 100 | R$ 3,90 | **R$ 3,90** | Validado |
| **Empadinha de Camarão** | Empadas | UND | 100 | R$ 4,90 | **R$ 4,90** | Validado |
| **Empadinha de Bacalhau** | Empadas | UND | 100 | R$ 4,90 | **R$ 4,90** | Validado |
| **Pastelzinho de Festa** | Salgados | UND | 100 | R$ 2,30 | **R$ 2,30** | Validado |
| **Canudinho de Frango** | Salgados | UND | 100 | R$ 3,70 | **R$ 3,70** | Validado |
| **Canudinho de Carne** | Salgados | UND | 100 | R$ 3,95 | **R$ 3,95** | Validado |
| **Mini Quiche de Alho-Poró** | Quiches | UND | 100 | R$ 3,95 | **R$ 3,95** | Validado |
| **Mini Burger** | Mini Sanduíches| UND | 100 | R$ 5,00 | **R$ 5,00** | Validado |
| **Mini Hot Dog** | Mini Sanduíches| UND | 100 | R$ 3,95 | **R$ 3,95** | Validado |
| **Camarão Empanado (Congelado)**| Salgados | 1 kg | 1 | R$ 175,00 | **R$ 175,00** | Validado |
| **Camarão Empanado (Frito)** | Salgados | 1 kg | 1 | R$ 195,00 | **R$ 195,00** | Validado |
| **Torta de Frango (1,5 kg)** | Tortas Salgadas| UND | 1 | R$ 170,00 | **R$ 170,00** | Validado |
| **Torta de Bacalhau (1,5 kg)** | Tortas Salgadas| UND | 1 | R$ 230,00 | **R$ 230,00** | Validado |

> [!IMPORTANT]
> **Nota sobre o Stitch**: O valor ilustrativo de *R$ 5,20* presente nas capturas do Stitch para Empadinha de Camarão demonstrava exclusivamente a UX de edição de preço. O preço oficial canônico permaneceu rigorosamente preservado em **R$ 4,90** no banco de dados e no catálogo público.
