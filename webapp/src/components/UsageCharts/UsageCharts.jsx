import React, { useMemo } from "react";
import { ResponsiveContainer, LineChart, Line, CartesianGrid, XAxis, YAxis, Tooltip, BarChart, Bar } from "recharts";
import { motion, useScroll, useTransform } from "framer-motion";
import styles from "./UsageCharts.module.css";

const tempTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    return (
      <div style={{ background: "var(--bg-secondary)", color: "var(--text-primary)", padding: "0.5rem 0.75rem", borderRadius: 8, border: `1px solid var(--border)` }}>
        <div>{payload[0].payload.day}</div>
        <div>Temp: {payload[0].payload.temp}°C</div>
        <div>Setpoint: {payload[0].payload.setpoint}°C</div>
      </div>
    );
  }
  return null;
};

const usageTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    return (
      <div style={{ background: "var(--bg-secondary)", color: "var(--text-primary)", padding: "0.5rem 0.75rem", borderRadius: 8, border: `1px solid var(--border)` }}>
        <div>{payload[0].payload.name}</div>
        <div>Horas ligadas: {payload[0].value.toFixed(1)}h</div>
      </div>
    );
  }
  return null;
};

export default function UsageCharts({ rooms = [], schedules = [] }) {
  const { scrollYProgress } = useScroll();
  const parallaxY = useTransform(scrollYProgress, [0, 1], [0, -60]);

  const tempData = useMemo(() => {
    // Dados sintéticos semanais; se houver leituras reais, podem ser conectadas aqui
    const base = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"];
    return base.map((day, idx) => ({
      day,
      temp: 21 + (idx % 3),
      setpoint: 22 + ((idx + 1) % 2),
    }));
  }, []);

  const usageData = useMemo(() => {
    if (rooms.length === 0) {
      return [
        { name: "Sala 1", shortName: "S1", onHours: 5.2 },
        { name: "Sala 2", shortName: "S2", onHours: 3.8 },
        { name: "Sala 3", shortName: "S3", onHours: 6.1 },
      ];
    }
    return rooms.map((r, idx) => ({
      name: r.name ?? `Sala ${idx + 1}`,
      shortName: (r.name ?? `Sala ${idx + 1}`).substring(0, 8),
      onHours: r.status === "ligado" ? 5 + (idx % 3) : 2 + (idx % 2),
    }));
  }, [rooms]);

  const nextSchedule = schedules && schedules.length > 0 ? schedules[0] : null;

  return (
    <motion.section
      className={styles.section}
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      viewport={{ once: true }}
    >
      <motion.div className={styles.parallax} style={{ y: parallaxY }} aria-hidden />
      <div className={styles.header}>
        <div>
          <h3 className={styles.title}>Histórico e Uso</h3>
          <p className={styles.subtitle}>Temperaturas médias semanais e horas ligadas por sala</p>
        </div>
        {nextSchedule && (
          <p className={styles.subtitle}>
            Próximo agendamento: {nextSchedule.roomName || nextSchedule.room?.name || "Sala"} às {new Date(nextSchedule.scheduledAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
          </p>
        )}
      </div>

      <div className={styles.grid}>
        <div className={styles.card}>
          <p className={styles.cardTitle}>
            Temperatura x Setpoint
            <span className={styles.legend}>
              <span className={styles.dotPrimary} /> Temp
              <span className={styles.dotAccent} /> Setpoint
            </span>
          </p>
          <div className={styles.chartWrapper}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={tempData} margin={{ top: 10, right: 16, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="day" stroke="var(--text-secondary)" />
                <YAxis stroke="var(--text-secondary)" domain={[18, 28]} />
                <Tooltip content={tempTooltip} />
                <Line type="monotone" dataKey="temp" stroke="#3b82f6" strokeWidth={3} dot={{ r: 4 }} />
                <Line type="monotone" dataKey="setpoint" stroke="#10b981" strokeWidth={3} strokeDasharray="4 4" dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className={styles.card}>
          <p className={styles.cardTitle}>
            Horas Ligadas por Sala
            <span className={styles.legend}>
              <span className={styles.dotWarning} /> Horas (estimado)
            </span>
          </p>
          <div className={styles.chartWrapper}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={usageData} margin={{ top: 10, right: 16, left: 0, bottom: 30 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis 
                  dataKey="shortName" 
                  stroke="var(--text-secondary)" 
                  tick={{ fontSize: 11 }}
                  angle={-45}
                  textAnchor="end"
                  height={80}
                />
                <YAxis stroke="var(--text-secondary)" />
                <Tooltip content={usageTooltip} />
                <Bar dataKey="onHours" fill="#f59e0b" radius={[8, 8, 4, 4]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </motion.section>
  );
}
