# API essencial

Base local: `http://localhost:3001`  
Base produção: `https://sistema-de-monitoramento-de-ar.onrender.com`

## Autenticação

- `POST /auth/register`
- `POST /auth/login`
- `GET /auth/me` (com token)

Header para rotas protegidas:

```http
Authorization: Bearer <token>
```

## Endpoints principais

### Health

- `GET /`

### Salas/dispositivos

- `POST /api/rooms` (ADMIN)
- `GET /api/rooms`
- `GET /api/rooms/:id`
- `PUT /api/rooms/:id` (ADMIN)
- `DELETE /api/rooms/:id` (ADMIN)

### Comandos

- `POST /api/command`
- `POST /api/ac/:id/setpoint`
- `POST /api/rooms/:id/ir/learn` (ADMIN)
- `POST /api/rooms/:id/ir/learn/confirm` (ADMIN)

### Agendamentos

- `POST /api/schedules`
- `GET /api/schedules`
- `DELETE /api/schedules/:id`

### Heartbeat e rede

- `POST /api/heartbeat`
- `GET /api/devices/status`
- `GET /api/esp/discover`
- `POST /api/esp/configure`
- `GET /api/esp/:ip/networks`

## Códigos HTTP comuns

- `200` sucesso
- `201` criado
- `202` enfileirado
- `400` inválido
- `401` não autenticado
- `403` sem permissão
- `404` não encontrado
- `409` conflito
- `500` erro interno

Fonte de verdade: `backend/server.js`.
