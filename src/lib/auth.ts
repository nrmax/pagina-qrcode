/**
 * Autenticação administrativa (etapa 5 — implementação real).
 *
 * - Senha do admin vive em `.env.local` (nunca no repositório).
 * - A sessão é um cookie httpOnly cujo valor é um HMAC-SHA256 de um
 *   domínio fixo, assinado com SESSION_SECRET — não é forjável sem o
 *   segredo e não depende de banco de dados.
 */

export const COOKIE_SESSAO = "nrmax_admin";
export const SESSAO_DOMINIO = "nrmax-admin-session-v1";

/** Segredo usado para assinar/verificar a sessão. Falha fechada se ausente. */
export function segredoSessao(): string | null {
  return process.env.SESSION_SECRET || process.env.ADMIN_SENHA || null;
}

function hex(buffer: ArrayBuffer): string {
  return [...new Uint8Array(buffer)]
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/** Assina o valor do cookie de sessão (HMAC-SHA256). */
export async function assinarSessao(segredo: string): Promise<string> {
  const chave = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(segredo),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const mac = await crypto.subtle.sign(
    "HMAC",
    chave,
    new TextEncoder().encode(SESSAO_DOMINIO)
  );
  return hex(mac);
}

/** Comparação em tempo constante de duas strings. */
export function igualConstante(a: string, b: string): boolean {
  const alvo = a.length === b.length ? b : "x".repeat(a.length);
  let diff = a.length === b.length ? 0 : 1;
  for (let i = 0; i < a.length; i++) {
    diff |= a.charCodeAt(i) ^ alvo.charCodeAt(i);
  }
  return diff === 0;
}

/** Verifica se o token do cookie é válido para o segredo atual. */
export async function sessaoValida(
  token: string | undefined | null,
  segredo: string | null
): Promise<boolean> {
  if (!token || !segredo) return false;
  const esperado = await assinarSessao(segredo);
  return igualConstante(token, esperado);
}
