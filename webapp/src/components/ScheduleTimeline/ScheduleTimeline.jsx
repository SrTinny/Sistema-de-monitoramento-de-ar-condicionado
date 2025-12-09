import React, { useState } from 'react';
import { Clock, ChevronDown, Trash2 } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import styles from './ScheduleTimeline.module.css';

/**
 * Timeline de Agendamentos com filtros
 */
export default function ScheduleTimeline({ schedules = [], onDelete }) {
  const [filter, setFilter] = useState('all'); // 'today', 'week', 'all'
  const [expandedId, setExpandedId] = useState(null);

  // Filtrar agendamentos baseado no filtro selecionado
  const filteredSchedules = schedules.filter(schedule => {
    // Se for agendamento recorrente, sempre incluir (não tem data específica)
    if (schedule.isRecurring) {
      return true;
    }

    // Para agendamentos únicos, aplicar filtro de data
    if (!schedule.scheduledAt) {
      return false;
    }

    const scheduledDate = parseISO(schedule.scheduledAt);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const weekEnd = new Date(today);
    weekEnd.setDate(weekEnd.getDate() + 7);

    scheduledDate.setHours(0, 0, 0, 0);

    switch (filter) {
      case 'today':
        return scheduledDate.getTime() === today.getTime();
      case 'week':
        return scheduledDate >= today && scheduledDate <= weekEnd;
      default:
        return true;
    }
  }).sort((a, b) => {
    // Agendamentos recorrentes primeiro
    if (a.isRecurring && !b.isRecurring) return -1;
    if (!a.isRecurring && b.isRecurring) return 1;
    
    // Depois ordenar por data
    if (a.scheduledAt && b.scheduledAt) {
      return new Date(a.scheduledAt) - new Date(b.scheduledAt);
    }
    return 0;
  });

  return (
    <section className={styles.container}>
      <div className={styles.header}>
        <h2 className={styles.title}>
          <Clock size={20} />
          Agendamentos
        </h2>
        <div className={styles.filters}>
          <FilterButton
            active={filter === 'today'}
            onClick={() => setFilter('today')}
          >
            Hoje
          </FilterButton>
          <FilterButton
            active={filter === 'week'}
            onClick={() => setFilter('week')}
          >
            Semana
          </FilterButton>
          <FilterButton
            active={filter === 'all'}
            onClick={() => setFilter('all')}
          >
            Todos
          </FilterButton>
        </div>
      </div>

      {filteredSchedules.length > 0 ? (
        <div className={styles.timeline}>
          {filteredSchedules.map((schedule, index) => (
            <TimelineItem
              key={schedule.id}
              schedule={schedule}
              isFirst={index === 0}
              isLast={index === filteredSchedules.length - 1}
              isExpanded={expandedId === schedule.id}
              onToggleExpand={() =>
                setExpandedId(expandedId === schedule.id ? null : schedule.id)
              }
              onDelete={() => onDelete(schedule.id)}
            />
          ))}
        </div>
      ) : (
        <div className={styles.empty}>
          <Clock size={32} />
          <p>Nenhum agendamento neste período</p>
        </div>
      )}
    </section>
  );
}

/**
 * Item individual da timeline
 */
