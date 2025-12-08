# Intelifri - Sistema Inteligente de Monitoramento de Ar Condicionado

Este repositório contém o sistema completo para monitoramento e controle inteligente de unidades de ar condicionado:

- backend: API Node.js + Express com Prisma e Postgres
- webapp: frontend React + Vite
- firmware: código para microcontroladores (PlatformIO)
- js, lib, test: scripts e utilitários auxiliares

Visão rápida

- O backend expõe endpoints para autenticação, gerenciamento de salas/unidades, heartbeats e agendamentos.
- O frontend consome a API (via JWT) e fornece telas para gerenciamento e agendamento.
- O firmware (ESP/MCU) se comunica via HTTP com o backend (heartbeat) e aplica comandos pendentes.

Quickstart (desenvolvimento)

1. Backend

```powershell
cd backend
npm install
cp .env.example .env   # ajustar DATABASE_URL, JWT_SECRET
npm run dev
```

2. Webapp

```powershell
cd webapp
npm install
npm run dev
```

3. Firmware

- Abrir a pasta `firmware/` no VSCode com extensão PlatformIO e carregar no dispositivo.

Observações

- Migrations do Prisma estão em `backend/prisma/migrations`. Use `npx prisma migrate dev` para aplicar em dev.
- Scripts úteis para inspeção rápida: `backend/scripts/listSchedules.js` e `backend/scripts/showAC.js`.
- Agendamentos: o backend possui um executor (polling) que marca schedules como EXECUTADO e grava `pendingCommand` na tabela `AirConditioner`. Dispositivos consultam via `/api/heartbeat`.

Próximos passos sugeridos

- Implementar validação adicional no backend para evitar agendamentos no passado.
- Adicionar testes automatizados (unit/e2e) e CI.

Licença

Arquivo de exemplo — adicione sua licença se necessário.
