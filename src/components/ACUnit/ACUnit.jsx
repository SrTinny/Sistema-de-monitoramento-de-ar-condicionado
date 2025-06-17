// components/ACUnit.jsx
import styles from "./ACUnit.module.css";

export default function ACUnit({ roomId, status, temperature, onToggle, onTempChange }) {
  return (
    <div className={`${styles["ac-unit"]} ${styles[status]}`} data-room={roomId}>
      <h2>
        <span className={styles["room-title"]}>Sala {roomId}</span>
        <span className={styles["settings-icon"]} onClick={() => alert('Abrir modal')}>⚙</span>
      </h2>
      <p>Status: <span id={`status-${roomId}`} className={`${styles.status} ${styles[status]}`}>{status === 'ligado' ? 'Ligado' : 'Desligado'}</span></p>
      <p>Temperatura Atual: <span id={`temp-${roomId}`}>{temperature}°C</span></p>
      <button id={`toggle-${roomId}`} onClick={() => onToggle(roomId)}>Ligar/Desligar</button>
      <input type="range" min="16" max="30" id={`temp-range-${roomId}`} value={temperature} onChange={(e) => onTempChange(roomId, e.target.value)} />
    </div>
  );
}
