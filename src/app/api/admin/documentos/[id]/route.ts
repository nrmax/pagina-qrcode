import { NextResponse } from "next/server";
import { removerDocumento } from "@/lib/db/equipamentos";

export const runtime = "nodejs";

/**
 * DELETE /api/admin/documentos/[id]
 * Remove o PDF do Storage e o registro do banco.
 * Protegido pelo proxy (sessão administrativa obrigatória).
 */
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const resultado = await removerDocumento(id);

  if (!resultado.ok) {
    const status = resultado.erro.startsWith("Servidor sem")
      ? 503
      : resultado.erro === "Documento não encontrado."
        ? 404
        : 500;
    return NextResponse.json({ erro: resultado.erro }, { status });
  }

  return NextResponse.json({ ok: true, id });
}
