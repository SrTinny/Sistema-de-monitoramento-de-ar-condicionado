// src/components/footer/Footer.jsx
import React from "react";
import styles from "./Footer.module.css";

export default function Footer() {
  return (
    <footer className={styles.footer}>
      <div className={styles.footerContent}>
        <p>© 2025 Monitoramento de Ar-condicionados. Todos os direitos reservados.</p>
        <p>
          Desenvolvido por{" "}
          <a
            href="https://seulink.com"
            target="_blank"
            rel="noopener noreferrer"
          >
            Sua Empresa
          </a>
        </p>
      </div>
    </footer>
  );
}
