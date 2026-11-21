import { NextResponse } from "next/server";
import { anexarDocumento } from "@/lib/db/equipamentos";

export const runtime = "nodejs";

/**
 * POST /api/admin/equipamentos/[id]/documentos
 * multipart/form-data: arquivo (PDF, até 10 MB) + nome (opcional)
 *
 * Envia ao bucket "documentos" e registra na tabela. Protegido
 * pelo proxy (sessão administrativa obrigatória).
 */
const MAX_BYTES = 10 * 1024 * 1024;

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const form = await request.formData().catch(() => null);
  const arquivo = form?.get("arquivo");

  if (!(arquivo instanceof File)) {
    return NextResponse.json(
      { erro: "Selecione um arquivo PDF." },
      { status: 400 }
    );
  }

  if (arquivo.size === 0) {
    return NextResponse.json({ erro: "O arquivo está vazio." }, { status: 400 });
  }

  if (arquivo.size > MAX_BYTES) {
    return NextResponse.json(
      { erro: "O PDF deve ter no máximo 10 MB." },
      { status: 413 }
    );
  }

  const ehPdf =
    arquivo.type === "application/pdf" ||
    arquivo.name.toLowerCase().endsWith(".pdf");
  if (!ehPdf) {
    return NextResponse.json(
      { erro: "Apenas arquivos PDF são aceitos." },
      { status: 400 }
    );
  }

  const nomeInformado = form?.get("nome");
  const nome =
    typeof nomeInformado === "string" && nomeInformado.trim()
      ? nomeInformado.trim()
      : arquivo.name;

  const bytes = await arquivo.arrayBuffer();
  const resultado = await anexarDocumento(id, { nome, bytes });

  if (!resultado.ok) {
    const status = resultado.erro.startsWith("Servidor sem") ? 503 : 500;
    return NextResponse.json({ erro: resultado.erro }, { status });
  }

  return NextResponse.json(
    { ok: true, documento: resultado.documento },
    { status: 201 }
  );
}
