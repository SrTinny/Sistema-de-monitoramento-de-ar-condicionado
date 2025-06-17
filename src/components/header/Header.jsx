// src/components/header/Header.jsx
import React, { useEffect, useState } from "react";
import styles from "./Header.module.css";
import { Link } from "react-router-dom";

export default function Header() {
  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    // Detecta tema atual
    const dark = document.body.classList.contains("dark-mode");
    setIsDarkMode(dark);
  }, []);

  const toggleTheme = () => {
    document.body.classList.toggle("dark-mode");
    setIsDarkMode(!isDarkMode);
  };

  return (
    <header className={styles.header}>
      <nav className={styles.nav}>
        <Link to="/" className={styles.logoLink}>
          Monitoramento
        </Link>

        <ul className={styles.navList}>
          <li>
            <Link to="/" className={styles.navLink}>
              Início
            </Link>
          </li>
          <li>
            <Link to="/add-room" className={styles.navLink}>
              Adicionar Cômodo
            </Link>
          </li>
          <li>
            <Link to="/about" className={styles.navLink}>
              Sobre
            </Link>
          </li>
        </ul>

        <button onClick={toggleTheme} className={styles.themeToggle} aria-label="Alternar tema">
          <svg
            className={styles.icon}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            {isDarkMode ? (
              // Ícone lua
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M21.752 15.002A9.718 9.718 0 0112 21.75 9.719 9.719 0 013.75 15c0-3.58 2.016-6.79 5.002-8.498a0.75 0.75 0 00.25-1.212 7.487 7.487 0 009.872 9.872 0.75 0.75 0 001.212-.25A9.704 9.704 0 0121.752 15z"
              />
            ) : (
              // Ícone sol
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M12 3v1m0 16v1m9-9h1M4 12H3m15.364 7.364l-.707-.707M6.343 6.343l-.707-.707m12.728 12.728l-.707-.707M6.343 17.657l-.707-.707M12 6a6 6 0 100 12 6 6 0 000-12z"
              />
            )}
          </svg>
        </button>
      </nav>
    </header>
  );
}
