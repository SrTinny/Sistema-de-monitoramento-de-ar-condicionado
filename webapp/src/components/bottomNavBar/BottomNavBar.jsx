// 1. Importar o useContext e o RoomContext
import { useContext } from "react";
import { NavLink } from "react-router-dom";
import { FiHome, FiPlusSquare, FiCalendar, FiSettings } from "react-icons/fi";
import styles from "./BottomNavBar.module.css";
import { RoomContext } from "../../contexts/RoomContext";

// 2. Remover a prop 'onAddClick' da função
export default function BottomNavBar() {
  const { openForm } = useContext(RoomContext);

  // A função para determinar a classe do NavLink
  const getNavLinkClass = ({ isActive }) => {
    return isActive ? `${styles.navItem} ${styles.active}` : styles.navItem;
  };

  return (
    <nav className={styles.navbar}>
      <NavLink to="/" className={getNavLinkClass} end>
        <FiHome className={styles.icon} />
        <span>Início</span>
      </NavLink>

      {/* O botão de adicionar não é um link, então continua como button */}
      <button className={styles.navItem} onClick={openForm}>
        <FiPlusSquare className={styles.icon} />
        <span>Adicionar</span>
      </button>

      <NavLink to="/agendamentos" className={getNavLinkClass}>
        <FiCalendar className={styles.icon} />
        <span>Agenda</span>
      </NavLink>

      <NavLink to="/config" className={getNavLinkClass}>
        <FiSettings className={styles.icon} />
        <span>Config</span>
      </NavLink>
    </nav>
  );
}
