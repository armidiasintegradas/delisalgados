import { NextResponse } from "next/server";
import { DbService } from "@/lib/db";
import { isServerSupabaseConfigured, supabaseServer } from "@/lib/supabase/server";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const categorySlug = searchParams.get("category") || undefined;
    const includeUnavailableParam = searchParams.get("include_unavailable") === "true";

    const settings = await DbService.getSettings();

    const [categories, products] = await Promise.all([
      DbService.getCategories(),
      DbService.getProducts({
        categorySlug,
        includeUnavailable: includeUnavailableParam || settings.catalog_show_unavailable,
        includeHidden: false,
      }),
    ]);

    let enrichedProducts = products;

    if (isServerSupabaseConfigured && supabaseServer) {
      const { data: salesRows, error: salesError } = await supabaseServer
        .from("order_items")
        .select("product_id, quantity");

      if (!salesError && salesRows) {
        const salesMap = new Map<string, number>();
        for (const row of salesRows) {
          if (!row.product_id) continue;
          salesMap.set(
            row.product_id,
            (salesMap.get(row.product_id) || 0) + Number(row.quantity || 0)
          );
        }

        enrichedProducts = products.map((product) => ({
          ...product,
          sales_count:
            product.slug === "produto-teste-pix" || product.unit_label === "TESTE"
              ? 0
              : salesMap.get(product.id) || 0,
        }));
      }
    }

    return NextResponse.json({
      settings,
      categories: categories.filter((c) => c.is_active),
      products: enrichedProducts,
    });
  } catch (error: any) {
    console.error("Error fetching catalog:", error);
    return NextResponse.json({ error: error.message || "Erro ao carregar catálogo" }, { status: 500 });
  }
}
