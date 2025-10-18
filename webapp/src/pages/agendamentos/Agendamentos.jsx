import React, { useEffect, useState } from "react";
import { useRooms } from "../../contexts/RoomContext";
import BottomNavBar from "../../components/bottomNavBar/BottomNavBar";
import styles from "./Agendamentos.module.css";
import toast from "react-hot-toast";
import { format, parseISO } from 'date-fns';
import { FiTrash2 } from 'react-icons/fi'; // 1. Ícone para o botão de deletar

export default function Agendamentos() {
  const { rooms, fetchRooms, schedules, fetchSchedules, addSchedule, deleteSchedule } = useRooms();

  const [form, setForm] = useState({
    airConditionerId: "",
    action: "LIGAR",
    scheduledAt: "",
  });

  // A lógica para o minDateTime já está ótima, sem alterações
  const getMinDateTimeLocal = () => {
    const dt = new Date();
    dt.setMinutes(dt.getMinutes() + 1); // Garante que o mínimo seja sempre no futuro
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
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.airConditionerId || !form.scheduledAt) {
      toast.error("Preencha todos os campos do formulário.");
      return;
    }
    await addSchedule(form);
    setForm((f) => ({ ...f, scheduledAt: "" }));
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
            {/* 2. ESTRUTURA REFEITA USANDO O PADRÃO 'inputGroup' */}
            <div className={styles.inputGroup}>
              <label htmlFor="ac-select">Sala</label>
              <select id="ac-select" name="airConditionerId" value={form.airConditionerId} onChange={handleChange}>
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
                <option value="LIGAR">Ligar</option>
                <option value="DESLIGAR">Desligar</option>
              </select>
            </div>

            <div className={styles.inputGroup}>
              <label htmlFor="datetime-input">Data e hora</label>
              <input
                id="datetime-input"
                name="scheduledAt"
                type="datetime-local"
                value={form.scheduledAt}
                min={minDateTime}
                onChange={handleChange}
              />
            </div>

            <button type="submit" className={styles.submitButton}>
              Criar Agendamento
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
                      {s.scheduledAt ? format(parseISO(s.scheduledAt), 'dd/MM/yyyy HH:mm') : 'Data inválida'}
                    </span>
                  </div>
                  <div className={styles.itemActions}>
                    <span className={`${styles.itemAction} ${styles[s.action.toLowerCase()]}`}>
                      {s.action === 'LIGAR' ? 'Ligar' : 'Desligar'}
                    </span>
                    {/* 3. BOTÃO DE DELETAR AGORA É UM ÍCONE */}
                    <button className={styles.deleteButton} onClick={() => handleDelete(s.id)} aria-label="Cancelar agendamento">
                      <FiTrash2 />
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