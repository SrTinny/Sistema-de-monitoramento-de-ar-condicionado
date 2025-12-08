import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import styles from './EnhancedModal.module.css';

/**
 * Modal Aprimorado com Framer Motion
 * Inclui backdrop blur, animações de entrada, e tabs
 */
export default function EnhancedModal({
  isOpen = false,
  onClose,
  title,
  children,
  tabs,
  size = 'md', // sm, md, lg
  showTabs = false,
}) {
  const [activeTab, setActiveTab] = useState(0);

  const backdropVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1 },
    exit: { opacity: 0 },
  };

  const modalVariants = {
    hidden: { opacity: 0, scale: 0.95, y: 20 },
    visible: { opacity: 1, scale: 1, y: 0 },
    exit: { opacity: 0, scale: 0.95, y: 20 },
  };

  const tabVariants = {
    hidden: { opacity: 0, x: 20 },
    visible: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -20 },
  };

  const sizeClass = {
    sm: styles.sm,
    md: styles.md,
    lg: styles.lg,
  }[size];

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            className={styles.backdrop}
            variants={backdropVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            onClick={onClose}
            transition={{ duration: 0.2 }}
          />

          {/* Modal */}
          <motion.div
            className={`${styles.modal} ${sizeClass}`}
            variants={modalVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            transition={{ duration: 0.3 }}
          >
            {/* Header */}
            <div className={styles.header}>
              <h2 className={styles.title}>{title}</h2>
              <button
                className={styles.closeBtn}
                onClick={onClose}
                aria-label="Fechar modal"
              >
                <X size={24} />
              </button>
            </div>

            {/* Tabs */}
            {showTabs && tabs && tabs.length > 0 && (
              <div className={styles.tabs}>
                {tabs.map((tab, index) => (
                  <button
                    key={index}
                    className={`${styles.tab} ${activeTab === index ? styles.active : ''}`}
                    onClick={() => setActiveTab(index)}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            )}

            {/* Content */}
            <div className={styles.content}>
              {showTabs && tabs && tabs.length > 0 ? (
                <motion.div
                  key={activeTab}
                  variants={tabVariants}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                  transition={{ duration: 0.2 }}
                >
                  {tabs[activeTab].content}
                </motion.div>
              ) : (
                children
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
