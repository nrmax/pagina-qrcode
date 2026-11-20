/**
 * Regras de status do laudo técnico.
 * O prazo de alerta é configurável pelo administrador (alertaDias).
 */

export type StatusLaudo = "valido" | "alerta" | "vencido";

/** Interpreta "AAAA-MM-DD" como data local (meio-dia) e devolve os dias até hoje. */
export function diasRestantes(vencimento: string): number {
  const [ano, mes, dia] = vencimento.split("-").map(Number);
  const alvo = new Date(ano, mes - 1, dia, 12, 0, 0);
  const hoje = new Date();
  hoje.setHours(12, 0, 0, 0);
  return Math.round((alvo.getTime() - hoje.getTime()) / 86_400_000);
}

export function statusLaudo(
  vencimento: string,
  alertaDias: number
): StatusLaudo {
  const dias = diasRestantes(vencimento);
  if (dias < 0) return "vencido";
  if (dias <= alertaDias) return "alerta";
  return "valido";
}

export const rotuloStatus: Record<StatusLaudo, string> = {
  valido: "Laudo válido",
  alerta: "Vencimento próximo",
  vencido: "Laudo vencido",
};

/** Ex.: 31 de agosto de 2027 */
export function formatarData(iso: string): string {
  const [ano, mes, dia] = iso.split("-").map(Number);
  return new Date(ano, mes - 1, dia).toLocaleDateString("pt-BR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

/** Ex.: 31/08/2027 */
export function formatarDataCurta(iso: string): string {
  const [ano, mes, dia] = iso.split("-").map(Number);
  return new Date(ano, mes - 1, dia).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

/** Texto do contador regressivo. */
export function textoContador(vencimento: string): string {
  const dias = diasRestantes(vencimento);
  if (dias < 0) {
    const abs = Math.abs(dias);
    return abs === 1 ? "Vencido há 1 dia" : `Vencido há ${abs} dias`;
  }
  if (dias === 0) return "Vence hoje";
  if (dias === 1) return "Vence em 1 dia";
  return `Vence em ${dias} dias`;
}
