import { useState } from "react";
import styles from "./ACUnit.module.css";
import SettingsModal from "../settingsModal/SettingsModal";

export default function ACUnit({ room, onToggle, onTempChange }) {
  const [showModal, setShowModal] = useState(false);

  const { name, room: roomLocation, status, temperature, deviceId } = room;

  const handleTempChange = (e) => {
    // Chamamos a função do pai (onTempChange) que veio via props
    onTempChange(deviceId, e.target.value);
  };

  return (
    <>
      <div
        className={`${styles.unit} ${styles[status]}`}
        data-device-id={deviceId}
      >
        <h2 className={styles.header}>
          <span className={styles.title}>{name}</span>
          <span className={styles.icon} onClick={() => setShowModal(true)}>
            ⚙
          </span>
        </h2>

        <p className={styles.location}>{roomLocation}</p>

        <p>
          Status:{" "}
          <span className={`${styles.statusText} ${styles[status]}`}>
            {status === "ligado" ? "Ligado" : "Desligado"}
          </span>
        </p>
        <p>
          Temperatura Atual: <span>{temperature || "--"}°C</span>
        </p>

        <button onClick={() => onToggle(room)}>
          {status === "ligado" ? "Desligar" : "Ligar"}
        </button>

        <input
          type="range"
          min="16"
          max="30"
          value={temperature || 22}
          onChange={handleTempChange} // A função agora é encontrada!
        />
      </div>

      <SettingsModal
        visible={showModal}
        room={room} // Passando o room para o modal
        onClose={() => setShowModal(false)}
        onSave={
          // Você precisará passar a função de update para cá depois
          (roomId, data) =>
            console.log("Salvar ainda a ser implementado", roomId, data)
        }
      />
    </>
  );
}
