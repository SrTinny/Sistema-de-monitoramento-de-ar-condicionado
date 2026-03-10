# Troubleshooting essencial

## Backend não inicia

### JWT ausente

Sintoma: erro de `JWT_SECRET`.  
Ação: definir `JWT_SECRET` em `backend/.env` e reiniciar `npm run dev`.

### Banco indisponível

Sintoma: falha de conexão PostgreSQL.  
Ação:

1. revisar `DATABASE_URL`
2. testar acesso ao banco
3. rodar `npx prisma migrate dev`

## Frontend não carrega dados

Sintoma: tela abre, mas sem dados da API.  
Ação: criar `webapp/.env.local` com `VITE_API_URL=http://localhost:3001`.

## Firmware não aparece no sistema

Sintoma: upload ok, mas sem atualização no painel.  
Ação:

1. monitorar com `pio device monitor`
2. validar `BACKEND_URL` em `firmware/platformio.ini`
3. regravar firmware (`pio run -t upload`)

## Erro de porta serial ocupada (Windows)

Sintoma: `PermissionError(13)` no upload.  
Ação: fechar monitor/processos PlatformIO e tentar novamente.

## Bug conhecido aberto (delete de AC)

- Ao clicar em deletar um AC das Salas de Controle pela primeira vez, ele aparece em Salas Disponíveis e depois volta para Salas de Controle (incorreto).
- Ao clicar em deletar o AC que voltou para Salas de Controle, ele some de vez sem aparecer em Salas Disponíveis (incorreto).

Status: pendente de correção em código.
