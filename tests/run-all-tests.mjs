import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const BASE_URL = "http://localhost:3000";
const CATALOG_JSON = JSON.parse(fs.readFileSync("DELI_SALGADOS_CURRENT_CATALOG_V1_2.json", "utf8"));

// 1. CANONICAL CATALOG INTEGRITY
test("1. CANONICAL CATALOG & CATEGORIES INTEGRITY", async (t) => {
  const res = await fetch(`${BASE_URL}/api/catalog`);
  assert.equal(res.status, 200);
  const data = await res.json();

  await t.test("has exactly 11 canonical categories", () => {
    assert.equal(data.categories.length, 11);
    const slugs = data.categories.map((c) => c.slug);
    const expected = [
      "empadas", "trouxinhas", "tortas-salgadas", "massa-folhada",
      "canapes", "quiches", "vol-au-vent", "salgados",
      "diversos", "bolinhos", "mini-sanduiches"
    ];
    for (const slug of expected) {
      assert.ok(slugs.includes(slug), `Missing expected category: ${slug}`);
    }
  });

  await t.test("has exactly 43 currently available products", () => {
    assert.equal(data.products.length, 43);
  });

  await t.test("has exactly 4 active variants", () => {
    let variantsCount = 0;
    data.products.forEach((p) => {
      if (p.variants) {
        variantsCount += p.variants.filter((v) => v.is_active).length;
      }
    });
    assert.equal(variantsCount, 4);
  });

  await t.test("validates all canonical key prices", () => {
    const findBySlug = (s) => data.products.find((p) => p.slug === s);

    assert.equal(findBySlug("coxinha-frango")?.base_price, 1.70);
    assert.equal(findBySlug("risole-carne")?.base_price, 1.80);
    assert.equal(findBySlug("bolinho-queijo")?.base_price, 2.00);
    assert.equal(findBySlug("bolinho-presunto-queijo")?.base_price, 2.30);
    assert.equal(findBySlug("bolinho-calabresa")?.base_price, 1.80);
    assert.equal(findBySlug("bolinho-bacalhau")?.base_price, 5.10);
    assert.equal(findBySlug("empada-frango")?.base_price, 3.90);
    assert.equal(findBySlug("empada-camarao")?.base_price, 4.90);
    assert.equal(findBySlug("empada-bacalhau")?.base_price, 4.90);

    const camarao = findBySlug("camarao-empanado-1kg");
    assert.equal(camarao?.price_type, "variants");
    assert.equal(camarao?.variants.find((v) => v.name === "Congelado")?.price, 175.00);
    assert.equal(camarao?.variants.find((v) => v.name === "Frito")?.price, 195.00);

    const tortaFrango = findBySlug("torta-frango");
    assert.equal(tortaFrango?.variants.find((v) => v.name === "1,5 kg")?.price, 170.00);

    const tortaBacalhau = findBySlug("torta-bacalhau");
    assert.equal(tortaBacalhau?.variants.find((v) => v.name === "1,5 kg")?.price, 230.00);
  });
});

// 2. PRICE SPOOFING & SECURITY ATTACK TEST
test("2. PRICE SPOOFING ATTACK TEST (SERVER AUTHORITY)", async (t) => {
  const catRes = await fetch(`${BASE_URL}/api/catalog`);
  const catData = await catRes.json();
  const coxinha = catData.products.find((p) => p.slug === "coxinha-frango");

  await t.test("client attempting to send Coxinha = R$ 0.01 has price ignored and recalculated to R$ 1.70", async () => {
    const maliciousPayload = {
      customer: {
        customerName: "Attacker Test",
        customerPhone: "81999999999",
        desiredDate: "2026-09-30",
        fulfillmentType: "pickup",
      },
      items: [
        {
          productId: coxinha.id,
          quantity: 100,
          spoofedPrice: 0.01,
          spoofedSubtotal: 1.00,
        },
      ],
    };

    const res = await fetch(`${BASE_URL}/api/orders`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(maliciousPayload),
    });

    assert.equal(res.status, 201);
    const data = await res.json();
    assert.ok(data.success);
    assert.equal(data.order.total, 170.00);
    const item = data.order.items.find((i) => i.product_id === coxinha.id);
    assert.equal(item.unit_price_snapshot, 1.70);
    assert.equal(item.subtotal, 170.00);
  });

  await t.test("rejects order when quantity is below minimum quantity", async () => {
    const res = await fetch(`${BASE_URL}/api/orders`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        customer: {
          customerName: "Min Qty Test",
          customerPhone: "81999999999",
          desiredDate: "2026-09-30",
          fulfillmentType: "pickup",
        },
        items: [{ productId: coxinha.id, quantity: 50 }],
      }),
    });

    assert.equal(res.status, 400);
    const data = await res.json();
    assert.match(data.error, /Quantidade mínima/);
  });
});

