import { notFound } from "next/navigation";
import { getEquipamento } from "@/data/equipamentos";
import { buscarEquipamentoPorId } from "@/lib/db/equipamentos";
import EquipmentView from "@/components/equipamento/EquipmentView";

/**
 * Renderização dinâmica: o conteúdo vem do Supabase e o status do
 * laudo depende da data atual do servidor. Enquanto o banco não
 * estiver configurado, a página cai nos dados de demonstração.
 */
export const dynamic = "force-dynamic";

export const metadata = {
  title: "Equipamento",
};

export default async function PaginaEquipamento({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  // 1º banco de dados; fallback para a demonstração local.
  const equipamento = (await buscarEquipamentoPorId(id)) ?? getEquipamento(id);

  if (!equipamento) {
    notFound();
  }

  return <EquipmentView equip={equipamento} />;
}
