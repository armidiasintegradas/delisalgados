import { execSync } from "node:child_process";
import fs from "node:fs";

const CHROME = '"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"';
const OUT_DIR = "docs/qa/screenshots";

if (!fs.existsSync(OUT_DIR)) {
  fs.mkdirSync(OUT_DIR, { recursive: true });
}

// 1. Ensure a test order exists so /pedido/enviado?code=DL-0001 and /admin/pedidos have real data
try {
  const catRes = await fetch("http://localhost:3000/api/catalog");
  const catData = await catRes.json();
  const coxinha = catData.products?.find((p) => p.slug === "coxinha-frango");
  if (coxinha) {
    await fetch("http://localhost:3000/api/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        customer: {
          customerName: "Mariana Oliveira",
          customerPhone: "(81) 98765-4321",
          desiredDate: "2026-09-28",
          fulfillmentType: "pickup",
          customerNote: "Separar em duas caixas de 50",
        },
        items: [{ productId: coxinha.id, quantity: 100 }],
      }),
    });
  }
} catch (e) {
  console.warn("Notice: order prep for screenshot:", e.message);
}

const screenshots = [
  // PUBLIC FLOW (Mobile 390x844 reference + other viewports)
  { name: "01_splash_390x844.png", url: "http://localhost:3000/", size: "390,844" },
  { name: "02_catalog_390x844.png", url: "http://localhost:3000/", size: "390,844" },
  { name: "02_catalog_360x800.png", url: "http://localhost:3000/", size: "360,800" },
  { name: "02_catalog_430x932.png", url: "http://localhost:3000/", size: "430,932" },
  { name: "02_catalog_768x1024.png", url: "http://localhost:3000/", size: "768,1024" },
  { name: "02_catalog_1440x900.png", url: "http://localhost:3000/", size: "1440,900" },
  { name: "04_cart_390x844.png", url: "http://localhost:3000/pedido", size: "390,844" },
  { name: "05_order_details_390x844.png", url: "http://localhost:3000/pedido/finalizar", size: "390,844" },
  { name: "06_whatsapp_handoff_390x844.png", url: "http://localhost:3000/pedido/enviado?code=DL-0001", size: "390,844" },

  // ADMIN FLOW (Desktop 1440x900 + Mobile 390x844)
  { name: "07_admin_login_1440x900.png", url: "http://localhost:3000/admin/login", size: "1440,900" },
  { name: "07_admin_login_390x844.png", url: "http://localhost:3000/admin/login", size: "390,844" },
  { name: "08_admin_dashboard_1440x900.png", url: "http://localhost:3000/admin", size: "1440,900" },
  { name: "08_admin_dashboard_390x844.png", url: "http://localhost:3000/admin", size: "390,844" },
  { name: "09_admin_products_1440x900.png", url: "http://localhost:3000/admin/produtos", size: "1440,900" },
  { name: "10_admin_product_editor_simple_1440x900.png", url: "http://localhost:3000/admin/produtos/novo", size: "1440,900" },
  { name: "12_admin_categories_1440x900.png", url: "http://localhost:3000/admin/categorias", size: "1440,900" },
  { name: "13_admin_orders_1440x900.png", url: "http://localhost:3000/admin/pedidos", size: "1440,900" },
  { name: "14_admin_catalog_mgmt_1440x900.png", url: "http://localhost:3000/admin/cardapio", size: "1440,900" },
  { name: "15_admin_settings_1440x900.png", url: "http://localhost:3000/admin/configuracoes", size: "1440,900" },
  { name: "16_admin_products_mobile_390x844.png", url: "http://localhost:3000/admin/produtos", size: "390,844" }
];

console.log(`Starting capture of ${screenshots.length} screenshots...`);

for (const s of screenshots) {
  const target = `${OUT_DIR}/${s.name}`;
  const cmd = `${CHROME} --headless --disable-gpu --window-size=${s.size} --screenshot=${target} "${s.url}" 2>/dev/null`;
  try {
    execSync(cmd);
    console.log(`✓ Captured: ${s.name} (${s.size})`);
  } catch (err) {
    console.error(`✗ Error capturing ${s.name}:`, err.message);
  }
}

console.log("All screenshots captured successfully!");
