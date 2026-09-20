import { NextResponse } from "next/server";
import { verifyAdminSession } from "@/lib/auth/adminAuth";
import { supabaseServer } from "@/lib/supabase/server";

export const runtime = "nodejs";

export async function DELETE(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const auth = await verifyAdminSession(request, { requiredRole: "administrator" });
  if (!auth.authorized) {
    return NextResponse.json(
      { error: auth.error || "Ação restrita a administradores." },
      { status: auth.status }
    );
  }

  if (!supabaseServer) {
    return NextResponse.json({ error: "Supabase indisponível." }, { status: 503 });
  }

  try {
    const { id } = await context.params;

    const { data: profile } = await supabaseServer
      .from("customer_profiles")
      .select("id,email,full_name")
      .eq("id", id)
      .maybeSingle();

    let authUser: any = null;
    try {
      const { data } = await supabaseServer.auth.admin.getUserById(id);
      authUser = data.user || null;
    } catch {
      authUser = null;
    }

    const email = String(profile?.email || authUser?.email || "").trim().toLowerCase();

    if (!profile && !authUser) {
      return NextResponse.json({ error: "Cliente não encontrado." }, { status: 404 });
    }

    // Keep commercial/order history, but remove ownership so a deleted login
    // cannot continue to access previous orders.
    await supabaseServer
      .from("orders")
      .update({ customer_user_id: null, updated_at: new Date().toISOString() })
      .eq("customer_user_id", id);

    if (profile) {
      const { error: profileError } = await supabaseServer
        .from("customer_profiles")
        .delete()
        .eq("id", id);
      if (profileError) throw profileError;
    }

    if (authUser) {
      const { error: authError } = await supabaseServer.auth.admin.deleteUser(id);
      if (authError) throw authError;
    }

    return NextResponse.json({
      success: true,
      deleted_id: id,
      deleted_email: email || null,
      message: "Usuário excluído. O histórico comercial dos pedidos foi preservado.",
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Não foi possível excluir o usuário." },
      { status: 500 }
    );
  }
}
