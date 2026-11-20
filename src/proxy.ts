import { NextResponse, type NextRequest } from "next/server";
import { COOKIE_SESSAO, segredoSessao, sessaoValida } from "@/lib/auth";

/**
 * Proteção das rotas administrativas.
 * (Next.js 16: o arquivo `middleware.ts` foi renomeado para `proxy.ts`.)
 *
 * - /admin/*      → exige sessão válida; sem sessão, envia para /admin/login
 * - /admin/login  → quem já tem sessão vai direto para /admin
 * - /api/admin/*  → exige sessão (exceto login/logout), respondendo 401
 */
export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get(COOKIE_SESSAO)?.value;
  const segredo = segredoSessao();
  const autenticado = await sessaoValida(token, segredo);

  const publico =
    pathname === "/admin/login" ||
    pathname === "/api/admin/login" ||
    pathname === "/api/admin/logout";

  // APIs administrativas protegidas
  if (pathname.startsWith("/api/admin/") && !publico) {
    if (!autenticado) {
      return NextResponse.json(
        { erro: "Sessão inválida. Faça login novamente." },
        { status: 401 }
      );
    }
    return NextResponse.next();
  }

  // Páginas administrativas
  if (pathname.startsWith("/admin")) {
    // Login: quem já tem sessão vai direto para o painel;
    // quem não tem, acessa normalmente (é a página pública).
    if (pathname === "/admin/login") {
      if (autenticado) {
        const destino = request.nextUrl.clone();
        destino.pathname = "/admin";
        destino.search = "";
        return NextResponse.redirect(destino);
      }
      return NextResponse.next();
    }
    if (!autenticado) {
      const destino = request.nextUrl.clone();
      destino.pathname = "/admin/login";
      destino.search = "";
      return NextResponse.redirect(destino);
    }
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/api/admin/:path*"],
};
