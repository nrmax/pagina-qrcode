import styles from "./Logo.module.css";

type Props = {
  /** Tamanho da fonte em px */
  size?: number;
  /** Força tom claro (usado sobre fundos escuros) */
  light?: boolean;
};

/**
 * Wordmark NRmax.
 * "NR" em peso forte + "max" em cor de marca — remete a precisão de engenharia.
 */
export default function Logo({ size = 22, light = false }: Props) {
  return (
    <span
      className={`${styles.logo} ${light ? styles.light : ""}`}
      style={{ fontSize: `${size}px` }}
      aria-label="NRmax"
      role="img"
    >
      <span className={styles.nr}>NR</span>
      <span className={styles.max}>max</span>
    </span>
  );
}
