import { useState } from "react";
import styles from "./ACUnit.module.css";
import SettingsModal from "../settingsModal/SettingsModal";

export default function ACUnit({ roomId, status, temperature, onToggle, onTempChange }) {
  const [showModal, setShowModal] = useState(false);

  const handleOpenModal = () => setShowModal(true);
  const handleCloseModal = () => setShowModal(false);
  const handleSaveSettings = () => {
    console.log("Configurações salvas para sala:", roomId);
    setShowModal(false);
  };

  return (
    <>
      <div className={`${styles["ac-unit"]} ${styles[status]}`} data-room={roomId}>
        <h2>
          <span className={styles["room-title"]}>Sala {roomId}</span>
          <span className={styles["settings-icon"]} onClick={handleOpenModal}>⚙</span>
        </h2>
        <p>Status: 
          <span id={`status-${roomId}`} className={`${styles.status} ${styles[status]}`}>
            {status === "ligado" ? "Ligado" : "Desligado"}
          </span>
        </p>
        <p>Temperatura Atual: <span id={`temp-${roomId}`}>{temperature}°C</span></p>
        <button id={`toggle-${roomId}`} onClick={() => onToggle(roomId)}>
          Ligar/Desligar
        </button>
        <input
          type="range"
          min="16"
          max="30"
          id={`temp-range-${roomId}`}
          value={temperature}
          onChange={(e) => onTempChange(roomId, e.target.value)}
        />
      </div>

      <SettingsModal
        visible={showModal}
        onClose={handleCloseModal}
        onSave={handleSaveSettings}
      />
    </>
  );
}
