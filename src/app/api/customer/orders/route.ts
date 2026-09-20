import { NextResponse } from "next/server";
import { createSupabaseServerClient, supabaseServer } from "@/lib/supabase/server";

export async function GET() {
  const client = await createSupabaseServerClient();
  if (!client || !supabaseServer) {
    return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  }

  const { data: { user } } = await client.auth.getUser();
  if (!user?.email) {
    return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  }

  const email = user.email.toLowerCase();

  await supabaseServer
    .from("orders")
    .update({ customer_user_id: user.id })
    .eq("customer_email", email)
    .is("customer_user_id", null);

  const { data, error } = await supabaseServer
    .from("orders")
    .select("*, items:order_items(*)")
    .or(`customer_user_id.eq.${user.id},customer_email.eq.${email}`)
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ orders: data || [] });
}
