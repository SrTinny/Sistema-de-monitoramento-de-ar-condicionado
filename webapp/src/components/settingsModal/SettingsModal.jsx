import React, { useState, useEffect, useContext } from "react";
import ReactDOM from "react-dom"; // 👈 1. IMPORTE O ReactDOM
import styles from "./SettingsModal.module.css";
import { RoomContext } from "../../contexts/RoomContext";

export default function SettingsModal({ visible, room, onClose, onSave }) {
  const [name, setName] = useState("");
  const [location, setLocation] = useState("");
  const { deleteRoom } = useContext(RoomContext);

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
    // Adiciona a confirmação
    if (
      window.confirm(
        `Tem certeza que deseja deletar a sala "${room.name}"? Esta ação não pode ser desfeita.`
      )
    ) {
      try {
        await deleteRoom(room.id);
        onClose(); // Fecha o modal após deletar com sucesso
      } catch (error) {
        alert("Ocorreu um erro ao deletar a sala."); // Feedback de erro simples
      }
    }
  };

  // 2. ENVOLVEMOS O JSX NO ReactDOM.createPortal()
  return ReactDOM.createPortal(
    <div
      className={styles.modal}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className={styles.modalContent}>
        <div className={styles.modalHeader}>
          <h3>Configurações da Sala</h3>
          <button onClick={onClose} className={styles.closeButton}>
            &times;
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          {/* O conteúdo do formulário permanece o mesmo */}
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
        <div className={styles.deleteSection}>
          <button onClick={handleDelete} className={styles.deleteButton}>
            Deletar Sala
          </button>
        </div>
      </div>
    </div>,
    document.getElementById("modal-root") // 👈 3. ONDE O PORTAL VAI RENDERIZAR
  );
}
