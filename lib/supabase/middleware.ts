import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const PUBLIC_PATHS = ["/login", "/cadastro", "/auth", "/primeiro-acesso", "/esqueci-senha"];

/** Refreshes the Supabase session on every request and guards protected routes. */
export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const path = request.nextUrl.pathname;
  const isPublic = PUBLIC_PATHS.some((p) => path === p || path.startsWith(p + "/"));
  // Cliente de pesquisa: conta separada da equipe, sem linha em `members` —
  // marcada em app_metadata na criação (admin.createUser) para decidir a rota
  // sem precisar de consulta extra ao banco no middleware.
  const isPortal = user?.app_metadata?.portal === true;

  if (!user && !isPublic) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  if (user && (path === "/login" || path === "/cadastro")) {
    const url = request.nextUrl.clone();
    url.pathname = isPortal ? "/pesquisa" : "/dashboard";
    return NextResponse.redirect(url);
  }

  if (user && isPortal && !isPublic && !path.startsWith("/pesquisa")) {
    const url = request.nextUrl.clone();
    url.pathname = "/pesquisa";
    return NextResponse.redirect(url);
  }

  if (user && !isPortal && path.startsWith("/pesquisa")) {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    return NextResponse.redirect(url);
  }

  return response;
}
