# 🌎 Sistema de Monitoramento e Controle de Ar-Condicionado Inteligente ❄️  

Este projeto consiste em um **sistema web inteligente** integrado com um **ESP32** para **monitorar e controlar** ar-condicionados remotamente. Utilizando **sinais infravermelhos (IR)**, o sistema permite **ligar e desligar** o ar-condicionado via **interface web responsiva**, além de exibir **o estado em tempo real** e permitir **configurações dinâmicas**.  

🚀 **Tecnologias modernas como WebSockets, React.js e Node.js** garantem uma experiência fluida e comunicação eficiente com o ESP32.  

---

## 🖥️ **Funcionalidades**
✅ **Controle remoto via interface web** 🔄  
✅ **Envio de comandos IR para o ar-condicionado** 📡  
✅ **Monitoramento do estado em tempo real (ligado/desligado)** ⚡  
✅ **Atualização automática via WebSockets** 🔥  
✅ **Suporte a múltiplas salas e personalização da interface** 🏢  
✅ **Design responsivo e alternância entre tema claro e escuro** 🌗  

---

## 🛠️ **Tecnologias Utilizadas**
### **🌐 Frontend**
- **React.js** ⚛️ - Interface dinâmica e reativa.  
- **TailwindCSS** 🎨 - Estilização moderna e responsiva.  
- **WebSockets (Socket.io)** 📡 - Comunicação em tempo real.  
- **Fetch API** 🔄 - Requisições HTTP para comunicação com o ESP32.  

### **🔧 Backend**
- **Node.js + Express** 🌍 - API para gerenciamento das requisições.  
- **Socket.io** 📡 - Comunicação bidirecional com a interface.  
- **ESP32 WebServer** 🔥 - Processamento de comandos e envio de sinais IR.  

### **📡 Hardware**
- **ESP32** 🤖 - Microcontrolador responsável pelo envio dos comandos IR.  
- **Módulo IR** 📡 - Transmissão e recepção de sinais infravermelhos.  
- **Sensores e LEDs** 💡 - Simulação do controle de dispositivos.  

---

## 🚀 **Instalação e Configuração**
### **1️⃣ Configuração do ESP32**
1. **Instale o [PlatformIO](https://platformio.org/) no VS Code**.  
2. Clone este repositório e abra a pasta no PlatformIO.  
3. Configure o arquivo `platformio.ini`:  
```ini
[env:esp32dev]
platform = espressif32
board = esp32dev
framework = arduino
monitor_speed = 115200

lib_deps =
    z3t0/IRremote@^3.9.0
    Links2004/WebSockets@^2.3.3
    bblanchon/ArduinoJson@^6.19.4
```
4. Compile e faça upload do código para o ESP32.  

---

### **2️⃣ Configuração do Servidor Backend (Opcional)**
Se estiver utilizando um **servidor Node.js** para gerenciar requisições, siga estes passos:  
```sh
git clone https://github.com/seu-repo/sistema-monitoramento-ar-condicionado.git
cd backend
npm install
node server.js
```
Isso iniciará o servidor na porta `3000`, permitindo comunicação com o ESP32.  

---

### **3️⃣ Configuração do Frontend**
Se estiver usando **React.js** como interface, siga estes passos:  
```sh
git clone https://github.com/seu-repo/frontend-controle-ar.git
cd frontend
npm install
npm start
```
Isso iniciará o frontend na porta `3000`, pronto para conectar ao ESP32.  

---

## 📡 **Como Funciona?**
1️⃣ **O ESP32 cria um servidor HTTP** e aceita comandos para ligar/desligar o ar-condicionado.  
2️⃣ **Os sinais IR são enviados pelo ESP32** para o controle do AC.  
3️⃣ **A interface web comunica-se com o ESP32** via WebSockets, garantindo **atualizações instantâneas**.  
4️⃣ **Os botões físicos no ESP32 também alteram o estado** e refletem no site automaticamente.  

---

## 📌 **Melhorias Futuras**
🔹 **Automação baseada em sensores de temperatura e presença**  
🔹 **Integração com assistentes virtuais (Alexa, Google Assistant)**  
🔹 **Monitoramento de consumo energético em tempo real**  
🔹 **Compatibilidade com múltiplos modelos de ar-condicionado**  

---

## 🤝 **Contribuição**
Contribuições são bem-vindas! Para colaborar:  
1️⃣ Faça um fork do repositório.  
2️⃣ Crie uma branch (`feature-nova-funcionalidade`).  
3️⃣ Envie um pull request!  

📩 **Dúvidas? Contate-me em** [victor.eng.dev@gmail.com](mailto:victor.eng.dev@gmail.com)  


