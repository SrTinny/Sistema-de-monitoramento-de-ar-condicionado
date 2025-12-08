import React, { useEffect, useState, useContext } from "react";
import styles from "./Header.module.css";
import { Link } from "react-router-dom";
import { AuthContext } from "../../contexts/AuthContext";
import { FiLogOut } from "react-icons/fi";

export default function Header() {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const { user, logout } = useContext(AuthContext);

  useEffect(() => {
    const saved = localStorage.getItem("theme");
    const prefersDark = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
    const shouldUseDark = saved === "dark" || (!saved && prefersDark);
    if (shouldUseDark) {
      document.body.classList.add("dark-mode");
      setIsDarkMode(true);
    }
  }, []);

  const toggleTheme = () => {
    const next = !isDarkMode;
    setIsDarkMode(next);
    document.body.classList.toggle("dark-mode", next);
    localStorage.setItem("theme", next ? "dark" : "light");
  };

  // 1. MELHORIA NA SAUDAÇÃO: Extrai o nome de usuário do e-mail
  const username = user ? user.email.split('@')[0] : null;

  return (
    <header className={styles.header}>
      <nav className={styles.nav}>
        <Link to="/" className={styles.logo}>
          {/* A saudação agora é mais limpa e amigável */}
          {user ? `👋 Olá, ${username}` : "Sistema de AC"}
        </Link>

        <div className={styles.actions}>
          <button onClick={toggleTheme} className={styles.actionButton} aria-label="Alternar tema">
            {/* O SVG continua igual */}
            <svg className={styles.icon} viewBox="0 0 24 24" fill="none" stroke="currentColor">
              {isDarkMode ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21.752 15.002A9.718 9.718 0 0112 21.75 9.719 9.719 0 013.75 15c0-3.58 2.016-6.79 5.002-8.498a0.75 0.75 0 00.25-1.212 7.487 7.487 0 009.872 9.872 0.75 0.75 0 001.212-.25A9.704 9.704 0 0121.752 15z" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 3v1m0 16v1m9-9h1M4 12H3m15.364 7.364l-.707-.707M6.343 6.343l-.707-.707m12.728 12.728l-.707-.707M6.343 17.657l-.707-.707M12 6a6 6 0 100 12 6 6 0 000-12z" />
              )}
            </svg>
          </button>

          {user && (
            <button onClick={logout} className={styles.actionButton} aria-label="Sair">
              <FiLogOut className={styles.icon} />
            </button>
          )}
        </div>
      </nav>
    </header>
  );
}