# Sistema de Monitoramento e Controle de Ar-Condicionado

Este projeto consiste em um sistema web integrado com um ESP32 para monitorar e controlar salas equipadas com ar-condicionado. O sistema permite ligar e desligar o ar-condicionado (representado por um LED conectado ao ESP32) e alterar informações diretamente pela interface web.

---

## 🖥️ Funcionalidades
- Ligar e desligar o ar-condicionado (LED) via interface web.
- Visualizar o estado atual de cada sala (ligado/desligado).
- Alterar a temperatura simulada e configurar salas pela interface.
- Adicionar novas salas dinamicamente.
- Alternar entre tema claro e escuro na interface.
- Design responsivo para uso em diferentes dispositivos.

---

## 🛠️ Tecnologias Utilizadas
### Frontend
- **HTML5** e **CSS3**: Estrutura e estilo da interface.
- **JavaScript**: Controle de eventos e comunicação com o ESP32.
- **Fetch API**: Realização de requisições HTTP para o ESP32.

### Backend
- **ESP32**: Microcontrolador configurado como servidor HTTP para responder a comandos de ligar e desligar um LED.

---
