"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Logo from "@/components/Logo";
import styles from "./login.module.css";

const TOTAL = 6;

export default function LoginAdmin() {
  const router = useRouter();
  const [digitos, setDigitos] = useState<string[]>(Array(TOTAL).fill(""));
  const [erro, setErro] = useState<string | null>(null);
  const [carregando, setCarregando] = useState(false);
  const [bloqueio, setBloqueio] = useState(0);
  const inputsRef = useRef<Array<HTMLInputElement | null>>([]);

  const completo = digitos.every((d) => d !== "");
  const bloqueado = bloqueio > 0;

  // Contagem regressiva do bloqueio informado pelo servidor
  useEffect(() => {
    if (bloqueio <= 0) return;
    const t = setInterval(() => setBloqueio((s) => Math.max(0, s - 1)), 1000);
    return () => clearInterval(t);
  }, [bloqueio > 0]); // eslint-disable-line react-hooks/exhaustive-deps

  function alterarDigito(i: number, valor: string) {
    const limpo = valor.replace(/\D/g, "");
    if (!limpo && valor !== "") return;
    setErro(null);

    if (limpo.length > 1) {
      // Colou o código inteiro
      const chars = limpo.slice(0, TOTAL).split("");
      const novos = Array(TOTAL).fill("");
      chars.forEach((c, idx) => (novos[idx] = c));
      setDigitos(novos);
      inputsRef.current[Math.min(chars.length, TOTAL - 1)]?.focus();
      if (chars.length === TOTAL) enviar(novos.join(""));
      return;
    }

    const novos = [...digitos];
    novos[i] = limpo;
    setDigitos(novos);

    if (limpo && i < TOTAL - 1) {
      inputsRef.current[i + 1]?.focus();
      if (i + 1 === TOTAL - 1 && novos.every((d) => d !== "")) {
        enviar(novos.join(""));
      }
    }
  }

  function teclaParaTras(i: number, e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Backspace" && !digitos[i] && i > 0) {
      inputsRef.current[i - 1]?.focus();
    }
  }

  /**
   * Validação REAL no servidor via POST /api/admin/login
   * (comparação em tempo constante + limite de tentativas por IP).
   */
  async function enviar(senha: string) {
    if (carregando || bloqueado) return;
    setCarregando(true);
    setErro(null);

    try {
      const resposta = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ senha }),
      });
      const dados = await resposta.json().catch(() => ({}));

      if (resposta.ok) {
        router.push("/admin");
        router.refresh();
        return;
      }

      if (resposta.status === 429 && dados.retryAfter) {
        setBloqueio(dados.retryAfter);
      }
      setErro(dados.erro ?? "Não foi possível validar o acesso.");
      setDigitos(Array(TOTAL).fill(""));
      inputsRef.current[0]?.focus();
    } catch {
      setErro("Falha de conexão com o servidor. Tente novamente.");
      setDigitos(Array(TOTAL).fill(""));
    } finally {
      setCarregando(false);
    }
  }

  function enviarFormulario(e: React.FormEvent) {
    e.preventDefault();
    if (completo) enviar(digitos.join(""));
  }

  return (
    <main className={styles.main}>
      <div className={styles.orbes} aria-hidden>
        <span className={styles.orbe1} />
        <span className={styles.orbe2} />
      </div>

      <section className={`${styles.cartao} ${erro ? styles.shake : ""}`}>
        <header className={styles.topo}>
          <span className={styles.escudo} aria-hidden>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
              <path
                d="M12 3l7 3v5.5c0 4.4-3 8.2-7 9.5-4-1.3-7-5.1-7-9.5V6l7-3z"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinejoin="round"
              />
              <path
                d="M9.5 12l1.8 1.8 3.4-3.6"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </span>
          <Logo size={22} />
          <h1 className={styles.titulo}>Área administrativa</h1>
          <p className={styles.subtitulo}>
            Informe a senha administrativa de 6 dígitos.
          </p>
        </header>

        <form onSubmit={enviarFormulario} className={styles.form}>
          <fieldset
            className={styles.campos}
            disabled={bloqueado || carregando}
            aria-label="Senha administrativa de 6 dígitos"
          >
            {digitos.map((d, i) => (
              <input
                key={i}
                ref={(el) => {
                  inputsRef.current[i] = el;
                }}
                className={styles.campo}
                type="text"
                inputMode="numeric"
                autoComplete={i === 0 ? "one-time-code" : "off"}
                maxLength={TOTAL}
                value={d}
                placeholder="•"
                aria-label={`Dígito ${i + 1} da senha`}
                onChange={(e) => alterarDigito(i, e.target.value)}
                onKeyDown={(e) => teclaParaTras(i, e)}
              />
            ))}
          </fieldset>

          <div className={styles.mensagem} aria-live="polite">
            {bloqueado ? (
              <span className={styles.bloqueio}>
                Acesso bloqueado. Tente novamente em <strong>{bloqueio}s</strong>.
              </span>
            ) : erro ? (
              <span className={styles.erro}>{erro}</span>
            ) : carregando ? (
              <span className={styles.carregando}>Validando…</span>
            ) : (
              <span className={styles.dica}>
                Acesso restrito à equipe NRmax.
              </span>
            )}
          </div>

          <button
            type="submit"
            className="btn btn--primary"
            disabled={!completo || bloqueado || carregando}
          >
            {carregando ? "Validando…" : "Entrar no painel"}
          </button>
        </form>

        <footer className={styles.rodape}>
          <a href="/" className={styles.voltar}>
            ← Voltar à consulta de equipamentos
          </a>
        </footer>
      </section>
    </main>
  );
}
