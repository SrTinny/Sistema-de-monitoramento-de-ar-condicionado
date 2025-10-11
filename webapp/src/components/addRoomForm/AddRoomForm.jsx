import { useState } from "react";
import styles from "./AddRoomForm.module.css";

// O componente agora recebe as funções de adicionar e fechar como props
export default function AddRoomForm({ onAddRoom, onClose }) {
  const [name, setName] = useState("");
  const [room, setRoom] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(""); // Limpa erros antigos

    if (!name.trim() || !room.trim()) {
      setError("Por favor, preencha todos os campos.");
      return;
    }

    try {
      // Chama a função 'addRoom' que veio do contexto!
      await onAddRoom(name, room);
      // O onClose já é chamado dentro do addRoom no contexto, mas podemos garantir aqui também
      onClose();
    } catch (err) {
      setError("Ocorreu um erro ao adicionar a sala.");
      console.error(err);
    }
  };

  return (
    // Renomeamos para .modalOverlay para clareza
    <div
      className={styles.modalOverlay}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      {/* Renomeamos para .modalContent */}
      <div className={styles.modalContent}>
        {/* 👇 ESTRUTURA DE CABEÇALHO ADICIONADA, IGUAL AO SETTINGSMODAL 👇 */}
        <div className={styles.modalHeader}>
          <h2>Adicionar Nova Sala</h2>
          <button onClick={onClose} className={styles.closeButton}>
            &times;
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
