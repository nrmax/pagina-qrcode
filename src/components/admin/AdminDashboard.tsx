"use client";

import { useEffect, useState } from "react";
import QRCode from "qrcode";
import { rotuloStatus, statusLaudo } from "@/lib/laudo";
import type { Equipamento } from "@/data/equipamentos";
import styles from "./AdminDashboard.module.css";

const CLASSE_PILL = {
  valido: "pill--green",
  alerta: "pill--amber",
  vencido: "pill--red",
} as const;

type Props = {
  equipamentos: Equipamento[];
};

export default function AdminDashboard({ equipamentos }: Props) {
  const [qr, setQr] = useState<string | null>(null);

  // QR Code único: aponta para a raiz do site (mesmo para todos os equipamentos)
  useEffect(() => {
    QRCode.toDataURL(window.location.origin, {
      width: 512,
      margin: 1,
      errorCorrectionLevel: "M",
      color: { dark: "#0d1d32", light: "#ffffff" },
    })
      .then(setQr)
      .catch(() => setQr(null));
  }, []);

  const clientes = new Set(equipamentos.map((e) => e.cliente)).size;
  const manutencoes = equipamentos.reduce(
    (total, e) => total + e.manutencoes.length,
    0
  );
  const laudosAtencao = equipamentos.filter(
    (e) => statusLaudo(e.laudo.vencimentoEm, e.laudo.alertaDias) !== "valido"
  ).length;

  const estatisticas = [
    { rotulo: "Equipamentos", valor: equipamentos.length, tom: "neutro" },
    { rotulo: "Clientes", valor: clientes, tom: "neutro" },
    { rotulo: "Laudos em atenção", valor: laudosAtencao, tom: "atencao" },
    { rotulo: "Manutenções", valor: manutencoes, tom: "neutro" },
  ] as const;

  return (
    <div className={styles.raiz}>
      <header className={styles.cabecalho}>
        <div>
          <h1 className={styles.titulo}>Visão geral</h1>
          <p className={styles.subtitulo}>
            {new Date().toLocaleDateString("pt-BR", {
              weekday: "long",
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
          </p>
        </div>
        <span className={styles.avisoDemo}>
          Demonstração — o CRUD grava no banco nas próximas etapas
        </span>
      </header>

      {/* ---------- Estatísticas ---------- */}
      <section id="visao-geral" className={styles.gradeStats}>
        {estatisticas.map((s) => (
          <article
            key={s.rotulo}
            className={`${styles.stat} ${s.tom === "atencao" ? styles.statAtencao : ""}`}
          >
            <span className={styles.statRotulo}>{s.rotulo}</span>
            <strong className={styles.statValor}>{s.valor}</strong>
          </article>
        ))}
      </section>

      {/* ---------- Equipamentos ---------- */}
      <section id="equipamentos" className={styles.secao}>
        <div className={styles.topoSecao}>
          <h2 className={styles.tituloSecao}>Equipamentos</h2>
          <button
            type="button"
            className="btn btn--primary"
            style={{ height: 40, fontSize: 14, opacity: 0.55 }}
            disabled
            title="Disponível após a etapa de banco de dados"
          >
            + Novo equipamento
          </button>
        </div>

        <div className={styles.tabela}>
          <table>
            <thead>
              <tr>
                <th>Equipamento</th>
                <th>Cliente</th>
                <th>Laudo</th>
                <th>Senha</th>
                <th className={styles.colAcoes}>Ações</th>
              </tr>
            </thead>
            <tbody>
              {equipamentos.map((e) => {
                const status = statusLaudo(
                  e.laudo.vencimentoEm,
                  e.laudo.alertaDias
                );
                return (
                  <tr key={e.id}>
                    <td>
                      <strong className={styles.nomeEquip}>{e.nome}</strong>
                      <span className={styles.modeloEquip}>
                        {e.marca} {e.modelo} · {e.anoFabricacao}
                      </span>
                    </td>
                    <td className={styles.celulaCliente}>{e.cliente}</td>
                    <td>
                      <span className={`pill ${CLASSE_PILL[status]}`}>
                        {rotuloStatus[status]}
                      </span>
                    </td>
                    <td>
                      <code className={styles.senha}>{e.senha}</code>
                    </td>
                    <td className={styles.acoes}>
                      <button
                        type="button"
                        className={styles.botaoAcao}
                        disabled
                        title="Disponível após a etapa de banco de dados"
                      >
                        Editar
                      </button>
                      <button
                        type="button"
                        className={`${styles.botaoAcao} ${styles.excluir}`}
                        disabled
                        title="Disponível após a etapa de banco de dados"
                      >
                        Excluir
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      {/* ---------- QR Code único ---------- */}
      <section id="qrcode" className={styles.secao}>
        <h2 className={styles.tituloSecao}>QR Code único</h2>
        <div className={styles.qrCartao}>
          <div className={styles.qrArea}>
            {qr ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={qr}
                alt="QR Code de acesso NRmax"
                className={styles.qrImg}
                width={220}
                height={220}
              />
            ) : (
              <div className={styles.qrSkeleton} aria-label="Gerando QR Code" />
            )}
          </div>
          <div className={styles.qrTexto}>
            <h3>O mesmo QR Code para todos os equipamentos</h3>
            <p>
              Ao escanear, o cliente é levado à página de acesso e informa a
              senha individual de 3 dígitos. O QR não contém senha nem identifica
              equipamento algum — a identificação acontece no servidor.
            </p>
            <ul className={styles.qrLista}>
              <li>Aponte para a página inicial do sistema</li>
              <li>Pode ser impresso em etiqueta, manual ou placa</li>
              <li>Nunca expõe dados sensíveis</li>
            </ul>
            <div className={styles.qrAcoes}>
              {qr && (
                <a
                  href={qr}
                  download="nrmax-qrcode.png"
                  className="btn btn--primary"
                  style={{ height: 42, fontSize: 14 }}
                >
                  Baixar QR Code
                </a>
              )}
              <span className={styles.qrUrl}>
                {typeof window !== "undefined" ? window.location.origin : ""}
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* ---------- Em breve ---------- */}
      <section className={styles.secao}>
        <h2 className={styles.tituloSecao}>Próximos módulos</h2>
        <div className={styles.emBreve}>
          {[
            ["Clientes e responsáveis", "Cadastro e vínculo com equipamentos"],
            ["Manutenções e fotos", "CRUD completo com upload de imagens"],
            ["Documentos", "Laudos, certificados e relatórios por equipamento"],
            ["Campos técnicos", "Campos personalizados por equipamento"],
          ].map(([nome, desc]) => (
            <article key={nome} className={styles.modulo}>
              <span className={styles.moduloSelo}>em breve</span>
              <h4>{nome}</h4>
              <p>{desc}</p>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
