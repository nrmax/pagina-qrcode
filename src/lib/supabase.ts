import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * Clientes Supabase.
 *
 * - `supabase()`: chave pública (anon) — leitura pública com RLS.
 *   Segura para qualquer contexto.
 * - `supabaseAdmin()`: chave `service_role` — SOMENTE no servidor,
 *   usada nas rotas de escrita (CRUD) e na validação de senha.
 *   Nunca importada em componentes "use client"; a chave nunca
 *   aparece no bundle nem no Git (vive só em .env.local).
 *
 * Ambos retornam `null` quando as variáveis não estão configuradas,
 * para que a aplicação falhe de forma controlada.
 */
let cliente: SupabaseClient | null = null;
let configurado = false;

let clienteAdmin: SupabaseClient | null = null;
let adminConfigurado = false;

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

export function supabaseAdmin(): SupabaseClient | null {
  if (adminConfigurado) return clienteAdmin;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const chave = process.env.SUPABASE_SERVICE_ROLE_KEY;
  adminConfigurado = true;

  if (!url || !chave) return null;

  clienteAdmin = createClient(url, chave, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return clienteAdmin;
}

/** URL pública de um arquivo do Storage (buckets públicos). */
export function urlStorage(caminho: string): string {
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL;
  return base ? `${base}/storage/v1/object/public/${caminho}` : caminho;
}
