import { NextResponse } from "next/server";
import { verifyAdminSession } from "@/lib/auth/adminAuth";
import { supabaseServer } from "@/lib/supabase/server";

export const runtime = "nodejs";

async function listAllAuthUsers() {
  if (!supabaseServer) return [];
  const users: any[] = [];
  let page = 1;

  while (page <= 20) {
    const { data, error } = await supabaseServer.auth.admin.listUsers({
      page,
      perPage: 200,
    });
    if (error) throw error;
    users.push(...(data.users || []));
    if (!data.users || data.users.length < 200) break;
    page += 1;
  }

  return users;
}

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
    const [
      { data: profiles, error: profilesError },
      { data: orders, error: ordersError },
      authUsers,
    ] = await Promise.all([
      supabaseServer
        .from("customer_profiles")
        .select("*")
        .order("created_at", { ascending: false }),
      supabaseServer
        .from("orders")
        .select("id,public_code,customer_user_id,customer_email,customer_name,customer_phone,total,status,payment_status,created_at,updated_at")
        .order("created_at", { ascending: false }),
      listAllAuthUsers(),
    ]);

    if (profilesError) throw profilesError;
    if (ordersError) throw ordersError;

    const profileById = new Map((profiles || []).map((profile: any) => [profile.id, profile]));
    const profileByEmail = new Map(
      (profiles || []).map((profile: any) => [
        String(profile.email || "").trim().toLowerCase(),
        profile,
      ])
    );

    // Auth is the source of truth for access. Include Auth-only users as well so
    // a broken/incomplete signup can never disappear from the Admin panel.
    const unified = new Map<string, any>();

    for (const user of authUsers) {
      const email = String(user.email || "").trim().toLowerCase();
      const profile = profileById.get(user.id) || profileByEmail.get(email);
      const latestOrder = (orders || []).find((order: any) => {
        if (order.customer_user_id && order.customer_user_id === user.id) return true;
        return String(order.customer_email || "").trim().toLowerCase() === email;
      });

      unified.set(user.id, {
        ...(profile || {}),
        id: user.id,
        email,
        full_name:
          profile?.full_name ||
          user.user_metadata?.full_name ||
          latestOrder?.customer_name ||
          email.split("@")[0] ||
          "Cliente",
        whatsapp:
          profile?.whatsapp ||
          user.user_metadata?.whatsapp ||
          latestOrder?.customer_phone ||
          "",
        address: profile?.address || "",
        reference_point: profile?.reference_point || "",
        created_at: profile?.created_at || user.created_at || null,
        auth_email_confirmed: Boolean(user.email_confirmed_at),
        auth_last_sign_in_at: user.last_sign_in_at || null,
        auth_status: user.email_confirmed_at ? "active" : "pending_confirmation",
      });
    }

    // Preserve legacy profile-only rows too. These need repair and must remain visible.
    for (const profile of profiles || []) {
      if (unified.has(profile.id)) continue;
      unified.set(profile.id, {
        ...profile,
        auth_email_confirmed: false,
        auth_last_sign_in_at: null,
        auth_status: "missing_auth",
      });
    }

    const customerRows = Array.from(unified.values()).map((profile: any) => {
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

    customerRows.sort((a: any, b: any) => {
      const aTime = a.created_at ? new Date(a.created_at).getTime() : 0;
      const bTime = b.created_at ? new Date(b.created_at).getTime() : 0;
      return bTime - aTime;
    });

    return NextResponse.json({ customers: customerRows });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Não foi possível carregar os clientes." },
      { status: 500 }
    );
  }
}
