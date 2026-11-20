import Link from "next/link";
import Logo from "@/components/Logo";
import styles from "./not-found.module.css";

export default function NaoEncontrado() {
  return (
    <main className={styles.main}>
      <section className={styles.cartao}>
        <Logo size={24} />
        <span className={styles.codigo}>404</span>
        <h1 className={styles.titulo}>Equipamento não encontrado</h1>
        <p className={styles.texto}>
          O endereço acessado não corresponde a nenhum equipamento. Confira o
          link ou informe sua senha individual novamente.
        </p>
        <Link href="/" className="btn btn--primary">
          Voltar ao acesso
        </Link>
      </section>
    </main>
  );
}
