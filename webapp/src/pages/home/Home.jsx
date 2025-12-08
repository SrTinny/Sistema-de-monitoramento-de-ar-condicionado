import React, { useEffect } from 'react';
import { Plus } from 'lucide-react';
import { useRooms } from '../../contexts/RoomContext';
import ACUnit from '../../components/ACUnit/ACUnit';
import DashboardHeader from '../../components/DashboardHeader/DashboardHeader';
import ScheduleTimeline from '../../components/ScheduleTimeline/ScheduleTimeline';
import { SkeletonRoomList } from '../../components/SkeletonLoader/SkeletonLoader';
import { EmptyStateRooms } from '../../components/EmptyState/EmptyState';
import { StaggerContainer, StaggerItem, FloatingActionButton } from '../../components/AnimatedCard/AnimatedCard';
import styles from './Home.module.css';

export default function Home() {
  const { rooms, loading, fetchRooms, sendCommand, setTemperature, updateRoom, openForm, schedules, fetchSchedules, deleteSchedule } = useRooms();

  useEffect(() => {
    fetchRooms();
    fetchSchedules();
  }, [fetchRooms, fetchSchedules]);

  const toggleAC = async (room) => {
    const command = room.status === "ligado" ? "desligar" : "ligar";
    await sendCommand(room.deviceId, command);
    setTimeout(fetchRooms, 500);
  };

  const handleTemperatureChange = async (roomId, temp) => {
    await setTemperature(roomId, temp);
  };

  return (
    <main className={styles.container}>
      {/* Dashboard Header com estatísticas */}
      <DashboardHeader rooms={rooms} schedules={schedules} />

      {/* Seção de Salas */}
      {loading ? (
        <section className={styles.unitsSection}>
          <SkeletonRoomList count={3} />
        </section>
      ) : rooms.length > 0 ? (
        <section className={styles.unitsSection}>
          <h2 className={styles.sectionTitle}>Salas de Controle</h2>
          <StaggerContainer className={styles.unitsGrid}>
            {rooms.map((sala) => (
              <StaggerItem key={sala.id}>
                <ACUnit
                  room={sala}
                  onToggle={toggleAC}
                  onTempChange={handleTemperatureChange}
                  onUpdate={updateRoom}
                />
              </StaggerItem>
            ))}
          </StaggerContainer>
        </section>
      ) : (
        <EmptyStateRooms onAddClick={openForm} />
      )}

      {/* Timeline de Agendamentos */}
      {schedules && schedules.length > 0 && (
        <ScheduleTimeline 
          schedules={schedules} 
          onDelete={deleteSchedule}
        />
      )}

      {/* FAB para mobile */}
      <FloatingActionButton onClick={openForm}>
        <Plus size={24} />
      </FloatingActionButton>
    </main>
  );
}
