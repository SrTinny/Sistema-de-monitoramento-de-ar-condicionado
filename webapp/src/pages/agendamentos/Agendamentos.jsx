// src/pages/Agendamentos.jsx
import Agenda from "../../components/agenda/Agenda";
import BottomNavBar from "../../components/bottomNavBar/BottomNavBar";
import styles from "./Agendamentos.module.css";

export default function Agendamentos({ salas }) {
  const handleAgendar = (dados) => {
    console.log("Agendamento:", dados);
    // Aqui você pode salvar no backend, localStorage, etc
  };

  return (
    <main className={styles.container}>
      <h1 className={styles.titulo}>Agendamentos</h1>
      <Agenda salas={salas} onAgendar={handleAgendar} />
      <BottomNavBar />
    </main>
  );
}
