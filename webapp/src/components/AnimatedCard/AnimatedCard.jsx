import React from 'react';
import { motion } from 'framer-motion';
import styles from './AnimatedCard.module.css';

/**
 * Card Animado com Framer Motion
 * Usa stagger para múltiplos cards
 */
export const AnimatedCard = ({ children, delay = 0, className = '', ...props }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
      className={`${styles.card} ${className}`}
      {...props}
    >
      {children}
    </motion.div>
  );
};

/**
 * Container com animação de stagger para múltiplos elementos
 */
export const StaggerContainer = ({ children, className = '' }) => {
  const variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.3,
      },
    },
  };

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={variants}
      className={className}
    >
      {children}
    </motion.div>
  );
};

/**
 * Item individual para stagger
 */
export const StaggerItem = ({ children }) => {
  const variants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.4,
      },
    },
  };

  return (
    <motion.div variants={variants}>
      {children}
    </motion.div>
  );
};

/**
 * Animação de Page Transition
 */
export const PageTransition = ({ children }) => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
    >
      {children}
    </motion.div>
  );
};

/**
 * Animação de Hover Scale
 */
export const HoverScaleCard = ({ children, className = '', ...props }) => {
  return (
    <motion.div
      whileHover={{ scale: 1.02, y: -4 }}
      whileTap={{ scale: 0.98 }}
      transition={{ duration: 0.2 }}
      className={className}
      {...props}
    >
      {children}
    </motion.div>
  );
};

/**
 * Animação de Expandir/Colapsar
 */
export const ExpandableMotion = ({ isExpanded, children }) => {
  return (
    <motion.div
      initial={false}
      animate={{ height: isExpanded ? 'auto' : 0 }}
      transition={{ duration: 0.3 }}
      style={{ overflow: 'hidden' }}
    >
      {children}
    </motion.div>
  );
};

/**
 * FAB com animação flutuante (para mobile)
 */
export const FloatingActionButton = ({ onClick, children, className = '' }) => {
  return (
    <motion.button
      initial={{ opacity: 0, scale: 0 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: 0.5 }}
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.95 }}
      className={`${styles.fab} ${className}`}
      onClick={onClick}
    >
      {children}
    </motion.button>
  );
};

export default {
  AnimatedCard,
  StaggerContainer,
  StaggerItem,
  PageTransition,
  HoverScaleCard,
  ExpandableMotion,
  FloatingActionButton,
};
