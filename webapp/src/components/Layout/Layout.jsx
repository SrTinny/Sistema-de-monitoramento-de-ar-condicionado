import React from 'react';
import { Outlet } from 'react-router-dom';
import Header from '../header/Header';
import BottomNavBar from '../bottomNavBar/BottomNavBar';
// Importe o AddRoomForm e a lógica de exibição se quiser mantê-la aqui

const Layout = () => {
  // A lógica para exibir o AddRoomForm pode vir para cá
  // ou ser gerenciada por um estado global no RoomContext

  return (
    <>
      <Header />
      <main>
        {/* O Outlet renderiza o componente da rota atual (Home, Agendamentos, etc.) */}
        <Outlet />
      </main>
      <BottomNavBar /* onAddClick={...} */ />
    </>
  );
};

export default Layout;