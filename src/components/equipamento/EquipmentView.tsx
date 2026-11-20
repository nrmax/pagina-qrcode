"use client";

import { useState } from "react";
import Link from "next/link";
import Logo from "../Logo";
import SegmentedTabs from "../SegmentedTabs";
import LaudoCard from "./LaudoCard";
import Timeline from "./Timeline";
import HealthTab from "./HealthTab";
import { rotuloStatus, statusLaudo } from "@/lib/laudo";
import type { Equipamento } from "@/data/equipamentos";
import styles from "./EquipmentView.module.css";

const ABAS = [
  { id: "equipamento", rotulo: "Equipamento" },
  { id: "manutencao", rotulo: "Manutenção" },
  { id: "saude", rotulo: "Saúde" },
];

const CLASSE_PILL = {
  valido: "pill--green",
  alerta: "pill--amber",
  vencido: "pill--red",
} as const;

type Props = {
  equip: Equipamento;
};

function Item({
  rotulo,
  valor,
  monoespacado = false,
}: {
  rotulo: string;
  valor: string;
  monoespacado?: boolean;
}) {
  return (
    <div className={styles.item}>
      <dt>{rotulo}</dt>
      <dd className={monoespacado ? styles.mono : undefined}>{valor}</dd>
    </div>
  );
}

export default function EquipmentView({ equip }: Props) {
  const [aba, setAba] = useState<string>("equipamento");
  const status = statusLaudo(equip.laudo.vencimentoEm, equip.laudo.alertaDias);

  return (
    <div className={styles.raiz}>
      <header className={styles.topo}>
        <div className={styles.topoInterno}>
          <Link href="/" className={styles.logoLink} aria-label="NRmax — início">
            <Logo size={20} />
          </Link>
          <Link href="/" className={styles.sair}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden>
              <path
                d="M15 18l-6-6 6-6"
                stroke="currentColor"
                strokeWidth="2.4"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            Trocar equipamento
          </Link>
        </div>
      </header>

      <main className={`container ${styles.main}`}>
        {/* ---------- Hero ---------- */}
        <section className={styles.hero}>
          <div className={styles.heroTexto}>
            <span className="eyebrow">
              {equip.marca} · {equip.anoFabricacao}
            </span>
            <h1 className={styles.nome}>{equip.nome}</h1>
            <p className={styles.subtituloHero}>
              Modelo {equip.modelo} · S/N {equip.numeroSerie}
            </p>
            <p className={styles.clienteHero}>{equip.cliente}</p>
            <div className={styles.heroPills}>
              <span className={`pill ${CLASSE_PILL[status]}`}>
                {rotuloStatus[status]}
              </span>
              <span className="chip">Laudo {equip.laudo.numero}</span>
            </div>
          </div>
          <figure className={styles.heroFoto}>
            <img
              src={equip.fotoHero}
              alt={`Ilustração do ${equip.nome} — ${equip.modelo}`}
              width={1200}
              height={800}
            />
          </figure>
        </section>

        {/* ---------- Abas ---------- */}
        <nav className={styles.abas}>
          <SegmentedTabs
            abas={ABAS}
            ativa={aba}
            aoMudar={setAba}
            ariaLabel="Seções do equipamento"
          />
        </nav>

        <div key={aba} className={styles.painel}>
          {aba === "equipamento" && (
            <>
              <section className={styles.secao}>
                <h2 className={styles.tituloSecao}>Laudo técnico</h2>
                <LaudoCard laudo={equip.laudo} />
              </section>

              <section className={styles.secao}>
                <h2 className={styles.tituloSecao}>Especificações técnicas</h2>
                <dl className={styles.grade}>
                  <Item rotulo="Marca" valor={equip.marca} />
                  <Item rotulo="Modelo" valor={equip.modelo} />
                  <Item
                    rotulo="Ano de fabricação"
                    valor={String(equip.anoFabricacao)}
                  />
                  <Item
                    rotulo="Número de série"
                    valor={equip.numeroSerie}
                    monoespacado
                  />
                  <Item rotulo="Potência" valor={equip.potencia} />
                  <Item rotulo="Tensão" valor={equip.tensao} />
                  <Item rotulo="Capacidade" valor={equip.capacidade} />
                </dl>
              </section>

              <section className={styles.secao}>
                <h2 className={styles.tituloSecao}>Instalação</h2>
                <dl className={styles.grade}>
                  <Item rotulo="Cliente" valor={equip.cliente} />
                  <Item
                    rotulo="Endereço de instalação"
                    valor={equip.endereco}
                  />
                  <Item rotulo="Responsável" valor={equip.responsavel} />
                </dl>
              </section>

              {equip.camposCustomizados.length > 0 && (
                <section className={styles.secao}>
                  <h2 className={styles.tituloSecao}>
                    Campos personalizados
                  </h2>
                  <dl className={styles.grade}>
                    {equip.camposCustomizados.map((c) => (
                      <Item key={c.rotulo} rotulo={c.rotulo} valor={c.valor} />
                    ))}
                  </dl>
                </section>
              )}
            </>
          )}

          {aba === "manutencao" && (
            <section className={styles.secao}>
              <h2 className={styles.tituloSecao}>Histórico de manutenção</h2>
              <Timeline manutencoes={equip.manutencoes} />
            </section>
          )}

          {aba === "saude" && <HealthTab />}
        </div>
      </main>

      <footer className={styles.rodape}>
        <p>
          © {new Date().getFullYear()} NRmax · Engenharia, segurança e
          qualidade
        </p>
        <p className={styles.rodapeDemo}>
          Sistema em demonstração — dados temporários
        </p>
      </footer>
    </div>
  );
}
