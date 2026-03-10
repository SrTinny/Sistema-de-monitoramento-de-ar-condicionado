# Prisma

Arquivos de banco de dados do backend.

- Schema: `schema.prisma`
- Migrações: `migrations/`

## Comandos

```powershell
npx prisma generate
npx prisma migrate dev
npx prisma db push
npx prisma studio
```

Requisito: `DATABASE_URL` configurada em `backend/.env`.
