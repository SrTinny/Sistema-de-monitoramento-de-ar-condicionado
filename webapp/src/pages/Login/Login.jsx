import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../../contexts/AuthContext';
import styles from './Login.module.css';

const Login = () => {
  const navigate = useNavigate();
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
      navigate('/');
    } catch (err) {
      setError('Falha no login. Verifique suas credenciais.');
    } finally {
      setLoading(false); // Finaliza o carregamento, independentemente do resultado
    }
  };

  return (
    <div className={styles.container}>
      <picture className={styles.backgroundPicture} aria-hidden="true">
        <source
          media="(max-width: 768px)"
          type="image/avif"
          srcSet="/background-mobile-768.avif"
        />
        <source
          media="(max-width: 768px)"
          type="image/webp"
          srcSet="/background-mobile-768.webp"
        />
        <source
          media="(min-width: 769px)"
          type="image/avif"
          srcSet="/background-desktop-1200.avif"
        />
        <source
          media="(min-width: 769px)"
          type="image/webp"
          srcSet="/background-desktop-1200.webp"
        />
        <img
          src="/background-mobile-768.png"
          alt=""
          className={styles.backgroundImage}
          loading="eager"
          decoding="async"
          fetchPriority="high"
        />
      </picture>
      
      <div className={styles.overlay}></div>
      
      <form onSubmit={handleSubmit} className={styles.formCard}>
        <div className={styles.logoContainer}>
          <picture className={styles.logoPicture}>
            <source
              type="image/avif"
              srcSet="/logo_name-200.avif 200w, /logo_name-400.avif 400w"
              sizes="(max-width: 768px) 168px, 200px"
            />
            <source
              type="image/webp"
              srcSet="/logo_name-200.webp 200w, /logo_name-400.webp 400w"
              sizes="(max-width: 768px) 168px, 200px"
            />
            <img
              src="/logo_name.png?v=1"
              alt="Intelifri"
              className={styles.logo}
              width="200"
              height="70"
              loading="eager"
              decoding="async"
              fetchPriority="high"
            />
          </picture>
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
            autoComplete="email"
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
            autoComplete="current-password"
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