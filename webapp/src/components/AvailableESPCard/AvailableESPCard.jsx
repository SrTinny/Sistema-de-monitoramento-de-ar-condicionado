import React from 'react';
import styles from './AvailableESPCard.module.css';

const getEspDisplayName = (room) => {
  if (room?.deviceId) return room.deviceId;
  if (room?.name) return room.name;
  return 'ESP sem identificador';
};

export default function AvailableESPCard({ room, onConfigure }) {
  return (
    <article className={styles.card}>
      <div className={styles.row}>
        <h3 className={styles.title}>{getEspDisplayName(room)}</h3>

        <p className={styles.badge}>Nao configurado</p>

        <button type="button" className={styles.configureButton} onClick={onConfigure}>
          Configurar
        </button>
      </div>
    </article>
  );
}