// 3. HISTORICAL SNAPSHOT IMMUTABILITY TEST
test("3. HISTORICAL SNAPSHOT IMMUTABILITY", async (t) => {
  const catRes = await fetch(`${BASE_URL}/api/catalog`);
  const catData = await catRes.json();
  const coxinha = catData.products.find((p) => p.slug === "coxinha-frango");

  await t.test("historical order item preserves original snapshot when catalog price changes", async () => {
    // 1. Create order with Coxinha at canonical R$ 1.70
    const createRes = await fetch(`${BASE_URL}/api/orders`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        customer: {
          customerName: "Snapshot Test Customer",
          customerPhone: "81988887777",
          desiredDate: "2026-10-01",
          fulfillmentType: "pickup",
        },
        items: [{ productId: coxinha.id, quantity: 100 }],
      }),
    });
    const orderData = await createRes.json();
    const publicCode = orderData.order.public_code;
    assert.equal(orderData.order.total, 170.00);

    // 2. Temporarily alter Coxinha price in catalog to R$ 2.90
    await fetch(`${BASE_URL}/api/admin/products`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: coxinha.id, base_price: 2.90 }),
    });

    // 3. Fetch historical order - snapshot must NOT have changed
    const orderRes = await fetch(`${BASE_URL}/api/orders/${publicCode}`);
    const fetched = (await orderRes.json()).order;
    assert.equal(fetched.total, 170.00);
    const item = fetched.items.find((i) => i.product_id === coxinha.id);
    assert.equal(item.unit_price_snapshot, 1.70);
    assert.equal(item.subtotal, 170.00);

    // 4. Restore canonical price to R$ 1.70
    await fetch(`${BASE_URL}/api/admin/products`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: coxinha.id, base_price: 1.70 }),
    });
  });
});

// 4. ADMIN CRUD & SYNCHRONIZATION E2E
test("4. ADMIN CRUD & CATALOG SYNCHRONIZATION E2E", async (t) => {
  const catRes = await fetch(`${BASE_URL}/api/catalog`);
  const catData = await catRes.json();
  const empadasCat = catData.categories.find((c) => c.slug === "empadas");

  let createdId = null;

  await t.test("admin creates a new QA product", async () => {
    const res = await fetch(`${BASE_URL}/api/admin/products`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "Empada Especial QA Test",
        category_id: empadasCat.id,
        base_price: 7.50,
        unit_label: "UND",
        minimum_quantity: 100,
        availability: "available",
        is_visible: true,
      }),
    });
    assert.equal(res.status, 201);
    const data = await res.json();
    createdId = data.product.id;
    assert.ok(createdId);
  });

  await t.test("admin changes price and public catalog reflects", async () => {
    await fetch(`${BASE_URL}/api/admin/products`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: createdId, base_price: 8.20 }),
    });

    const checkRes = await fetch(`${BASE_URL}/api/catalog`);
    const checkData = await checkRes.json();
    const found = checkData.products.find((p) => p.id === createdId);
    assert.ok(found);
    assert.equal(found.base_price, 8.20);
  });

  await t.test("admin changes availability to unavailable and catalog hides by default", async () => {
    await fetch(`${BASE_URL}/api/admin/products`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "updateAvailability", id: createdId, availability: "unavailable" }),
    });

    const checkRes = await fetch(`${BASE_URL}/api/catalog`);
    const checkData = await checkRes.json();
    const found = checkData.products.find((p) => p.id === createdId);
    assert.equal(found, undefined);
  });

  await t.test("clean up QA test product to preserve canonical assortment of 43", async () => {
    await fetch(`${BASE_URL}/api/admin/products`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "toggleVisibility", id: createdId, is_visible: false }),
    });
    const checkRes = await fetch(`${BASE_URL}/api/catalog`);
    const checkData = await checkRes.json();
    assert.equal(checkData.products.length, 43);
  });
});

