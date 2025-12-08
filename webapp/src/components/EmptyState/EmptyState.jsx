import React from 'react';
import styles from './EmptyState.module.css';

/**
 * Empty State - Componente para exibir quando não há dados
 * Tipos: rooms, schedules, devices, generic
 */
export const EmptyStateRooms = ({ onAddClick }) => (
  <div className={styles.emptyStateContainer}>
    <div className={styles.illustration}>
      <div className={styles.illustrationContent}>
        <span className={styles.icon}>🏠</span>
      </div>
    </div>
    <h2 className={styles.title}>Nenhuma sala configurada</h2>
    <p className={styles.description}>
      Comece adicionando uma sala para controlar seus equipamentos de ar condicionado.
    </p>
    {onAddClick && (
      <button className={styles.actionButton} onClick={onAddClick}>
        Adicionar Primeira Sala
      </button>
    )}
  </div>
);

export const EmptyStateSchedules = ({ onAddClick }) => (
  <div className={styles.emptyStateContainer}>
    <div className={styles.illustration}>
      <div className={styles.illustrationContent}>
        <span className={styles.icon}>📅</span>
      </div>
    </div>
    <h2 className={styles.title}>Nenhum agendamento</h2>
    <p className={styles.description}>
      Crie agendamentos para automatizar o controle de temperatura.
    </p>
    {onAddClick && (
      <button className={styles.actionButton} onClick={onAddClick}>
        Criar Agendamento
      </button>
    )}
  </div>
);

export const EmptyStateDevices = ({ onAddClick }) => (
  <div className={styles.emptyStateContainer}>
    <div className={styles.illustration}>
      <div className={styles.illustrationContent}>
        <span className={styles.icon}>🔌</span>
      </div>
    </div>
    <h2 className={styles.title}>Nenhum dispositivo conectado</h2>
    <p className={styles.description}>
      Seus dispositivos IoT aparecerão aqui quando conectados à rede.
    </p>
  </div>
);

export const EmptyStateGeneric = ({ 
  title = 'Nenhum dado disponível',
  description = 'Não há nada para exibir neste momento.',
  icon = '📭',
  onActionClick,
  actionLabel = 'Tentar Novamente'
}) => (
  <div className={styles.emptyStateContainer}>
    <div className={styles.illustration}>
      <div className={styles.illustrationContent}>
        <span className={styles.icon}>{icon}</span>
      </div>
    </div>
    <h2 className={styles.title}>{title}</h2>
    <p className={styles.description}>{description}</p>
    {onActionClick && (
      <button className={styles.actionButton} onClick={onActionClick}>
        {actionLabel}
      </button>
    )}
  </div>
);

export default {
  Rooms: EmptyStateRooms,
  Schedules: EmptyStateSchedules,
  Devices: EmptyStateDevices,
  Generic: EmptyStateGeneric,
};
