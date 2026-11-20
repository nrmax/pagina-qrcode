import AdminDashboard from "@/components/admin/AdminDashboard";
import { EQUIPAMENTOS } from "@/data/equipamentos";
import {
  listarEquipamentos,
  listarClientes,
  listarResponsaveis,
} from "@/lib/db/equipamentos";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Painel administrativo",
};

/**
 * Painel administrativo — lê do Supabase quando o banco está
 * configurado e cai nos dados de demonstração caso contrário.
 * O CRUD grava por API routes com a chave service_role (servidor).
 */
export default async function PaginaAdmin() {
  const [equipamentos, clientes, responsaveis] = await Promise.all([
    listarEquipamentos(true), // admin: inclui senhas (service_role)
    listarClientes(),
    listarResponsaveis(),
  ]);

  return (
    <AdminDashboard
      equipamentos={equipamentos ?? EQUIPAMENTOS}
      clientes={clientes}
      responsaveis={responsaveis}
    />
  );
}
