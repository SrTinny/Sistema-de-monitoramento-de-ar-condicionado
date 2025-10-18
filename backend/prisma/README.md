# Prisma (schema & migrations)

Local: `backend/prisma/`

- Arquivo principal: `schema.prisma` — modelagem do banco (AirConditioner, User, Schedule, etc).
- Migrações geradas em `migrations/`.

Comandos úteis

```powershell
# gerar client
npx prisma generate

# aplicar migrações em dev
npx prisma migrate dev --name <descrição>

# introspectar um banco existente
npx prisma db pull
```

Observações

- As migrations existentes incluem uma que adiciona a tabela `Schedule`.
- Antes de rodar `migrate dev`, confirme a variável `DATABASE_URL` no `.env`.
