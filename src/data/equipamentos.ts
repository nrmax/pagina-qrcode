/**
 * DADOS DE DEMONSTRAÇÃO — fallback do sistema.
 *
 * Conteúdo fictício usado apenas quando o Supabase não está
 * acessível (banco vazio ou sem credencial), para que o site
 * nunca fique fora do ar. Com o banco configurado, os dados
 * reais vêm de src/lib/db/ e têm precedência.
 */

export type Foto = {
  src: string;
  legenda: string;
  alt: string;
};

export type Manutencao = {
  id: string;
  data: string; // AAAA-MM-DD
  servico: string;
  descricao: string;
  pecas: string[];
  responsavel: string;
  fotos: Foto[];
};

export type CampoCustomizado = {
  rotulo: string;
  valor: string;
};

export type Laudo = {
  numero: string;
  emitidoEm: string; // AAAA-MM-DD
  vencimentoEm: string; // AAAA-MM-DD
  alertaDias: number; // prazo de alerta configurado pelo administrador
};

export type Equipamento = {
  id: string;
  nome: string;
  modelo: string;
  marca: string;
  anoFabricacao: number;
  numeroSerie: string;
  potencia: string;
  tensao: string;
  capacidade: string;
  cliente: string;
  endereco: string;
  responsavel: string;
  fotoHero: string;
  laudo: Laudo;
  camposCustomizados: CampoCustomizado[];
  manutencoes: Manutencao[];
  /** Senha individual de 3 dígitos (exibida apenas no painel admin). */
  senha: string;
  /** Status operacional do equipamento no cadastro. */
  status?: "ativo" | "manutencao" | "inativo" | "desativado";
};

