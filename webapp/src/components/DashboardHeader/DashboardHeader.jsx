import React from 'react';
import { Cloud, AlertCircle, TrendingUp, Clock } from 'lucide-react';
import styles from './DashboardHeader.module.css';

/**
 * Header do Dashboard com cumprimento, resumo e hora
 */
export default function DashboardHeader({ rooms = [], schedules = [] }) {
  // Obter cumprimento baseado na hora
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return '🌅 Bom dia';
    if (hour < 18) return '☀️ Boa tarde';
    return '🌙 Boa noite';
  };

  // Calcular estatísticas
  const onlineRooms = rooms.filter(r => r.status === 'ligado').length;
  const totalRooms = rooms.length;
  const tempSamples = rooms
    .map((room) => room.temperature)
    .filter((temperature) => typeof temperature === 'number' && Number.isFinite(temperature));
  const averageTemp = tempSamples.length > 0
    ? (tempSamples.reduce((sum, temperature) => sum + temperature, 0) / tempSamples.length).toFixed(1)
    : '--';
  const pendingSchedules = schedules.length;

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
          tooltip={`${onlineRooms} de ${totalRooms} salas ligadas`}
        />

        {/* Stat Card: Temperatura Média */}
        <StatCard
          icon={<TrendingUp size={20} />}
          label="Temp. Ambiente"
          value={averageTemp}
          unit="°C"
          color="info"
          tooltip="Média das leituras de temperatura recebidas no último heartbeat"
        />

        {/* Stat Card: Agendamentos */}
        <StatCard
          icon={<Clock size={20} />}
          label="Agendamentos"
          value={pendingSchedules}
          color={pendingSchedules > 0 ? 'warning' : 'secondary'}
          tooltip={`${pendingSchedules} agendamento(s) pendente(s)`}
        />

        {/* Stat Card: Status Geral */}
        <StatCard
          icon={<AlertCircle size={20} />}
          label="Status Geral"
          value={totalRooms === onlineRooms ? '✓ Ótimo' : '⚠ Atenção'}
          color={totalRooms === onlineRooms ? 'success' : 'warning'}
          tooltip="Status geral dos equipamentos"
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
