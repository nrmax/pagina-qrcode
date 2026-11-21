"use client";

import { useState } from "react";
import type { Documento, Equipamento } from "@/data/equipamentos";
import type { Opcao } from "@/lib/db/equipamentos";
import styles from "./EquipamentoForm.module.css";

type Props = {
  /** null = criando novo */
  equipamento: Equipamento | null;
  clientes: Opcao[];
  responsaveis: Opcao[];
  aoFechar: () => void;
  aoSalvar: () => void;
  /** Recarrega os dados do servidor sem fechar (após anexar/remover PDF) */
  aoAtualizar: () => void;
};

type Campos = {
  nome: string;
  marca: string;
  modelo: string;
  anoFabricacao: string;
  numeroSerie: string;
  potencia: string;
  tensao: string;
  capacidade: string;
  endereco: string;
  status: string;
  clienteId: string;
  responsavelId: string;
  laudoNumero: string;
  laudoEmitidoEm: string;
  laudoVencimentoEm: string;
  laudoAlertaDias: string;
  senha: string;
};

function deEquipamento(e: Equipamento | null): Campos {
  if (!e) {
    return {
      nome: "",
      marca: "",
      modelo: "",
      anoFabricacao: "",
      numeroSerie: "",
      potencia: "",
      tensao: "",
      capacidade: "",
      endereco: "",
      status: "ativo",
      clienteId: "",
      responsavelId: "",
      laudoNumero: "",
      laudoEmitidoEm: "",
      laudoVencimentoEm: "",
      laudoAlertaDias: "30",
      senha: "",
    };
  }

  return {
    nome: e.nome,
    marca: e.marca === "—" ? "" : e.marca,
    modelo: e.modelo === "—" ? "" : e.modelo,
    anoFabricacao: e.anoFabricacao ? String(e.anoFabricacao) : "",
    numeroSerie: e.numeroSerie === "—" ? "" : e.numeroSerie,
    potencia: e.potencia === "—" ? "" : e.potencia,
    tensao: e.tensao === "—" ? "" : e.tensao,
    capacidade: e.capacidade === "—" ? "" : e.capacidade,
    endereco: e.endereco === "—" ? "" : e.endereco,
    status: e.status ?? "ativo",
    // vínculos resolvidos por nome (o modelo guarda o nome exibido)
    clienteId: "",
    responsavelId: "",
    laudoNumero: e.laudo.numero === "—" ? "" : e.laudo.numero,
    laudoEmitidoEm: e.laudo.emitidoEm,
    laudoVencimentoEm: e.laudo.vencimentoEm,
    laudoAlertaDias: String(e.laudo.alertaDias ?? 30),
    senha: "",
  };
}

