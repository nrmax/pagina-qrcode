import { NextResponse } from "next/server";
import { COOKIE_SESSAO } from "@/lib/auth";

export const runtime = "nodejs";

/** POST /api/admin/logout — encerra a sessão administrativa. */
export async function POST() {
  const resposta = NextResponse.json({ ok: true });
  resposta.cookies.set(COOKIE_SESSAO, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  });
  return resposta;
}
