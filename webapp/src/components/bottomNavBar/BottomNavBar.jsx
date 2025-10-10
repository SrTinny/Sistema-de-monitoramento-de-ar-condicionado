// 1. Importar o useContext e o RoomContext
import { useContext } from "react";
import { useNavigate } from "react-router-dom";
import { FiHome, FiPlusSquare, FiCalendar, FiSettings } from "react-icons/fi";
import styles from "./BottomNavBar.module.css";
import { RoomContext } from "../../contexts/RoomContext";

// 2. Remover a prop 'onAddClick' da função
export default function BottomNavBar() {
  const navigate = useNavigate();
  // 3. Acessar a função 'openForm' do nosso contexto
  const { openForm } = useContext(RoomContext);

  return (
    <nav className={styles.navbar}>
      <button className={styles.navItem} onClick={() => navigate("/")}>
        <FiHome className={styles.icon} />
        <span>Início</span>
      </button>

      {/* 4. O onClick agora chama 'openForm' diretamente */}
      <button className={styles.navItem} onClick={openForm}>
        <FiPlusSquare className={styles.icon} />
        <span>Adicionar</span>
      </button>

      <button
        className={styles.navItem}
        onClick={() => navigate("/agendamentos")}
      >
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