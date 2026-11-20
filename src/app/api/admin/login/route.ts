import { NextResponse } from "next/server";
import {
  COOKIE_SESSAO,
  assinarSessao,
  igualConstante,
  segredoSessao,
} from "@/lib/auth";

export const runtime = "nodejs";

/**
 * POST /api/admin/login  { senha: "<6 dígitos>" }
 *
 * Validação de senha no servidor, comparação em tempo constante e
 * limite de tentativas por IP (5 falhas → bloqueio de 60 s).
 */
const MAX_TENTATIVAS = 5;
const BLOQUEIO_MS = 60_000;
const tentativas = new Map<string, { falhas: number; bloqueadoAte: number }>();

function ipDoPedido(request: Request): string {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "local"
  );
}

function bloquear(tempoMs: number, msg: string) {
  const restante = Math.ceil(tempoMs / 1000);
  return NextResponse.json(
    { erro: msg, retryAfter: restante },
    { status: 429, headers: { "Retry-After": String(restante) } }
  );
}

export async function POST(request: Request) {
  const ip = ipDoPedido(request);
  const registro = tentativas.get(ip) ?? { falhas: 0, bloqueadoAte: 0 };

  if (Date.now() < registro.bloqueadoAte) {
    return bloquear(
      registro.bloqueadoAte - Date.now(),
      "Tentativas excedidas. Aguarde antes de tentar novamente."
    );
  }

  const segredo = segredoSessao();
  const senhaEsperada = process.env.ADMIN_SENHA;
  if (!segredo || !senhaEsperada) {
    return NextResponse.json(
      {
        erro:
          "Configuração ausente: defina ADMIN_SENHA e SESSION_SECRET no .env.local (veja .env.example).",
      },
      { status: 500 }
    );
  }

  const corpo = await request.json().catch(() => null);
  const senha = typeof corpo?.senha === "string" ? corpo.senha : "";

  const formatoValido = /^\d{6}$/.test(senha);
  if (!formatoValido || !igualConstante(senha, senhaEsperada)) {
    registro.falhas += 1;
    if (registro.falhas >= MAX_TENTATIVAS) {
      tentativas.set(ip, { falhas: 0, bloqueadoAte: Date.now() + BLOQUEIO_MS });
      return bloquear(
        BLOQUEIO_MS,
        "Número de tentativas excedido. Acesso bloqueado temporariamente."
      );
    }
    tentativas.set(ip, registro);
    return NextResponse.json(
      {
        erro: `Senha incorreta. Tentativa ${registro.falhas} de ${MAX_TENTATIVAS}.`,
      },
      { status: 401 }
    );
  }

  // Sucesso: limpa o limite e cria a sessão
  tentativas.delete(ip);
  const token = await assinarSessao(segredo);
  const resposta = NextResponse.json({ ok: true });
  resposta.cookies.set(COOKIE_SESSAO, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 8, // 8 horas
  });
  return resposta;
}
