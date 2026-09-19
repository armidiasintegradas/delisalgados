import { spawn } from "node:child_process";
import fs from "node:fs";

const CHROME_PATH = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const PORT = 9224;

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

async function captureScreen(client, url, outputPath, width, height, waitMs = 2500) {
  console.log(`Navigating to ${url}...`);
  await client.send("Page.navigate", { url });
  await sleep(waitMs);

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
  const brainDir = "/Users/alexribeiro/.gemini/antigravity/brain/c978863f-07b2-4706-b9fd-d4b9656aff35";
  const filename = outputPath.split("/").pop();
  fs.writeFileSync(`${brainDir}/${filename}`, buffer);
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

    const outDir = "docs/qa/v3.1";

    // ==========================================
    // DESKTOP CAPTURES (1440x900)
    // ==========================================
    console.log("\n--- Setting Desktop Viewport (1440x900) ---");
    await client.send("Emulation.setDeviceMetricsOverride", {
      width: 1440,
      height: 900,
      deviceScaleFactor: 1,
      mobile: false,
    });
    await client.send("Emulation.setUserAgentOverride", {
      userAgent:
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
    });

    // 1. Catalog Desktop — 1440×900
    await captureScreen(
      client,
      "http://localhost:3000/?nosplash=1",
      `${outDir}/01-catalog-desktop-1440x900.png`,
      1440,
      900,
      2500
    );

    // 2. Catalog Desktop with Cart — 1440×900
    await captureScreen(
      client,
      "http://localhost:3000/?nosplash=1&mock_cart=stitch",
      `${outDir}/02-catalog-desktop-with-cart-1440x900.png`,
      1440,
      900,
      2500
    );

    // 3. Product Options Desktop — 1440×900
    await captureScreen(
      client,
      "http://localhost:3000/?nosplash=1&open_product=camarao-empanado-1kg",
      `${outDir}/03-product-options-desktop-1440x900.png`,
      1440,
      900,
      2500
    );

    // 4. Cart Desktop — 1440×900
    await captureScreen(
      client,
      "http://localhost:3000/pedido?mock_cart=stitch",
      `${outDir}/04-cart-desktop-1440x900.png`,
      1440,
      900,
      2500
    );

    // 5. Finalize Desktop — 1440×900
    await captureScreen(
      client,
      "http://localhost:3000/pedido/finalizar?mock_cart=stitch",
      `${outDir}/05-finalize-desktop-1440x900.png`,
      1440,
      900,
      2500
    );

    // ==========================================
    // MOBILE CAPTURES (390x844)
    // ==========================================
    console.log("\n--- Setting Mobile Viewport (390x844) ---");
    await client.send("Emulation.setDeviceMetricsOverride", {
      width: 390,
      height: 844,
      deviceScaleFactor: 1,
      mobile: true,
    });
    await client.send("Emulation.setUserAgentOverride", {
      userAgent:
        "Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1",
    });

    // 6. Mobile Catalog — 390×844
    await captureScreen(
      client,
      "http://localhost:3000/?nosplash=1",
      `${outDir}/06-mobile-catalog-390x844.png`,
      390,
      844,
      2500
    );

    // 7. Mobile Catalog with 200% logo — 390×844
    await captureScreen(
      client,
      "http://localhost:3000/?nosplash=1",
      `${outDir}/07-mobile-catalog-200pct-logo-390x844.png`,
      390,
      844,
      2500
    );

    client.close();
    browserClient.close();
    console.log("\nAll 7 screenshots captured successfully!");
  } finally {
    chrome.kill("SIGTERM");
  }
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
