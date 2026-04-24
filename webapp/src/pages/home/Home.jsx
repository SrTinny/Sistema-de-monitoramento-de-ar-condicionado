import React, { useEffect, useMemo, useState } from 'react';
import { useRooms } from '../../contexts/RoomContext';
import ACUnit from '../../components/ACUnit/ACUnit';
import AvailableESPCard from '../../components/AvailableESPCard/AvailableESPCard';
import SettingsModal from '../../components/settingsModal/SettingsModal';
import DashboardHeader from '../../components/DashboardHeader/DashboardHeader';
import ScheduleTimeline from '../../components/ScheduleTimeline/ScheduleTimeline';
import { SkeletonRoomList } from '../../components/SkeletonLoader/SkeletonLoader';
import { EmptyStateRooms } from '../../components/EmptyState/EmptyState';
import UsageCharts from '../../components/UsageCharts/UsageCharts';
import { StaggerContainer, StaggerItem } from '../../components/AnimatedCard/AnimatedCard';
import styles from './Home.module.css';

const UNCONFIGURED_ROOM_LABELS = new Set([
  'não configurada',
  'nao configurada',
  'not configured',
  'unconfigured',
]);

const isPendingConfiguration = (roomData) => {
  const normalized = String(roomData?.room ?? '').trim().toLowerCase();
  return normalized.length === 0 || UNCONFIGURED_ROOM_LABELS.has(normalized);
};

// Sala está pronta para controle se tiver nome de sala definido (não unconfigured)
const isControlReady = (roomData) => !isPendingConfiguration(roomData);

// Salas marcadas __removed__ aguardam wifi_reset e não aparecem em nenhuma lista
const isRemovedRoom = (roomData) => String(roomData?.room ?? '').trim() === '__removed__';

export default function Home() {
  const { rooms, loading, fetchRooms, sendCommand, setTemperature, updateRoom, openForm, schedules, fetchSchedules, deleteSchedule } = useRooms();
  const [availableConfigRoom, setAvailableConfigRoom] = useState(null);

  const controlRooms = useMemo(
    () => rooms.filter((room) => !isRemovedRoom(room) && isControlReady(room)),
    [rooms]
  );
  const dashboardRooms = useMemo(
    () => rooms.filter((room) => !isRemovedRoom(room)),
    [rooms]
  );
  const availableRooms = useMemo(
    () => rooms.filter((room) => !isRemovedRoom(room) && isPendingConfiguration(room)),
    [rooms]
  );

  useEffect(() => {
    fetchRooms();
    fetchSchedules();
  }, [fetchRooms, fetchSchedules]);

  useEffect(() => {
    const refreshInterval = setInterval(() => {
      fetchRooms({ silent: true });
    }, 10000);

    return () => clearInterval(refreshInterval);
  }, [fetchRooms]);

  const toggleAC = async (room) => {
    const command = room.status === "ligado" ? "desligar" : "ligar";
    await sendCommand(room.deviceId, command);
    setTimeout(fetchRooms, 500);
  };

  const handleTemperatureChange = async (roomId, temp) => {
    await setTemperature(roomId, temp);
  };

  const handleIrCommand = async (roomId, command) => {
    await sendCommand(roomId, command);
    setTimeout(fetchRooms, 500);
  };

  return (
    <main className={styles.container}>
      {/* Dashboard Header com estatísticas */}
      <DashboardHeader rooms={dashboardRooms} schedules={schedules} />

      {/* Gráficos históricos */}
      <section className={styles.chartsSection}>
        <UsageCharts rooms={rooms} />
      </section>

      {/* Seção de Salas */}
      {loading ? (
        <section className={styles.unitsSection}>
          <SkeletonRoomList count={3} />
        </section>
      ) : controlRooms.length === 0 && availableRooms.length === 0 ? (
        <EmptyStateRooms onAddClick={openForm} />
      ) : (
        <>
          <section className={styles.unitsSection}>
            <h2 className={styles.sectionTitle}>Salas de Controle</h2>
            <p className={styles.sectionDescription}>
              Equipamentos prontos para uso (sala definida ou heartbeat recente).
            </p>

            {controlRooms.length > 0 ? (
              <StaggerContainer className={styles.unitsGrid}>
                {controlRooms.map((sala) => (
                  <StaggerItem key={sala.id}>
                    <ACUnit
                      room={sala}
                      onToggle={toggleAC}
                      onTempChange={handleTemperatureChange}
                      onIrCommand={handleIrCommand}
                      onUpdate={updateRoom}
                    />
                  </StaggerItem>
                ))}
              </StaggerContainer>
            ) : (
              <p className={styles.sectionEmptyState}>
                Nenhuma sala de controle configurada ainda.
              </p>
            )}
          </section>

          {availableRooms.length > 0 && (
            <section className={styles.unitsSection}>
              <h2 className={styles.sectionTitle}>Salas Disponíveis</h2>
              <p className={styles.sectionDescription}>
                Dispositivos pendentes sem heartbeat recente ou em reconfiguração de Wi-Fi.
              </p>

              <StaggerContainer className={styles.unitsGrid}>
                {availableRooms.map((sala) => (
                  <StaggerItem key={sala.id}>
                    <AvailableESPCard
                      room={sala}
                      onConfigure={() => setAvailableConfigRoom(sala)}
                    />
                  </StaggerItem>
                ))}
              </StaggerContainer>
            </section>
          )}
        </>
      )}

      {availableConfigRoom && (
        <SettingsModal
          visible={Boolean(availableConfigRoom)}
          room={availableConfigRoom}
          onClose={() => setAvailableConfigRoom(null)}
          onSave={async (roomId, data) => {
            await updateRoom(roomId, data);
            setAvailableConfigRoom(null);
          }}
        />
      )}

      {/* Timeline de Agendamentos */}
      {schedules && schedules.length > 0 && (
        <ScheduleTimeline 
          schedules={schedules} 
          onDelete={deleteSchedule}
        />
      )}
    </main>
  );
}
