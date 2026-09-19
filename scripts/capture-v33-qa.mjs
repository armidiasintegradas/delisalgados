import { spawn } from "node:child_process";
import fs from "node:fs";

const CHROME_PATH = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const PORT = 9225;
const OUT_DIR = "docs/qa/v3.3";
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

async function captureScreen(client, url, filename, width, height, waitMs = 2500) {
  console.log(`Navigating to ${url} (${width}x${height})...`);
  await client.send("Page.navigate", { url });
  await sleep(waitMs);

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

  // Also copy to brain artifacts directory for user viewing
  fs.writeFileSync(`${BRAIN_DIR}/${filename}`, buffer);
}

async function main() {
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

    // ==========================================
    // 1. Desktop: catalog-desktop-no-splash-1440x900.png
    // ==========================================
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
    // Clear cookies first
    await client.send("Network.clearBrowserCookies");

    // Capture desktop catalog directly without ?nosplash=1 (should open catalog without splash)
    await captureScreen(
      client,
      "http://localhost:3000/",
      "catalog-desktop-no-splash-1440x900.png",
      1440,
      900,
      4000
    );

    // 2. Desktop: admin-login-1440x900.png (unauthenticated)
    await captureScreen(
      client,
      "http://localhost:3000/delisalgados/admin/login",
      "admin-login-1440x900.png",
      1440,
      900,
      2000
    );

    // Now authenticate for admin pages
    await client.send("Network.setCookie", {
      name: "deli_test_session",
      value: "admin",
      url: "http://localhost:3000",
    });

    // 3. Desktop: admin-dashboard-1440x900.png
    await captureScreen(
      client,
      "http://localhost:3000/delisalgados/admin",
      "admin-dashboard-1440x900.png",
      1440,
      900,
      2500
    );

    // 4. Desktop: admin-products-1440x900.png
    await captureScreen(
      client,
      "http://localhost:3000/delisalgados/admin/produtos",
      "admin-products-1440x900.png",
      1440,
      900,
      2500
    );

    // 5. Desktop: admin-orders-1440x900.png
    await captureScreen(
      client,
      "http://localhost:3000/delisalgados/admin/pedidos",
      "admin-orders-1440x900.png",
      1440,
      900,
      4000
    );

    // 6. Desktop: admin-settings-1440x900.png
    await captureScreen(
      client,
      "http://localhost:3000/delisalgados/admin/configuracoes",
      "admin-settings-1440x900.png",
      1440,
      900,
      2500
    );

    // ==========================================
    // 7. Mobile: admin-dashboard-mobile-390x844.png
    // ==========================================
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
      "http://localhost:3000/delisalgados/admin",
      "admin-dashboard-mobile-390x844.png",
      390,
      844,
      2500
    );

    // ==========================================
    // 8. Mobile: catalog-mobile-splash-390x844.png
    // ==========================================
    // Navigate and capture immediately during splash (approx 400ms)
    console.log("Navigating to mobile root to capture splash...");
    await client.send("Page.navigate", { url: "http://localhost:3000/" });
    await sleep(400);

    console.log("Capturing splash screenshot...");
    const splashResult = await client.send("Page.captureScreenshot", {
      format: "png",
      clip: { x: 0, y: 0, width: 390, height: 844, scale: 1 },
    });
    const splashBuffer = Buffer.from(splashResult.data, "base64");
    fs.writeFileSync(`${OUT_DIR}/catalog-mobile-splash-390x844.png`, splashBuffer);
    fs.writeFileSync(`${BRAIN_DIR}/catalog-mobile-splash-390x844.png`, splashBuffer);
    console.log(`✓ Saved ${OUT_DIR}/catalog-mobile-splash-390x844.png (${splashBuffer.length} bytes)`);

    console.log("\n🎉 All 8 QA screenshots captured successfully!");
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
