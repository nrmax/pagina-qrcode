"use client";

import styles from "./SegmentedTabs.module.css";

export type Aba = {
  id: string;
  rotulo: string;
};

type Props = {
  abas: Aba[];
  ativa: string;
  aoMudar: (id: string) => void;
  ariaLabel?: string;
};

/**
 * Controle segmentado inspirado no iOS/macOS:
 * seletor com pílula deslizante e transição suave.
 */
export default function SegmentedTabs({
  abas,
  ativa,
  aoMudar,
  ariaLabel = "Seções",
}: Props) {
  const indice = Math.max(
    0,
    abas.findIndex((a) => a.id === ativa)
  );

  return (
    <div className={styles.trilho} role="tablist" aria-label={ariaLabel}>
      <span
        className={styles.pilula}
        aria-hidden
        style={{
          width: `${100 / abas.length}%`,
          transform: `translateX(${indice * 100}%)`,
        }}
      />
      {abas.map((aba) => (
        <button
          key={aba.id}
          role="tab"
          type="button"
          aria-selected={aba.id === ativa}
          className={`${styles.aba} ${aba.id === ativa ? styles.ativa : ""}`}
          onClick={() => aoMudar(aba.id)}
        >
          {aba.rotulo}
        </button>
      ))}
    </div>
  );
}
