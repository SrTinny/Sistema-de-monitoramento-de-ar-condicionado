import React, { useState, useContext } from 'react';
import { AuthContext } from '../../contexts/AuthContext';
import styles from './Login.module.css';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  // 1. ADICIONADO: Estado de carregamento para feedback de UX
  const [loading, setLoading] = useState(false);
  const { login } = useContext(AuthContext);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true); // Inicia o carregamento
    try {
      await login(email, password);
      // O redirecionamento ocorre no AuthContext
    } catch (err) {
      setError('Falha no login. Verifique suas credenciais.');
    } finally {
      setLoading(false); // Finaliza o carregamento, independentemente do resultado
    }
  };

  return (
    <div className={styles.container}>
      {/* Vídeo de background */}
      <video 
        autoPlay 
        muted 
        loop 
        className={styles.videoBackground}
      >
        <source src="/src/public/video_background.mp4" type="video/mp4" />
      </video>
      
      {/* Overlay para melhorar legibilidade */}
      <div className={styles.overlay}></div>
      
      <form onSubmit={handleSubmit} className={styles.formCard}>
        <div className={styles.logoContainer}>
          <img src="/src/public/logo_name.png" alt="Intelifri" className={styles.logo} />
        </div>
        <p className={styles.subtitle}>Faça login para continuar</p>
        
        <div className={styles.inputGroup}>
          <label htmlFor="email">Email</label>
          <input
            type="email"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="seu@email.com"
            required
            autoFocus // Foco automático no primeiro campo
          />
        </div>

        <div className={styles.inputGroup}>
          <label htmlFor="password">Senha</label>
          <input
            type="password"
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Sua senha"
            required
          />
        </div>

        {error && <p className={styles.error}>{error}</p>}
        
        {/* 2. O botão agora reage ao estado de carregamento */}
        <button type="submit" className={styles.submitButton} disabled={loading}>
          {loading ? 'Entrando...' : 'Entrar'}
        </button>
      </form>
    </div>
  );
};

export default Login;