import { useState, useContext, useEffect } from "react";
import { createPortal } from "react-dom";
import styles from "./ACUnit.module.css";
import SettingsModal from "../settingsModal/SettingsModal";
import { LoadingButton } from "../Spinner/Spinner";
import { AuthContext } from "../../contexts/AuthContext";
import { useRooms } from "../../contexts/RoomContext";

const OFFLINE_TIMEOUT_MS = 20000;

export default function ACUnit({ room, onToggle, onIrCommand }) {
  const [showModal, setShowModal] = useState(false);
  const [isToggling, setIsToggling] = useState(false);
  const [isSendingIr, setIsSendingIr] = useState(false);
  const [nowMs, setNowMs] = useState(Date.now());
  const { user } = useContext(AuthContext);
  const { updateRoom } = useRooms();

  const { name, room: roomLocation, status, temperature, deviceId, lastHeartbeat } = room;

  useEffect(() => {
    const timer = setInterval(() => {
      setNowMs(Date.now());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const isOnline = Boolean(lastHeartbeat) && (nowMs - new Date(lastHeartbeat).getTime()) < OFFLINE_TIMEOUT_MS;
  const statusLabel = isOnline ? "Online" : "Offline";
  const statusTone = isOnline ? "success" : "neutral";
  const cardStatusClass = isOnline ? status : "offline";
  const formattedTemperature = Number.isFinite(Number(temperature))
    ? Math.round(Number(temperature))
    : "--";

  const handleToggle = async (roomData) => {
    setIsToggling(true);
    try {
      await onToggle(roomData);
    } finally {
      setIsToggling(false);
    }
  };

  const handleIrCommand = async (command) => {
    if (!onIrCommand) {
      return;
    }

    setIsSendingIr(true);
    try {
      await onIrCommand(deviceId, command);
    } finally {
      setIsSendingIr(false);
    }
  };

  return (
    <>
      <div
        className={`${styles.unit} ${styles[cardStatusClass]}`}
        data-device-id={deviceId}
      >
        <div className={styles.header}>
          <h2 className={styles.title}>{name}</h2>
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

        <div className={styles.contentGrid}>
          <div className={styles.infoCol}>
            <p className={styles.location}>{roomLocation}</p>

            <div className={styles.operationRow}>
              <span className={styles.metricLabel}>Operação</span>
              <span className={`${styles.statusText} ${styles[status]}`}>
                {status === "ligado" ? "Ligado" : "Desligado"}
              </span>
            </div>

            <div className={styles.temperatureBlock}>
              <span className={styles.metricLabel}>Temperatura Atual</span>
              <span className={styles.temperatureValue}>{formattedTemperature}°C</span>
            </div>
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

            <div className={styles.tempControls}>
              <button
                type="button"
                className={`${styles.tempButton} ${styles.tempDownButton}`}
                onClick={() => handleIrCommand("temp_down")}
                disabled={isToggling || isSendingIr}
              >
                Temp -
              </button>
              <button
                type="button"
                className={`${styles.tempButton} ${styles.tempUpButton}`}
                onClick={() => handleIrCommand("temp_up")}
                disabled={isToggling || isSendingIr}
              >
                Temp +
              </button>
            </div>
          </div>
        </div>
      </div>

      {showModal && createPortal(
        <SettingsModal
          visible={showModal}
          room={room}
          onClose={() => setShowModal(false)}
          onSave={async (roomId, data) => {
            try {
              await updateRoom(roomId, data);
              setShowModal(false);
            } catch (err) {
              console.error('Erro ao salvar configurações da sala:', err);
            }
          }}
        />,
        document.getElementById("modal-root")
      )}
    </>
  );
}