import { NextResponse } from "next/server";
import { criarEquipamento } from "@/lib/db/equipamentos";

export const runtime = "nodejs";

/**
 * POST /api/admin/equipamentos  { ...dados, senha: "123" }
 *
 * Cria equipamento no Supabase (chave service_role, só no servidor).
 * Protegido pelo proxy (/api/admin/* exige sessão).
 */
export async function POST(request: Request) {
  const corpo = await request.json().catch(() => null);
  if (!corpo || typeof corpo !== "object") {
    return NextResponse.json({ erro: "Corpo inválido." }, { status: 400 });
  }

  const resultado = await criarEquipamento(corpo);
  if (!resultado.ok) {
    const status = resultado.erro.startsWith("Informe") ||
      resultado.erro.startsWith("A senha") ||
      resultado.erro.startsWith("Status")
      ? 400
      : resultado.erro.startsWith("Servidor sem")
        ? 503
        : 500;
    return NextResponse.json({ erro: resultado.erro }, { status });
  }

  return NextResponse.json({ ok: true, id: resultado.id }, { status: 201 });
}
