import React from "react";
import styles from "./SettingsModal.module.css";

export default function SettingsModal({ visible, onClose, onSave }) {
  if (!visible) return null;

  return (
    <div className={styles.modal}>
      <div className={styles.modalContent}>
        <h3>Configurações da Sala</h3>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            onSave();
          }}
        >
          <input type="text" placeholder="Novo nome da sala" required />
          <input type="number" placeholder="Nova temperatura" min="16" max="30" required />
          <div className={styles.buttonGroup}>
            <button type="submit">Salvar</button>
            <button type="button" onClick={onClose}>Cancelar</button>
          </div>
        </form>
      </div>
    </div>
  );
}
