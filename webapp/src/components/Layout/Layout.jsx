import React, { useContext } from 'react';
import { Outlet } from 'react-router-dom';
import Header from '../header/Header';
import BottomNavBar from '../bottomNavBar/BottomNavBar';
import AddRoomForm from '../addRoomForm/AddRoomForm'; // 👈 Importe o formulário
import { RoomContext } from '../../contexts/RoomContext'; // 👈 Importe o contexto

const Layout = () => {
  // Pega o estado e as funções do contexto
  const { isFormOpen, addRoom, closeForm } = useContext(RoomContext);

  return (
    <>
      <Header />
      <main>
        <Outlet />
      </main>
      <BottomNavBar />

      {/* Renderização condicional do formulário */}
      {isFormOpen && (
        <AddRoomForm 
          onAddRoom={addRoom} 
          onClose={closeForm} 
        />
      )}
    </>
  );
};

export default Layout;