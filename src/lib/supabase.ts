import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * Cliente Supabase do servidor (leitura pública com RLS).
 *
 * - Usa a chave pública `anon`/`publishable` — segura para o frontend
 *   e limitada pelas políticas RLS do banco.
 * - A chave `service_role` (escrita/leitura de senhas) NUNCA é usada
 *   aqui; ela será adicionada apenas nas etapas de CRUD, somente no
 *   servidor, via env sem prefixo NEXT_PUBLIC.
 * - Retorna `null` quando as variáveis não estão configuradas, para
 *   que a aplicação caia com elegância nos dados de demonstração.
 */
let cliente: SupabaseClient | null = null;
let configurado = false;

export function supabase(): SupabaseClient | null {
  if (configurado) return cliente;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const chave = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  configurado = true;

  if (!url || !chave) return null;

  cliente = createClient(url, chave, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return cliente;
}
