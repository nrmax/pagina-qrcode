import { supabase, supabaseAdmin } from "@/lib/supabase";
import type {
  EquipamentoComRelacoes,
  EquipamentoRow,
  ManutencaoRow,
  FotoRow,
  CampoTecnicoRow,
} from "@/lib/db/tipos";
import type { Equipamento, Manutencao, Foto, CampoCustomizado } from "@/data/equipamentos";

/**
 * Camada de acesso a dados (repositório).
 *
 * - Toda consulta passa por aqui — páginas nunca falam com o
 *   Supabase diretamente (facilita trocar de provedor/banco).
 * - Erros são absorvidos com `console.warn` e retorno de `null`:
 *   a aplicação cai nos dados de demonstração e continua no ar
 *   enquanto o banco não estiver configurado.
 */

const SELECT_RELACIONAMENTOS = `
  *,
  clientes ( nome, endereco ),
  responsaveis ( nome, cargo ),
  equipamentos_senhas ( senha ),
  manutencoes ( *, fotos ( * ) ),
  campos_tecnicos ( * )
`;

function paraFoto(row: FotoRow): Foto {
  return {
    src: row.storage_path,
    legenda: row.legenda ?? "",
    alt: row.alt ?? row.legenda ?? "Foto do equipamento",
  };
}

function paraManutencao(row: ManutencaoRow & { fotos: FotoRow[] }): Manutencao {
  return {
    id: row.id,
    data: row.data,
    servico: row.servico,
    descricao: row.descricao ?? "",
    pecas: Array.isArray(row.pecas) ? row.pecas : [],
    responsavel: row.responsavel ?? "—",
    fotos: (row.fotos ?? []).map(paraFoto),
  };
}

function paraCampoCustomizado(row: CampoTecnicoRow): CampoCustomizado {
  return {
    rotulo: row.chave,
    valor: row.unidade ? `${row.valor} ${row.unidade}` : row.valor,
  };
}

/** Mapeia a linha do banco para o modelo de domínio usado pela UI. */
function paraDominio(row: EquipamentoComRelacoes): Equipamento {
  const cliente = row.clientes;
  const resp = row.responsaveis;

  return {
    id: row.id,
    nome: row.nome,
    modelo: row.modelo ?? "—",
    marca: row.fabricante ?? "—",
    anoFabricacao: row.ano_fabricacao ?? 0,
    numeroSerie: row.numero_serie ?? "—",
    potencia: row.potencia ?? "—",
    tensao: row.tensao ?? "—",
    capacidade: row.capacidade ?? "—",
    cliente: cliente?.nome ?? "—",
    endereco: row.local_instalacao ?? cliente?.endereco ?? "—",
    responsavel: resp
      ? `${resp.nome}${resp.cargo ? ` — ${resp.cargo}` : ""}`
      : "—",
    fotoHero: row.foto_hero ?? "/photos/manutencao-01.svg",
    laudo: {
      numero: row.laudo_numero ?? "—",
      emitidoEm: row.laudo_emitido_em ?? "",
      vencimentoEm: row.laudo_vencimento_em ?? "",
      alertaDias: row.laudo_alerta_dias ?? 30,
    },
    camposCustomizados: (row.campos_tecnicos ?? [])
      .slice()
      .sort((a, b) => a.ordem - b.ordem)
      .map(paraCampoCustomizado),
    manutencoes: (row.manutencoes ?? [])
      .slice()
      .sort((a, b) => b.data.localeCompare(a.data))
      .map(paraManutencao),
    senha: row.equipamentos_senhas?.senha ?? "",
    status: row.status,
  };
}

/** Busca um equipamento completo por id. `null` = não achou ou erro. */
export async function buscarEquipamentoPorId(
  id: string
): Promise<Equipamento | null> {
  const sb = supabase();
  if (!sb) return null;

  try {
    const { data, error } = await sb
      .from("equipamentos")
      .select(SELECT_RELACIONAMENTOS)
      .eq("id", id)
      .maybeSingle();

    if (error) {
      console.warn("[db] buscarEquipamentoPorId:", error.message);
      return null;
    }
    return data ? paraDominio(data as EquipamentoComRelacoes) : null;
  } catch (erro) {
    console.warn("[db] falha inesperada:", erro);
    return null;
  }
}

/**
 * Lista todos os equipamentos completos.
 * `admin=true`: lê com a chave service_role (servidor, atrás da
 * sessão do proxy) — necessário para exibir as senhas no painel,
 * já que o RLS nega essa tabela para a chave pública.
 */
