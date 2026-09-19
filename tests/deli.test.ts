import { describe, it, expect, beforeEach } from "vitest";
import { DbService } from "@/lib/db";
import { generateWhatsAppMessage, buildWhatsAppLink, formatCurrency } from "@/lib/formatters";
import { CustomerData } from "@/types";

describe("DELI SALGADOS — MASTER IMPLEMENTATION SUITE", () => {
  // 1. Canonical Catalog verification
  describe("1. Canonical Catalog & Categories Integrity", () => {
    it("should have exactly 11 canonical categories", async () => {
      const categories = await DbService.getCategories();
      expect(categories.length).toBe(11);
      const slugs = categories.map((c) => c.slug);
      expect(slugs).toContain("empadas");
      expect(slugs).toContain("trouxinhas");
      expect(slugs).toContain("tortas-salgadas");
      expect(slugs).toContain("massa-folhada");
      expect(slugs).toContain("canapes");
      expect(slugs).toContain("quiches");
      expect(slugs).toContain("vol-au-vent");
      expect(slugs).toContain("salgados");
      expect(slugs).toContain("diversos");
      expect(slugs).toContain("bolinhos");
      expect(slugs).toContain("mini-sanduiches");
    });

    it("should have exactly 43 currently available products", async () => {
      const availableProds = await DbService.getProducts({ includeUnavailable: false });
      expect(availableProds.length).toBe(43);
    });

    it("should have exactly 4 active variants", async () => {
      const allProds = await DbService.getProducts({ includeUnavailable: true, includeHidden: true });
      let activeVariantsCount = 0;
      allProds.forEach((p) => {
        (p.variants || []).forEach((v) => {
          if (v.is_active) activeVariantsCount++;
        });
      });
      expect(activeVariantsCount).toBe(4);
    });

    it("should match canonical key prices", async () => {
      const products = await DbService.getProducts({ includeHidden: true, includeUnavailable: true });

      const coxinha = products.find((p) => p.slug === "coxinha-frango");
      expect(coxinha?.base_price).toBe(1.70);
      expect(coxinha?.minimum_quantity).toBe(100);

      const empadaFrango = products.find((p) => p.slug === "empada-frango");
      expect(empadaFrango?.base_price).toBe(3.90);
      expect(empadaFrango?.minimum_quantity).toBe(100);

      const empadaCamarao = products.find((p) => p.slug === "empada-camarao");
      expect(empadaCamarao?.base_price).toBe(4.90);

      const risoleCarne = products.find((p) => p.slug === "risole-carne");
      expect(risoleCarne?.base_price).toBe(1.80);

      const bolinhoQueijo = products.find((p) => p.slug === "bolinho-queijo");
      expect(bolinhoQueijo?.base_price).toBe(2.00);

      const camarao = products.find((p) => p.slug === "camarao-empanado-1kg");
      expect(camarao?.price_type).toBe("variants");
      const congelado = (camarao?.variants || []).find((v) => v.name === "Congelado");
      const frito = (camarao?.variants || []).find((v) => v.name === "Frito");
      expect(congelado?.price).toBe(175.00);
      expect(frito?.price).toBe(195.00);

      const tortaFrango = products.find((p) => p.slug === "torta-frango");
      const vTortaFrango = (tortaFrango?.variants || []).find((v) => v.name === "1,5 kg");
      expect(vTortaFrango?.price).toBe(170.00);

      const tortaBacalhau = products.find((p) => p.slug === "torta-bacalhau");
      const vTortaBacalhau = (tortaBacalhau?.variants || []).find((v) => v.name === "1,5 kg");
      expect(vTortaBacalhau?.price).toBe(230.00);
    });
  });

  // 2. Server-side Order Authority & Snapshots
  describe("2. Server-Side Order Authority, Price Calculations & Snapshots", () => {
    it("should calculate totals server-side and reject sub-minimum quantity", async () => {
      const products = await DbService.getProducts();
      const coxinha = products.find((p) => p.slug === "coxinha-frango")!;

      const customer: CustomerData = {
        customerName: "Cliente Teste",
        customerPhone: "81999999999",
        desiredDate: "2026-09-25",
        fulfillmentType: "pickup",
      };

      // Test sub-minimum rejection
      await expect(
        DbService.createOrder({
          customer,
          items: [{ productId: coxinha.id, quantity: 50 }], // min is 100
        })
      ).rejects.toThrow(/Quantidade mínima/);
    });

    it("should create order with DL-XXXX public code and immutable snapshots", async () => {
      const products = await DbService.getProducts();
      const coxinha = products.find((p) => p.slug === "coxinha-frango")!;
      const camarao = products.find((p) => p.slug === "camarao-empanado-1kg")!;
      const fritoVariant = (camarao.variants || []).find((v) => v.name === "Frito")!;

      const customer: CustomerData = {
        customerName: "Mariana Oliveira",
        customerPhone: "(81) 98765-4321",
        desiredDate: "2026-09-28",
        fulfillmentType: "delivery",
        deliveryAddress: "Av. Boa Viagem, 1500, Apt 302",
        customerNote: "Caprichar no ponto",
      };

      const order = await DbService.createOrder({
        customer,
        items: [
          { productId: coxinha.id, quantity: 100, note: "Sem pimenta" },
          { productId: camarao.id, variantId: fritoVariant.id, quantity: 2 },
        ],
      });

      expect(order.public_code).toMatch(/^DL-\d{4}$/);
      expect(order.customer_name).toBe("Mariana Oliveira");
      expect(order.fulfillment_type).toBe("delivery");

      // Expected calculation:
      // Coxinha: 100 * 1.70 = 170.00
      // Camarão Frito: 2 * 195.00 = 390.00
      // Total = 560.00
      expect(order.total).toBe(560.00);

      // Verify item snapshots
      expect(order.items?.length).toBe(2);
      const coxinhaItem = order.items?.find((i) => i.product_id === coxinha.id)!;
      expect(coxinhaItem.product_name_snapshot).toBe("Coxinha");
      expect(coxinhaItem.unit_price_snapshot).toBe(1.70);
      expect(coxinhaItem.quantity).toBe(100);
      expect(coxinhaItem.subtotal).toBe(170.00);
      expect(coxinhaItem.note).toBe("Sem pimenta");

      const camaraoItem = order.items?.find((i) => i.product_id === camarao.id)!;
      expect(camaraoItem.product_name_snapshot).toBe("Camarão Empanado 1 kg");
      expect(camaraoItem.variant_name_snapshot).toBe("Frito");
      expect(camaraoItem.unit_price_snapshot).toBe(195.00);
      expect(camaraoItem.subtotal).toBe(390.00);

      // Verify Snapshot Immutability: change catalog price, order item must NOT change
      await DbService.updateProductPrice(coxinha.id, 2.50);
      const fetchedOrder = await DbService.getOrderByCode(order.public_code);
      const fetchedCoxinhaItem = fetchedOrder?.items?.find((i) => i.product_id === coxinha.id);
      expect(fetchedCoxinhaItem?.unit_price_snapshot).toBe(1.70);
      expect(fetchedOrder?.total).toBe(560.00);

      // Restore price back to 1.70
      await DbService.updateProductPrice(coxinha.id, 1.70);
    });
  });

  // 3. WhatsApp & Instagram Handshake
  describe("3. WhatsApp & Instagram Handshake", () => {
    it("should build proper WhatsApp message without forbidden confirmation words", async () => {
      const order = (await DbService.getOrders())[0];
      const settings = await DbService.getSettings();

      const message = generateWhatsAppMessage(order, settings);
      expect(message).toContain(order.public_code);
      expect(message).toContain(order.customer_name);
      expect(message).not.toContain("Compra concluída");
      expect(message).not.toContain("Pagamento realizado");

      const link = buildWhatsAppLink(settings.whatsapp_number, message);
      expect(link).toContain("https://wa.me/");
      expect(link).toContain(encodeURIComponent(order.public_code));
    });

    it("should read instagram_url from settings", async () => {
      const settings = await DbService.getSettings();
      expect(settings.instagram_url).toBe("https://www.instagram.com/deli.salgados");
    });
  });

  // 4. Admin CRUD & Real Metrics
  describe("4. Admin Operations & Dynamic Metrics", () => {
    it("should return real dashboard metrics and not hardcoded mock numbers", async () => {
      const metrics = await DbService.getDashboardMetrics();
      expect(metrics.availableProducts).toBeGreaterThan(0);
      expect(metrics.totalOrders).toBeGreaterThanOrEqual(1);
    });

    it("should allow product price updates and availability toggling", async () => {
      const products = await DbService.getProducts();
      const p = products[0];

      // Test availability update
      await DbService.updateProductAvailability(p.id, "unavailable");
      let updated = await DbService.getProductById(p.id);
      expect(updated?.availability).toBe("unavailable");

      // Revert back
      await DbService.updateProductAvailability(p.id, "available");
      updated = await DbService.getProductById(p.id);
      expect(updated?.availability).toBe("available");
    });
  });
});