function TimelineItem({
  schedule,
  isFirst,
  isLast,
  isExpanded,
  onToggleExpand,
  onDelete,
}) {
  // Para agendamentos recorrentes
  if (schedule.isRecurring) {
    return (
      <div className={styles.timelineItem}>
        {/* Linha da timeline */}
        <div className={styles.timeline_line}>
          <div className={`${styles.dot} ${styles.recurring}`}></div>
        </div>

        {/* Card do agendamento recorrente */}
        <div className={styles.card}>
          <button
            className={styles.cardHeader}
            onClick={onToggleExpand}
          >
            <div className={styles.cardInfo}>
              <div className={styles.timeBlock}>
                <span className={styles.time}>🔄 {schedule.recurringTime}</span>
                <span className={styles.date}>Todos os dias</span>
              </div>
              <div className={styles.details}>
                <p className={styles.roomName}>
                  {schedule.airConditioner?.name || 'Sala desconhecida'}
                </p>
                <p className={styles.day}>Recorrente</p>
              </div>
            </div>

            <div className={styles.cardAction}>
              <span className={`${styles.badge} ${styles[schedule.action.toLowerCase()]}`}>
                {schedule.action === 'LIGAR' ? '⚡ Ligar' : '❄️ Desligar'}
              </span>
              <ChevronDown
                size={18}
                className={`${styles.chevron} ${isExpanded ? styles.expanded : ''}`}
              />
            </div>
          </button>

          {isExpanded && (
            <div className={styles.cardDetails}>
              <div className={styles.detailsContent}>
                <span>Agendamento recorrente diário</span>
                <button
                  className={styles.deleteBtn}
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete();
                  }}
                >
                  <Trash2 size={16} /> Cancelar
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Para agendamentos únicos
  const scheduledDate = parseISO(schedule.scheduledAt);
  const now = new Date();
  const isPast = scheduledDate < now;
  const isToday = scheduledDate.toDateString() === now.toDateString();

  const timeStr = format(scheduledDate, 'HH:mm', { locale: ptBR });
  const dateStr = format(scheduledDate, 'dd MMM', { locale: ptBR });
  const dayStr = format(scheduledDate, 'EEEE', { locale: ptBR });

  return (
    <div className={`${styles.timelineItem} ${isPast ? styles.past : ''}`}>
      {/* Linha da timeline */}
      <div className={styles.timeline_line}>
        <div className={`${styles.dot} ${isToday ? styles.active : ''}`}></div>
        {!isLast && <div className={styles.line}></div>}
      </div>

      {/* Card do agendamento */}
      <div className={styles.card}>
        <button
          className={styles.cardHeader}
          onClick={onToggleExpand}
        >
          <div className={styles.cardInfo}>
            <div className={styles.timeBlock}>
              <span className={styles.time}>{timeStr}</span>
              <span className={styles.date}>{dateStr}</span>
            </div>
            <div className={styles.details}>
              <p className={styles.roomName}>
                {schedule.airConditioner?.name || 'Sala desconhecida'}
              </p>
              <p className={styles.day}>{dayStr}</p>
            </div>
          </div>

          <div className={styles.cardAction}>
            <span className={`${styles.badge} ${styles[schedule.action.toLowerCase()]}`}>
              {schedule.action === 'LIGAR' ? '⚡ Ligar' : '❄️ Desligar'}
            </span>
            <ChevronDown
              size={18}
              className={`${styles.chevron} ${isExpanded ? styles.expanded : ''}`}
            />
          </div>
        </button>

        {/* Detalhes expandidos */}
        {isExpanded && (
          <div className={styles.cardDetails}>
            <div className={styles.detailRow}>
              <span className={styles.label}>Ação:</span>
              <span className={styles.value}>
                {schedule.action === 'LIGAR' ? 'Ligar equipamento' : 'Desligar equipamento'}
              </span>
            </div>
            <div className={styles.detailRow}>
              <span className={styles.label}>Horário:</span>
              <span className={styles.value}>
                {format(scheduledDate, 'dd/MM/yyyy HH:mm', { locale: ptBR })}
              </span>
            </div>
            <div className={styles.detailRow}>
              <span className={styles.label}>Sala:</span>
              <span className={styles.value}>
                {schedule.airConditioner?.room || 'Não especificada'}
              </span>
            </div>
            {isPast && (
              <p className={styles.status}>✓ Agendamento executado</p>
            )}
            <button
              className={styles.deleteBtn}
              onClick={onDelete}
              aria-label="Deletar agendamento"
            >
              <Trash2 size={16} />
              Cancelar
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Botão de filtro
 */
function FilterButton({ active, onClick, children }) {
  return (
    <button
      className={`${styles.filterBtn} ${active ? styles.active : ''}`}
      onClick={onClick}
    >
      {children}
    </button>
  );
}
