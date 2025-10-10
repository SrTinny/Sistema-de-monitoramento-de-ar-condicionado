import React, { useEffect, useState, useContext } from "react"; // 1. Importa o useContext
import styles from "./Header.module.css";
import { Link } from "react-router-dom";
import { AuthContext } from "../../contexts/AuthContext"; // 2. Importa nosso AuthContext
import { FiLogOut } from "react-icons/fi"; // Ícone para o botão de logout

export default function Header() {
  const [isDarkMode, setIsDarkMode] = useState(false);
  // 3. Acessa os dados do usuário e a função de logout do contexto
  const { user, logout } = useContext(AuthContext);

  useEffect(() => {
    // A lógica do dark mode continua a mesma e funciona perfeitamente
    const bodyHasDarkMode = document.body.classList.contains("dark-mode");
    if (bodyHasDarkMode) {
      setIsDarkMode(true);
    }
  }, []);

  const toggleTheme = () => {
    document.body.classList.toggle("dark-mode");
    setIsDarkMode(!isDarkMode);
  };

  return (
    <header className={styles.header}>
      <nav className={styles.nav}>
        {/* 4. A saudação agora é dinâmica, usando o email do usuário logado */}
        <Link to="/" className={styles.logo}>
          {user ? `👋 Olá, ${user.email}` : "Sistema de AC"}
        </Link>

        <div className={styles.actions}>
          <button onClick={toggleTheme} className={styles.toggleBtn} aria-label="Alternar tema">
            <svg className={styles.icon} viewBox="0 0 24 24" fill="none" stroke="currentColor">
              {isDarkMode ? (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M21.752 15.002A9.718 9.718 0 0112 21.75
                     9.719 9.719 0 013.75 15c0-3.58 2.016-6.79
                     5.002-8.498a0.75 0.75 0 00.25-1.212
                     7.487 7.487 0 009.872 9.872
                     0.75 0.75 0 001.212-.25A9.704 9.704 0 0121.752 15z"
                />
              ) : (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M12 3v1m0 16v1m9-9h1M4 12H3m15.364 7.364l-.707-.707M6.343 6.343l-.707-.707
                     m12.728 12.728l-.707-.707M6.343 17.657l-.707-.707
                     M12 6a6 6 0 100 12 6 6 0 000-12z"
                />
              )}
            </svg>
          </button>

          {user && (
            <button onClick={logout} className={styles.logoutBtn} aria-label="Sair">
              <FiLogOut />
            </button>
          )}
        </div>
      </nav>
    </header>
  );
}
