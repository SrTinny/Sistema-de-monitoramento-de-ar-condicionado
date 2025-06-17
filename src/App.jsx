// src/App.jsx
import React from "react";
import Header from "./components/header/Header";
import Footer from "./components/footer/Footer";
import Home from "./pages/Home";

// Estilo global (não é CSS module)
import "./index.css";

function App() {
  return (
    <>
      <Header />
      <main>
        <Home />
      </main>
      <Footer />
    </>
  );
}

export default App;
