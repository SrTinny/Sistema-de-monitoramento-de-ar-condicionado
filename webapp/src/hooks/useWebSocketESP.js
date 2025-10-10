// hooks/useWebSocketESP.js
import { useEffect, useRef } from "react";

/**
 * Hook para lidar com conexão WebSocket com o ESP32.
 * @param {Function} onMessage - Função callback para lidar com mensagens recebidas.
 */
export function useWebSocketESP(onMessage) {
  const socketRef = useRef(null);

  useEffect(() => {
    const ESP_IP = "192.168.1.106"; // ✅ Substitua pelo IP real do seu ESP
    const socket = new WebSocket(`ws://${ESP_IP}:81`);
    socketRef.current = socket;

    socket.onopen = () => {
      console.log("🔗 Conectado ao WebSocket do ESP32");
    };

    socket.onmessage = (e) => {
      console.log("📨 Mensagem recebida:", e.data);
      onMessage(e.data);
    };

    socket.onerror = (err) => {
      console.error("❌ Erro no WebSocket:", err);
    };

    socket.onclose = () => {
      console.warn("⚠️ Conexão WebSocket encerrada");
    };

    return () => {
      console.log("🚪 Encerrando WebSocket...");
      socket.close();
    };
  }, [onMessage]);

  return socketRef;
}
