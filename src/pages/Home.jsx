// src/pages/Home.jsx
import { useState, useEffect } from "react";
import { useWebSocketESP } from "../hooks/useWebSocketESP";
import ACUnit from "../components/ACUnit/ACUnit";
import AddRoomForm from "../components/addRoomForm/AddRoomForm";
import BottomNavBar from "../components/bottomNavBar/BottomNavBar";
import styles from "./Home.module.css";

export default function Home() {
  const [salas, setSalas] = useState([
    { id: "01", status: "desligado", temp: 25 },
    { id: "02", status: "desligado", temp: 25 },
    { id: "03", status: "desligado", temp: 25 },
    { id: "04", status: "desligado", temp: 25 },
  ]);
  const [showAddForm, setShowAddForm] = useState(false);

  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (e.target.classList.contains("overlay")) {
        setShowAddForm(false);
      }
    };

    if (showAddForm) {
      window.addEventListener("click", handleOutsideClick);
    }

    return () => {
      window.removeEventListener("click", handleOutsideClick);
    };
  }, [showAddForm]);

  const handleAddRoomClick = () => setShowAddForm(true);

  const handleAddRoom = (roomId) => {
    setSalas((prev) => [
      ...prev,
      { id: roomId, status: "desligado", temp: 25 },
    ]);
    setShowAddForm(false);
  };

  const updateStatus = (roomId, newStatus) => {
    setSalas((prev) =>
      prev.map((s) => (s.id === roomId ? { ...s, status: newStatus } : s))
    );
  };

  const updateTemp = (roomId, newTemp) => {
    setSalas((prev) =>
      prev.map((s) => (s.id === roomId ? { ...s, temp: newTemp } : s))
    );
  };

  useWebSocketESP((msg) => {
    if (msg.includes("Sinal IR enviado")) alert(msg);
    else updateStatus("101", msg);
  });

  const toggleAC = async (roomId) => {
    const sala = salas.find((s) => s.id === roomId);
    const ESP_IP = "192.168.1.106";
    const rota = sala.status === "ligado" ? "desligar" : "ligar";
    try {
      await fetch(`http://${ESP_IP}/${rota}`);
    } catch (err) {
      console.error("Erro ao alternar AC:", err);
    }
  };

  return (
    <main className={styles.container}>
      <div className={styles.unitsSection}>
        {salas.map((sala) => (
          <ACUnit
            key={sala.id}
            roomId={sala.id}
            status={sala.status}
            temperature={sala.temp}
            onToggle={toggleAC}
            onTempChange={updateTemp}
          />
        ))}
      </div>

      {showAddForm && (
        <AddRoomForm onAddRoom={handleAddRoom} onClose={() => setShowAddForm(false)} />
      )}

      <BottomNavBar onAddClick={handleAddRoomClick} />
    </main>
  );
}