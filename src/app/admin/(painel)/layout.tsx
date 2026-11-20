"use client";

import { useRouter } from "next/navigation";
import Logo from "@/components/Logo";
import styles from "./shell.module.css";

/**
 * Shell do painel administrativo: barra lateral (desktop) /
 * barra superior (mobile), navegação por seções e sair da sessão.
 */
export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();

  async function sair() {
    await fetch("/api/admin/logout", { method: "POST" });
    router.push("/admin/login");
    router.refresh();
  }

  return (
    <div className={styles.shell}>
      <aside className={styles.lateral}>
        <div className={styles.marca}>
          <Logo size={21} />
          <span className={styles.selo}>Admin</span>
        </div>

        <nav className={styles.nav} aria-label="Seções do painel">
          <a href="#visao-geral" className={styles.link}>
            <Icone d="M4 13h6V4H4v9zm10 7h6v-9h-6v9zM4 20h6v-4H4v4zM14 8h6V4h-6v4z" />
            Visão geral
          </a>
          <a href="#equipamentos" className={styles.link}>
            <Icone d="M4 7h16v10H4zM7 17v2M17 17v2M8 11h8" />
            Equipamentos
          </a>
          <a href="#qrcode" className={styles.link}>
            <Icone d="M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM14 14h2v2h-2zM18 14h2v2h-2zM14 18h2v2h-2zM18 18h2v2h-2z" />
            QR Code único
          </a>

          <span className={styles.divisor} />

          {[
            "Clientes",
            "Manutenções",
            "Documentos",
            "Campos personalizados",
          ].map((item) => (
            <span
              key={item}
              className={`${styles.link} ${styles.desativado}`}
              title="Disponível nas próximas etapas"
            >
              <Icone d="M6 6h12v12H6z" />
              {item}
              <em className={styles.emBreve}>em breve</em>
            </span>
          ))}
        </nav>

        <footer className={styles.rodape}>
          <span className={styles.usuario}>
            <span className={styles.avatar} aria-hidden>
              AD
            </span>
            Administrador
          </span>
          <button type="button" className={styles.sair} onClick={sair}>
            Sair
          </button>
        </footer>
      </aside>

      {/* Barra superior no mobile */}
      <header className={styles.topoMobile}>
        <Logo size={19} />
        <span className={styles.selo}>Admin</span>
        <button type="button" className={styles.sair} onClick={sair}>
          Sair
        </button>
      </header>

      <main className={styles.conteudo}>{children}</main>
    </div>
  );
}

function Icone({ d }: { d: string }) {
  return (
    <svg
      width="17"
      height="17"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d={d} />
    </svg>
  );
}
