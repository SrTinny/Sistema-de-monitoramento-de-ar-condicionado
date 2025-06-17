// Exemplo simples
useEffect(() => {
  // Endereço IP do ESP32
  const ESP_IP = "192.168.1.106"; // Substitua pelo IP correto do ESP32
  const socket = new WebSocket(`ws://${ESP_IP}:81`);

  // Atualiza a interface com o estado do AC
  function updateStatusUI(state) {
    const statusElement = document.getElementById("status-101");
    const roomElement = document.querySelector(".ac-unit[data-room='101']");
    const buttonElement = document.getElementById("toggle-101");

    if (state === "ligado") {
      statusElement.textContent = "Ligado";
      statusElement.classList.remove("desligado");
      statusElement.classList.add("ligado");
      roomElement.classList.remove("desligado");
      roomElement.classList.add("ligado");
      buttonElement.textContent = "Desligar";
    } else {
      statusElement.textContent = "Desligado";
      statusElement.classList.remove("ligado");
      statusElement.classList.add("desligado");
      roomElement.classList.remove("ligado");
      roomElement.classList.add("desligado");
      buttonElement.textContent = "Ligar";
    }
  }

  // WebSocket para receber atualizações do ESP32
  socket.onopen = () => {
    console.log("🔗 Conectado ao WebSocket do ESP32");
  };

  socket.onmessage = (event) => {
    console.log("🔄 Atualização recebida do ESP32:", event.data);

    if (event.data.includes("Sinal IR enviado")) {
      alert(event.data); // Exibe alerta mostrando o sinal IR exato enviado
    } else {
      updateStatusUI(event.data);
    }
  };

  socket.onerror = (error) => {
    console.error("⚠️ Erro no WebSocket:", error);
  };

  socket.onclose = () => {
    console.warn("🔌 Conexão WebSocket fechada");
  };

  // Envia requisição para ligar o AC via HTTP
  async function ligarAC() {
    try {
      const response = await fetch(`http://${ESP_IP}/ligar`);
      if (!response.ok) throw new Error("Erro ao ligar o AC");
    } catch (error) {
      console.error("⚠️ Erro ao ligar o AC:", error);
    }
  }

  // Envia requisição para desligar o AC via HTTP
  async function desligarAC() {
    try {
      const response = await fetch(`http://${ESP_IP}/desligar`);
      if (!response.ok) throw new Error("Erro ao desligar o AC");
    } catch (error) {
      console.error("⚠️ Erro ao desligar o AC:", error);
    }
  }

  // Alterna entre ligar e desligar ao clicar no botão do site
  async function toggleAC() {
    const statusElement = document.getElementById("status-101");
    const isLigado = statusElement.textContent.trim() === "Ligado";

    if (isLigado) {
      await desligarAC();
    } else {
      await ligarAC();
    }
  }

  // Atualiza a temperatura exibida no site
  function updateTemperature(roomId) {
    const tempRangeElement = document.getElementById(`temp-range-${roomId}`);
    const tempValueElement = document.getElementById(`temp-${roomId}`);
    tempValueElement.textContent = `${tempRangeElement.value}°C`;
  }

  // Configuração do menu responsivo
  function openMenu() {
    const navList = document.querySelector(".nav-list");
    navList.classList.toggle("open");
  }

  // Alternância de tema (dark mode)
  document.getElementById("theme-toggle").addEventListener("click", () => {
    document.body.classList.toggle("dark-mode");

    const themeIcon = document.getElementById("theme-icon");
    const isDarkMode = document.body.classList.contains("dark-mode");

    themeIcon.innerHTML = isDarkMode
      ? `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21.752 15.002A9.718 9.718 0 0112 21.75 9.719 9.719 0 013.75 15c0-3.58 2.016-6.79 5.002-8.498a0.75 0.75 0 00.25-1.212 7.487 7.487 0 009.872 9.872 0.75 0.75 0 001.212-.25A9.704 9.704 0 0121.752 15z"/>`
      : `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 3v1m0 16v1m9-9h1M4 12H3m15.364 7.364l-.707-.707M6.343 6.343l-.707-.707m12.728 12.728l-.707-.707M6.343 17.657l-.707-.707M12 6a6 6 0 100 12 6 6 0 000-12z"/>`;
  });

  // Adiciona o evento de clique ao botão de Ligar/Desligar da Sala 101
  document.addEventListener("DOMContentLoaded", () => {
    const toggleButton = document.getElementById("toggle-101");
    if (toggleButton) {
      toggleButton.addEventListener("click", toggleAC);
    } else {
      console.error("❌ Botão de Ligar/Desligar não encontrado!");
    }
  });
}, []);
