// src/components/BottomNavBar.jsx
import { useNavigate } from "react-router-dom";
import { FiHome, FiPlusSquare, FiCalendar, FiSettings } from "react-icons/fi";
import styles from "./BottomNavBar.module.css";

export default function BottomNavBar({ onAddClick }) {
  const navigate = useNavigate();

  return (
    <nav className={styles.navbar}>
      <button className={styles.navItem} onClick={() => navigate("/")}>  
        <FiHome className={styles.icon} />
        <span>Início</span>
      </button>
      <button className={styles.navItem} onClick={onAddClick}>
        <FiPlusSquare className={styles.icon} />
        <span>Adicionar</span>
      </button>
      <button className={styles.navItem} onClick={() => navigate("/agendamentos")}>  
        <FiCalendar className={styles.icon} />
        <span>Agenda</span>
      </button>
      <button className={styles.navItem} onClick={() => navigate("/config")}>  
        <FiSettings className={styles.icon} />
        <span>Config</span>
      </button>
    </nav>
  );
}
