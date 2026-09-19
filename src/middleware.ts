import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1. Legacy /admin redirects
  if (pathname === "/admin") {
    return NextResponse.redirect(new URL("/delisalgados/admin", request.url));
  }
  if (pathname.startsWith("/admin/")) {
    const newPath = pathname.replace(/^\/admin/, "/delisalgados/admin");
    return NextResponse.redirect(new URL(newPath, request.url));
  }

  // Only protect /delisalgados/admin routes
  if (!pathname.startsWith("/delisalgados/admin")) {
    return NextResponse.next();
  }

  const isLoginPage = pathname === "/delisalgados/admin/login";

  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

  // If Supabase is configured with real credentials
  if (supabaseUrl && supabaseAnonKey && !supabaseUrl.includes("placeholder")) {
    const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          response = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    });

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user && !isLoginPage) {
      const redirectUrl = new URL("/delisalgados/admin/login", request.url);
      redirectUrl.searchParams.set("next", pathname);
      return NextResponse.redirect(redirectUrl);
    }

    if (user && isLoginPage) {
      return NextResponse.redirect(new URL("/delisalgados/admin", request.url));
    }

    return response;
  }

  // Fallback when Supabase is not configured (e.g. local dev / test suite)
  // An unauthenticated request to admin must ALWAYS redirect to login
  const testAuthCookie = request.cookies.get("deli_test_session")?.value;
  const testAuthHeader = request.headers.get("authorization");

  const isAuthenticatedInTest = Boolean(
    testAuthCookie === "admin" ||
    (testAuthHeader && testAuthHeader.includes("Bearer deli-admin-test-token"))
  );

  if (!isAuthenticatedInTest && !isLoginPage) {
    const redirectUrl = new URL("/delisalgados/admin/login", request.url);
    redirectUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(redirectUrl);
  }

  if (isAuthenticatedInTest && isLoginPage) {
    return NextResponse.redirect(new URL("/delisalgados/admin", request.url));
  }

  return response;
}

export const config = {
  matcher: [
    "/admin/:path*",
    "/delisalgados/admin/:path*",
  ],
};
