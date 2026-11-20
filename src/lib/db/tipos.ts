/**
 * Tipos das linhas do banco (espelho do SQL da migração 001).
 * Mantidos à mão de forma intencional: pequenos, estáveis e sem
 * dependência de geração de tipos (gen types) nesta etapa.
 */

export type ClienteRow = {
  id: string;
  nome: string;
  cnpj_cpf: string | null;
  endereco: string | null;
  telefone: string | null;
  email: string | null;
  observacoes: string | null;
};

export type ResponsavelRow = {
  id: string;
  nome: string;
  cargo: string | null;
  email: string | null;
  telefone: string | null;
  cliente_id: string | null;
};

export type EquipamentoRow = {
  id: string;
  codigo: string | null;
  nome: string;
  tipo: string | null;
  fabricante: string | null;
  modelo: string | null;
  ano_fabricacao: number | null;
  numero_serie: string | null;
  local_instalacao: string | null;
  data_instalacao: string | null;
  status: "ativo" | "manutencao" | "inativo" | "desativado";
  potencia: string | null;
  tensao: string | null;
  capacidade: string | null;
  foto_hero: string | null;
  laudo_numero: string | null;
  laudo_emitido_em: string | null;
  laudo_vencimento_em: string | null;
  laudo_alerta_dias: number;
  observacoes: string | null;
  cliente_id: string | null;
  responsavel_id: string | null;
};

export type ManutencaoRow = {
  id: string;
  equipamento_id: string;
  tipo: string;
  data: string;
  servico: string;
  descricao: string | null;
  diagnostico: string | null;
  solucao: string | null;
  pecas: string[];
  responsavel: string | null;
  status: string;
  proxima_manutencao: string | null;
};

export type FotoRow = {
  id: string;
  equipamento_id: string;
  manutencao_id: string | null;
  storage_path: string;
  legenda: string | null;
  alt: string | null;
  tipo: string;
  data_envio: string;
};

export type CampoTecnicoRow = {
  id: string;
  equipamento_id: string;
  chave: string;
  valor: string;
  unidade: string | null;
  grupo: string;
  ordem: number;
};

/** Shape retornado pelo select aninhado do Supabase. */
export type EquipamentoComRelacoes = EquipamentoRow & {
  clientes: Pick<ClienteRow, "nome" | "endereco"> | null;
  responsaveis: Pick<ResponsavelRow, "nome" | "cargo"> | null;
  equipamentos_senhas: { senha: string } | null;
  manutencoes: (ManutencaoRow & { fotos: FotoRow[] })[];
  campos_tecnicos: CampoTecnicoRow[];
};
