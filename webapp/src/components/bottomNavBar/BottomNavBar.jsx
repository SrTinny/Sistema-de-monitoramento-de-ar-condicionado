// 1. Importar o useContext e o RoomContext
import { useContext, useState } from "react";
import { NavLink } from "react-router-dom";
import { FiHome, FiPlusSquare, FiCalendar } from "react-icons/fi";
import styles from "./BottomNavBar.module.css";
import { RoomContext } from "../../contexts/RoomContext";
import { AuthContext } from "../../contexts/AuthContext";
import DiscoverESPModal from "../discoverESPModal/DiscoverESPModal";

// 2. Remover a prop 'onAddClick' da função
export default function BottomNavBar() {
  const { openForm, fetchRooms } = useContext(RoomContext);
  const { user } = useContext(AuthContext);
  const [showDiscoverModal, setShowDiscoverModal] = useState(false);

  // A função para determinar a classe do NavLink
  const getNavLinkClass = ({ isActive }) => {
    return isActive ? `${styles.navItem} ${styles.active}` : styles.navItem;
  };

  return (
    <>
      <nav className={styles.navbar}>
        <NavLink to="/" className={getNavLinkClass} end>
          <FiHome className={styles.icon} />
          <span>Início</span>
        </NavLink>

        {/* O botão de adicionar abre o modal de descoberta ESP */}
        {user && user.role === "ADMIN" && (
          <button className={styles.navItem} onClick={() => setShowDiscoverModal(true)}>
            <FiPlusSquare className={styles.icon} />
            <span>Adicionar</span>
          </button>
        )}

        <NavLink to="/agendamentos" className={getNavLinkClass}>
          <FiCalendar className={styles.icon} />
          <span>Agenda</span>
        </NavLink>
      </nav>

      {/* Modal de Descoberta de ESP */}
      <DiscoverESPModal 
        isOpen={showDiscoverModal}
        onClose={() => setShowDiscoverModal(false)}
        onESPAdded={() => {
          // Recarrega salas após adicionar novo AC
          setTimeout(fetchRooms, 2000);
        }}
      />
    </>
  );
}
