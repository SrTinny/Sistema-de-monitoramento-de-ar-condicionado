import { useState } from "react";
import toast from "react-hot-toast";
import styles from "./Agenda.module.css";

const diasSemana = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

export default function Agenda({ salas, onAgendar }) {
  // O estado inicial já estava bom
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
    // 2. USAR TOAST EM VEZ DE ALERT() PARA UMA UX MELHOR
    toast.success("Agendamento salvo com sucesso!");
  };

  return (
    <div className={styles.agendaContainer}>
      <h2>Agendar Ação</h2>
      <form onSubmit={handleSubmit} className={styles.agendaForm}>
        {/* 3. ESTRUTURA REFEITA USANDO O PADRÃO 'inputGroup' */}
        <div className={styles.inputGroup}>
          <label htmlFor="sala-select">Sala:</label>
          <select id="sala-select" value={roomId} onChange={(e) => setRoomId(e.target.value)}>
            {salas.map((s) => (
              // 4. MOSTRANDO O NOME DA SALA EM VEZ DO ID
              <option key={s.id} value={s.id}>
                {s.name} ({s.room})
              </option>
            ))}
          </select>
        </div>

        <div className={styles.inputGroup}>
          <label htmlFor="acao-select">Ação:</label>
          <select id="acao-select" value={acao} onChange={(e) => setAcao(e.target.value)}>
            <option value="ligar">Ligar</option>
            <option value="desligar">Desligar</option>
          </select>
        </div>

        <div className={styles.inputGroup}>
          <label htmlFor="hora-input">Horário:</label>
          <input
            id="hora-input"
            type="time"
            value={hora}
            onChange={(e) => setHora(e.target.value)}
          />
        </div>

        <div className={styles.inputGroup}>
          <label htmlFor="repeticao-select">Repetição:</label>
          <select
            id="repeticao-select"
            value={repeticao}
            onChange={(e) => setRepeticao(e.target.value)}
          >
            <option value="sempre">Todos os dias</option>
            <option value="semanal">Dias específicos</option>
            <option value="unico">Apenas uma vez</option>
          </select>
        </div>

        {repeticao === "semanal" && (
          <div className={styles.inputGroup}>
             <label>Dias da semana:</label>
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
          </div>
        )}

        <button type="submit" className={styles.botaoSalvar}>
          Salvar Agendamento
        </button>
      </form>
    </div>
  );
}