import { useState } from 'react';
import styles from './AddRoomForm.module.css';

// O componente agora recebe as funções de adicionar e fechar como props
export default function AddRoomForm({ onAddRoom, onClose }) {
  const [name, setName] = useState('');
  const [room, setRoom] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(''); // Limpa erros antigos

    if (!name.trim() || !room.trim()) {
      setError('Por favor, preencha todos os campos.');
      return;
    }

    try {
      // Chama a função 'addRoom' que veio do contexto!
      await onAddRoom(name, room);
      // O onClose já é chamado dentro do addRoom no contexto, mas podemos garantir aqui também
      onClose();
    } catch (err) {
      setError('Ocorreu um erro ao adicionar a sala.');
      console.error(err);
    }
  };

  return (
    // A classe 'overlay' permite fechar o modal clicando fora (lógica do App.jsx antigo)
    <div className={styles.overlay} onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className={styles.modal}>
        <h2>Adicionar Nova Sala</h2>
        <form onSubmit={handleSubmit}>
          <div className={styles.inputGroup}>
            <label htmlFor="name">Nome do Ar (Ex: AC Sala 101)</label>
            <input
              type="text"
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Digite o nome"
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
            />
          </div>
          {error && <p className={styles.error}>{error}</p>}
          <div className={styles.buttonGroup}>
            <button type="button" onClick={onClose} className={styles.cancelButton}>
              Cancelar
            </button>
            <button type="submit" className={styles.addButton}>
              Adicionar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}