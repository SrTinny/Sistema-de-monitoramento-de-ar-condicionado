// src/App.jsx
import React from "react";
import Header from "./components/header/Header";
import Home from "./pages/Home";

import "./index.css";

function App() {
  return (
    <>
      <Header />
      <main>
        <Home /> {/* Aqui está o BottomNavBar sendo renderizado dentro do Home */}
      </main>
    </>
  );
}

export default App;
