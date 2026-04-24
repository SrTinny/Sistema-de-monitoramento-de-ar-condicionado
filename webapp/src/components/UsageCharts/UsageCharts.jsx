import React, { useMemo } from "react";
import { ResponsiveContainer, LineChart, Line, CartesianGrid, XAxis, YAxis, Tooltip } from "recharts";
import { motion, useScroll, useTransform } from "framer-motion";
import styles from "./UsageCharts.module.css";

const tempTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    return (
      <div style={{ background: "var(--bg-secondary)", color: "var(--text-primary)", padding: "0.5rem 0.75rem", borderRadius: 8, border: `1px solid var(--border)` }}>
        <div>{payload[0].payload.fullName}</div>
        <div>Temp: {payload[0].payload.temp ?? "sem leitura"}</div>
        <div>Setpoint: {payload[0].payload.setpoint ?? "sem ajuste"}</div>
      </div>
    );
  }
  return null;
};

const truncateName = (name, maxLength = 12) => {
  return name.length > maxLength ? name.substring(0, maxLength) + "..." : name;
};

const formatTemp = (value) => (typeof value === "number" && Number.isFinite(value) ? `${value.toFixed(1)}°C` : "--");

export default function UsageCharts({ rooms = [] }) {
  const { scrollYProgress } = useScroll();
  const parallaxY = useTransform(scrollYProgress, [0, 1], [0, -60]);

  const tempData = useMemo(() => {
    return rooms.map((room, idx) => {
      const fullName = room.name ?? room.room ?? `Sala ${idx + 1}`;
      return {
        id: room.id,
        name: truncateName(fullName, 15),
        fullName,
        temp: typeof room.temperature === "number" && Number.isFinite(room.temperature) ? room.temperature : null,
        setpoint: typeof room.setpoint === "number" && Number.isFinite(room.setpoint) ? room.setpoint : null,
      };
    });
  }, [rooms]);

  const roomStats = useMemo(() => {
    const withTemp = tempData.filter((room) => room.temp !== null);
    const temperatures = withTemp.map((room) => room.temp);
    const avgTemperature = temperatures.length > 0 ? (temperatures.reduce((sum, value) => sum + value, 0) / temperatures.length).toFixed(1) : null;
    const highest = withTemp.reduce((best, room) => (best === null || room.temp > best.temp ? room : best), null);
    const lowest = withTemp.reduce((best, room) => (best === null || room.temp < best.temp ? room : best), null);

    return {
      monitoredRooms: tempData.length,
      roomsWithReading: withTemp.length,
      avgTemperature,
      highest,
      lowest,
    };
  }, [tempData]);

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
          <p className={styles.subtitle}>Leituras atuais de todos os ambientes monitorados</p>
        </div>
      </div>

      <div className={styles.grid}>
        <div className={styles.card}>
          <p className={styles.cardTitle}>
            Leitura dos ambientes
            <span className={styles.legend}>
              <span className={styles.dotPrimary} /> Temperatura
              <span className={styles.dotAccent} /> Setpoint
            </span>
          </p>
          <div className={styles.chartWrapper}>
            {tempData.length > 0 ? (
              <div className={styles.scrollArea}>
                <div className={styles.chartInner}>
                  <ResponsiveContainer width="100%" height={350}>
                    <LineChart data={tempData} margin={{ top: 10, right: 16, left: 0, bottom: 20 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                      <XAxis dataKey="name" stroke="var(--text-secondary)" interval={0} tick={{ fontSize: 12 }} />
                      <YAxis stroke="var(--text-secondary)" domain={[16, 32]} />
                      <Tooltip content={tempTooltip} />
                      <Line type="monotone" dataKey="temp" stroke="#3b82f6" strokeWidth={3} dot={{ r: 4 }} />
                      <Line type="monotone" dataKey="setpoint" stroke="#10b981" strokeWidth={3} strokeDasharray="4 4" dot={{ r: 4 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            ) : (
              <p className={styles.subtitle}>Sem leitura de temperatura disponível no momento.</p>
            )}
          </div>
        </div>

        <div className={styles.card}>
          <p className={styles.cardTitle}>
            Resumo dos ambientes
            <span className={styles.legend}>
              <span className={styles.dotWarning} /> Estado atual
            </span>
          </p>
          <div className={styles.chartWrapper}>
            {roomStats.roomsWithReading > 0 ? (
              <div className={styles.statsGrid}>
                <article className={`${styles.statCard} ${styles.statCardPrimary}`}>
                  <span className={styles.statLabel}>Temperatura média</span>
                  <strong className={styles.statValue}>{formatTemp(roomStats.avgTemperature ? Number(roomStats.avgTemperature) : null)}</strong>
                  <span className={styles.statMeta}>{roomStats.roomsWithReading} ambientes com leitura</span>
                </article>

                <article className={styles.statCard}>
                  <span className={styles.statLabel}>Maior temperatura</span>
                  <strong className={styles.statValue}>{formatTemp(roomStats.highest?.temp)}</strong>
                  <span className={styles.statMeta}>{roomStats.highest?.fullName || "Sem ambiente"}</span>
                </article>

                <article className={styles.statCard}>
                  <span className={styles.statLabel}>Menor temperatura</span>
                  <strong className={styles.statValue}>{formatTemp(roomStats.lowest?.temp)}</strong>
                  <span className={styles.statMeta}>{roomStats.lowest?.fullName || "Sem ambiente"}</span>
                </article>

                <article className={styles.statCard}>
                  <span className={styles.statLabel}>Ambientes monitorados</span>
                  <strong className={styles.statValue}>{roomStats.monitoredRooms}</strong>
                  <span className={styles.statMeta}>{roomStats.roomsWithReading} com leitura disponível</span>
                </article>
              </div>
            ) : (
              <div className={styles.subtitle}>
                <p>Sem leituras suficientes para montar um resumo.</p>
                <p>Ambientes monitorados: {roomStats.monitoredRooms}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </motion.section>
  );
}
