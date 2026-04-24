import React from 'react';
import { Cloud, AlertCircle, TrendingUp, Clock } from 'lucide-react';
import styles from './DashboardHeader.module.css';

const HEARTBEAT_ONLINE_WINDOW_MS = 35000;

/**
 * Header do Dashboard com cumprimento, resumo e hora
 */
export default function DashboardHeader({ rooms = [], schedules = [] }) {
  const isRoomOnline = (room) => {
    if (!room.lastHeartbeat) return false;
    const heartbeatTime = new Date(room.lastHeartbeat).getTime();
    if (Number.isNaN(heartbeatTime)) return false;
    return (Date.now() - heartbeatTime) < HEARTBEAT_ONLINE_WINDOW_MS;
  };

  // Obter cumprimento baseado na hora
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return '🌅 Bom dia';
    if (hour < 18) return '☀️ Boa tarde';
    return '🌙 Boa noite';
  };

  // Calcular estatísticas
  const onlineRooms = rooms.filter(isRoomOnline).length;
  const totalRooms = rooms.length;
  const acLigadosAgora = rooms.filter((room) => room.status === 'ligado').length;
  const acLigadosComHeartbeat = rooms.filter((room) => room.status === 'ligado' && isRoomOnline(room)).length;
  const acLigadosSemHeartbeat = acLigadosAgora - acLigadosComHeartbeat;
  const pendingSchedules = schedules.length;

  const healthLabel = totalRooms === 0
    ? '—'
    : acLigadosSemHeartbeat > 0
      ? `⚠ ${acLigadosSemHeartbeat} sem heartbeat`
      : '✓ Estável';
  const healthColor = totalRooms === 0
    ? 'secondary'
    : acLigadosSemHeartbeat > 0
      ? 'warning'
      : 'success';
  const healthTooltip = totalRooms === 0
    ? 'Nenhuma sala cadastrada no momento'
    : acLigadosSemHeartbeat > 0
      ? `${acLigadosSemHeartbeat} AC(s) ligados não possuem heartbeat recente`
      : 'Todos os AC ligados possuem heartbeat recente';

  // Obter hora e data formatadas
  const now = new Date();
  const timeStr = now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  const dateStr = now.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' });

  return (
    <header className={styles.header}>
      <div className={styles.greetingSection}>
        <div>
          <h1 className={styles.greeting}>{getGreeting()}</h1>
          <p className={styles.datetime}>
            <Clock size={14} className={styles.icon} />
            {timeStr} • {dateStr}
          </p>
        </div>
      </div>

      <div className={styles.statsGrid}>
        {/* Stat Card: Online */}
        <StatCard
          icon={<Cloud size={20} />}
          label="Salas Ativas"
          value={onlineRooms}
          total={totalRooms}
          color="success"
          tooltip={`${onlineRooms} de ${totalRooms} salas com heartbeat recente`}
        />

        {/* Stat Card: AC ligados agora */}
        <StatCard
          icon={<TrendingUp size={20} />}
          label="AC Ligados Agora"
          value={acLigadosAgora}
          color="info"
          tooltip={`${acLigadosAgora} AC(s) estão ligados neste momento`}
        />

        {/* Stat Card: Agendamentos */}
        <StatCard
          icon={<Clock size={20} />}
          label="Agendamentos"
          value={pendingSchedules}
          color={pendingSchedules > 0 ? 'warning' : 'secondary'}
          tooltip={`${pendingSchedules} agendamento(s) pendente(s)`}
        />

        {/* Stat Card: Saúde do sistema */}
        <StatCard
          icon={<AlertCircle size={20} />}
          label="Saúde do Sistema"
          value={healthLabel}
          color={healthColor}
          tooltip={healthTooltip}
        />
      </div>
    </header>
  );
}

/**
 * Card de Estatística Reutilizável
 */
function StatCard({ icon, label, value, unit = '', color = 'primary', tooltip, total }) {
  return (
    <div className={`${styles.statCard} ${styles[color]}`} title={tooltip}>
      <div className={styles.statIcon}>{icon}</div>
      <div className={styles.statContent}>
        <p className={styles.statLabel}>{label}</p>
        <p className={styles.statValue}>
          {value}
          {unit && <span className={styles.unit}>{unit}</span>}
          {total && <span className={styles.total}>/ {total}</span>}
        </p>
      </div>
    </div>
  );
}
