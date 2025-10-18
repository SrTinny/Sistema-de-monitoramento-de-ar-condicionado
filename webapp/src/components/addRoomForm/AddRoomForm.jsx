import { useState } from "react";
import styles from "./AddRoomForm.module.css";

export default function AddRoomForm({ onAddRoom, onClose }) {
  const [name, setName] = useState("");
  const [room, setRoom] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!name.trim() || !room.trim()) {
      setError("Por favor, preencha todos os campos.");
      return;
    }

    try {
      await onAddRoom(name, room);
      onClose(); // Fechar o modal após o sucesso
    } catch (err) {
      setError("Ocorreu um erro ao adicionar a sala.");
      console.error(err);
    }
  };

  return (
    <div
      className={styles.modalOverlay}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className={styles.modalContent}>
        <div className={styles.modalHeader}>
          <h3>Adicionar Nova Sala</h3>
          {/* MELHORIA 1: Acessibilidade do botão de fechar */}
          <button
            onClick={onClose}
            className={styles.closeButton}
            aria-label="Fechar modal" /* Adiciona um rótulo para leitores de tela */
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2.5} /* Espessura da linha */
              stroke="currentColor" /* Herda a cor do CSS */
              width="24"
              height="24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className={styles.inputGroup}>
            <label htmlFor="name">Nome do Ar (Ex: AC Sala 101)</label>
            <input
              type="text"
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Digite o nome"
              required
              autoFocus /* MELHORIA 2: Foco automático para UX */
            />
          </div>
          <div className={styles.inputGroup}>
            <label htmlFor="room">Local (Ex: Sala 101 Bloco A)</label>
            <input
              type="text"
              id="room"
              value={room}
              onChange={(e) => setRoom(e.target.value)}
              placeholder="Digite o local"
              required
            />
          </div>
          {error && <p className={styles.error}>{error}</p>}
          <div className={styles.buttonGroup}>
            <button type="submit" className={styles.saveButton}>
              Adicionar
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
      </div>
    </div>
  );
}
