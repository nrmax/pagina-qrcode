"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Logo from "@/components/Logo";
import styles from "./page.module.css";

const TOTAL_DIGITOS = 3;
const MAX_TENTATIVAS = 5;
const SEGUNDOS_BLOQUEIO = 30;

export default function PaginaAcesso() {
  const router = useRouter();
  const [digitos, setDigitos] = useState<string[]>(["", "", ""]);
  const [erro, setErro] = useState(false);
  const [carregando, setCarregando] = useState(false);
  const [tentativas, setTentativas] = useState(0);
  const [bloqueioAte, setBloqueioAte] = useState(0);
  const [restante, setRestante] = useState(0);
  const inputsRef = useRef<Array<HTMLInputElement | null>>([]);

  const bloqueado = restante > 0;
  const completo = digitos.every((d) => d !== "");

  // Contagem regressiva do bloqueio temporário
  useEffect(() => {
    if (!bloqueioAte) return;
    const t = setInterval(() => {
      const s = Math.max(0, Math.ceil((bloqueioAte - Date.now()) / 1000));
      setRestante(s);
      if (s === 0) {
        setTentativas(0);
        clearInterval(t);
      }
    }, 250);
    return () => clearInterval(t);
  }, [bloqueioAte]);

  function alterarDigito(i: number, valor: string) {
    const limpo = valor.replace(/\D/g, "");
    if (!limpo && valor !== "") return;

    setErro(false);

    if (limpo.length > 1) {
      // Colou um código completo de uma vez
      const chars = limpo.slice(0, TOTAL_DIGITOS).split("");
      const novos = Array(TOTAL_DIGITOS).fill("");
      chars.forEach((c, idx) => (novos[idx] = c));
      setDigitos(novos);
      const proximo = Math.min(chars.length, TOTAL_DIGITOS - 1);
      inputsRef.current[proximo]?.focus();
      if (chars.length === TOTAL_DIGITOS) validar(novos.join(""));
      return;
    }

    const novos = [...digitos];
    novos[i] = limpo;
    setDigitos(novos);

    if (limpo && i < TOTAL_DIGITOS - 1) {
      inputsRef.current[i + 1]?.focus();
      if (i + 1 === TOTAL_DIGITOS - 1 && novos.every((d) => d !== "")) {
        validar(novos.join(""));
      }
    }
  }

  function teclaParaTras(i: number, e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Backspace" && !digitos[i] && i > 0) {
      inputsRef.current[i - 1]?.focus();
    }
  }

  /**
   * Validação REAL no servidor (POST /api/acesso).
   * A senha é conferida na tabela protegida por RLS; o cliente
   * recebe apenas o id quando acerta. Rate-limit também no servidor.
   */
  async function validar(senha: string) {
    if (carregando || bloqueado) return;
    setCarregando(true);
    setErro(false);

    try {
      const res = await fetch("/api/acesso", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ senha }),
      });
      const dados = await res.json().catch(() => ({}));

      if (res.ok && dados.ok && dados.id) {
        router.push(`/equip/${dados.id}`);
        return;
      }

      if (res.status === 429) {
        const segundos = dados.retryAfter ?? SEGUNDOS_BLOQUEIO;
        setBloqueioAte(Date.now() + segundos * 1000);
        setRestante(segundos);
        setErro(true);
        setCarregando(false);
        return;
      }

      const novasTentativas = tentativas + 1;
      setTentativas(novasTentativas);
      setErro(true);
      setCarregando(false);
      setDigitos(["", "", ""]);
      inputsRef.current[0]?.focus();

      if (novasTentativas >= MAX_TENTATIVAS) {
        setBloqueioAte(Date.now() + SEGUNDOS_BLOQUEIO * 1000);
        setRestante(SEGUNDOS_BLOQUEIO);
      }
    } catch {
      setErro(true);
      setCarregando(false);
    }
  }

  function enviarFormulario(e: React.FormEvent) {
    e.preventDefault();
    if (completo) validar(digitos.join(""));
  }

  return (
    <main className={styles.main}>
      {/* Fundo com orbes suaves — movimento discreto, estilo Apple */}
      <div className={styles.orbes} aria-hidden>
        <span className={styles.orbe1} />
        <span className={styles.orbe2} />
        <span className={styles.orbe3} />
      </div>

      <section className={`${styles.cartao} ${erro ? styles.shake : ""}`}>
        <header className={styles.topo}>
          <Logo size={26} />
          <h1 className={styles.titulo}>Acesso ao equipamento</h1>
          <p className={styles.subtitulo}>
            Informe a senha individual de 3 dígitos impressa na etiqueta do
            equipamento.
          </p>
        </header>

        <form onSubmit={enviarFormulario} className={styles.form}>
          <fieldset
            className={styles.campos}
            disabled={bloqueado || carregando}
            aria-label="Senha de 3 dígitos"
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
                maxLength={TOTAL_DIGITOS}
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
                Muitas tentativas. Tente novamente em{" "}
                <strong>{restante}s</strong>.
              </span>
            ) : erro ? (
              <span className={styles.erro}>
                Senha incorreta.{" "}
                {tentativas > 0 &&
                  `Tentativa ${tentativas} de ${MAX_TENTATIVAS}.`}
              </span>
            ) : carregando ? (
              <span className={styles.carregando}>Verificando…</span>
            ) : (
              <span className={styles.dica}>
                O QR Code é o mesmo para todos os equipamentos — a senha
                identifica o seu.
              </span>
            )}
          </div>

          <button
            type="submit"
            className="btn btn--primary"
            disabled={!completo || bloqueado || carregando}
          >
            {carregando ? "Validando…" : "Acessar"}
          </button>
        </form>

        <footer className={styles.rodape}>
          <span className={styles.demo}>
            Acesso individual por senha de 3 dígitos
          </span>
        </footer>
      </section>

      <p className={styles.marca}>
        NRmax · Engenharia, segurança e qualidade em cada equipamento
      </p>
    </main>
  );
}
