import React from 'react';
import styles from './EnvWarning.module.css';

export default function EnvWarning() {
  const base = import.meta.env.VITE_API_URL || 'http://localhost:3001';
  const host = typeof window !== 'undefined' ? window.location.hostname : 'localhost';

  const isUsingLocalhostInProd = base.includes('localhost') && host !== 'localhost' && import.meta.env.MODE === 'production';

  if (!isUsingLocalhostInProd) return null;

  return (
    <div className={styles.banner} role="alert">
      Frontend está apontando para <strong>localhost</strong>. No ambiente de produção configure a variável <code>VITE_API_URL</code> com a URL pública do backend.
    </div>
  );
}