export async function listarEquipamentos(
  admin = false
): Promise<Equipamento[] | null> {
  const sb = (admin && supabaseAdmin()) || supabase();
  if (!sb) return null;

  try {
    const { data, error } = await sb
      .from("equipamentos")
      .select(SELECT_RELACIONAMENTOS)
      .order("nome");

    if (error) {
      console.warn("[db] listarEquipamentos:", error.message);
      return null;
    }
    return ((data ?? []) as EquipamentoComRelacoes[]).map(paraDominio);
  } catch (erro) {
    console.warn("[db] falha inesperada:", erro);
    return null;
  }
}

/** Quantidade de linhas (usado pelo dashboard quando disponível). */
export type { EquipamentoRow };

// ============================================================
// ESCRITA (somente servidor — cliente service_role)
// ============================================================

export type Opcao = { id: string; nome: string };

export type DadosEquipamento = {
  nome: string;
  codigo?: string | null;
  tipo?: string | null;
  fabricante?: string | null;
  modelo?: string | null;
  anoFabricacao?: number | string | null;
  numeroSerie?: string | null;
  dataInstalacao?: string | null;
  status?: string;
  localInstalacao?: string | null;
  observacoes?: string | null;
  potencia?: string | null;
  tensao?: string | null;
  capacidade?: string | null;
  fotoHero?: string | null;
  clienteId?: string | null;
  responsavelId?: string | null;
  laudoNumero?: string | null;
  laudoEmitidoEm?: string | null;
  laudoVencimentoEm?: string | null;
  laudoAlertaDias?: number | string | null;
  /** 3 dígitos — obrigatório na criação, opcional na edição. */
  senha?: string;
};

export type Resultado = { ok: true; id?: string } | { ok: false; erro: string };

/** Converte "" / undefined em null e valida formatos de data. */
function texto(v: unknown): string | null {
  return typeof v === "string" && v.trim() !== "" ? v.trim() : null;
}

function data(v: unknown): string | null {
  return typeof v === "string" && /^\d{4}-\d{2}-\d{2}$/.test(v) ? v : null;
}

function inteiro(v: unknown, padrao: number | null = null): number | null {
  if (v === null || v === undefined || v === "") return padrao;
  const n = Number(v);
  return Number.isInteger(n) ? n : padrao;
}

function linhaEquipamento(d: DadosEquipamento) {
  return {
    nome: (d.nome ?? "").trim(),
    codigo: texto(d.codigo),
    tipo: texto(d.tipo),
    fabricante: texto(d.fabricante),
    modelo: texto(d.modelo),
    ano_fabricacao: inteiro(d.anoFabricacao),
    numero_serie: texto(d.numeroSerie),
    data_instalacao: data(d.dataInstalacao),
    status: d.status ?? "ativo",
    local_instalacao: texto(d.localInstalacao),
    observacoes: texto(d.observacoes),
    potencia: texto(d.potencia),
    tensao: texto(d.tensao),
    capacidade: texto(d.capacidade),
    foto_hero: texto(d.fotoHero),
    cliente_id: texto(d.clienteId),
    responsavel_id: texto(d.responsavelId),
    laudo_numero: texto(d.laudoNumero),
    laudo_emitido_em: data(d.laudoEmitidoEm),
    laudo_vencimento_em: data(d.laudoVencimentoEm),
    laudo_alerta_dias: inteiro(d.laudoAlertaDias, 30) ?? 30,
    atualizado_em: new Date().toISOString(),
  };
}

function validar(d: DadosEquipamento, exigeSenha: boolean): string | null {
  if (!texto(d.nome)) return "Informe o nome do equipamento.";
  if (d.senha && !/^\d{3}$/.test(d.senha))
    return "A senha deve ter exatamente 3 dígitos.";
  if (exigeSenha && !/^\d{3}$/.test(d.senha ?? ""))
    return "Informe a senha de 3 dígitos do equipamento.";
  if (d.status && !["ativo", "manutencao", "inativo", "desativado"].includes(d.status))
    return "Status inválido.";
  return null;
}

/**
 * Payload de atualização: campos de vínculo (cliente/responsável)
 * só entram quando o chamador os envia — assim um PATCH parcial
 * nunca apaga um vínculo existente por acidente.
 */
function linhaAtualizacao(d: DadosEquipamento) {
  const base = linhaEquipamento(d) as Partial<ReturnType<typeof linhaEquipamento>>;
  if (d.clienteId === undefined) delete base.cliente_id;
  if (d.responsavelId === undefined) delete base.responsavel_id;
  return base;
}

