import React, { useContext } from 'react';
import { Outlet } from 'react-router-dom';
import Header from '../header/Header';
import AddRoomForm from '../addRoomForm/AddRoomForm';
import { RoomContext } from '../../contexts/RoomContext';
import styles from './Layout.module.css';

const Layout = () => {
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