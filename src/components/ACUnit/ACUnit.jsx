// src/components/ACUnit/ACUnit.jsx
import { useState } from "react";
import styles from "./ACUnit.module.css";
import SettingsModal from "../settingsModal/SettingsModal";

export default function ACUnit({ roomId, status, temperature, onToggle, onTempChange }) {
  const [showModal, setShowModal] = useState(false);

  return (
    <>
      <div className={`${styles.unit} ${styles[status]}`} data-room={roomId}>
        <h2 className={styles.header}>
          <span className={styles.title}>Sala {roomId}</span>
          <span className={styles.icon} onClick={() => setShowModal(true)}>⚙</span>
        </h2>
        <p>
          Status:{" "}
          <span
            id={`status-${roomId}`}
            className={`${styles.status} ${styles[status]}`}
          >
            {status === "ligado" ? "Ligado" : "Desligado"}
          </span>
        </p>
        <p>
          Temperatura Atual: <span id={`temp-${roomId}`}>{temperature}°C</span>
        </p>
        <button onClick={() => onToggle(roomId)}>Ligar/Desligar</button>
        <input
          type="range"
          min="16"
          max="30"
          value={temperature}
          onChange={(e) => onTempChange(roomId, e.target.value)}
        />
      </div>

      <SettingsModal
        visible={showModal}
        onClose={() => setShowModal(false)}
        onSave={() => {
          console.log("Configurações salvas para sala:", roomId);
          setShowModal(false);
        }}
      />
    </>
  );
}
