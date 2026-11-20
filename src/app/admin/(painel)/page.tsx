import AdminDashboard from "@/components/admin/AdminDashboard";
import { EQUIPAMENTOS } from "@/data/equipamentos";
import { listarEquipamentos } from "@/lib/db/equipamentos";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Painel administrativo",
};

/**
 * Painel administrativo — lê do Supabase quando o banco está
 * configurado e cai nos dados de demonstração caso contrário.
 */
export default async function PaginaAdmin() {
  const equipamentos = (await listarEquipamentos()) ?? EQUIPAMENTOS;
  return <AdminDashboard equipamentos={equipamentos} />;
}
