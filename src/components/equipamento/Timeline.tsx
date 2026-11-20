"use client";

import { useState } from "react";
import Lightbox from "./Lightbox";
import { formatarDataCurta } from "@/lib/laudo";
import type { Manutencao } from "@/data/equipamentos";
import styles from "./Timeline.module.css";

type Props = {
  manutencoes: Manutencao[];
};

/**
 * Linha do tempo do histórico de manutenção.
 * Cada registro pode ser expandido na galeria ampliada (Lightbox).
 */
export default function Timeline({ manutencoes }: Props) {
  const [galeria, setGaleria] = useState<{
    manutencao: number;
    foto: number;
  } | null>(null);

  if (manutencoes.length === 0) {
    return (
      <div className={styles.vazio}>
        <p>Nenhuma manutenção registrada até o momento.</p>
      </div>
    );
  }

  const atual = galeria ? manutencoes[galeria.manutencao] : null;

  return (
    <>
      <ol className={styles.linha}>
        {manutencoes.map((m, i) => (
          <li key={m.id} className={styles.item}>
            <span
              className={`${styles.marcador} ${i === 0 ? styles.marcadorAtual : ""}`}
              aria-hidden
            />

            <article className={styles.cartao}>
              <header className={styles.cabecalho}>
                <time className={styles.data} dateTime={m.data}>
                  {formatarDataCurta(m.data)}
                </time>
                <h3 className={styles.servico}>{m.servico}</h3>
              </header>

              <p className={styles.descricao}>{m.descricao}</p>

              {m.pecas.length > 0 && (
                <div className={styles.bloco}>
                  <span className={styles.rotulo}>Peças substituídas</span>
                  <ul className={styles.pecas}>
                    {m.pecas.map((p) => (
                      <li key={p} className="chip">
                        {p}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div className={styles.responsavel}>
                <span className={styles.avatar} aria-hidden>
                  {m.responsavel
                    .split(" ")
                    .slice(0, 2)
                    .map((p) => p[0])
                    .join("")
                    .toUpperCase()}
                </span>
                <span>{m.responsavel}</span>
              </div>

              {m.fotos.length > 0 && (
                <div className={styles.fotos}>
                  {m.fotos.map((f, fi) => (
                    <button
                      key={f.src + fi}
                      type="button"
                      className={styles.miniatura}
                      onClick={() => setGaleria({ manutencao: i, foto: fi })}
                      aria-label={`Ampliar foto: ${f.legenda}`}
                    >
                      <img src={f.src} alt={f.alt} loading="lazy" />
                      <span className={styles.zoom} aria-hidden>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                          <path
                            d="M4 10a8 8 0 1 1 2.34 5.66M4 10V4m0 6h6"
                            stroke="currentColor"
                            strokeWidth="2.2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                          <path
                            d="M20 4v6m0-6h-6"
                            stroke="currentColor"
                            strokeWidth="2.2"
                            strokeLinecap="round"
                          />
                        </svg>
                      </span>
                    </button>
                  ))}
                  <span className={styles.fotoContagem}>
                    {m.fotos.length}{" "}
                    {m.fotos.length === 1 ? "foto" : "fotos"}
                  </span>
                </div>
              )}
            </article>
          </li>
        ))}
      </ol>

      {galeria && atual && (
        <Lightbox
          fotos={atual.fotos}
          indice={galeria.foto}
          aoNavegar={(idx) => setGaleria({ ...galeria, foto: idx })}
          aoFechar={() => setGaleria(null)}
          contexto={`${atual.servico} · ${formatarDataCurta(atual.data)}`}
        />
      )}
    </>
  );
}
