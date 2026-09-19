import { spawn } from "node:child_process";
import fs from "node:fs";

const CHROME_PATH = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const PORT = 9223;

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

async function captureScreen(client, url, outputPath, waitMs = 1500) {
  console.log(`Navigating to ${url}...`);
  await client.send("Page.navigate", { url });
  await sleep(waitMs);

  console.log(`Capturing screenshot to ${outputPath}...`);
  const result = await client.send("Page.captureScreenshot", {
    format: "png",
    clip: {
      x: 0,
      y: 0,
      width: 390,
      height: 844,
      scale: 1,
    },
  });

  const buffer = Buffer.from(result.data, "base64");
  fs.writeFileSync(outputPath, buffer);
  console.log(`✓ Saved ${outputPath} (${buffer.length} bytes)`);
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

    // Create a new target/page
    const { targetId } = await browserClient.send("Target.createTarget", { url: "about:blank" });
    const pageRes = await fetch(`http://127.0.0.1:${PORT}/json`);
    const targets = await pageRes.json();
    const target = targets.find((t) => t.id === targetId);

    const client = new CDPClient(target.webSocketDebuggerUrl);
    await client.connect();

    await client.send("Page.enable");
    await client.send("Network.enable");

    // Force exact iPhone 14 / mobile viewport 390x844 with scale 1
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

    const brainDir = "/Users/alexribeiro/.gemini/antigravity/brain/c978863f-07b2-4706-b9fd-d4b9656aff35";

    // 1. Capture Splash Screen
    await captureScreen(
      client,
      "http://localhost:3000/?splash_lock=1",
      `${brainDir}/01-splash-canonical-390x844.png`,
      1200
    );

    // 2. Capture Catalog / Main Screen
    await captureScreen(
      client,
      "http://localhost:3000/?nosplash=1",
      `${brainDir}/02-catalog-canonical-390x844.png`,
      2500
    );

    client.close();
    browserClient.close();
    console.log("All captures completed successfully!");
  } finally {
    chrome.kill("SIGTERM");
  }
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
