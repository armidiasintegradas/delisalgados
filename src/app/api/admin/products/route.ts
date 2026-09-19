import { NextResponse } from "next/server";
import { DbService } from "@/lib/db";
import { verifyAdminSession } from "@/lib/auth/adminAuth";

export async function GET(request: Request) {
  const auth = await verifyAdminSession(request);
  if (!auth.authorized) {
    return NextResponse.json({ error: auth.error || "Acesso restrito." }, { status: auth.status });
  }

  try {
    const products = await DbService.getProducts({ includeHidden: true, includeUnavailable: true });
    return NextResponse.json({ products });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const auth = await verifyAdminSession(request);
  if (!auth.authorized) {
    return NextResponse.json({ error: auth.error || "Acesso restrito." }, { status: auth.status });
  }

  try {
    const body = await request.json();
    if (body.action === "duplicate") {
      const duplicated = await DbService.duplicateProduct(body.id);
      return NextResponse.json({ success: true, product: duplicated });
    }
    const { variants, category, ...productInput } = body;
    const product = await DbService.createProduct(productInput);
    if (Array.isArray(variants)) {
      await DbService.syncProductVariants(product.id, variants);
    }
    const reloaded = await DbService.getProductById(product.id);
    return NextResponse.json({ success: true, product: reloaded || product }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}

export async function PUT(request: Request) {
  const auth = await verifyAdminSession(request);
  if (!auth.authorized) {
    return NextResponse.json({ error: auth.error || "Acesso restrito." }, { status: auth.status });
  }

  try {
    const body = await request.json();
    // Bulk price updates or single update
    if (body.bulkPrices && Array.isArray(body.bulkPrices)) {
      let updatedCount = 0;
      for (const item of body.bulkPrices) {
        if (item.id && typeof item.price === "number") {
          const ok = await DbService.updateProductPrice(item.id, item.price);
          if (ok) updatedCount++;
        }
      }
      return NextResponse.json({ success: true, updatedCount, message: `${updatedCount} preços atualizados.` });
    }

    if (body.id && body.action === "updateAvailability") {
      await DbService.updateProductAvailability(body.id, body.availability);
      return NextResponse.json({ success: true, message: "Disponibilidade alterada." });
    }

    if (body.id && body.action === "toggleVisibility") {
      await DbService.toggleProductVisibility(body.id, body.is_visible);
      return NextResponse.json({ success: true, message: "Visibilidade alterada." });
    }

    if (body.id) {
      const { id, variants, category, ...productUpdates } = body;
      const updated = await DbService.updateProduct(id, productUpdates);
      if (Array.isArray(variants)) {
        await DbService.syncProductVariants(id, variants);
      }
      const reloaded = await DbService.getProductById(id);
      return NextResponse.json({
        success: true,
        product: reloaded || updated,
        message: "Produto atualizado com sucesso.",
      });
    }

    return NextResponse.json({ error: "Ação não suportada" }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

