// src/pages/home/Home.jsx
import { useEffect } from "react";
import { useWebSocketESP } from "../../hooks/useWebSocketESP";
import ACUnit from "../../components/ACUnit/ACUnit";
import styles from "./Home.module.css";

export default function Home({ salas, setSalas }) {
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
    </main>
  );
}
