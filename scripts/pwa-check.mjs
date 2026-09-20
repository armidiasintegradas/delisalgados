import assert from "node:assert/strict";
import fs from "node:fs";

const manifest = JSON.parse(fs.readFileSync("public/manifest.webmanifest", "utf8"));
const sw = fs.readFileSync("public/sw.js", "utf8");
const prompt = fs.readFileSync("src/components/public/PWAInstallPrompt.tsx", "utf8");
const layout = fs.readFileSync("src/app/layout.tsx", "utf8");

assert.equal(manifest.name, "Deli Salgados");
assert.equal(manifest.short_name, "Deli Salgados");
assert.equal(manifest.display, "standalone");
assert.equal(manifest.start_url, "/");
assert.equal(manifest.scope, "/");
assert.equal(manifest.id, "/");
assert.equal(manifest.prefer_related_applications, false);
assert.ok(Array.isArray(manifest.icons) && manifest.icons.length > 0);
assert.ok(manifest.icons.some((icon) => icon.src === "/logo-square.png"));

assert.ok(sw.includes('navigator') === false, "service worker must not depend on window navigator");
assert.ok(sw.includes('"/manifest.webmanifest"'));
assert.ok(sw.includes('"/logo-square.png"'));
assert.ok(sw.includes('url.pathname.startsWith("/api/")'));
assert.ok(sw.includes('url.pathname.startsWith("/pedido")'));

assert.ok(prompt.includes('"beforeinstallprompt"'));
assert.ok(prompt.includes('"appinstalled"'));
assert.ok(prompt.includes("iPad|iPhone|iPod"));
assert.ok(prompt.includes("/Android/i"));
assert.ok(prompt.includes("Adicionar à Tela de Início"));
assert.ok(prompt.includes("Instalar app"));
assert.ok(prompt.includes("Deli Salgados"));
assert.ok(prompt.includes("INSTALAR DELI SALGADOS"));
assert.ok(prompt.includes("COMO INSTALAR DELI SALGADOS"));
assert.ok(prompt.includes("androidFallbackReady"));
assert.ok(prompt.includes("4500"));

assert.ok(layout.includes('manifest: "/manifest.webmanifest"'));
assert.ok(layout.includes('applicationName: "Deli Salgados"'));
assert.ok(layout.includes('title: "Deli Salgados"'));
assert.ok(layout.includes('themeColor: "#E05A36"'));
assert.ok(layout.includes("<PWAInstallPrompt />"));

console.log("PWA static checks: OK");
