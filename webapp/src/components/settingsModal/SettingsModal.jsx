import React, { useState, useEffect, useContext } from "react";
import { createPortal } from "react-dom"; // Usando createPortal em vez de ReactDOM
import styles from "./SettingsModal.module.css";
import { RoomContext } from "../../contexts/RoomContext";
import { AuthContext } from "../../contexts/AuthContext";
import api from "../../services/api";

export default function SettingsModal({ visible, room, onClose, onSave }) {
  const [name, setName] = useState("");
  const [location, setLocation] = useState("");
  const [showCloneOptions, setShowCloneOptions] = useState(false);
  const [learningButton, setLearningButton] = useState(null);
  const [isReceivingSignal, setIsReceivingSignal] = useState(false);
  const [capturedSignal, setCapturedSignal] = useState(null);
  const [localRoomState, setLocalRoomState] = useState(room || null);
  const { deleteRoom, sendCommand, startIrLearning, confirmIrLearning, fetchRooms } = useContext(RoomContext);
  const { user } = useContext(AuthContext);

  useEffect(() => {
    if (room && visible) {
      setName(room.name);
      setLocation(room.room);
      setLocalRoomState(room);
      setLearningButton(null);
      setIsReceivingSignal(false);
      setCapturedSignal(null);
    }
  }, [room, visible]);

  if (!visible) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(room.id, { name, room: location });
  };

  const handleDelete = async () => {
    if (
      window.confirm(
        `Tem certeza que deseja deletar a sala "${room.name}"? Esta ação não pode ser desfeita.`
      )
    ) {
      try {
        await deleteRoom(room.id);
        onClose();
      } catch (error) {
        console.error("Erro no componente ao deletar:", error);
      }
    }
  };

  const handleWifiReset = async () => {
    if (!room?.deviceId) {
      window.alert("Este dispositivo ainda não possui deviceId registrado.");
      return;
    }

    if (
      window.confirm(
        `Deseja reconfigurar o Wi-Fi do dispositivo ${room.deviceId}? O ESP será reiniciado e abrirá o portal AC-SETUP.`
      )
    ) {
      try {
        await sendCommand(room.deviceId, "wifi_reset");
        window.alert("Comando enviado. Aguarde o reinício do ESP e conecte no Wi-Fi AC-SETUP para configurar a rede.");
      } catch (error) {
        console.error("Erro ao solicitar reset de Wi-Fi:", error);
        window.alert("Não foi possível enviar o comando de reset de Wi-Fi.");
      }
    }
  };

  const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

  const hasLearnedSignal = (button) => {
    return Boolean(localRoomState?.irSignals?.[button]?.raw);
  };

  const truncateSignal = (raw) => {
    if (!raw) return "";
    if (raw.length <= 300) return raw;
    return `${raw.slice(0, 300)}...`;
  };

  const handleLearnIr = async (button) => {
    if (!room?.deviceId) {
      window.alert("Este dispositivo ainda não possui deviceId registrado.");
      return;
    }

    const startedAtMs = Date.now();

    try {
      setCapturedSignal(null);
      setLearningButton(button);
      setIsReceivingSignal(true);
      await startIrLearning(room.id, button);

      let attempts = 0;
      while (attempts < 18) {
        await wait(2000);
        const response = await api.get(`/api/rooms/${room.id}`);
        const latest = response.data;
        setLocalRoomState(latest);

        const updatedAt = latest?.irLearnUpdatedAt ? new Date(latest.irLearnUpdatedAt).getTime() : 0;
        const isCurrentButton = latest?.irLearnButton === button;
        const state = latest?.irLearnState;

        if (isCurrentButton && updatedAt >= startedAtMs) {
          if (state === "capturado_pendente" && latest?.irLearnRaw) {
            setCapturedSignal({
              button,
              raw: latest.irLearnRaw,
              message: latest.irLearnMessage || `Sinal '${button}' recebido. Deseja salvar?`,
            });
            setIsReceivingSignal(false);
            setLearningButton(null);
            return;
          }

          if (state === "timeout") {
            window.alert(latest.irLearnMessage || `Tempo esgotado ao capturar sinal '${button}'.`);
            setIsReceivingSignal(false);
            setLearningButton(null);
            return;
          }

          if (state === "erro") {
            window.alert(latest.irLearnMessage || `Falha ao capturar sinal '${button}'.`);
            setIsReceivingSignal(false);
            setLearningButton(null);
            return;
          }
        }

        attempts += 1;
      }

      window.alert("Não houve confirmação de captura a tempo. Verifique se o ESP está online e tente novamente.");
    } catch (error) {
      console.error("Erro ao clonar sinal IR:", error);
      window.alert("Não foi possível concluir a clonagem do sinal IR.");
    } finally {
      setIsReceivingSignal(false);
      setLearningButton(null);
    }
  };

  const handleConfirmCapturedSignal = async (save) => {
    if (!capturedSignal) {
      return;
    }

    try {
      const result = await confirmIrLearning(room.id, save);
      if (result?.room) {
        setLocalRoomState((prev) => ({ ...(prev || {}), ...result.room }));
      }
      setCapturedSignal(null);
      await fetchRooms();
    } catch (error) {
      console.error("Erro ao confirmar sinal capturado:", error);
    }
  };

  return createPortal(
    <div
      className={styles.modalOverlay} // Renomeado para consistência
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className={styles.modalContent}>
        <div className={styles.modalHeader}>
          <h3>Configurações da Sala</h3>
          <button
            onClick={onClose}
            className={styles.closeButton}
            aria-label="Fechar modal" // Adicionada acessibilidade
          >
            &times;
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className={styles.inputGroup}>
            <label htmlFor="room-name">Nome do Ar</label>
            <input
              id="room-name"
              type="text"
              placeholder="Ex: AC da Biblioteca"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              autoFocus // Adicionado foco automático para melhor UX
            />
          </div>

          <div className={styles.inputGroup}>
            <label htmlFor="room-location">Localização</label>
            <input
              id="room-location"
              type="text"
              placeholder="Ex: Bloco C - Sala 203"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              required
            />
          </div>

          <div className={styles.buttonGroup}>
            <button type="submit" className={styles.saveButton}>
              Salvar
            </button>
            <button
              type="button"
              onClick={onClose}
              className={styles.cancelButton}
            >
              Cancelar
            </button>
          </div>
        </form>

        {user && user.role === "ADMIN" && (
          <div className={styles.irSection}>
            <h4>Clonar controle remoto (IR)</h4>
            <p className={styles.irHint}>
              Capture separadamente os botões de ligar e desligar do controle original.
            </p>

            <button
              type="button"
              onClick={() => setShowCloneOptions((prev) => !prev)}
              className={styles.cloneControlButton}
              disabled={isReceivingSignal}
            >
              {showCloneOptions ? "Ocultar opções de clonagem" : "Clonar controle"}
            </button>

            {showCloneOptions && (
              <div className={styles.irButtonsRow}>
                <button
                  type="button"
                  onClick={() => handleLearnIr("ligar")}
                  className={styles.learnButton}
                  disabled={Boolean(learningButton)}
                >
                  Clonar botão Ligar
                </button>

                <button
                  type="button"
                  onClick={() => handleLearnIr("desligar")}
                  className={styles.learnButton}
                  disabled={Boolean(learningButton)}
                >
                  Clonar botão Desligar
                </button>
              </div>
            )}

            {isReceivingSignal && learningButton && (
              <div className={styles.irReceivingBox}>
                <strong>ESP recebendo sinal IR...</strong>
                <p>Pressione agora o botão '{learningButton}' no controle remoto.</p>
              </div>
            )}

            {capturedSignal && (
              <div className={styles.irCapturedBox}>
                <strong>Sinal recebido para '{capturedSignal.button}'</strong>
                <p>{capturedSignal.message}</p>
                <textarea
                  className={styles.signalPreview}
                  readOnly
                  value={truncateSignal(capturedSignal.raw)}
                />
                <div className={styles.signalConfirmActions}>
                  <button type="button" className={styles.saveSignalButton} onClick={() => handleConfirmCapturedSignal(true)}>
                    Salvar sinal
                  </button>
                  <button type="button" className={styles.discardSignalButton} onClick={() => handleConfirmCapturedSignal(false)}>
                    Descartar
                  </button>
                </div>
              </div>
            )}

            <p className={styles.irStatus}>
              Ligar: {hasLearnedSignal("ligar") ? "configurado" : "não configurado"} | Desligar: {hasLearnedSignal("desligar") ? "configurado" : "não configurado"}
            </p>
          </div>
        )}

        {user && user.role === "ADMIN" && (
          <div className={styles.adminSection}>
            <button onClick={handleWifiReset} className={styles.wifiButton}>
              Reconfigurar Wi-Fi do ESP
            </button>
          </div>
        )}

        {user && user.role === "ADMIN" && (
          <div className={styles.deleteSection}>
            <button onClick={handleDelete} className={styles.deleteButton}>
              Deletar Sala
            </button>
          </div>
        )}
      </div>
    </div>,
    document.getElementById("modal-root")
  );
}