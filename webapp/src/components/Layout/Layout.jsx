import React, { useContext } from 'react';
import { Outlet } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Header from '../header/Header';
import BottomNavBar from '../bottomNavBar/BottomNavBar';
import AddRoomForm from '../addRoomForm/AddRoomForm';
import { RoomContext } from '../../contexts/RoomContext';
import styles from './Layout.module.css';

const Layout = () => {
  const { isFormOpen, addRoom, closeForm } = useContext(RoomContext);

  return (
    // 👇 Envolvemos tudo em um container principal
    <div className={styles.layoutContainer}>
      {/* 1. Adicionamos o Toaster para notificações */}
      <Toaster 
        position="top-center" // Posição das notificações
        reverseOrder={false}
        toastOptions={{
          // Define estilos padrão para os toasts
          style: {
            background: 'var(--bg-secondary)',
            color: 'var(--text-primary)',
            border: '1px solid var(--border)',
          },
        }}
      />
      <Header />
      
      {/* 👇 O <main> agora tem uma classe para fazê-lo crescer */}
      <main className={styles.mainContent}>
        <Outlet />
      </main>
      
      <BottomNavBar />

      {isFormOpen && (
        <AddRoomForm 
          onAddRoom={addRoom} 
          onClose={closeForm} 
        />
      )}
    </div>
  );
};

export default Layout;