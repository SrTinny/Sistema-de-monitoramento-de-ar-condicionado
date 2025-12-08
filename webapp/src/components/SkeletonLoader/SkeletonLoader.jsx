import React from 'react';
import styles from './SkeletonLoader.module.css';

/**
 * Skeleton Loader - Componente para simular carregamento
 * Tipos: room, button, text, card, grid
 */
export const SkeletonRoom = () => (
  <div className={styles.skeletonRoom}>
    <div className={styles.skeletonHeader}>
      <div className={styles.skeletonLine} style={{ width: '60%' }}></div>
      <div className={styles.skeletonCircle}></div>
    </div>
    <div className={styles.skeletonContent}>
      <div className={styles.skeletonLine} style={{ width: '40%', marginBottom: '0.75rem' }}></div>
      <div className={styles.skeletonLine} style={{ width: '50%', marginBottom: '1rem' }}></div>
      <div className={styles.skeletonSlider}></div>
    </div>
    <div className={styles.skeletonFooter}>
      <div className={styles.skeletonButton}></div>
      <div className={styles.skeletonButton}></div>
    </div>
  </div>
);

export const SkeletonButton = ({ width = '100px' }) => (
  <div className={styles.skeletonButton} style={{ width }}></div>
);

export const SkeletonText = ({ lines = 3 }) => (
  <div className={styles.skeletonText}>
    {Array.from({ length: lines }).map((_, i) => (
      <div
        key={i}
        className={styles.skeletonLine}
        style={{
          width: i === lines - 1 ? '80%' : '100%',
          marginBottom: i < lines - 1 ? '0.75rem' : 0,
        }}
      ></div>
    ))}
  </div>
);

export const SkeletonCard = () => (
  <div className={styles.skeletonCard}>
    <div className={styles.skeletonImage}></div>
    <div className={styles.skeletonCardContent}>
      <div className={styles.skeletonLine} style={{ width: '70%', marginBottom: '0.75rem' }}></div>
      <div className={styles.skeletonLine} style={{ width: '100%', marginBottom: '1rem' }}></div>
      <div className={styles.skeletonLine} style={{ width: '60%' }}></div>
    </div>
  </div>
);

export const SkeletonGrid = ({ columns = 3, rows = 2 }) => (
  <div className={styles.skeletonGrid} style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
    {Array.from({ length: columns * rows }).map((_, i) => (
      <SkeletonCard key={i} />
    ))}
  </div>
);

// Skeleton List (para listas de salas)
export const SkeletonRoomList = ({ count = 3 }) => (
  <div className={styles.skeletonList}>
    {Array.from({ length: count }).map((_, i) => (
      <SkeletonRoom key={i} />
    ))}
  </div>
);

export default {
  Room: SkeletonRoom,
  Button: SkeletonButton,
  Text: SkeletonText,
  Card: SkeletonCard,
  Grid: SkeletonGrid,
  List: SkeletonRoomList,
};
