import { NextResponse } from "next/server";
import { resolverIdPorSenha } from "@/lib/db/equipamentos";

export const runtime = "nodejs";

/**
 * POST /api/acesso  { senha: "<3 dígitos>" }
 *
 * Valida a senha do equipamento NO SERVIDOR (tabela protegida por
 * RLS — nunca lida pelo cliente). Responde apenas o id; nada de
 * conteúdo da ficha até a senha estar correta.
 *
 * Limite de tentativas por IP: 5 falhas → bloqueio de 60 s.
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

  const corpo = await request.json().catch(() => null);
  const senha = typeof corpo?.senha === "string" ? corpo.senha : "";

  if (!/^\d{3}$/.test(senha)) {
    return NextResponse.json(
      { erro: "Senha deve ter 3 dígitos." },
      { status: 400 }
    );
  }

  const { id, falha } = await resolverIdPorSenha(senha);

  if (falha) {
    // Falha de infraestrutura (sem credencial/banco): não conta
    // como tentativa errada do usuário, mas também não libera.
    return NextResponse.json(
      { erro: "Serviço de acesso indisponível no momento." },
      { status: 503 }
    );
  }

  if (!id) {
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
        tentativas: registro.falhas,
      },
      { status: 401 }
    );
  }

  tentativas.delete(ip);
  return NextResponse.json({ ok: true, id });
}
