// src/App.jsx
import React from "react";
import Header from "./components/header/Header";
import Footer from "./components/footer/Footer";
import BottomNavBar from "./components/bottomNavBar/BottomNavBar"; // ✅ Novo
import Home from "./pages/Home";

import "./index.css";

function App() {
  return (
    <>
      <Header />
      <main>
        <Home />
      </main>
      <BottomNavBar />
    </>
  );
}

export default App;
