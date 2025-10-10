// src/main.jsx
import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx"; // Importa o componente principal do aplicativo
import { BrowserRouter } from "react-router-dom"; // Importa o roteador do React Router
import "./index.css"; // Importa o CSS global

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>
);