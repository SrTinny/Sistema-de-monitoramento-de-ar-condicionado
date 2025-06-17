// src/components/addRoomForm/AddRoomForm.jsx
import React, { useState } from "react";
import styles from "./AddRoomForm.module.css";

export default function AddRoomForm({ onAddRoom }) {
  const [roomId, setRoomId] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    if (roomId.trim() !== "") {
      onAddRoom(roomId);
      setRoomId("");
    }
  };

  return (
    <section className={styles.addRoomSection}>
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
    </section>
  );
}
