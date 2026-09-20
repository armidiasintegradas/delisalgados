import { NextResponse } from "next/server";
import { verifyAdminSession } from "@/lib/auth/adminAuth";
import { supabaseServer, isServerSupabaseConfigured } from "@/lib/supabase/server";
import { DbService } from "@/lib/db";

export const runtime = "nodejs";

const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);
const MAX_BYTES = 5 * 1024 * 1024;

function safeStem(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80) || "produto";
}

export async function POST(request: Request) {
  const auth = await verifyAdminSession(request);
  if (!auth.authorized) {
    return NextResponse.json(
      { error: auth.error || "Acesso restrito." },
      { status: auth.status }
    );
  }

  if (!isServerSupabaseConfigured || !supabaseServer) {
    return NextResponse.json(
      { error: "Supabase Storage não configurado." },
      { status: 503 }
    );
  }

  try {
    const form = await request.formData();
    const file = form.get("file");
    const productId = String(form.get("productId") || "").trim();
    const slug = safeStem(String(form.get("slug") || productId || "produto"));

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "Arquivo de imagem não informado." }, { status: 400 });
    }

    if (!ALLOWED_TYPES.has(file.type)) {
      return NextResponse.json(
        { error: "Formato inválido. Use JPG, PNG ou WebP." },
        { status: 400 }
      );
    }

    if (file.size <= 0 || file.size > MAX_BYTES) {
      return NextResponse.json(
        { error: "A imagem deve ter no máximo 5 MB." },
        { status: 400 }
      );
    }

    const extension =
      file.type === "image/webp" ? "webp" : file.type === "image/png" ? "png" : "jpg";
    const path = `${safeStem(productId || "novo")}/${slug}-${Date.now()}.${extension}`;
    const body = Buffer.from(await file.arrayBuffer());

    const { error: uploadError } = await supabaseServer.storage
      .from("product-images")
      .upload(path, body, {
        contentType: file.type,
        upsert: false,
        cacheControl: "3600",
      });

    if (uploadError) {
      throw new Error(uploadError.message);
    }

    const { data } = supabaseServer.storage.from("product-images").getPublicUrl(path);

    return NextResponse.json({
      success: true,
      path,
      publicUrl: data.publicUrl,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Falha ao enviar a imagem." },
      { status: 500 }
    );
  }
}


export async function DELETE(request: Request) {
  const auth = await verifyAdminSession(request);
  if (!auth.authorized) {
    return NextResponse.json(
      { error: auth.error || "Acesso restrito." },
      { status: auth.status }
    );
  }

  if (!isServerSupabaseConfigured || !supabaseServer) {
    return NextResponse.json(
      { error: "Supabase Storage não configurado." },
      { status: 503 }
    );
  }

  try {
    const body = await request.json();
    const productId = String(body.productId || "").trim();
    const imageUrl = String(body.imageUrl || "").trim();

    if (!productId) {
      return NextResponse.json({ error: "Produto não informado." }, { status: 400 });
    }

    // Remove the stored file when the URL points to our product-images bucket.
    if (imageUrl) {
      try {
        const marker = "/storage/v1/object/public/product-images/";
        const markerIndex = imageUrl.indexOf(marker);
        if (markerIndex >= 0) {
          const encodedPath = imageUrl.slice(markerIndex + marker.length).split("?")[0];
          const storagePath = decodeURIComponent(encodedPath);
          if (storagePath) {
            const { error: removeError } = await supabaseServer.storage
              .from("product-images")
              .remove([storagePath]);

            if (removeError) {
              console.warn("Product image storage cleanup failed:", removeError.message);
            }
          }
        }
      } catch (storageError) {
        console.warn("Product image storage cleanup notice:", storageError);
      }
    }

    // Always remove the product/image association, even if storage cleanup is not applicable.
    const updated = await DbService.updateProduct(productId, { image_url: null });

    return NextResponse.json({
      success: true,
      product: updated,
      message: "Imagem removida do produto.",
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Falha ao remover a imagem." },
      { status: 500 }
    );
  }
}
