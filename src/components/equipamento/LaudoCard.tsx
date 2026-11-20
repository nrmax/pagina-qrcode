"use client";

import { useEffect, useState } from "react";
import {
  diasRestantes,
  formatarData,
  rotuloStatus,
  statusLaudo,
  textoContador,
} from "@/lib/laudo";
import type { Laudo } from "@/data/equipamentos";
import styles from "./LaudoCard.module.css";

type Props = {
  laudo: Laudo;
};

/**
 * Cartão do laudo técnico com contador regressivo.
 * O contador é calculado no cliente após a montagem para garantir
 * que sempre reflita a data atual do usuário.
 */
export default function LaudoCard({ laudo }: Props) {
  const [dias, setDias] = useState<number | null>(null);
  const status = statusLaudo(laudo.vencimentoEm, laudo.alertaDias);

  useEffect(() => {
    setDias(diasRestantes(laudo.vencimentoEm));
  }, [laudo.vencimentoEm]);

  const total = Math.max(
    1,
    Math.round(
      (new Date(laudo.vencimentoEm).getTime() -
        new Date(laudo.emitidoEm).getTime()) /
        86_400_000
    )
  );
  const decorridos = Math.min(
    total,
    Math.max(0, total - Math.max(0, dias ?? total))
  );
  const percentual = Math.round((decorridos / total) * 100);

  return (
    <article className={`${styles.cartao} ${styles[status]}`}>
      <div className={styles.topo}>
        <div>
          <span className={`pill ${CLASSE_PILL[status]}`}>
            {rotuloStatus[status]}
          </span>
          <h3 className={styles.titulo}>
            {status === "vencido" ? "Laudo vencido" : "Validade do laudo"}
          </h3>
          <p className={styles.numero}>Laudo {laudo.numero}</p>
        </div>
        <div className={styles.contador} aria-live="polite">
          {dias === null ? (
            <span className={styles.contadorSkeleton}>&nbsp;</span>
          ) : status === "vencido" ? (
            <>
              <strong>{Math.abs(dias)}</strong>
              <span>dias em atraso</span>
            </>
          ) : (
            <>
              <strong>{dias}</strong>
              <span>{dias === 1 ? "dia restante" : "dias restantes"}</span>
            </>
          )}
          <small>
            {dias === null ? "" : textoContador(laudo.vencimentoEm)}
          </small>
        </div>
      </div>

      <div className={styles.barra} aria-hidden>
        <span
          className={styles.barraPreenchimento}
          style={{ width: `${percentual}%` }}
        />
      </div>

      <div className={styles.datas}>
        <div>
          <span className={styles.rotuloData}>Emissão</span>
          <strong>{formatarData(laudo.emitidoEm)}</strong>
        </div>
        <div className={styles.dataDireita}>
          <span className={styles.rotuloData}>Vencimento</span>
          <strong>{formatarData(laudo.vencimentoEm)}</strong>
        </div>
      </div>

      <p className={styles.alertaInfo}>
        Alerta configurado para{" "}
        <strong>{laudo.alertaDias} dias</strong> antes do vencimento.
      </p>
    </article>
  );
}

const CLASSE_PILL = {
  valido: "pill--green",
  alerta: "pill--amber",
  vencido: "pill--red",
} as const;
