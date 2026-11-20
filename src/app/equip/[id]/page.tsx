import { notFound } from "next/navigation";
import { getEquipamento } from "@/data/equipamentos";
import EquipmentView from "@/components/equipamento/EquipmentView";

/**
 * Renderização dinâmica: o conteúdo será lido do banco nas próximas
 * etapas, e o status do laudo depende da data atual do servidor.
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
  const equipamento = getEquipamento(id);

  if (!equipamento) {
    notFound();
  }

  return <EquipmentView equip={equipamento} />;
}
