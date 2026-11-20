import styles from "./HealthTab.module.css";

const INDICADORES = [
  {
    rotulo: "Ciclos",
    unidade: "ciclos",
    descricao: "Ciclos completos de operação acumulados",
  },
  {
    rotulo: "Acionamentos",
    unidade: "acionamentos",
    descricao: "Partidas e paradas do equipamento",
  },
  {
    rotulo: "Cargas transportadas",
    unidade: "t",
    descricao: "Carga total movimentada no período",
  },
  {
    rotulo: "Sobrecargas",
    unidade: "eventos",
    descricao: "Ocorrências acima do limite especificado",
  },
  {
    rotulo: "Intensidade de utilização",
    unidade: "%",
    descricao: "Percentual de uso em relação à capacidade",
  },
];

/**
 * Aba "Saúde do Equipamento" — estrutura preparada para futuras
 * informações de sensores e telemetria (etapa 12).
 * Nada de coleta de dados ou inteligência artificial nesta fase.
 */
export default function HealthTab() {
  return (
    <section>
      <div className={styles.cabecalho}>
        <span className={styles.selo}>Em breve</span>
        <h2 className={styles.titulo}>Saúde do equipamento</h2>
        <p className={styles.texto}>
          Acompanhamento consolidado da utilização do equipamento: ciclos,
          acionamentos, cargas transportadas, sobrecargas e intensidade de
          utilização aparecerão aqui.
        </p>
      </div>

      <ul className={styles.grade}>
        {INDICADORES.map((i) => (
          <li key={i.rotulo} className={styles.card}>
            <span className={styles.rotulo}>{i.rotulo}</span>
            <strong className={styles.valor}>—</strong>
            <span className={styles.unidade}>{i.unidade}</span>
            <span className={styles.trilho} aria-hidden>
              <span className={styles.trilhoPreenchimento} />
            </span>
            <span className={styles.descricao}>{i.descricao}</span>
          </li>
        ))}
      </ul>

      <p className={styles.nota}>
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden>
          <rect
            x="4.5"
            y="10.5"
            width="15"
            height="10"
            rx="2.5"
            stroke="currentColor"
            strokeWidth="2"
          />
          <path
            d="M8 10.5V7.5a4 4 0 0 1 8 0v3"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </svg>
        Sensores e coleta de dados serão habilitados em uma próxima etapa.
        Até lá, nenhuma métrica é exibida para não induzir a erro.
      </p>
    </section>
  );
}
