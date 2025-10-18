# Backend (API)

Pasta `backend/` contém a API Node.js + Express, autenticação JWT e integração com Prisma/Postgres.

Principais pontos

- Entrypoint: `server.js`
- ORM: Prisma (schema em `prisma/schema.prisma`)
- Scripts úteis: `scripts/listSchedules.js`, `scripts/showAC.js`
- Agendamentos: existe um executor no servidor que roda periodicamente e processa agendamentos pendentes.

Como rodar (desenvolvimento)

```powershell
cd backend
npm install
cp .env.example .env
# configurar DATABASE_URL e JWT_SECRET no .env
npm run dev
```

Prisma

- Gerar cliente (após editar schema):

```powershell
npx prisma generate
```

- Rodar migrações (dev):

```powershell
npx prisma migrate dev
```

Notes

- Endpoints importantes: `/auth/*`, `/api/rooms`, `/api/schedules`, `/api/heartbeat`.
- Se precisar resetar o banco de dev, use `npx prisma migrate reset` (atenção: destrói dados).
