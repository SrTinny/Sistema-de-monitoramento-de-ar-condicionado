import React, { useEffect, useState } from "react";
import { useRooms } from "../../contexts/RoomContext";
import { EmptyStateSchedules } from "../../components/EmptyState/EmptyState";
import styles from "./Agendamentos.module.css";
import toast from "react-hot-toast";
import { format, parseISO } from 'date-fns';
import { FiTrash2 } from 'react-icons/fi';

export default function Agendamentos() {
  const { rooms, fetchRooms, schedules, fetchSchedules, addSchedule, deleteSchedule } = useRooms();

  const [form, setForm] = useState({
    airConditionerId: "all", // Permite selecionar todos
    action: "LIGAR",
    scheduledAt: "",
    isRecurring: false, // Nova opção de recorrência
    recurringTime: "", // Hora para recorrência diária
  });

  const getMinDateTimeLocal = () => {
    const dt = new Date();
    dt.setMinutes(dt.getMinutes() + 1);
    const pad = (n) => String(n).padStart(2, '0');
    return `${dt.getFullYear()}-${pad(dt.getMonth() + 1)}-${pad(dt.getDate())}T${pad(dt.getHours())}:${pad(dt.getMinutes())}`;
  };
  const [minDateTime, setMinDateTime] = useState(getMinDateTimeLocal());

  useEffect(() => {
    const id = setInterval(() => setMinDateTime(getMinDateTimeLocal()), 60 * 1000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    fetchRooms();
    fetchSchedules();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!form.airConditionerId && rooms && rooms.length > 0) {
      setForm((f) => ({ ...f, airConditionerId: rooms[0].id }));
    }
  }, [rooms]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((f) => ({ 
      ...f, 
      [name]: type === 'checkbox' ? checked : value 
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (form.airConditionerId === "all" && !rooms.length) {
      toast.error("Nenhuma sala disponível.");
      return;
    }

    if (!form.isRecurring && !form.scheduledAt) {
      toast.error("Preencha a data e hora ou ative recorrência diária.");
      return;
    }

    if (form.isRecurring && !form.recurringTime) {
      toast.error("Preencha a hora para a recorrência diária.");
      return;
    }

    try {
      // Se for "todos", cria agendamento para cada sala
      if (form.airConditionerId === "all") {
        for (const room of rooms) {
          const scheduleData = {
            airConditionerId: room.id,
            action: form.action,
            isRecurring: form.isRecurring,
            recurringTime: form.recurringTime,
            scheduledAt: form.scheduledAt,
          };
          await addSchedule(scheduleData);
        }
        toast.success(`Agendamento criado para todas as ${rooms.length} salas!`);
      } else {
        const scheduleData = {
          airConditionerId: form.airConditionerId,
          action: form.action,
          isRecurring: form.isRecurring,
          recurringTime: form.recurringTime,
          scheduledAt: form.scheduledAt,
        };
        await addSchedule(scheduleData);
        toast.success('Agendamento criado com sucesso!');
      }
      
      setForm((f) => ({ 
        ...f, 
        scheduledAt: "",
        recurringTime: "",
        isRecurring: false,
      }));
    } catch (error) {
      toast.error('Erro ao criar agendamento.');
      console.error(error);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Confirma o cancelamento deste agendamento?')) {
      await deleteSchedule(id);
    }
  };

  return (
    <main className={styles.container}>
      <h1 className={styles.title}>Agendamentos</h1>

      <section className={styles.grid}>
        {/* Card do Formulário */}
        <div className={styles.card}>
          <h2 className={styles.subTitle}>Novo Agendamento</h2>
          <form className={styles.form} onSubmit={handleSubmit}>
            <div className={styles.inputGroup}>
              <label htmlFor="ac-select">Sala</label>
              <select id="ac-select" name="airConditionerId" value={form.airConditionerId} onChange={handleChange}>
                <option value="all">🔗 Todos os ACs</option>
                {rooms.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name} — {r.room}
                  </option>
                ))}
              </select>
            </div>

            <div className={styles.inputGroup}>
              <label htmlFor="action-select">Ação</label>
              <select id="action-select" name="action" value={form.action} onChange={handleChange}>
                <option value="LIGAR">🟢 Ligar</option>
                <option value="DESLIGAR">🔴 Desligar</option>
              </select>
            </div>

            {/* Opção de recorrência */}
            <div className={styles.recurringBox}>
              <label className={styles.checkboxLabel}>
                <input
                  type="checkbox"
                  name="isRecurring"
                  checked={form.isRecurring}
                  onChange={handleChange}
                />
                <span>Recorrer todos os dias 🔄</span>
              </label>
              {form.isRecurring && (
                <div className={styles.inputGroup}>
                  <label htmlFor="recurring-time">Hora do dia</label>
                  <input
                    id="recurring-time"
                    type="time"
                    name="recurringTime"
                    value={form.recurringTime}
                    onChange={handleChange}
                  />
                  <small className={styles.helperText}>
                    Vai repetir todos os dias nesta hora
                  </small>
                </div>
              )}
            </div>

            {!form.isRecurring && (
              <div className={styles.inputGroup}>
                <label htmlFor="datetime-input">Data e hora (una única vez)</label>
                <input
                  id="datetime-input"
                  name="scheduledAt"
                  type="datetime-local"
                  value={form.scheduledAt}
                  min={minDateTime}
                  onChange={handleChange}
                />
              </div>
            )}

            <button type="submit" className={styles.submitButton}>
              ✓ Criar Agendamento
            </button>
          </form>
        </div>

        {/* Card da Lista */}
        <div className={styles.card}>
          <h2 className={styles.subTitle}>Agendamentos Pendentes</h2>
          {schedules && schedules.length > 0 ? (
            <ul className={styles.list}>
              {schedules.map((s) => (
                <li key={s.id} className={styles.item}>
                  <div className={styles.itemInfo}>
                    <span className={styles.itemTitle}>{s.airConditioner?.name || 'Sala desconhecida'}</span>
                    <span className={styles.itemMeta}>
                      {s.isRecurring ? (
                        <span>🔄 Todos os dias às {s.recurringTime || 'hora não definida'}</span>
                      ) : (
                        s.scheduledAt ? format(parseISO(s.scheduledAt), 'dd/MM/yyyy HH:mm') : 'Data inválida'
                      )}
                    </span>
                  </div>
                  <div className={styles.itemActions}>
                    <span className={`${styles.itemAction} ${styles[s.action.toLowerCase()]}`}>
                      {s.action === 'LIGAR' ? '🟢 Ligar' : '🔴 Desligar'}
                    </span>
                    <button className={styles.deleteButton} onClick={() => handleDelete(s.id)} aria-label="Cancelar agendamento">
                      <FiTrash2 />
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyStateSchedules />
          )}
        </div>
      </section>

    </main>
  );
}