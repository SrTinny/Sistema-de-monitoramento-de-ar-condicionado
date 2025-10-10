import React, { useState, useEffect } from "react";
import styles from "./SettingsModal.module.css";

export default function SettingsModal({ visible, room, onClose, onSave }) {
  const [name, setName] = useState("");
  const [location, setLocation] = useState("");

  useEffect(() => {
    if (room && visible) {
      setName(room.name);
      setLocation(room.room);
    }
  }, [room, visible]);

  if (!visible) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(room.id, { name, room: location });
  };

  return (
    <div className={styles.modal} onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className={styles.modalContent}>
        {/* BOTÃO DE FECHAR ADICIONADO */}
        <button onClick={onClose} className={styles.closeButton}>&times;</button>
        
        <h3>Configurações da Sala</h3>
        <form onSubmit={handleSubmit}>
          {/* GRUPOS DE INPUT PARA MELHOR ESTRUTURA */}
          <div className={styles.inputGroup}>
            <label htmlFor="room-name">Nome do Ar</label>
            <input
              id="room-name"
              type="text"
              placeholder="Ex: AC da Biblioteca"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
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
            {/* CLASSES ESPECÍFICAS PARA OS BOTÕES */}
            <button type="submit" className={styles.saveButton}>Salvar</button>
            <button type="button" onClick={onClose} className={styles.cancelButton}>
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}