export const EQUIPAMENTOS: Equipamento[] = [
  {
    id: "eq-001",
    nome: "Compressor de Parafuso",
    modelo: "VX-75",
    marca: "AeroForge",
    anoFabricacao: 2021,
    numeroSerie: "AF-VX75-2104873",
    potencia: "75 kW",
    tensao: "380 V / 60 Hz",
    capacidade: "13 m³/min @ 8 bar",
    cliente: "Indústria Metalúrgica Vale Norte",
    endereco: "Rod. Industrial, km 42 — Pólo Tecnológico, Ipatinga/MG",
    responsavel: "Eng.ª Marina Duarte — NRmax Serviços Técnicos",
    fotoHero: "/photos/manutencao-01.svg",
    laudo: {
      numero: "LT-2026-0412",
      emitidoEm: "2026-08-31",
      vencimentoEm: "2027-08-31",
      alertaDias: 45,
    },
    camposCustomizados: [
      { rotulo: "Pressão de trabalho", valor: "8 bar" },
      { rotulo: "Tipo de óleo", valor: "Sintético ISO VG 46" },
      { rotulo: "Horas de operação", valor: "11.480 h" },
      { rotulo: "Nível de ruído", valor: "68 dB(A) @ 1 m" },
    ],
    manutencoes: [
      {
        id: "m-010",
        data: "2026-09-18",
        servico: "Revisão geral de 4.000 horas",
        descricao:
          "Troca completa dos elementos filtrantes, óleo sintético e verificação da correia de acionamento. Teste de pressão de corte e conferência da válvula de segurança.",
        pecas: ["Filtro de óleo", "Filtro de ar", "Óleo sintético ISO VG 46"],
        responsavel: "Marina Duarte — Eng.ª Mecânica",
        fotos: [
          {
            src: "/photos/manutencao-03.svg",
            legenda: "Elementos filtrantes substituídos",
            alt: "Ilustração dos filtros e peças substituídos na revisão",
          },
          {
            src: "/photos/manutencao-02.svg",
            legenda: "Inspeção com registro em campo",
            alt: "Ilustração de técnico registrando a inspeção em tablet",
          },
        ],
      },
      {
        id: "m-009",
        data: "2026-05-04",
        servico: "Inspeção elétrica e testes de comutação",
        descricao:
          "Termografia do painel, aperto de barramentos e teste dos contadores de horas. Corrigido afrouxamento no terminal do contator principal.",
        pecas: ["Contator 100 A", "Terminal barramento"],
        responsavel: "Rafael Lima — Técnico de Manutenção",
        fotos: [
          {
            src: "/photos/manutencao-04.svg",
            legenda: "Conferência do painel elétrico",
            alt: "Ilustração de painel elétrico sendo inspecionado",
          },
        ],
      },
      {
        id: "m-008",
        data: "2026-01-27",
        servico: "Troca do separador de óleo",
        descricao:
          "Substituição programada do separador de óleo com medição de queda de pressão antes e após a troca. Valores dentro do especificado.",
        pecas: ["Separador de óleo"],
        responsavel: "Marina Duarte — Eng.ª Mecânica",
        fotos: [
          {
            src: "/photos/manutencao-01.svg",
            legenda: "Unidade após a substituição",
            alt: "Ilustração da sala de compressores após a manutenção",
          },
        ],
      },
    ],
    senha: "482",
  },
  {
    id: "eq-002",
    nome: "Gerador a Diesel",
    modelo: "GD-500",
    marca: "Voltrax",
    anoFabricacao: 2019,
    numeroSerie: "VT-GD500-1907742",
    potencia: "500 kVA",
    tensao: "380 V / 60 Hz",
    capacidade: "500 kVA contínuo",
    cliente: "Centro Logístico Serra Azul",
    endereco: "Av. do Porto, 1.850 — Distrito Logístico, Cubatão/SP",
    responsavel: "Eng. Rafael Lima — NRmax Serviços Técnicos",
    fotoHero: "/photos/manutencao-04.svg",
    laudo: {
      numero: "LT-2025-0918",
      emitidoEm: "2025-12-20",
      vencimentoEm: "2026-12-20",
      alertaDias: 30,
    },
    camposCustomizados: [
      { rotulo: "Autonomia", valor: "18 h @ 75% de carga" },
      { rotulo: "Tanque", valor: "900 L" },
      { rotulo: "Horas de operação", valor: "3.260 h" },
      { rotulo: "Nível de ruído", valor: "72 dB(A) @ 7 m" },
    ],
    manutencoes: [
      {
        id: "m-007",
        data: "2026-08-12",
        servico: "Manutenção preventiva de 250 horas",
        descricao:
          "Troca de óleo e filtros, teste de carga em bancada e conferência do sistema de refrigeração. Bateria substituída por baixa retenção.",
        pecas: ["Óleo 15W-40", "Filtro de combustível", "Bateria 135 Ah"],
        responsavel: "Rafael Lima — Técnico de Manutenção",
        fotos: [
          {
            src: "/photos/manutencao-02.svg",
            legenda: "Registro da manutenção preventiva",
            alt: "Ilustração de técnico realizando manutenção preventiva",
          },
          {
            src: "/photos/manutencao-03.svg",
            legenda: "Peças substituídas",
            alt: "Ilustração das peças substituídas na preventiva",
          },
        ],
      },
      {
        id: "m-006",
        data: "2026-02-09",
        servico: "Teste de carga e calibração",
        descricao:
          "Aplicação de carga em 25%, 50%, 75% e 100% com registro de tensão e frequência. Regulagem do governador ajustada.",
        pecas: [],
        responsavel: "Marina Duarte — Eng.ª Mecânica",
        fotos: [],
      },
    ],
    senha: "137",
  },
  {
    id: "eq-003",
    nome: "Vaso de Pressão Horizontal",
    modelo: "TP-2000",
    marca: "Ferrax",
    anoFabricacao: 2017,
    numeroSerie: "FX-TP2000-1703315",
    potencia: "—",
    tensao: "—",
    capacidade: "2.000 L @ 10 bar",
    cliente: "Cooperativa Agroindustrial Campo Verde",
    endereco: "Estrada do Campo, km 7 — Zona Rural, Rio Verde/GO",
    responsavel: "Eng.ª Marina Duarte — NRmax Serviços Técnicos",
    fotoHero: "/photos/manutencao-01.svg",
    laudo: {
      numero: "LT-2025-0271",
      emitidoEm: "2025-11-05",
      vencimentoEm: "2026-11-05",
      alertaDias: 60,
    },
    camposCustomizados: [
      { rotulo: "Volume útil", valor: "2.000 L" },
      { rotulo: "Pressão máxima de trabalho", valor: "10 bar" },
      { rotulo: "Corpo", valor: "Aço carbono ASTM A516 Gr. 70" },
      { rotulo: "Inspeção interna", valor: "A cada 2 anos" },
    ],
    manutencoes: [
      {
        id: "m-005",
        data: "2026-06-30",
        servico: "Inspeção interna e teste hidrostático",
        descricao:
          "Inspeção interna com endoscopia, medição de espessura ultrassônica e teste hidrostático a 1,5× a pressão de trabalho. Sem indicação de corrosão relevante.",
        pecas: ["Junção de vedação da tampa"],
        responsavel: "Marina Duarte — Eng.ª Mecânica",
        fotos: [
          {
            src: "/photos/manutencao-01.svg",
            legenda: "Vaso após inspeção e teste",
            alt: "Ilustração do equipamento após inspeção",
          },
        ],
      },
    ],
    senha: "905",
  },
];

export function getEquipamento(id: string): Equipamento | undefined {
  return EQUIPAMENTOS.find((e) => e.id === id);
}
