import React, { useEffect, useState } from "react";
import { useRooms } from "../../contexts/RoomContext";
import BottomNavBar from "../../components/bottomNavBar/BottomNavBar";
import styles from "./Agendamentos.module.css";
import toast from "react-hot-toast";
import format from 'date-fns/format';
import parseISO from 'date-fns/parseISO';

export default function Agendamentos() {
  const {
    rooms,
    fetchRooms,
    schedules,
    fetchSchedules,
    addSchedule,
    deleteSchedule,
  } = useRooms();

  const [form, setForm] = useState({
    airConditionerId: "",
    action: "LIGAR",
    scheduledAt: "",
  });

  // Gera string no formato YYYY-MM-DDTHH:mm (local) para usar no atributo `min` do input datetime-local
  const getMinDateTimeLocal = () => {
    const dt = new Date();
    const pad = (n) => String(n).padStart(2, '0');
    const year = dt.getFullYear();
    const month = pad(dt.getMonth() + 1);
    const day = pad(dt.getDate());
    const hours = pad(dt.getHours());
    const minutes = pad(dt.getMinutes());
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };
  const [minDateTime, setMinDateTime] = useState(getMinDateTimeLocal());

  // Recalcula minDateTime a cada minuto para evitar que o usuário selecione datas passadas
  useEffect(() => {
    const id = setInterval(() => {
      setMinDateTime(getMinDateTimeLocal());
    }, 60 * 1000);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.airConditionerId || !form.scheduledAt || !form.action) {
      toast.error("Preencha todos os campos do formulário.");
      return;
    }

    try {
      await addSchedule({
        airConditionerId: form.airConditionerId,
        action: form.action,
        scheduledAt: form.scheduledAt,
      });
      setForm((f) => ({ ...f, scheduledAt: "" }));
    } catch (err) {
      console.error("Erro ao criar agendamento:", err);
    }
  };

  const handleDelete = async (id) => {
    const confirmed = window.confirm('Confirma o cancelamento deste agendamento?');
    if (!confirmed) return;

    try {
      await deleteSchedule(id);
    } catch (err) {
      console.error("Erro ao deletar agendamento:", err);
    }
  };

  return (
    <main className={styles.container}>
      <h1 className={styles.title}>Agendamentos</h1>

      <section className={styles.grid}>
        <form className={styles.form} onSubmit={handleSubmit}>
          <label className={styles.label}>
            Sala
            <select
              name="airConditionerId"
              value={form.airConditionerId}
              onChange={handleChange}
              className={styles.select}
            >
              {rooms.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name} — {r.room}
                </option>
              ))}
            </select>
          </label>

          <label className={styles.label}>
            Ação
            <select
              name="action"
              value={form.action}
              onChange={handleChange}
              className={styles.select}
            >
              <option value="LIGAR">Ligar</option>
              <option value="DESLIGAR">Desligar</option>
            </select>
          </label>

          <label className={styles.label}>
            Data e hora
            <input
              name="scheduledAt"
              type="datetime-local"
              value={form.scheduledAt}
              min={minDateTime}
              onChange={handleChange}
              className={styles.input}
            />
          </label>

          <button type="submit" className={styles.submit}>
            Criar Agendamento
          </button>
        </form>

        <div className={styles.listContainer}>
          <h2 className={styles.subTitle}>Agendamentos Pendentes</h2>
          {schedules && schedules.length > 0 ? (
            <ul className={styles.list}>
              {schedules.map((s) => (
                <li key={s.id} className={styles.item}>
                  <div>
                    <div className={styles.itemTitle}>{s.airConditioner?.name || '—'}</div>
                    <div className={styles.itemMeta}>{s.airConditioner?.room || '—'}</div>
                    <div className={styles.itemDate}>
                      {s.scheduledAt ? format(parseISO(s.scheduledAt), 'dd/MM/yyyy HH:mm') : '—'}
                    </div>
                    <div className={styles.itemAction}>{s.action}</div>
                  </div>
                  <div>
                    <button
                      className={styles.deleteButton}
                      onClick={() => handleDelete(s.id)}
                    >
                      Cancelar
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className={styles.empty}>Nenhum agendamento pendente.</p>
          )}
        </div>
      </section>

      <BottomNavBar />
    </main>
  );
}
