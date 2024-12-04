// Endereço IP do ESP32
const ESP_IP = "http://192.168.1.110";

// Função para ligar o LED
async function ligarLED(acId) {
  try {
    const response = await fetch(`${ESP_IP}/ligar?sala=${acId}`);
    if (!response.ok) {
      throw new Error("Erro ao ligar o LED no ESP32");
    }
    console.log(await response.text());

    // Atualizar o status na interface
    const statusElement = document.getElementById(`status-${acId}`);
    statusElement.textContent = "Ligado";
    statusElement.classList.remove("desligado");
    statusElement.classList.add("ligado");

    const acUnit = document.querySelector(`.ac-unit[data-room="${acId}"]`);
    acUnit.classList.remove("desligado");
    acUnit.classList.add("ligado");
  } catch (error) {
    console.error("Erro ao ligar o LED:", error);
  }
}

// Função para desligar o LED
async function desligarLED(acId) {
  try {
    const response = await fetch(`${ESP_IP}/desligar?sala=${acId}`);
    if (!response.ok) {
      throw new Error("Erro ao desligar o LED no ESP32");
    }
    console.log(await response.text());

    // Atualizar o status na interface
    const statusElement = document.getElementById(`status-${acId}`);
    statusElement.textContent = "Desligado";
    statusElement.classList.remove("ligado");
    statusElement.classList.add("desligado");

    const acUnit = document.querySelector(`.ac-unit[data-room="${acId}"]`);
    acUnit.classList.remove("ligado");
    acUnit.classList.add("desligado");
  } catch (error) {
    console.error("Erro ao desligar o LED:", error);
  }
}

// Função para alternar o estado do LED
async function toggleAC(acId) {
  const acUnit = document.querySelector(`.ac-unit[data-room="${acId}"]`);
  const statusElement = document.getElementById(`status-${acId}`);
  const currentStatus = statusElement.textContent.trim();

  if (currentStatus === "Desligado") {
    await ligarLED(acId);
    statusElement.textContent = "Ligado";
    statusElement.classList.remove("desligado");
    statusElement.classList.add("ligado");
    acUnit.classList.remove("desligado");
    acUnit.classList.add("ligado");
  } else {
    await desligarLED(acId);
    statusElement.textContent = "Desligado";
    statusElement.classList.remove("ligado");
    statusElement.classList.add("desligado");
    acUnit.classList.remove("ligado");
    acUnit.classList.add("desligado");
  }
}

// Atualiza a temperatura exibida na interface
function updateTemperature(acId) {
  const tempRangeElement = document.getElementById(`temp-range-${acId}`);
  const tempValueElement = document.getElementById(`temp-${acId}`);
  tempValueElement.textContent = `${tempRangeElement.value}°C`;
}

// Abre a janela de configurações
function openSettings(roomId) {
  const modal = document.getElementById("settings-modal");
  const locationInput = document.getElementById("room-location");
  const temperatureInput = document.getElementById("room-temperature");

  const roomElement = document.querySelector(`.ac-unit[data-room="${roomId}"]`);
  const currentTitle = roomElement.querySelector("h2 .room-title").textContent;
  const currentTemperature = roomElement.querySelector(
    `#temp-${roomId}`
  ).textContent;

  locationInput.value = currentTitle;
  temperatureInput.value = currentTemperature.replace("°C", "");

  modal.dataset.currentRoom = roomId;
  modal.classList.remove("hidden");
}

// Fecha a janela de configurações
function closeSettings() {
  document.getElementById("settings-modal").classList.add("hidden");
}

// Salva as configurações da sala
function saveSettings() {
  const modal = document.getElementById("settings-modal");
  const roomId = modal.dataset.currentRoom;
  const locationInput = document.getElementById("room-location");
  const temperatureInput = document.getElementById("room-temperature");

  const roomElement = document.querySelector(`.ac-unit[data-room="${roomId}"]`);
  const roomTitleElement = roomElement.querySelector("h2 .room-title");
  roomTitleElement.textContent = locationInput.value;

  if (temperatureInput.value) {
    const tempElement = document.getElementById(`temp-${roomId}`);
    tempElement.textContent = `${temperatureInput.value}°C`;
  }

  closeSettings();
}

// Cria uma nova sala dinamicamente
function createRoom(roomId, roomName, initialTemperature) {
  const container = document.getElementById("rooms-container");

  const roomDiv = document.createElement("div");
  roomDiv.classList.add("ac-unit", "desligado");
  roomDiv.setAttribute("data-room", roomId);

  roomDiv.innerHTML = `
    <h2>
      <span class="room-title">${roomName}</span>
      <span class="settings-icon" onclick="openSettings('${roomId}')">⚙</span>
    </h2>
    <p>Status: <span id="status-${roomId}" class="status desligado">Desligado</span></p>
    <p>Temperatura Atual: <span id="temp-${roomId}">${initialTemperature}°C</span></p>
    <button id="toggle-${roomId}" onclick="toggleAC('${roomId}')">Ligar/Desligar</button>
    <input type="range" min="16" max="30" id="temp-range-${roomId}" value="${initialTemperature}" oninput="updateTemperature('${roomId}')"/>
  `;

  container.appendChild(roomDiv);
}

// Inicializa o formulário para adicionar novas salas
document.addEventListener("DOMContentLoaded", () => {
  const addRoomForm = document.getElementById("add-room-form");

  if (addRoomForm) {
    addRoomForm.addEventListener("submit", function (e) {
      e.preventDefault();

      const roomName = document.getElementById("room-name").value;
      const initialTemperature = document.getElementById(
        "initial-temperature"
      ).value;

      const roomId = `room-${Date.now()}`;
      createRoom(roomId, roomName, initialTemperature);

      document.getElementById("room-name").value = "";
      document.getElementById("initial-temperature").value = "";
    });
  }

  // Alternância de tema com ícones minimalistas
  const themeToggleButton = document.getElementById("theme-toggle");
  const themeIcon = document.getElementById("theme-icon");

  if (themeToggleButton) {
    themeToggleButton.addEventListener("click", () => {
      // Alterna entre os temas
      document.body.classList.toggle("dark-mode");

      // Verifica o estado atual e altera o ícone
      const isDarkMode = document.body.classList.contains("dark-mode");

      // Altera o ícone de acordo com o tema
      themeIcon.innerHTML = isDarkMode
        ? `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21.752 15.002A9.718 9.718 0 0112 21.75 9.719 9.719 0 013.75 15c0-3.58 2.016-6.79 5.002-8.498a0.75 0.75 0 00.25-1.212 7.487 7.487 0 009.872 9.872 0.75 0.75 0 001.212-.25A9.704 9.704 0 0121.752 15z"/>`
        : `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 3v1m0 16v1m9-9h1M4 12H3m15.364 7.364l-.707-.707M6.343 6.343l-.707-.707m12.728 12.728l-.707-.707M6.343 17.657l-.707-.707M12 6a6 6 0 100 12 6 6 0 000-12z"/>`;
    });
  }

  // Configuração do menu responsivo
  const menuToggle = document.querySelector(".menu-toggle");
  const navList = document.querySelector(".nav-list");

  if (menuToggle && navList) {
    menuToggle.addEventListener("click", () => {
      // Alterna o menu
      navList.classList.toggle("fullscreen");
      navList.classList.toggle("open");

      // Alterna o ícone entre "☰" e "✕"
      menuToggle.textContent = menuToggle.textContent === "☰" ? "✕" : "☰";
    });
  }
});
