// PONTO DE MELHORIA 1: Importar o 'createPortal' e remover o 'ReactDOM' que não era usado
import { useState, useContext, useEffect, useMemo } from "react";
import { createPortal } from "react-dom";
import styles from "./ACUnit.module.css";
import SettingsModal from "../settingsModal/SettingsModal";
import { LoadingButton } from "../Spinner/Spinner";
import { AuthContext } from "../../contexts/AuthContext";
import { useRooms } from "../../contexts/RoomContext";

export default function ACUnit({ room, onToggle, onTempChange }) {
  const [showModal, setShowModal] = useState(false);
  const [isToggling, setIsToggling] = useState(false);
  const [currentSetpoint, setCurrentSetpoint] = useState(room.setpoint ?? 22);
  const [isDragging, setIsDragging] = useState(false);
  const { user } = useContext(AuthContext);
  const { updateRoom } = useRooms();

  const { id, name, room: roomLocation, status, temperature, setpoint, deviceId } = room;

  useEffect(() => {
    setCurrentSetpoint(setpoint ?? 22);
  }, [setpoint]);

  const sliderPercent = useMemo(() => {
    const min = 16;
    const max = 30;
    const clamped = Math.min(Math.max(currentSetpoint, min), max);
    return ((clamped - min) / (max - min)) * 100;
  }, [currentSetpoint]);

  const statusLabel = status === "ligado" ? "Online" : status === "desligado" ? "Offline" : "Offline";
  const statusTone = status === "ligado" ? "success" : status === "desligado" ? "warning" : "neutral";

  const handleTempChange = (e) => {
    const value = parseFloat(e.target.value);
    setCurrentSetpoint(value);
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
          <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
            <div className={`${styles.statusBadge} ${styles[statusTone]}`}>
              <span className={`${styles.pulseDot} ${styles[statusTone]}`} aria-hidden="true" />
              <span>{statusLabel}</span>
            </div>
            
            {user && user.role === "ADMIN" && (
              <button
                className={styles.iconButton}
                onClick={() => setShowModal(true)}
                aria-label="Abrir configurações da sala"
              >
                <span className={styles.icon} aria-hidden="true">⚙</span>
              </button>
            )}
          </div>
        </div>

        <div className={styles.contentGrid}>
          <div className={styles.infoCol}>
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
          </div>

          <div className={styles.controlCol}>
            <LoadingButton
              isLoading={isToggling}
              disabled={isToggling}
              onClick={() => handleToggle(room)}
              className={styles.mainButton}
            >
              {status === "ligado" ? "Desligar" : "Ligar"}
            </LoadingButton>

            <div className={styles.sliderWrapper}>
              <input
                type="range"
                min="16"
                max="30"
                value={currentSetpoint}
                onChange={handleTempChange}
                onMouseDown={() => setIsDragging(true)}
                onMouseUp={() => setIsDragging(false)}
                onTouchStart={() => setIsDragging(true)}
                onTouchEnd={() => setIsDragging(false)}
                className={styles.rangeInput}
                style={{
                  background: `linear-gradient(90deg, #3B82F6 0%, #3B82F6 ${sliderPercent}%, #EF4444 ${sliderPercent}%, #E5E7EB ${sliderPercent}%)`,
                }}
                aria-label="Ajustar setpoint de temperatura"
              />
              <div className={styles.sliderMarks} aria-hidden="true">
                {[16, 18, 20, 22, 24, 26, 28, 30].map((mark) => (
                  <span key={mark} className={styles.mark} />
                ))}
              </div>
              <div
                className={`${styles.valueBubble} ${isDragging ? styles.visible : ""}`}
                style={{ left: `${sliderPercent}%` }}
              >
                {currentSetpoint.toFixed(0)}°C
              </div>
            </div>
          </div>
        </div>
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