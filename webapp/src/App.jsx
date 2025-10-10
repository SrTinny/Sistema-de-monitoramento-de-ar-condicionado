// src/App.jsx
import { useState, useEffect } from "react";
import { Routes, Route } from "react-router-dom";

import Header from "./components/header/Header";
import BottomNavBar from "./components/bottomNavBar/BottomNavBar";
import Home from "./pages/home/Home";
import Agendamentos from "./pages/agendamentos/Agendamentos";
import AddRoomForm from "./components/addRoomForm/AddRoomForm";

function App() {
  const [salas, setSalas] = useState([
    { id: "01", status: "desligado", temp: 25 },
    { id: "02", status: "desligado", temp: 25 },
    { id: "03", status: "desligado", temp: 25 },
    { id: "04", status: "desligado", temp: 25 },
  ]);

  const [showAddForm, setShowAddForm] = useState(false);

  const handleAddRoomClick = () => setShowAddForm(true);

  const handleAddRoom = (roomId) => {
    setSalas((prev) => [
      ...prev,
      { id: roomId, status: "desligado", temp: 25 },
    ]);
    setShowAddForm(false);
  };

  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (e.target.classList.contains("overlay")) {
        setShowAddForm(false);
      }
    };

    if (showAddForm) {
      window.addEventListener("click", handleOutsideClick);
    }

    return () => {
      window.removeEventListener("click", handleOutsideClick);
    };
  }, [showAddForm]);

  return (
    <>
      <Header />
      <main>
        <Routes>
          <Route
            path="/"
            element={
              <Home
                salas={salas}
                setSalas={setSalas}
              />
            }
          />
          <Route path="/agendamentos" element={<Agendamentos salas={salas} />} />
        </Routes>

        {showAddForm && (
          <AddRoomForm onAddRoom={handleAddRoom} onClose={() => setShowAddForm(false)} />
        )}
      </main>
      <BottomNavBar onAddClick={handleAddRoomClick} />
    </>
  );
}

export default App;
