import { spawn } from "node:child_process";
import fs from "node:fs";

const CHROME_PATH = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const PORT = 9226;
const OUT_DIR = "docs/qa/v3.4";
const BRAIN_DIR = "/Users/alexribeiro/.gemini/antigravity/brain/c978863f-07b2-4706-b9fd-d4b9656aff35";

if (!fs.existsSync(OUT_DIR)) {
  fs.mkdirSync(OUT_DIR, { recursive: true });
}

async function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function getDebuggerUrl() {
  for (let i = 0; i < 30; i++) {
    try {
      const res = await fetch(`http://127.0.0.1:${PORT}/json/version`);
      if (res.ok) {
        const data = await res.json();
        return data.webSocketDebuggerUrl;
      }
    } catch {}
    await sleep(200);
  }
  throw new Error("Could not connect to Chrome debugger");
}

class CDPClient {
  constructor(wsUrl) {
    this.ws = new WebSocket(wsUrl);
    this.id = 1;
    this.callbacks = new Map();
  }

  async connect() {
    return new Promise((resolve) => {
      this.ws.onopen = () => resolve();
      this.ws.onmessage = (event) => {
        const data = JSON.parse(event.data);
        if (data.id && this.callbacks.has(data.id)) {
          const cb = this.callbacks.get(data.id);
          this.callbacks.delete(data.id);
          if (data.error) cb.reject(new Error(data.error.message));
          else cb.resolve(data.result);
        }
      };
    });
  }

  async send(method, params = {}) {
    const id = this.id++;
    return new Promise((resolve, reject) => {
      this.callbacks.set(id, { resolve, reject });
      this.ws.send(JSON.stringify({ id, method, params }));
    });
  }

  close() {
    this.ws.close();
  }
}

async function waitForCondition(client, expression, timeoutMs = 15000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const res = await client.send("Runtime.evaluate", { expression, returnByValue: true });
      if (res && res.result && res.result.value) {
        return true;
      }
    } catch {}
    await sleep(250);
  }
  return false;
}

async function captureScreen(client, url, filename, width, height, conditionExpr) {
  console.log(`Navigating to ${url} (${width}x${height})...`);
  await client.send("Page.navigate", { url });
  
  if (conditionExpr) {
    console.log(`Waiting for condition: ${conditionExpr}...`);
    await waitForCondition(client, conditionExpr);
    await sleep(800); // brief settling time
  } else {
    await sleep(3000);
  }

  const outputPath = `${OUT_DIR}/${filename}`;
  console.log(`Capturing screenshot (${width}x${height}) to ${outputPath}...`);
  const result = await client.send("Page.captureScreenshot", {
    format: "png",
    clip: {
      x: 0,
      y: 0,
      width,
      height,
      scale: 1,
    },
  });

  const buffer = Buffer.from(result.data, "base64");
  fs.writeFileSync(outputPath, buffer);
  console.log(`✓ Saved ${outputPath} (${buffer.length} bytes)`);

  fs.writeFileSync(`${BRAIN_DIR}/${filename}`, buffer);
}

async function createSampleOrder() {
  console.log("Fetching catalog to get a product...");
  const catRes = await fetch("http://localhost:3000/api/catalog");
  const catalog = await catRes.json();
  const product = catalog.products[0];

  console.log(`Creating order with product ${product.name} (${product.id})...`);
  const orderPayload = {
    customer: {
      customerName: "Alex QA Testing",
      customerPhone: "(81) 98888-2222",
      desiredDate: "2026-10-05",
      fulfillmentType: "pickup",
      customerNote: "Pedido para homologação V3.4",
    },
    items: [
      {
        productId: product.id,
        quantity: product.minimum_quantity || 100,
      },
    ],
  };

  const createRes = await fetch("http://localhost:3000/api/orders", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(orderPayload),
  });

  if (!createRes.ok) {
    const errText = await createRes.text();
    throw new Error(`Failed to create order: ${createRes.status} ${errText}`);
  }

  const data = await createRes.json();
  console.log("Created order:", data.order.public_code, "handoffToken:", data.handoffToken ? "yes" : "no");
  return {
    code: data.order.public_code,
    token: data.handoffToken,
  };
}

async function main() {
  const { code, token } = await createSampleOrder();

  console.log("Launching Chrome in headless mode with remote debugging...");
  const chrome = spawn(CHROME_PATH, [
    "--headless=new",
    "--disable-gpu",
    `--remote-debugging-port=${PORT}`,
    "--hide-scrollbars",
    "--no-first-run",
    "--no-default-browser-check",
    "about:blank",
  ]);

  try {
    const browserWsUrl = await getDebuggerUrl();
    const browserClient = new CDPClient(browserWsUrl);
    await browserClient.connect();

    const { targetId } = await browserClient.send("Target.createTarget", { url: "about:blank" });
    const pageRes = await fetch(`http://127.0.0.1:${PORT}/json`);
    const targets = await pageRes.json();
    const target = targets.find((t) => t.id === targetId);

    const client = new CDPClient(target.webSocketDebuggerUrl);
    await client.connect();

    await client.send("Page.enable");
    await client.send("Network.enable");
    await client.send("Runtime.enable");

    // 1. Desktop: handoff-desktop-1440x900.png
    console.log("\n--- Desktop Viewport (1440x900) ---");
    await client.send("Emulation.setDeviceMetricsOverride", {
      width: 1440,
      height: 900,
      deviceScaleFactor: 1,
      mobile: false,
    });
    await client.send("Emulation.setUserAgentOverride", {
      userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
    });
    await client.send("Network.clearBrowserCookies");

    await captureScreen(
      client,
      `http://localhost:3000/pedido/enviado?code=${code}&t=${token}`,
      "handoff-desktop-1440x900.png",
      1440,
      900,
      `document.body.innerText.includes("pronto para ser enviado")`
    );

    // 2. Mobile: handoff-mobile-390x844.png
    console.log("\n--- Mobile Viewport (390x844) ---");
    await client.send("Emulation.setDeviceMetricsOverride", {
      width: 390,
      height: 844,
      deviceScaleFactor: 1,
      mobile: true,
    });
    await client.send("Emulation.setUserAgentOverride", {
      userAgent: "Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1",
    });

    await captureScreen(
      client,
      `http://localhost:3000/pedido/enviado?code=${code}&t=${token}`,
      "handoff-mobile-390x844.png",
      390,
      844,
      `document.body.innerText.includes("pronto para ser enviado")`
    );

    // 3. Desktop Recovery: handoff-recovery-1440x900.png
    console.log("\n--- Desktop Recovery Viewport (1440x900) ---");
    await client.send("Emulation.setDeviceMetricsOverride", {
      width: 1440,
      height: 900,
      deviceScaleFactor: 1,
      mobile: false,
    });
    await client.send("Emulation.setUserAgentOverride", {
      userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
    });

    // Clear storage on origin before navigating
    await client.send("Runtime.evaluate", {
      expression: "window.sessionStorage.clear(); window.localStorage.clear();",
    });

    // Navigate to order URL without token and wait for recovery card
    await captureScreen(
      client,
      `http://localhost:3000/pedido/enviado?code=${code}`,
      "handoff-recovery-1440x900.png",
      1440,
      900,
      `document.body.innerText.includes("RECUPERAR PEDIDO") || document.body.innerText.includes("recuperar os dados")`
    );

    console.log("\n🎉 All 3 V3.4 QA screenshots captured successfully!");
    client.close();
    browserClient.close();
  } finally {
    chrome.kill();
  }
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
