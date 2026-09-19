import { NextResponse } from "next/server";
import { DbService } from "@/lib/db";

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

    return NextResponse.json({
      settings,
      categories: categories.filter((c) => c.is_active),
      products,
    });
  } catch (error: any) {
    console.error("Error fetching catalog:", error);
    return NextResponse.json({ error: error.message || "Erro ao carregar catálogo" }, { status: 500 });
  }
}
