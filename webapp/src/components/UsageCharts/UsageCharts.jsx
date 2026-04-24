import React, { useMemo } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import styles from "./UsageCharts.module.css";

const truncateName = (name, maxLength = 12) => {
  return name.length > maxLength ? name.substring(0, maxLength) + "..." : name;
};

const formatTemp = (value) => (typeof value === "number" && Number.isFinite(value) ? `${value.toFixed(1)}°C` : "--");

export default function UsageCharts({ rooms = [] }) {
  const { scrollYProgress } = useScroll();
  const parallaxY = useTransform(scrollYProgress, [0, 1], [0, -60]);

  const summaryRooms = useMemo(() => {
    return rooms.map((room, idx) => {
      const fullName = room.name ?? room.room ?? `Sala ${idx + 1}`;
      const temperature = typeof room.temperature === "number" && Number.isFinite(room.temperature) ? room.temperature : null;

      return {
        id: room.id,
        fullName,
        shortName: truncateName(fullName, 18),
        temperature,
      };
    });
  }, [rooms]);

  const roomStats = useMemo(() => {
    const withTemp = summaryRooms.filter((room) => room.temperature !== null);
    const temperatures = withTemp.map((room) => room.temperature);
    const avgTemperature = temperatures.length > 0 ? (temperatures.reduce((sum, value) => sum + value, 0) / temperatures.length).toFixed(1) : null;
    const highest = withTemp.reduce((best, room) => (best === null || room.temperature > best.temperature ? room : best), null);
    const lowest = withTemp.reduce((best, room) => (best === null || room.temperature < best.temperature ? room : best), null);

    return {
      monitoredRooms: summaryRooms.length,
      roomsWithReading: withTemp.length,
      avgTemperature,
      highest,
      lowest,
    };
  }, [summaryRooms]);

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
          <h3 className={styles.title}>Resumo dos ambientes</h3>
          <p className={styles.subtitle}>Temperatura atual e visão geral dos ambientes monitorados</p>
        </div>
      </div>

      <div className={styles.card}>
        <p className={styles.cardTitle}>
          Estado atual
          <span className={styles.legend}>
            <span className={styles.dotWarning} /> Leitura em tempo real
          </span>
        </p>

        {roomStats.roomsWithReading > 0 ? (
          <div className={styles.statsGrid}>
            <article className={`${styles.statCard} ${styles.statCardPrimary}`}>
              <span className={styles.statLabel}>Temperatura média</span>
              <strong className={styles.statValue}>{formatTemp(roomStats.avgTemperature ? Number(roomStats.avgTemperature) : null)}</strong>
              <span className={styles.statMeta}>{roomStats.roomsWithReading} ambientes com leitura</span>
            </article>

            <article className={styles.statCard}>
              <span className={styles.statLabel}>Maior temperatura</span>
              <strong className={styles.statValue}>{formatTemp(roomStats.highest?.temperature)}</strong>
              <span className={styles.statMeta}>{roomStats.highest?.fullName || "Sem ambiente"}</span>
            </article>

            <article className={styles.statCard}>
              <span className={styles.statLabel}>Menor temperatura</span>
              <strong className={styles.statValue}>{formatTemp(roomStats.lowest?.temperature)}</strong>
              <span className={styles.statMeta}>{roomStats.lowest?.fullName || "Sem ambiente"}</span>
            </article>

            <article className={styles.statCard}>
              <span className={styles.statLabel}>Ambientes monitorados</span>
              <strong className={styles.statValue}>{roomStats.monitoredRooms}</strong>
              <span className={styles.statMeta}>{roomStats.roomsWithReading} com leitura disponível</span>
            </article>
          </div>
        ) : (
          <div className={styles.emptySummary}>
            <p>Sem leituras suficientes para montar o resumo.</p>
            <p>Ambientes monitorados: {roomStats.monitoredRooms}</p>
          </div>
        )}
      </div>
    </motion.section>
  );
}
