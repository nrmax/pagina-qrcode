"use client";

import { useEffect } from "react";
import type { Foto } from "@/data/equipamentos";
import styles from "./Lightbox.module.css";

type Props = {
  fotos: Foto[];
  indice: number;
  aoNavegar: (indice: number) => void;
  aoFechar: () => void;
  contexto?: string;
};

/**
 * Galeria ampliada em tela cheia com navegação por teclado
 * (← → para trocar de imagem, Esc para fechar).
 */
export default function Lightbox({
  fotos,
  indice,
  aoNavegar,
  aoFechar,
  contexto,
}: Props) {
  const total = fotos.length;
  const foto = fotos[indice];

  useEffect(() => {
    function aoTeclar(e: KeyboardEvent) {
      if (e.key === "Escape") aoFechar();
      if (e.key === "ArrowRight")
        aoNavegar((indice + 1) % total);
      if (e.key === "ArrowLeft")
        aoNavegar((indice - 1 + total) % total);
    }

    document.addEventListener("keydown", aoTeclar);
    const anterior = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", aoTeclar);
      document.body.style.overflow = anterior;
    };
  }, [indice, total, aoFechar, aoNavegar]);

  if (!foto) return null;

  return (
    <div
      className={styles.overlay}
      role="dialog"
      aria-modal="true"
      aria-label="Galeria de fotos da manutenção"
      onClick={aoFechar}
    >
      <button
        type="button"
        className={styles.fechar}
        onClick={aoFechar}
        aria-label="Fechar galeria"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
          <path
            d="M6 6l12 12M18 6L6 18"
            stroke="currentColor"
            strokeWidth="2.4"
            strokeLinecap="round"
          />
        </svg>
      </button>

      {total > 1 && (
        <>
          <button
            type="button"
            className={`${styles.navegar} ${styles.anterior}`}
            onClick={(e) => {
              e.stopPropagation();
              aoNavegar((indice - 1 + total) % total);
            }}
            aria-label="Foto anterior"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
              <path
                d="M15 5l-7 7 7 7"
                stroke="currentColor"
                strokeWidth="2.4"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
          <button
            type="button"
            className={`${styles.navegar} ${styles.proxima}`}
            onClick={(e) => {
              e.stopPropagation();
              aoNavegar((indice + 1) % total);
            }}
            aria-label="Próxima foto"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
              <path
                d="M9 5l7 7-7 7"
                stroke="currentColor"
                strokeWidth="2.4"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        </>
      )}

      <figure className={styles.figura} onClick={(e) => e.stopPropagation()}>
        <img src={foto.src} alt={foto.alt} />
        <figcaption className={styles.legenda}>
          <span className={styles.legendaTexto}>{foto.legenda}</span>
          <span className={styles.contador}>
            {contexto && <em>{contexto} · </em>}
            {indice + 1}/{total}
          </span>
        </figcaption>
      </figure>
    </div>
  );
}
