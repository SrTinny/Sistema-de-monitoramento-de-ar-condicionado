// src/components/Agenda/Agenda.jsx
import { useState } from "react";
import styles from "./Agenda.module.css";

const diasSemana = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

export default function Agenda({ salas, onAgendar }) {
  const [roomId, setRoomId] = useState(salas[0]?.id || "");
  const [acao, setAcao] = useState("ligar");
  const [hora, setHora] = useState("08:00");
  const [repeticao, setRepeticao] = useState("sempre");
  const [diasSelecionados, setDiasSelecionados] = useState([]);

  const toggleDia = (dia) => {
    setDiasSelecionados((prev) =>
      prev.includes(dia)
        ? prev.filter((d) => d !== dia)
        : [...prev, dia]
    );
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const agendamento = {
      roomId,
      acao,
      hora,
      repeticao,
      dias: repeticao === "semanal" ? diasSelecionados : [],
    };
    onAgendar(agendamento);
    alert("Agendamento salvo com sucesso!");
  };

  return (
    <div className={styles.agendaContainer}>
      <h2>Agendar Ação</h2>
      <form onSubmit={handleSubmit}>
        <label>
          Sala:
          <select value={roomId} onChange={(e) => setRoomId(e.target.value)}>
            {salas.map((s) => (
              <option key={s.id} value={s.id}>
                Sala {s.id}
              </option>
            ))}
          </select>
        </label>

        <label>
          Ação:
          <select value={acao} onChange={(e) => setAcao(e.target.value)}>
            <option value="ligar">Ligar</option>
            <option value="desligar">Desligar</option>
          </select>
        </label>

        <label>
          Horário:
          <input
            type="time"
            value={hora}
            onChange={(e) => setHora(e.target.value)}
          />
        </label>

        <label>
          Repetição:
          <select
            value={repeticao}
            onChange={(e) => setRepeticao(e.target.value)}
          >
            <option value="sempre">Todos os dias</option>
            <option value="semanal">Dias específicos</option>
            <option value="unico">Apenas uma vez</option>
          </select>
        </label>

        {repeticao === "semanal" && (
          <div className={styles.diasSemana}>
            {diasSemana.map((dia) => (
              <button
                type="button"
                key={dia}
                className={`${styles.diaBotao} ${
                  diasSelecionados.includes(dia) ? styles.selecionado : ""
                }`}
                onClick={() => toggleDia(dia)}
              >
                {dia}
              </button>
            ))}
          </div>
        )}

        <button type="submit" className={styles.botaoSalvar}>Salvar Agendamento</button>
      </form>
    </div>
  );
}
