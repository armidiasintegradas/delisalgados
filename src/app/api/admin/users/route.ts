import { NextResponse } from "next/server";
import { verifyAdminSession } from "@/lib/auth/adminAuth";
import { supabaseServer } from "@/lib/supabase/server";

export const runtime = "nodejs";

async function requireAdministrator(request: Request) {
  const auth = await verifyAdminSession(request, { requiredRole: "administrator" });
  if (!auth.authorized) {
    return {
      auth,
      response: NextResponse.json(
        { error: auth.error || "Ação restrita a administradores." },
        { status: auth.status }
      ),
    };
  }
  if (!supabaseServer) {
    return {
      auth,
      response: NextResponse.json(
        { error: "Supabase administrativo não configurado." },
        { status: 503 }
      ),
    };
  }
  return { auth, response: null };
}

export async function GET(request: Request) {
  const guard = await requireAdministrator(request);
  if (guard.response) return guard.response;

  const { data, error } = await supabaseServer!
    .from("admin_profiles")
    .select("id,email,name,role,is_active,created_at,updated_at")
    .order("created_at", { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    users: data || [],
    currentUserId: guard.auth.user?.id || null,
  });
}

export async function POST(request: Request) {
  const guard = await requireAdministrator(request);
  if (guard.response) return guard.response;

  try {
    const body = await request.json();
    const email = String(body.email || "").trim().toLowerCase();
    const name = String(body.name || "").trim();
    const password = String(body.password || "");
    const role = body.role === "administrator" ? "administrator" : "editor";

    if (!/^\S+@\S+\.\S+$/.test(email)) {
      return NextResponse.json({ error: "Informe um e-mail válido." }, { status: 400 });
    }
    if (!name) {
      return NextResponse.json({ error: "Informe o nome do usuário." }, { status: 400 });
    }
    if (password.length < 8) {
      return NextResponse.json(
        { error: "A senha temporária deve ter pelo menos 8 caracteres." },
        { status: 400 }
      );
    }

    const { data: existingProfile } = await supabaseServer!
      .from("admin_profiles")
      .select("id")
      .eq("email", email)
      .maybeSingle();

    if (existingProfile) {
      return NextResponse.json(
        { error: "Já existe um usuário administrativo com este e-mail." },
        { status: 409 }
      );
    }

    const { data: created, error: createError } =
      await supabaseServer!.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { full_name: name, account_type: "deli_admin" },
      });

    if (createError || !created.user) {
      return NextResponse.json(
        { error: createError?.message || "Não foi possível criar o usuário." },
        { status: 400 }
      );
    }

    const profile = {
      id: created.user.id,
      email,
      name,
      role,
      is_active: true,
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabaseServer!
      .from("admin_profiles")
      .insert(profile)
      .select("id,email,name,role,is_active,created_at,updated_at")
      .single();

    if (error) {
      await supabaseServer!.auth.admin.deleteUser(created.user.id).catch(() => {});
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true, user: data });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Não foi possível cadastrar o usuário." },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  const guard = await requireAdministrator(request);
  if (guard.response) return guard.response;

  try {
    const body = await request.json();
    const id = String(body.id || "").trim();
    if (!id) {
      return NextResponse.json({ error: "Usuário não informado." }, { status: 400 });
    }

    const updates: Record<string, any> = { updated_at: new Date().toISOString() };
    if (typeof body.name === "string") updates.name = body.name.trim();
    if (body.role === "administrator" || body.role === "editor") updates.role = body.role;
    if (typeof body.is_active === "boolean") updates.is_active = body.is_active;

    if (id === guard.auth.user?.id && updates.is_active === false) {
      return NextResponse.json(
        { error: "Você não pode desativar o próprio acesso." },
        { status: 400 }
      );
    }

    const { data, error } = await supabaseServer!
      .from("admin_profiles")
      .update(updates)
      .eq("id", id)
      .select("id,email,name,role,is_active,created_at,updated_at")
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    if (typeof body.password === "string" && body.password.length > 0) {
      if (body.password.length < 8) {
        return NextResponse.json(
          { error: "A nova senha deve ter pelo menos 8 caracteres." },
          { status: 400 }
        );
      }
      const { error: authError } = await supabaseServer!.auth.admin.updateUserById(id, {
        password: body.password,
      });
      if (authError) {
        return NextResponse.json({ error: authError.message }, { status: 400 });
      }
    }

    return NextResponse.json({ success: true, user: data });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Não foi possível atualizar o usuário." },
      { status: 500 }
    );
  }
}
