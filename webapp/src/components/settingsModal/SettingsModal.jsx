import React, { useState, useEffect, useContext } from "react";
import { createPortal } from "react-dom"; // Usando createPortal em vez de ReactDOM
import styles from "./SettingsModal.module.css";
import { RoomContext } from "../../contexts/RoomContext";
import { AuthContext } from "../../contexts/AuthContext";

export default function SettingsModal({ visible, room, onClose, onSave }) {
  const [name, setName] = useState("");
  const [location, setLocation] = useState("");
  const { deleteRoom } = useContext(RoomContext);
  const { user } = useContext(AuthContext);

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