/** Valida a senha de 3 dígitos e devolve o id do equipamento. */
export async function resolverIdPorSenha(
  senha: string
): Promise<{ id: string | null; falha: boolean }> {
  const sb = supabaseAdmin();
  if (!sb) return { id: null, falha: true };

  try {
    const { data, error } = await sb
      .from("equipamentos_senhas")
      .select("equipamento_id")
      .eq("senha", senha)
      .maybeSingle();

    if (error) {
      console.warn("[db] resolverIdPorSenha:", error.message);
      return { id: null, falha: true };
    }
    return { id: data?.equipamento_id ?? null, falha: false };
  } catch (erro) {
    console.warn("[db] resolverIdPorSenha falha:", erro);
    return { id: null, falha: true };
  }
}

/** Cria equipamento (e sua senha). Retorna o id gerado. */
export async function criarEquipamento(d: DadosEquipamento): Promise<Resultado> {
  const sb = supabaseAdmin();
  if (!sb)
    return { ok: false, erro: "Servidor sem credencial de escrita (SUPABASE_SERVICE_ROLE_KEY)." };

  const problema = validar(d, true);
  if (problema) return { ok: false, erro: problema };

  try {
    const id = crypto.randomUUID();
    const { error } = await sb.from("equipamentos").insert({
      id,
      ...linhaEquipamento(d),
      criado_em: new Date().toISOString(),
    });
    if (error) return { ok: false, erro: `Falha ao criar: ${error.message}` };

    const { error: erroSenha } = await sb
      .from("equipamentos_senhas")
      .upsert({ equipamento_id: id, senha: d.senha });
    if (erroSenha) {
      console.warn("[db] senha não gravada:", erroSenha.message);
      return { ok: false, erro: `Equipamento criado, mas a senha falhou: ${erroSenha.message}` };
    }

    return { ok: true, id };
  } catch (erro) {
    return { ok: false, erro: `Falha inesperada: ${String(erro)}` };
  }
}

/** Atualiza equipamento. Senha só é alterada se informada. */
export async function atualizarEquipamento(
  id: string,
  d: DadosEquipamento
): Promise<Resultado> {
  const sb = supabaseAdmin();
  if (!sb)
    return { ok: false, erro: "Servidor sem credencial de escrita (SUPABASE_SERVICE_ROLE_KEY)." };

  const problema = validar(d, false);
  if (problema) return { ok: false, erro: problema };

  try {
    const { error } = await sb
      .from("equipamentos")
      .update(linhaAtualizacao(d))
      .eq("id", id);
    if (error) return { ok: false, erro: `Falha ao atualizar: ${error.message}` };

    if (d.senha) {
      const { error: erroSenha } = await sb
        .from("equipamentos_senhas")
        .upsert({ equipamento_id: id, senha: d.senha });
      if (erroSenha)
        return { ok: false, erro: `Dados ok, mas a senha falhou: ${erroSenha.message}` };
    }

    return { ok: true, id };
  } catch (erro) {
    return { ok: false, erro: `Falha inesperada: ${String(erro)}` };
  }
}

/** Exclui equipamento (senhas, manutenções, fotos e campos vão junto). */
export async function excluirEquipamento(id: string): Promise<Resultado> {
  const sb = supabaseAdmin();
  if (!sb)
    return { ok: false, erro: "Servidor sem credencial de escrita (SUPABASE_SERVICE_ROLE_KEY)." };

  try {
    const { error } = await sb.from("equipamentos").delete().eq("id", id);
    if (error) return { ok: false, erro: `Falha ao excluir: ${error.message}` };
    return { ok: true };
  } catch (erro) {
    return { ok: false, erro: `Falha inesperada: ${String(erro)}` };
  }
}

/** Clientes para o select do formulário. */
export async function listarClientes(): Promise<Opcao[]> {
  const sb = supabase();
  if (!sb) return [];
  const { data, error } = await sb
    .from("clientes")
    .select("id, nome")
    .order("nome");
  if (error) {
    console.warn("[db] listarClientes:", error.message);
    return [];
  }
  return (data ?? []) as Opcao[];
}

/** Responsáveis para o select do formulário. */
export async function listarResponsaveis(): Promise<Opcao[]> {
  const sb = supabase();
  if (!sb) return [];
  const { data, error } = await sb
    .from("responsaveis")
    .select("id, nome")
    .order("nome");
  if (error) {
    console.warn("[db] listarResponsaveis:", error.message);
    return [];
  }
  return (data ?? []) as Opcao[];
}
