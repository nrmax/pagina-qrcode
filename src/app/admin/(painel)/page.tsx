import AdminDashboard from "@/components/admin/AdminDashboard";
import { EQUIPAMENTOS } from "@/data/equipamentos";

export const metadata = {
  title: "Painel administrativo",
};

/**
 * Painel administrativo (etapa 8 — estrutura + dados fictícios).
 * O CRUD passa a gravar no banco na etapa 4/8; por enquanto os dados
 * vêm do módulo de demonstração.
 */
export default function PaginaAdmin() {
  return <AdminDashboard equipamentos={EQUIPAMENTOS} />;
}
