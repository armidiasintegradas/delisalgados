import { NextResponse } from "next/server";
import { verifyAdminSession } from "@/lib/auth/adminAuth";
import { supabaseServer } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const auth = await verifyAdminSession(request);
  if (!auth.authorized) {
    return NextResponse.json(
      { error: auth.error || "Acesso restrito a administradores." },
      { status: auth.status }
    );
  }

  if (!supabaseServer) {
    return NextResponse.json({ error: "Supabase indisponível." }, { status: 503 });
  }

  try {
    const [{ data: profiles, error: profilesError }, { data: orders, error: ordersError }] =
      await Promise.all([
        supabaseServer
          .from("customer_profiles")
          .select("*")
          .order("created_at", { ascending: false }),
        supabaseServer
          .from("orders")
          .select("id,public_code,customer_user_id,customer_email,total,status,payment_status,created_at,updated_at")
          .order("created_at", { ascending: false }),
      ]);

    if (profilesError) throw profilesError;
    if (ordersError) throw ordersError;

    const customerRows = (profiles || []).map((profile: any) => {
      const email = String(profile.email || "").trim().toLowerCase();
      const customerOrders = (orders || []).filter((order: any) => {
        if (order.customer_user_id && order.customer_user_id === profile.id) return true;
        return String(order.customer_email || "").trim().toLowerCase() === email;
      });

      const totalSpent = customerOrders.reduce(
        (sum: number, order: any) => sum + Number(order.total || 0),
        0
      );

      return {
        ...profile,
        orders_count: customerOrders.length,
        total_spent: totalSpent,
        last_order_at: customerOrders[0]?.created_at || null,
        last_order_code: customerOrders[0]?.public_code || null,
        last_order_status: customerOrders[0]?.status || null,
        last_payment_status: customerOrders[0]?.payment_status || null,
      };
    });

    return NextResponse.json({ customers: customerRows });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Não foi possível carregar os clientes." },
      { status: 500 }
    );
  }
}
