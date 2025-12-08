// PONTO DE MELHORIA 1: Importar o 'createPortal' e remover o 'ReactDOM' que não era usado
import { useState, useContext } from "react";
import { createPortal } from "react-dom";
import styles from "./ACUnit.module.css";
import SettingsModal from "../settingsModal/SettingsModal";
import { LoadingButton } from "../Spinner/Spinner";
import { AuthContext } from "../../contexts/AuthContext";
import { useRooms } from "../../contexts/RoomContext";

export default function ACUnit({ room, onToggle, onTempChange }) {
  const [showModal, setShowModal] = useState(false);
  const [isToggling, setIsToggling] = useState(false);
  const { user } = useContext(AuthContext);
  const { updateRoom } = useRooms();

  const { id, name, room: roomLocation, status, temperature, setpoint, deviceId } = room;

  const handleTempChange = (e) => {
    const value = parseFloat(e.target.value);
    onTempChange(id, value);
  };

  const handleToggle = async (roomData) => {
    setIsToggling(true);
    try {
      await onToggle(roomData);
    } finally {
      setIsToggling(false);
    }
  };

  return (
    <>
      <div
        className={`${styles.unit} ${styles[status]}`}
        data-device-id={deviceId}
      >
        <div className={styles.header}>
          <h2 className={styles.title}>{name}</h2>
          
          {/* PONTO DE MELHORIA 2: Acessibilidade */}
          {/* Usar <button> em vez de <span> para o ícone clicável. */}
          {/* É semanticamente correto e acessível para teclados. */}
          {user && user.role === "ADMIN" && (
            <button
              className={styles.iconButton}
              onClick={() => setShowModal(true)}
              aria-label="Abrir configurações da sala" // Adiciona um rótulo para leitores de tela
            >
              <span className={styles.icon} aria-hidden="true">⚙</span>
            </button>
          )}
        </div>

        <p className={styles.location}>{roomLocation}</p>

        <p>
          Status:{" "}
          <span className={`${styles.statusText} ${styles[status]}`}>
            {status === "ligado" ? "Ligado" : "Desligado"}
          </span>
        </p>
        <p>
          Temperatura Atual: <span>{temperature ?? "--"}°C</span>
        </p>
        <p>
          Setpoint: <span>{setpoint ?? "--"}°C</span>
        </p>

        <LoadingButton
          isLoading={isToggling}
          disabled={isToggling}
          onClick={() => handleToggle(room)}
          className={styles.mainButton}
        >
          {status === "ligado" ? "Desligar" : "Ligar"}
        </LoadingButton>

        <input
          type="range"
          min="16"
          max="30"
          // PONTO DE MELHORIA 3: Usar '??' (Nullish Coalescing)
          // Evita bugs se a temperatura for 0 (embora não seja o caso aqui).
          value={setpoint ?? 22}
          onChange={handleTempChange}
        />
      </div>
      
      {/* PONTO DE MELHORIA 1 (Continuação): Renderizando o Modal com Portal */}
      {showModal && createPortal(
        <SettingsModal
          visible={showModal}
          room={room}
          onClose={() => setShowModal(false)}
          onSave={async (roomId, data) => {
            try {
              // usa o contexto de salas para atualizar no backend
              await updateRoom(roomId, data);
              setShowModal(false);
            } catch (err) {
              // deixa o modal aberto para o usuário tentar de novo
              console.error('Erro ao salvar configurações da sala:', err);
            }
          }}
        />,
        document.getElementById("modal-root") // O modal será renderizado aqui
      )}
    </>
  );
}