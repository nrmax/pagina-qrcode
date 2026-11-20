import { supabase } from "@/lib/supabase";
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

/** Lista todos os equipamentos completos (painel administrativo). */
export async function listarEquipamentos(): Promise<Equipamento[] | null> {
  const sb = supabase();
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
