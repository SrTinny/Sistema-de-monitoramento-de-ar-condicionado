import React from 'react';
import styles from './Spinner.module.css';

/**
 * Spinner - Componente de carregamento em loop
 * Tipos: default, small, large
 */
export const Spinner = ({ size = 'default', className = '' }) => {
  const sizeClass = {
    small: styles.spinnerSmall,
    default: styles.spinner,
    large: styles.spinnerLarge,
  }[size];

  return (
    <div className={`${styles.spinnerContainer} ${sizeClass} ${className}`}>
      <div className={styles.spinner}></div>
    </div>
  );
};

/**
 * Botão com Spinner integrado
 * Usado para operações assíncronas
 */
export const LoadingButton = ({
  isLoading = false,
  disabled = false,
  children,
  className = '',
  spinnerSize = 'small',
  ...props
}) => {
  return (
    <button
      disabled={disabled || isLoading}
      className={`${styles.loadingButton} ${isLoading ? styles.isLoading : ''} ${className}`}
      {...props}
    >
      {isLoading ? (
        <>
          <Spinner size={spinnerSize} />
          <span className={styles.loadingText}>Processando...</span>
        </>
      ) : (
        children
      )}
    </button>
  );
};

export default {
  Spinner,
  LoadingButton,
};
