import { NextResponse } from "next/server";
import { atualizarEquipamento, excluirEquipamento } from "@/lib/db/equipamentos";

export const runtime = "nodejs";

type Params = { params: Promise<{ id: string }> };

/**
 * PATCH /api/admin/equipamentos/[id]  — atualiza (senha só se informada)
 * DELETE /api/admin/equipamentos/[id] — exclui (cascata no banco)
 *
 * Protegido pelo proxy (/api/admin/* exige sessão).
 */
export async function PATCH(request: Request, { params }: Params) {
  const { id } = await params;
  const corpo = await request.json().catch(() => null);
  if (!corpo || typeof corpo !== "object") {
    return NextResponse.json({ erro: "Corpo inválido." }, { status: 400 });
  }

  const resultado = await atualizarEquipamento(id, corpo);
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

  return NextResponse.json({ ok: true, id });
}

export async function DELETE(_request: Request, { params }: Params) {
  const { id } = await params;
  const resultado = await excluirEquipamento(id);
  if (!resultado.ok) {
    const status = resultado.erro.startsWith("Servidor sem") ? 503 : 500;
    return NextResponse.json({ erro: resultado.erro }, { status });
  }
  return NextResponse.json({ ok: true, id });
}
