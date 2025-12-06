# Sistema de Monitoramento de Ar-Condicionado - Visão Geral

## 📋 Descrição do Projeto

Sistema IoT completo para monitoramento e controle remoto de ar-condicionado via web. A arquitetura consiste em:

- **Frontend (Webapp)**: Interface React hospedada no Vercel
- **Backend (API REST)**: Node.js + Express + Prisma hospedado no Render
- **Firmware (ESP32)**: Microcontrolador que controla o AC via sinal IR
- **Banco de Dados**: PostgreSQL (Neon) para persistência

## 🏗️ Arquitetura

```
┌─────────────────────────────────────────────────────────┐
│                   USUÁRIO (Celular/PC)                 │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
        ┌────────────────────────┐
        │   WEBAPP (Vercel)      │
        │   - React + Vite       │
        │   - React Router       │
        │   - Context API        │
        └────────────┬───────────┘
                     │ HTTP/REST
                     ▼
        ┌────────────────────────┐
        │   BACKEND (Render)     │
        │   - Node.js + Express  │
        │   - Prisma ORM         │
        │   - JWT Auth           │
        │   - Schedule Executor  │
        └────────────┬───────────┘
                     │ HTTP/REST
         ┌───────────┴───────────┐
         ▼                       ▼
    ┌─────────────┐      ┌──────────────────┐
    │ PostgreSQL  │      │ ESP32 Firmware   │
    │ (Neon)      │      │ - WiFi + IR      │
    │             │      │ - Polling 30s    │
    └─────────────┘      │ - WebServer      │
                         └──────────────────┘
                              │ IR Signal
                              ▼
                        ┌──────────────┐
                        │ AC Unit      │
                        │ (Controlled) │
                        └──────────────┘
```

## 🔄 Fluxo de Comunicação

### 1. Usuário Aciona Comando no Webapp
```
Webapp → Backend: POST /api/ac/{id}/command
                  { "command": "TURN_ON" }
                  ↓
Backend: Salva em AirConditioner.pendingCommand
         Retorna 200 OK
```

### 2. ESP32 Faz Polling (a cada 30s)
```
Firmware → Backend: POST /api/heartbeat
                    { "deviceId": "esp32-dev-ac-01", "isOn": false }
                    ↓
Backend: Lê pendingCommand
         Retorna: { "command": "TURN_ON" }
         Limpa pendingCommand após envio
```

### 3. Firmware Executa Comando
```
Firmware: Recebe "TURN_ON"
          ↓
          IrSender.sendRaw(irSignalLigar, ...)
          ↓
          AC Liga
          ↓
Atualiza estadoAC = true
Envia WebSocket broadcast: "ligado"
```

### 4. Schedule Automático (Executor)
```
Backend: A cada 30s, verifica Schedule com status PENDING
         Se scheduledAt <= now:
         - Define pendingCommand no AC
         - Marca Schedule como EXECUTADO
         - Firmware pega na próxima polling
```

## 📚 Tecnologias Utilizadas

| Camada | Tecnologia | Versão | Função |
|--------|-----------|--------|--------|
| **Frontend** | React | 18.x | UI Interativa |
| | Vite | 5.x | Build Tool |
| | React Router | 6.x | Roteamento |
| | Axios | 1.x | HTTP Client |
| | TailwindCSS | 3.x | Estilos |
| **Backend** | Node.js | 22.x | Runtime |
| | Express | 4.x | Web Framework |
| | Prisma | 5.x | ORM |
| | JWT | jsonwebtoken | Autenticação |
| | bcrypt | 5.x | Hash de Senha |
| **Firmware** | Arduino | IDE/CLI | Plataforma |
| | PlatformIO | 6.x | Build System |
| | IRremote | 3.9.0 | Controle IR |
| | ArduinoJson | 6.x | Parsing JSON |
| | WebSockets | 2.7.1 | Comunicação Real-time |
| | HTTPClient | 2.0.0 | Requisições HTTP |
| **Infra** | PostgreSQL | 14+ | Banco de Dados |
| | Vercel | - | Deploy Frontend |
| | Render | - | Deploy Backend |
| | Neon | - | PostgreSQL Serverless |

## 🎯 Casos de Uso

### 1. Login de Usuário
- Usuário acessa webapp
- Digita email/senha
- Backend valida com JWT
- Usuário tem acesso ao dashboard

### 2. Controle Manual de AC
- Usuário clica "Ligar AC"
- Comando salvo em `pendingCommand`
- ESP32 busca na próxima polling (max 30s)
- AC liga

### 3. Agendamento de AC
- Usuário cria schedule: "ligar às 19:00"
- Backend armazena em banco
- Executor verifica a cada 30s
- No horário agendado, executor seta `pendingCommand`
- ESP32 busca e executa

### 4. Monitoramento
- Dashboard exibe lista de ACs
- Mostra status (ligado/desligado)
- Mostra último heartbeat
- Mostra agendamentos

## 📊 Modelo de Dados

### User
```
id: String (CUID)
email: String (único)
password: String (hash)
role: "ADMIN" | "USER"
createdAt: DateTime
updatedAt: DateTime
```

### AirConditioner
```
id: String (CUID)
deviceId: String (único, ex: "esp32-dev-ac-01")
name: String (ex: "AC Sala")
room: String (ex: "Sala de Estar")
isOn: Boolean (estado atual)
lastHeartbeat: DateTime (último contato)
pendingCommand: String | null ("TURN_ON", "TURN_OFF", null)
createdAt: DateTime
updatedAt: DateTime
```

### Schedule
```
id: String (CUID)
airConditionerId: String (FK)
action: "TURN_ON" | "TURN_OFF"
scheduledAt: DateTime (quando executar)
status: "PENDING" | "EXECUTED" | "CANCELLED"
createdAt: DateTime
updatedAt: DateTime
```

## 🔐 Autenticação

- **Tipo**: JWT (Bearer Token)
- **Armazenamento**: localStorage (no cliente)
- **Expiração**: 8 horas
- **Header**: `Authorization: Bearer <token>`

## 🌐 URLs Públicas

| Serviço | URL |
|---------|-----|
| Frontend | https://sistema-de-monitoramento-de-ar-condicionado-pyzlq2ol7.vercel.app |
| Backend API | https://sistema-de-monitoramento-de-ar.onrender.com |
| Docs | Este repositório |

## 📞 Contato & Suporte

Para dúvidas sobre o projeto, consulte a documentação em `/docs`.
