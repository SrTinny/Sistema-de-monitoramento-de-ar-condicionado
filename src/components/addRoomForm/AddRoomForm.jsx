// src/components/addRoomForm/AddRoomForm.jsx
import React, { useState } from "react";
import styles from "./AddRoomForm.module.css";

export default function AddRoomForm({ onAddRoom, onClose }) {
  const [roomId, setRoomId] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    if (roomId.trim() !== "") {
      onAddRoom(roomId);
      setRoomId("");
    }
  };

  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        <button className={styles.closeButton} onClick={onClose}>×</button>
        <h2>Adicionar Nova Sala</h2>
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            placeholder="Digite o ID da sala (ex: 102)"
            value={roomId}
            onChange={(e) => setRoomId(e.target.value)}
          />
          <button type="submit">Adicionar Sala</button>
        </form>
      </div>
    </div>
  );
}
