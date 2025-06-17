// src/components/BottomNavBar.jsx
import { NavLink } from "react-router-dom";
import { FiHome, FiPlusSquare, FiCalendar, FiSettings } from "react-icons/fi";
import styles from "./BottomNavBar.module.css";

export default function BottomNavBar() {
  return (
    <nav className={styles.navbar}>
      <NavLink to="/" className={styles.navItem}>
        <FiHome className={styles.icon} />
        <span>Início</span>
      </NavLink>
      <NavLink to="/add-room" className={styles.navItem}>
        <FiPlusSquare className={styles.icon} />
        <span>Adicionar</span>
      </NavLink>
      <NavLink to="/agendamentos" className={styles.navItem}>
        <FiCalendar className={styles.icon} />
        <span>Agenda</span>
      </NavLink>
      <NavLink to="/config" className={styles.navItem}>
        <FiSettings className={styles.icon} />
        <span>Config</span>
      </NavLink>
    </nav>
  );
}
