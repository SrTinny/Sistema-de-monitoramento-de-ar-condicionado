import React, { useEffect } from 'react';
import { useRooms } from '../../contexts/RoomContext';
import ACUnit from '../../components/ACUnit/ACUnit';
import { SkeletonRoomList } from '../../components/SkeletonLoader/SkeletonLoader';
import { EmptyStateRooms } from '../../components/EmptyState/EmptyState';
import styles from './Home.module.css';

export default function Home() {
  const { rooms, loading, fetchRooms, sendCommand, setTemperature, updateRoom, openForm } = useRooms();

  useEffect(() => {
    fetchRooms();
  }, [fetchRooms]);

  const toggleAC = async (room) => {
    const command = room.status === "ligado" ? "desligar" : "ligar";
    await sendCommand(room.deviceId, command);
    setTimeout(fetchRooms, 500);
  };

  const handleTemperatureChange = async (roomId, temp) => {
    await setTemperature(roomId, temp);
  };

  return (
    // 1. Alterado para <main> para melhor semântica HTML
    <main className={styles.container}>
      {/* 2. Adicionado um título à página para consistência e acessibilidade */}
      <h1 className={styles.title}>Painel de Controle</h1>
      
      {loading ? (
        <section className={styles.unitsSection}>
          <SkeletonRoomList count={3} />
        </section>
      ) : rooms.length > 0 ? (
        <section className={styles.unitsSection}>
          {rooms.map((sala) => (
            <ACUnit
              key={sala.id}
              room={sala}
              onToggle={toggleAC}
              onTempChange={handleTemperatureChange}
              onUpdate={updateRoom}
            />
          ))}
        </section>
      ) : (
        <EmptyStateRooms onAddClick={openForm} />
      )}
    </main>
  );
}
