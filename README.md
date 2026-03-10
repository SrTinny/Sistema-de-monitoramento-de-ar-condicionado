# Intelifri

Sistema de monitoramento e controle de ar-condicionado com backend, webapp e firmware ESP.

## Estrutura

- `backend/`: API Node.js + Express + Prisma
- `webapp/`: Frontend React + Vite
- `firmware/`: Firmware ESP8266/ESP32 (PlatformIO)

## Início rápido

### 1. Backend

```powershell
cd backend
npm install
# criar backend/.env com DATABASE_URL e JWT_SECRET
npm run dev
```

### 2. Webapp

```powershell
cd webapp
npm install
# criar webapp/.env.local com VITE_API_URL=http://localhost:3001
npm run dev
```

### 3. Firmware

```powershell
cd firmware
pio run
pio run -t upload
```

## Documentação essencial

- `docs/SETUP.md`: configuração local passo a passo
- `docs/API.md`: endpoints principais da API
- `docs/TROUBLESHOOTING.md`: falhas comuns e diagnóstico rápido

## Bug conhecido (ainda não corrigido)

- Ao clicar em deletar um AC das Salas de Controle pela primeira vez, ele aparece em Salas Disponíveis e depois volta para Salas de Controle (comportamento incorreto).
- Ao clicar em deletar o AC que voltou para Salas de Controle, ele some de vez sem aparecer em Salas Disponíveis (comportamento incorreto).
