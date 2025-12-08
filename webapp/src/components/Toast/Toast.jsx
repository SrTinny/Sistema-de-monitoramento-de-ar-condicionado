import React from 'react';
import toast from 'react-hot-toast';
import styles from './Toast.module.css';

/**
 * Toast Customizado com suporte a diferentes tipos
 * Tipos suportados: success, error, info, warning, loading
 */
export const showToast = (message, type = 'success', options = {}) => {
  const defaultOptions = {
    duration: type === 'loading' ? Infinity : 4000,
    ...options,
  };

  switch (type) {
    case 'success':
      return toast.success(message, defaultOptions);
    case 'error':
      return toast.error(message, defaultOptions);
    case 'info':
      return toast(message, defaultOptions);
    case 'warning':
      return toast((t) => (
        <div className={styles.toastContent}>
          <span className={styles.icon}>⚠️</span>
          <span>{message}</span>
        </div>
      ), defaultOptions);
    case 'loading':
      return toast.loading(message, defaultOptions);
    default:
      return toast(message, defaultOptions);
  }
};

/**
 * Toast com Promise para operações assíncronas
 * Exemplo: toast.promise(api.post(...), { loading: '...', success: '...', error: '...' })
 */
export const showPromiseToast = (promise, messages) => {
  return toast.promise(promise, messages);
};

/**
 * Toast customizado com ícone e conteúdo personalizado
 */
export const showCustomToast = (content, options = {}) => {
  return toast.custom(
    (t) => (
      <div className={styles.customToast}>
        {content}
      </div>
    ),
    {
      duration: 4000,
      ...options,
    }
  );
};

/**
 * Fechar um toast específico
 */
export const dismissToast = (toastId) => {
  toast.dismiss(toastId);
};

/**
 * Fechar todos os toasts
 */
export const dismissAllToasts = () => {
  toast.dismiss();
};

export default {
  success: (msg, opts) => showToast(msg, 'success', opts),
  error: (msg, opts) => showToast(msg, 'error', opts),
  info: (msg, opts) => showToast(msg, 'info', opts),
  warning: (msg, opts) => showToast(msg, 'warning', opts),
  loading: (msg, opts) => showToast(msg, 'loading', opts),
  promise: showPromiseToast,
  custom: showCustomToast,
  dismiss: dismissToast,
  dismissAll: dismissAllToasts,
};