export default function EquipamentoForm({
  equipamento,
  clientes,
  responsaveis,
  aoFechar,
  aoSalvar,
  aoAtualizar,
}: Props) {
  const editando = Boolean(equipamento);
  const [f, setF] = useState<Campos>(() => deEquipamento(equipamento));
  const [erro, setErro] = useState("");
  const [salvando, setSalvando] = useState(false);
  const [docs, setDocs] = useState<Documento[]>(equipamento?.documentos ?? []);
  const [enviandoDoc, setEnviandoDoc] = useState(false);
  const [erroDoc, setErroDoc] = useState("");

  function alterar(campo: keyof Campos, valor: string) {
    setF((ant) => ({ ...ant, [campo]: valor }));
    if (erro) setErro("");
  }

  /** Upload imediato do PDF (requer equipamento já criado). */
  async function enviarPdf(arquivo: File) {
    if (!equipamento || enviandoDoc) return;

    const ehPdf =
      arquivo.type === "application/pdf" ||
      arquivo.name.toLowerCase().endsWith(".pdf");
    if (!ehPdf) {
      setErroDoc("Apenas arquivos PDF são aceitos.");
      return;
    }
    if (arquivo.size > 10 * 1024 * 1024) {
      setErroDoc("O PDF deve ter no máximo 10 MB.");
      return;
    }

    setEnviandoDoc(true);
    setErroDoc("");

    try {
      const corpo = new FormData();
      corpo.append("arquivo", arquivo);
      corpo.append("nome", arquivo.name);

      const res = await fetch(
        `/api/admin/equipamentos/${equipamento.id}/documentos`,
        { method: "POST", body: corpo }
      );
      const dados = await res.json().catch(() => ({}));

      if (!res.ok || !dados.documento) {
        setErroDoc(dados.erro ?? "Não foi possível enviar o PDF.");
        return;
      }

      setDocs((ant) => [dados.documento as Documento, ...ant]);
      aoAtualizar();
    } catch {
      setErroDoc("Falha de conexão com o servidor.");
    } finally {
      setEnviandoDoc(false);
    }
  }

  async function removerDoc(doc: Documento) {
    if (enviandoDoc) return;
    const confirmado = window.confirm(
      `Remover o PDF "${doc.nome}"?\n\nO arquivo será apagado do armazenamento.`
    );
    if (!confirmado) return;

    setEnviandoDoc(true);
    setErroDoc("");
    try {
      const res = await fetch(`/api/admin/documentos/${doc.id}`, {
        method: "DELETE",
      });
      const dados = await res.json().catch(() => ({}));
      if (!res.ok) {
        setErroDoc(dados.erro ?? "Não foi possível remover.");
        return;
      }
      setDocs((ant) => ant.filter((d) => d.id !== doc.id));
      aoAtualizar();
    } catch {
      setErroDoc("Falha de conexão com o servidor.");
    } finally {
      setEnviandoDoc(false);
    }
  }

  function dataBR(iso: string): string {
    if (!iso) return "";
    const [a, m, d] = iso.split("-");
    return `${d}/${m}/${a}`;
  }

  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    if (salvando) return;
    setErro("");
    setSalvando(true);

    try {
      const payload: Record<string, unknown> = {
        nome: f.nome.trim(),
        fabricante: f.marca.trim() || null,
        modelo: f.modelo.trim() || null,
        anoFabricacao: f.anoFabricacao || null,
        numeroSerie: f.numeroSerie.trim() || null,
        potencia: f.potencia.trim() || null,
        tensao: f.tensao.trim() || null,
        capacidade: f.capacidade.trim() || null,
        localInstalacao: f.endereco.trim() || null,
        status: f.status,
        laudoNumero: f.laudoNumero.trim() || null,
        laudoEmitidoEm: f.laudoEmitidoEm || null,
        laudoVencimentoEm: f.laudoVencimentoEm || null,
        laudoAlertaDias: f.laudoAlertaDias || 30,
      };

      // Vínculos: só envia se houver seleção (evita apagar o existente)
      if (f.clienteId) payload.clienteId = f.clienteId;
      if (f.responsavelId) payload.responsavelId = f.responsavelId;
      // Senha: obrigatória na criação; na edição só se digitada
      if (f.senha) payload.senha = f.senha;

      const url = editando
        ? `/api/admin/equipamentos/${equipamento!.id}`
        : "/api/admin/equipamentos";
      const res = await fetch(url, {
        method: editando ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const dados = await res.json().catch(() => ({}));

      if (!res.ok) {
        setErro(dados.erro ?? "Não foi possível salvar. Tente novamente.");
        return;
      }

      aoSalvar();
      aoFechar();
    } catch {
      setErro("Falha de conexão com o servidor.");
    } finally {
      setSalvando(false);
    }
  }

  return (
    <div className={styles.overlay} role="dialog" aria-modal="true">
      <form className={styles.cartao} onSubmit={enviar}>
        <header className={styles.topo}>
          <div>
            <h2 className={styles.titulo}>
              {editando ? "Editar equipamento" : "Novo equipamento"}
            </h2>
            <p className={styles.subtitulo}>
              {editando
                ? "Altere os campos e salve — as mudanças vão para o banco."
                : "Preencha os dados e defina a senha individual de 3 dígitos."}
            </p>
          </div>
          <button
            type="button"
            className={styles.fechar}
            onClick={aoFechar}
            aria-label="Fechar"
          >
            ✕
          </button>
        </header>

        <div className={styles.corpo}>
          {/* ---------- Identificação ---------- */}
          <fieldset className={styles.grupo}>
            <legend>Identificação</legend>
            <div className={styles.grade}>
              <label className={`${styles.campo} ${styles.campoLargo}`}>
                <span>Nome *</span>
                <input
                  type="text"
                  value={f.nome}
                  onChange={(e) => alterar("nome", e.target.value)}
                  placeholder="Ex.: Compressor de Parafuso"
                  required
                  autoFocus
                />
              </label>
              <label className={styles.campo}>
                <span>Marca</span>
                <input
                  type="text"
                  value={f.marca}
                  onChange={(e) => alterar("marca", e.target.value)}
                  placeholder="Ex.: AeroForge"
                />
              </label>
              <label className={styles.campo}>
                <span>Modelo</span>
                <input
                  type="text"
                  value={f.modelo}
                  onChange={(e) => alterar("modelo", e.target.value)}
                  placeholder="Ex.: VX-75"
                />
              </label>
              <label className={styles.campo}>
                <span>Ano</span>
                <input
                  type="number"
                  min={1900}
                  max={2100}
                  value={f.anoFabricacao}
                  onChange={(e) => alterar("anoFabricacao", e.target.value)}
                  placeholder="Ex.: 2021"
                />
              </label>
              <label className={styles.campo}>
                <span>Nº de série</span>
                <input
                  type="text"
                  value={f.numeroSerie}
                  onChange={(e) => alterar("numeroSerie", e.target.value)}
                  placeholder="Ex.: AF-VX75-2104873"
                />
              </label>
              <label className={styles.campo}>
                <span>Status</span>
                <select
                  value={f.status}
                  onChange={(e) => alterar("status", e.target.value)}
                >
                  <option value="ativo">Ativo</option>
                  <option value="manutencao">Em manutenção</option>
                  <option value="inativo">Inativo</option>
                  <option value="desativado">Desativado</option>
                </select>
              </label>
              <label className={`${styles.campo} ${styles.campoLargo}`}>
                <span>Local de instalação</span>
                <input
                  type="text"
                  value={f.endereco}
                  onChange={(e) => alterar("endereco", e.target.value)}
                  placeholder="Ex.: Rod. Industrial, km 42 — Ipatinga/MG"
                />
              </label>
            </div>
          </fieldset>

          {/* ---------- Vínculos ---------- */}
          <fieldset className={styles.grupo}>
            <legend>Vínculos</legend>
            <div className={styles.grade}>
              <label className={styles.campo}>
                <span>Cliente</span>
                <select
                  value={f.clienteId}
                  onChange={(e) => alterar("clienteId", e.target.value)}
                >
                  <option value="">— nenhum —</option>
                  {clientes.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.nome}
                    </option>
                  ))}
                </select>
              </label>
              <label className={styles.campo}>
                <span>Responsável técnico</span>
                <select
                  value={f.responsavelId}
                  onChange={(e) => alterar("responsavelId", e.target.value)}
                >
                  <option value="">— nenhum —</option>
                  {responsaveis.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.nome}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          </fieldset>

          {/* ---------- Laudo ---------- */}
          <fieldset className={styles.grupo}>
            <legend>Laudo de inspeção</legend>
            <div className={styles.grade}>
              <label className={styles.campo}>
                <span>Número</span>
                <input
                  type="text"
                  value={f.laudoNumero}
                  onChange={(e) => alterar("laudoNumero", e.target.value)}
                  placeholder="Ex.: LT-2026-0412"
                />
              </label>
              <label className={styles.campo}>
                <span>Emitido em</span>
                <input
                  type="date"
                  value={f.laudoEmitidoEm}
                  onChange={(e) => alterar("laudoEmitidoEm", e.target.value)}
                />
              </label>
              <label className={styles.campo}>
                <span>Vencimento</span>
                <input
                  type="date"
                  value={f.laudoVencimentoEm}
                  onChange={(e) => alterar("laudoVencimentoEm", e.target.value)}
                />
              </label>
              <label className={styles.campo}>
                <span>Alerta com (dias)</span>
                <input
                  type="number"
                  min={1}
                  max={365}
                  value={f.laudoAlertaDias}
                  onChange={(e) => alterar("laudoAlertaDias", e.target.value)}
                />
              </label>
            </div>
          </fieldset>

          {/* ---------- Técnico ---------- */}
          <fieldset className={styles.grupo}>
            <legend>Especificações</legend>
            <div className={styles.grade}>
              <label className={styles.campo}>
                <span>Potência</span>
                <input
                  type="text"
                  value={f.potencia}
                  onChange={(e) => alterar("potencia", e.target.value)}
                  placeholder="Ex.: 75 kW"
                />
              </label>
              <label className={styles.campo}>
                <span>Tensão</span>
                <input
                  type="text"
                  value={f.tensao}
                  onChange={(e) => alterar("tensao", e.target.value)}
                  placeholder="Ex.: 380 V / 60 Hz"
                />
              </label>
              <label className={styles.campo}>
                <span>Capacidade</span>
                <input
                  type="text"
                  value={f.capacidade}
                  onChange={(e) => alterar("capacidade", e.target.value)}
                  placeholder="Ex.: 13 m³/min @ 8 bar"
                />
              </label>
            </div>
          </fieldset>

          {/* ---------- Documentos ---------- */}
          <fieldset className={styles.grupo}>
            <legend>Documentos (PDF)</legend>

            {!editando ? (
              <p className={styles.avisoDoc}>
                Salve o equipamento primeiro para anexar documentos PDF.
              </p>
            ) : (
              <>
                <div className={styles.linhaDoc}>
                  <label
                    className={`btn btn--ghost ${styles.botaoArquivo} ${
                      enviandoDoc ? styles.botaoArquivoOcupado : ""
                    }`}
                  >
                    {enviandoDoc ? "Enviando…" : "Anexar PDF"}
                    <input
                      type="file"
                      accept="application/pdf,.pdf"
                      hidden
                      disabled={enviandoDoc}
                      onChange={(e) => {
                        const arquivo = e.target.files?.[0];
                        if (arquivo) enviarPdf(arquivo);
                        e.target.value = "";
                      }}
                    />
                  </label>
                  <span className={styles.dicaDoc}>
                    Até 10 MB · o arquivo fica no Storage do Supabase
                  </span>
                </div>

                {erroDoc && (
                  <p className={styles.erroDoc} role="alert">
                    {erroDoc}
                  </p>
                )}

                {docs.length === 0 ? (
                  <p className={styles.semDocs}>Nenhum PDF anexado ainda.</p>
                ) : (
                  <ul className={styles.listaDocs}>
                    {docs.map((doc) => (
                      <li key={doc.id}>
                        <span className={styles.docSelo}>PDF</span>
                        <span className={styles.docNome} title={doc.nome}>
                          {doc.nome}
                        </span>
                        <span className={styles.docData}>
                          {dataBR(doc.dataUpload)}
                        </span>
                        <a
                          className={styles.docAcao}
                          href={doc.url}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          Abrir
                        </a>
                        <button
                          type="button"
                          className={`${styles.docAcao} ${styles.docRemover}`}
                          onClick={() => removerDoc(doc)}
                          disabled={enviandoDoc}
                        >
                          Remover
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </>
            )}
          </fieldset>

          {/* ---------- Acesso ---------- */}
          <fieldset className={styles.grupo}>
            <legend>Acesso por QR Code</legend>
            <div className={styles.grade}>
              <label className={styles.campo}>
                <span>
                  Senha de 3 dígitos{editando ? " (deixe em branco para manter)" : " *"}
                </span>
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={3}
                  value={f.senha}
                  onChange={(e) =>
                    alterar("senha", e.target.value.replace(/\D/g, ""))
                  }
                  placeholder={editando ? "•••" : "Ex.: 482"}
                  required={!editando}
                />
              </label>
            </div>
          </fieldset>

          {erro && (
            <p className={styles.erro} role="alert">
              {erro}
            </p>
          )}
        </div>

        <footer className={styles.rodape}>
          <button
            type="button"
            className="btn btn--ghost"
            onClick={aoFechar}
            disabled={salvando}
          >
            Cancelar
          </button>
          <button
            type="submit"
            className="btn btn--primary"
            disabled={salvando}
          >
            {salvando ? "Salvando…" : editando ? "Salvar alterações" : "Criar equipamento"}
          </button>
        </footer>
      </form>
    </div>
  );
}
