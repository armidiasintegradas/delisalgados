import { isServerSupabaseConfigured, supabaseServer, createSupabaseServerClient } from "@/lib/supabase/server";

export interface AdminAuthResult {
  authorized: boolean;
  status: number;
  error?: string;
  user?: {
    id: string;
    email: string;
  };
  profile?: {
    id: string;
    email: string;
    role: "administrator" | "editor";
    is_active?: boolean;
  };
}

export async function verifyAdminSession(
  request: Request,
  options?: { requiredRole?: "administrator" | "editor" }
): Promise<AdminAuthResult> {
  const authHeader = request.headers.get("authorization");
  let bearerToken: string | null = null;
  if (authHeader && authHeader.startsWith("Bearer ")) {
    bearerToken = authHeader.substring(7).trim();
  }

  // 1. Real Supabase Auth validation
  if (isServerSupabaseConfigured && supabaseServer) {
    let authUser: any = null;

    if (bearerToken) {
      const { data, error } = await supabaseServer.auth.getUser(bearerToken);
      if (!error && data?.user) {
        authUser = data.user;
      }
    } else {
      const ssrClient = await createSupabaseServerClient();
      if (ssrClient) {
        const { data, error } = await ssrClient.auth.getUser();
        if (!error && data?.user) {
          authUser = data.user;
        }
      }
    }

    if (!authUser) {
      return {
        authorized: false,
        status: 401,
        error: "Autenticação necessária. Sessão não encontrada.",
      };
    }

    // Load admin profile from admin_profiles table
    const { data: profile, error: profileErr } = await supabaseServer
      .from("admin_profiles")
      .select("*")
      .eq("id", authUser.id)
      .single();

    if (profileErr || !profile) {
      return {
        authorized: false,
        status: 403,
        error: "Acesso negado. Usuário sem perfil de gestão cadastrado.",
      };
    }

    if (profile.is_active === false) {
      return {
        authorized: false,
        status: 403,
        error: "Acesso negado. Perfil administrativo desativado.",
      };
    }

    if (options?.requiredRole === "administrator" && profile.role !== "administrator") {
      return {
        authorized: false,
        status: 403,
        error: "Acesso negado. Ação restrita a administradores.",
      };
    }

    return {
      authorized: true,
      status: 200,
      user: {
        id: authUser.id,
        email: authUser.email || profile.email,
      },
      profile: {
        id: profile.id,
        email: profile.email,
        role: profile.role,
        is_active: profile.is_active !== false,
      },
    };
  }

  // 2. Development / Test environment without Supabase connection
  // When running in production, test tokens MUST be strictly rejected
  if (process.env.NODE_ENV === "production") {
    return {
      authorized: false,
      status: 401,
      error: "Ambiente de produção exige Supabase Auth configurado.",
    };
  }

  // In test / dev environment:
  const testCookie = request.cookies.get("deli_test_session")?.value;
  if (bearerToken === "deli-admin-test-token" || testCookie === "admin") {
    return {
      authorized: true,
      status: 200,
      user: { id: "test-admin-uuid", email: "admin@delisalgados.com.br" },
      profile: { id: "test-admin-uuid", email: "admin@delisalgados.com.br", role: "administrator", is_active: true },
    };
  }

  if (bearerToken === "deli-editor-test-token") {
    if (options?.requiredRole === "administrator") {
      return {
        authorized: false,
        status: 403,
        error: "Acesso negado. Ação restrita a administradores.",
      };
    }
    return {
      authorized: true,
      status: 200,
      user: { id: "test-editor-uuid", email: "editor@delisalgados.com.br" },
      profile: { id: "test-editor-uuid", email: "editor@delisalgados.com.br", role: "editor", is_active: true },
    };
  }

  // Anonymous request
  return {
    authorized: false,
    status: 401,
    error: "Autenticação necessária.",
  };
}
