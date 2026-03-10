# Setup local (essencial)

## Pré-requisitos

- Node.js 18+
- PostgreSQL (local ou Neon)
- PlatformIO

## 1) Backend

```powershell
cd backend
npm install
```

Criar `backend/.env`:

```env
DATABASE_URL="postgresql://user:password@host:5432/db"
JWT_SECRET="valor-seguro"
PORT=3001
```

Executar:

```powershell
npx prisma migrate dev
npm run dev
```

## 2) Webapp

```powershell
cd webapp
npm install
```

Criar `webapp/.env.local`:

```env
VITE_API_URL=http://localhost:3001
```

Executar:

```powershell
npm run dev
```

## 3) Firmware

```powershell
cd firmware
pio run
pio run -t upload
pio device monitor
```

Primeira configuração de rede:

1. Conectar no AP `AC-SETUP-XXXXXX`
2. Abrir `http://192.168.4.1`
3. Informar SSID/senha da rede local

## 4) Verificação rápida

- `http://localhost:3001` retorna health check
- Webapp abre em `http://localhost:5173`
- Dispositivo aparece em `GET /api/rooms` após heartbeat
