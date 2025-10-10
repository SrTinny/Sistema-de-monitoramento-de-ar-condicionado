import { useState } from "react";
import styles from "./ACUnit.module.css";
import SettingsModal from "../settingsModal/SettingsModal";

// 1. A PROPRIEDADE MUDOU: Agora recebemos um objeto 'room' completo e as funções de evento.
export default function ACUnit({ room, onToggle, onTempChange }) {
  const [showModal, setShowModal] = useState(false);

  // 2. DESESTRUTURAMOS OS DADOS: Pegamos as informações de dentro do objeto 'room'.
  // Isso torna o componente mais legível e fácil de manter.
  const { name, room: roomLocation, status, temperature, deviceId } = room;

  const handleTempChange = (e) => {
    // Chamamos a função do pai passando o deviceId e o novo valor da temperatura.
    onTempChange(deviceId, e.target.value);
  };

  return (
    <>
      <div className={`${styles.unit} ${styles[status]}`} data-device-id={deviceId}>
        <h2 className={styles.header}>
          {/* 3. EXIBIMOS DADOS REAIS: Usamos o 'name' vindo do banco de dados. */}
          <span className={styles.title}>{name}</span>
          <span className={styles.icon} onClick={() => setShowModal(true)}>
            ⚙
          </span>
        </h2>
        
        {/* Adicionamos o local (roomLocation) para mais clareza */}
        <p className={styles.location}>{roomLocation}</p>
        
        <p>
          Status:{" "}
          <span className={`${styles.status} ${styles[status]}`}>
            {status === "ligado" ? "Ligado" : "Desligado"}
          </span>
        </p>
        <p>
          Temperatura Atual: <span>{temperature || "--"}°C</span>
        </p>
        
        {/* 4. O EVENTO FOI ATUALIZADO: onToggle agora passa o objeto 'room' inteiro. */}
        <button onClick={() => onToggle(room)}>
          {status === "ligado" ? "Desligar" : "Ligar"}
        </button>
        
        <input
          type="range"
          min="16"
          max="30"
          // O valor padrão é a temperatura vinda do backend ou 22 se for nula
          value={temperature || 22}
          // Usamos a nova função para lidar com a mudança
          onChange={handleTempChange}
        />
      </div>

      <SettingsModal
        visible={showModal}
        onClose={() => setShowModal(false)}
        onSave={() => {
          console.log("Configurações salvas para:", name);
          setShowModal(false);
        }}
      />
    </>
  );
}