// 5. WHATSAPP & INSTAGRAM HANDSHAKE
test("5. WHATSAPP & INSTAGRAM HANDSHAKE", async (t) => {
  const res = await fetch(`${BASE_URL}/api/admin/settings`);
  const data = await res.json();
  const settings = data.settings;

  await t.test("whatsapp_number is read from settings and not hardcoded", () => {
    assert.ok(settings.whatsapp_number);
    assert.equal(settings.whatsapp_number, "5581987654321");
  });

  await t.test("instagram_url is read from settings and points to official profile", () => {
    assert.equal(settings.instagram_url, "https://www.instagram.com/deli.salgados");
  });
});

// 6. SECURITY & BUNDLE SECRETS SCAN
test("6. SECURITY SCAN & ZERO SECRETS IN CLIENT BUNDLE", async (t) => {
  await t.test("no service-role key or private secrets exposed in client components", () => {
    const clientFiles = [
      "src/components/public/Header.tsx",
      "src/components/public/ProductCard.tsx",
      "src/components/public/ProductModal.tsx",
      "src/components/public/FloatingCartBar.tsx",
      "src/components/public/BottomNav.tsx",
      "src/app/page.tsx",
      "src/app/pedido/page.tsx",
      "src/app/pedido/finalizar/page.tsx",
      "src/app/pedido/enviado/page.tsx",
      "src/lib/cartContext.tsx",
      "src/lib/supabase/client.ts",
    ];

    for (const f of clientFiles) {
      const content = fs.readFileSync(f, "utf8");
      assert.ok(!content.includes("SUPABASE_SERVICE_ROLE"), `File ${f} contains SUPABASE_SERVICE_ROLE`);
      assert.ok(!content.includes("service_role_key"), `File ${f} contains service_role_key`);
    }
  });
});

// 7. MOCK DATA SWEEP
test("7. MOCK DATA SWEEP (ZERO FICTITIOUS STITCH DATA)", async (t) => {
  await t.test("no fake stitch mock names or numbers in application source", () => {
    const srcFiles = [];
    function scanDir(dir) {
      for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) scanDir(full);
        else if (full.endsWith(".ts") || full.endsWith(".tsx")) srcFiles.push(full);
      }
    }
    scanDir("src");

    const forbiddenStitchMocks = [
      "Maria Fernanda",
      "Carlos Eduardo",
      "Juliana Mendes",
      "1.845,00",
      "850 unidades",
    ];

    for (const f of srcFiles) {
      const content = fs.readFileSync(f, "utf8");
      for (const mock of forbiddenStitchMocks) {
        assert.ok(!content.includes(mock), `Forbidden mock content "${mock}" found in ${f}`);
      }
    }
  });
});

// 8. REAL DASHBOARD METRICS CALCULATION
test("8. REAL DASHBOARD METRICS (ZERO HARDCODING)", async (t) => {
  await t.test("dashboard metrics query the database and reflect true state", async () => {
    const res = await fetch(`${BASE_URL}/api/admin/dashboard`);
    const data = await res.json();
    const metrics = data.metrics;
    assert.equal(typeof metrics.availableProducts, "number");
    assert.equal(typeof metrics.unavailableProducts, "number");
    assert.equal(typeof metrics.hiddenProducts, "number");
    assert.equal(typeof metrics.todayOrders, "number");
    assert.equal(metrics.availableProducts, 43);
  });
});
