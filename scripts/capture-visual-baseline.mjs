import { execSync } from "node:child_process";
import fs from "node:fs";

const CHROME = '"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"';
const OUT_DIR = "docs/qa/current";

if (!fs.existsSync(OUT_DIR)) {
  fs.mkdirSync(OUT_DIR, { recursive: true });
}

console.log("Capturing Screen 02 Catalog Main at 390x844 with headless=new...");
const target = `${OUT_DIR}/02-catalog-main.png`;
const url = "http://localhost:3000/?nosplash=1&mock_cart=stitch";
const cmd = `${CHROME} --headless=new --disable-gpu --window-size=390,844 --screenshot=${target} "${url}" 2>/dev/null`;

try {
  execSync(cmd);
  console.log("✓ Captured 02-catalog-main.png (390x844)");
} catch (e) {
  console.error("Error capturing:", e.message);
}




