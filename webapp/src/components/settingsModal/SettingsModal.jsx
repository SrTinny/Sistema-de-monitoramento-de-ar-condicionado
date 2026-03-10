import React, { useState, useEffect, useContext, useRef } from "react";
import { createPortal } from "react-dom";
import styles from "./SettingsModal.module.css";
import { RoomContext } from "../../contexts/RoomContext";
import { AuthContext } from "../../contexts/AuthContext";
import api from "../../services/api";
import toast from "react-hot-toast";

export default function SettingsModal({ visible, room, onClose, onSave }) {
  const [name, setName] = useState("");
  const [location, setLocation] = useState("");
  const [showCloneOptions, setShowCloneOptions] = useState(false);
  const [learningButton, setLearningButton] = useState(null);
  const [isReceivingSignal, setIsReceivingSignal] = useState(false);
  const [capturedSignal, setCapturedSignal] = useState(null);
  const [localRoomState, setLocalRoomState] = useState(room || null);
  const [showWifiResetConfirm, setShowWifiResetConfirm] = useState(false);
  const [isWifiResetSubmitting, setIsWifiResetSubmitting] = useState(false);
  const initializedRoomIdRef = useRef(null);
  const { deleteRoom, sendCommand, startIrLearning, confirmIrLearning, fetchRooms } = useContext(RoomContext);
  const { user } = useContext(AuthContext);

  useEffect(() => {
    if (!visible) {
      initializedRoomIdRef.current = null;
      return;
    }

    if (!room) {
      return;
    }

    const isFirstLoadForRoom = initializedRoomIdRef.current !== room.id;

    if (isFirstLoadForRoom) {
      setName(room.name || "");
      setLocation(room.room || "");
      setLocalRoomState(room);
      setLearningButton(null);
      setIsReceivingSignal(false);
      setCapturedSignal(null);
      setShowWifiResetConfirm(false);
      setIsWifiResetSubmitting(false);
      initializedRoomIdRef.current = room.id;
      return;
    }

    setLocalRoomState((prev) => ({ ...(prev || {}), ...room }));
  }, [room, visible]);

  if (!visible) return null;

  const setupSsidSuffix = String(room?.deviceId || "").slice(-6).toUpperCase();
  const setupSsid = setupSsidSuffix ? `AC-SETUP-${setupSsidSuffix}` : "AC-SETUP";
  const wifiResetOnlineWindowMs = 35000;
  const roomHeartbeatMs = room?.lastHeartbeat ? new Date(room.lastHeartbeat).getTime() : null;
  const isHeartbeatRecent = Boolean(roomHeartbeatMs) && (Date.now() - roomHeartbeatMs) < wifiResetOnlineWindowMs;

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(room.id, { name, room: location });
  };

  // Salas Disponíveis têm room = 'Não configurada' (ou vazio); Salas de Controle têm nome real
  const UNCONFIGURED_LABELS = new Set(['não configurada', 'nao configurada', 'not configured', 'unconfigured']);
  const isRoomAvailable = !room?.room || UNCONFIGURED_LABELS.has((room?.room ?? '').trim().toLowerCase());

  const handleDelete = () => {
    const msg = isRoomAvailable
      ? `Remover dispositivo "${room.name}" da lista? O ESP receberá um comando para abrir o portal Wi-Fi ${setupSsid}.`
      : `Remover sala "${room.name}" do controle? Ela voltará para Salas Disponíveis.`;
    if (!window.confirm(msg)) return;
    deleteRoom(room.id);
    onClose();
  };

  const handleWifiReset = async () => {
    if (!room?.deviceId) {
      toast.error("Este dispositivo ainda não possui deviceId registrado.");
      return;
    }

    const openSetupGuideWindow = () => {
      if (typeof window === "undefined") return null;

      const guideWindow = window.open("", "_blank");
      if (!guideWindow) return null;

      guideWindow.document.write(`
        <html>
          <head>
            <title>Configurar Wi-Fi do ESP</title>
            <meta name="viewport" content="width=device-width, initial-scale=1" />
            <style>
              body { font-family: 'Segoe UI', Arial, sans-serif; background: #081224; color: #e2e8f0; margin: 0; padding: 20px; }
              .card { max-width: 640px; margin: 0 auto; background: #0f172a; border: 1px solid #334155; border-radius: 14px; padding: 20px; }
              h2 { margin: 0 0 8px; font-size: 1.35rem; }
              p { margin: 0 0 12px; color: #cbd5e1; }
              ol { margin: 0 0 14px; padding-left: 20px; }
              li { margin: 8px 0; line-height: 1.45; }
              code { background: #1e293b; border-radius: 6px; padding: 2px 6px; }
              .actions { display: flex; gap: 10px; flex-wrap: wrap; margin-top: 14px; }
              a { display: inline-block; background: #0ea5e9; color: white; text-decoration: none; padding: 11px 14px; border-radius: 8px; font-weight: 700; }
              .muted { margin-top: 12px; font-size: 0.9rem; color: #94a3b8; }
              .warn { margin-top: 12px; background: rgba(245, 158, 11, 0.12); border: 1px solid rgba(245, 158, 11, 0.3); border-radius: 10px; padding: 10px; }
            </style>
          </head>
          <body>
            <div class="card">
              <h2>Configurar Wi-Fi do ESP</h2>
              <p>Guia rapido para reconectar o dispositivo na sua rede.</p>
              <ol>
                <li>Clique em <strong>Confirmar reconfiguração</strong> no sistema e aguarde de 10 a 20 segundos.</li>
                <li>No celular/PC, conecte na rede <code>${setupSsid}</code>.</li>
                <li>Se o aparelho avisar "sem internet", escolha manter conectado mesmo assim.</li>
                <li>Abra <code>http://192.168.4.1</code> e selecione sua rede Wi-Fi normal.</li>
                <li>Digite a senha, salve e aguarde o ESP reiniciar automaticamente.</li>
                <li>Volte ao sistema e confirme se o dispositivo aparece online.</li>
              </ol>
              <div class="actions">
                <a href="http://192.168.4.1">Abrir portal do ESP (192.168.4.1)</a>
              </div>
              <div class="warn">
                Dica: desative dados moveis temporariamente durante a configuracao para evitar troca automatica de rede.
              </div>
              <p class="muted">Se a pagina nao abrir de primeira, desconecte e reconecte em ${setupSsid} e tente novamente.</p>
            </div>
          </body>
        </html>
      `);
      guideWindow.document.close();
      return guideWindow;
    };

    setIsWifiResetSubmitting(true);
    const loadingId = toast.loading("Enviando comando para reconfigurar o Wi-Fi do ESP...");

    try {
      const response = await sendCommand(room.deviceId, "wifi_reset");
      const queuedOffline = response?.status === 202 || response?.data?.online === false;
      setShowWifiResetConfirm(false);

      if (queuedOffline) {
        toast.success(
          `ESP sem heartbeat recente. O comando ficou pendente e sera executado quando ${room.deviceId} voltar online.`,
          { id: loadingId, duration: 7000 }
        );
        return;
      }

      const setupPortalWindow = openSetupGuideWindow();
      if (!setupPortalWindow) {
        toast.error("Pop-up bloqueado: abra manualmente o guia e depois acesse http://192.168.4.1 apos conectar em AC-SETUP.");
      } else {
        setTimeout(() => {
          if (setupPortalWindow && !setupPortalWindow.closed) {
            setupPortalWindow.focus();
          }
        }, 200);
      }

      toast.success(
        `Comando enviado. Conecte em ${setupSsid} e siga o tutorial para concluir.`,
        { id: loadingId }
      );
    } catch (error) {
      console.error("Erro ao solicitar reset de Wi-Fi:", error);
      const message = error?.response?.data?.error || "Não foi possível enviar o comando de reset de Wi-Fi.";
      toast.error(message, { id: loadingId });
    } finally {
      setIsWifiResetSubmitting(false);
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

        <form id="room-settings-form" onSubmit={handleSubmit}>
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

        </form>

        {user && user.role === "ADMIN" && (
          <div className={styles.adminSection}>
            <h4>Configurar Wi-Fi do ESP</h4>
            <p className={styles.irHint}>
              Use este fluxo quando trocar roteador, senha da rede ou quando o ESP ficar offline.
            </p>

            <div className={styles.wifiGuideBox}>
              <ol>
                <li>Clique em "Reconfigurar Wi-Fi do ESP".</li>
                <li>Aguarde o ESP reiniciar e procure a rede <strong>{setupSsid}</strong>.</li>
                <li>Conecte nessa rede e abra <strong>http://192.168.4.1</strong>.</li>
                <li>Selecione sua rede normal, informe a senha e salve.</li>
              </ol>
              <p className={styles.wifiGuideHint}>
                Status atual do dispositivo: <strong>{isHeartbeatRecent ? "online com heartbeat recente" : "offline ou sem heartbeat recente"}</strong>.
              </p>
              <p className={styles.wifiGuideHint}>
                Observação: o navegador não pode listar redes Wi-Fi disponíveis automaticamente. A detecção de ESP nesta tela ocorre por heartbeat do dispositivo no backend.
              </p>
            </div>

            <button
              type="button"
              onClick={() => setShowWifiResetConfirm((prev) => !prev)}
              className={styles.wifiButton}
              disabled={isWifiResetSubmitting}
            >
              Reconfigurar Wi-Fi
            </button>

            {showWifiResetConfirm && (
              <div className={styles.wifiResetConfirmBox}>
                <p>
                  Confirmar reconfiguração do Wi-Fi do dispositivo <strong>{room.deviceId}</strong>? O ESP será reiniciado e entrará em modo de configuração na rede <strong>{setupSsid}</strong>.
                </p>
                <div className={styles.wifiResetConfirmActions}>
                  <button
                    type="button"
                    onClick={handleWifiReset}
                    className={styles.confirmWifiResetButton}
                    disabled={isWifiResetSubmitting}
                  >
                    {isWifiResetSubmitting ? "Enviando..." : "Enviar comando"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowWifiResetConfirm(false)}
                    className={styles.cancelWifiResetButton}
                    disabled={isWifiResetSubmitting}
                  >
                    Voltar
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

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

        <div className={styles.footerActions}>
          {user && user.role === "ADMIN" && (
            <button
              type="button"
              onClick={handleDelete}
              className={`${styles.actionButton} ${styles.deleteButton}`}
            >
              {isRoomAvailable ? 'Remover Dispositivo' : 'Remover Sala'}
            </button>
          )}

          <button
            type="submit"
            form="room-settings-form"
            className={`${styles.actionButton} ${styles.saveButton}`}
          >
            Salvar
          </button>
        </div>
      </div>
    </div>,
    document.getElementById("modal-root")
  );
}