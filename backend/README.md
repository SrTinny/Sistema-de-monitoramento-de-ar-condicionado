# Backend

API principal do projeto (Node.js + Express + Prisma).

## Rodar em desenvolvimento

```powershell
cd backend
npm install
npm run dev
```

## Variáveis obrigatórias (`backend/.env`)

```env
DATABASE_URL="postgresql://..."
JWT_SECRET="..."
PORT=3001
```

## Comandos úteis

```powershell
npx prisma generate
npx prisma migrate dev
npm run seed
```

Documentação da API: `../docs/API.md`.
