import React, { useContext } from 'react';
import { Outlet } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Header from '../header/Header';
import AddRoomForm from '../addRoomForm/AddRoomForm';
import { RoomProvider } from '../../contexts/RoomContext';
import { RoomContext } from '../../contexts/RoomContext';
import styles from './Layout.module.css';

const Layout = () => {
  return (
    <RoomProvider>
      <LayoutContent />
      <Toaster
        position="top-right"
        reverseOrder={false}
        gutter={12}
        containerClassName=""
        containerStyle={{}}
        toastOptions={{
          duration: 4000,
          style: {
            background: 'linear-gradient(135deg, #1f2937 0%, #111827 100%)',
            color: '#f3f4f6',
            borderRadius: '0.75rem',
            border: '1px solid rgba(75, 85, 99, 0.3)',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.3), 0 10px 10px -5px rgba(0, 0, 0, 0.2)',
            backdropFilter: 'blur(10px)',
            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
          },
          success: {
            duration: 4000,
            style: {
              background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
              border: '1px solid rgba(16, 185, 129, 0.3)',
            },
            iconTheme: {
              primary: '#fff',
              secondary: '#10b981',
            },
          },
          error: {
            duration: 5000,
            style: {
              background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
            },
            iconTheme: {
              primary: '#fff',
              secondary: '#ef4444',
            },
          },
          loading: {
            duration: Infinity,
            style: {
              background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
              border: '1px solid rgba(59, 130, 246, 0.3)',
            },
          },
        }}
      />
    </RoomProvider>
  );
};

const LayoutContent = () => {
  const { isFormOpen, addRoom, closeForm } = useContext(RoomContext);

  return (
    // 👇 Envolvemos tudo em um container principal
    <div className={styles.layoutContainer}>
      <Header />
      
      {/* 👇 O <main> agora tem uma classe para fazê-lo crescer */}
      <main className={styles.mainContent}>
        <Outlet />
      </main>

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