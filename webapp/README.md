# Webapp (React + Vite)

Pasta `webapp/` contém o frontend em React, empacotado com Vite.

Como rodar

```powershell
cd webapp
npm install
npm run dev
```

Notas

- Endereço padrão: `http://localhost:5173` (Vite pode usar outra porta se ocupado).
- Dependências notáveis: `date-fns` (usado para formatação de datas nos agendamentos).
- Contexts: `src/contexts/*` (AuthContext, RoomContext) orchestram estado e chamadas à API.
- Páginas: `src/pages/` — contém `agendamentos`, `home`, `Login`, etc.

Testes / lint

- Não há testes automatizados por enquanto. Recomendado adicionar ESLint/Prettier e CI.
