# Documentação da API REST

## Base URL

- **Desenvolvimento**: `http://localhost:3001`
- **Produção**: `https://sistema-de-monitoramento-de-ar.onrender.com`

## Autenticação

Todas as rotas (exceto login/register) requerem header:
```
Authorization: Bearer <token>
```

Token é obtido via `/auth/login` com 8 horas de expiração.

## Status Codes

- `200` - OK
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized (token inválido/expirado)
- `403` - Forbidden (sem permissão)
- `404` - Not Found
- `500` - Server Error

---

## Rotas Públicas

### Health Check

```http
GET /
```

Verifica se servidor está online.

**Response (200):**
```json
{
  "message": "Sistema de Monitoramento de AR Condicionado - Backend OK",
  "timestamp": "2025-12-05T14:30:00.000Z",
  "status": "operational"
}
```

### Registro de Usuário

```http
POST /auth/register
Content-Type: application/json

{
  "email": "newuser@example.com",
  "password": "senha123",
  "role": "USER"
}
```

**Response (201):**
```json
{
  "id": "clpf1a2b3c4d5e6f7g8h",
  "email": "newuser@example.com",
  "role": "USER"
}
```

**Errors:**
- `400` - Email obrigatório, senha obrigatória
- `400` - Usuário com este e-mail já existe

---

### Login

```http
POST /auth/login
Content-Type: application/json

{
  "email": "admin@local",
  "password": "123456"
}
```

**Response (200):**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Errors:**
- `401` - Credenciais inválidas
- `500` - Erro ao processar login

---

## Rotas Autenticadas (Requer Token)

### Listar Todos os ACs

```http
GET /api/ac
Authorization: Bearer <token>
```

**Response (200):**
```json
[
  {
    "id": "clpf1a2b3c4d5e6f7g8h",
    "deviceId": "esp32-ac-sala",
    "name": "AC Sala",
    "room": "Sala de Estar",
    "isOn": false,
    "lastHeartbeat": "2025-12-05T14:25:00.000Z",
    "pendingCommand": null,
    "createdAt": "2025-10-10T02:51:44.000Z",
    "updatedAt": "2025-12-05T14:25:00.000Z"
  },
  {
    "id": "clpf1a2b3c4d5e6f7g9i",
    "deviceId": "esp32-ac-quarto",
    "name": "AC Quarto",
    "room": "Quarto",
    "isOn": true,
    "lastHeartbeat": "2025-12-05T14:28:00.000Z",
    "pendingCommand": null,
    "createdAt": "2025-10-10T02:51:44.000Z",
    "updatedAt": "2025-12-05T14:28:00.000Z"
  }
]
```

---

### Obter AC Específico

```http
GET /api/ac/{id}
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "id": "clpf1a2b3c4d5e6f7g8h",
  "deviceId": "esp32-ac-sala",
  "name": "AC Sala",
  "room": "Sala de Estar",
  "isOn": false,
  "lastHeartbeat": "2025-12-05T14:25:00.000Z",
  "pendingCommand": null,
  "createdAt": "2025-10-10T02:51:44.000Z",
  "updatedAt": "2025-12-05T14:25:00.000Z"
}
```

**Errors:**
- `404` - AC não encontrado

---

### Criar AC

```http
POST /api/ac
Authorization: Bearer <token>
Content-Type: application/json

{
  "deviceId": "esp32-ac-novo",
  "name": "AC Sala 2",
  "room": "Sala Auxiliar"
}
```

**Response (201):**
```json
{
  "id": "clpf1a2b3c4d5e6f7g9j",
  "deviceId": "esp32-ac-novo",
  "name": "AC Sala 2",
  "room": "Sala Auxiliar",
  "isOn": false,
  "lastHeartbeat": null,
  "pendingCommand": null,
  "createdAt": "2025-12-05T14:30:00.000Z",
  "updatedAt": "2025-12-05T14:30:00.000Z"
}
```

**Errors:**
- `400` - Campos obrigatórios faltando

---

### Atualizar AC

```http
PUT /api/ac/{id}
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "AC Sala Principal",
  "room": "Sala Integrada"
}
```

**Response (200):**
```json
{
  "id": "clpf1a2b3c4d5e6f7g8h",
  "deviceId": "esp32-ac-sala",
  "name": "AC Sala Principal",
  "room": "Sala Integrada",
  "isOn": false,
  "lastHeartbeat": "2025-12-05T14:25:00.000Z",
  "pendingCommand": null,
  "createdAt": "2025-10-10T02:51:44.000Z",
  "updatedAt": "2025-12-05T14:30:00.000Z"
}
```

**Errors:**
- `404` - AC não encontrado

---

### Deletar AC

```http
DELETE /api/ac/{id}
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "message": "AC deletado com sucesso"
}
```

**Errors:**
- `404` - AC não encontrado

---

### Enviar Comando para AC

```http
POST /api/ac/{id}/command
Authorization: Bearer <token>
Content-Type: application/json

{
  "command": "TURN_ON"
}
```

**Comandos válidos:** `"TURN_ON"`, `"TURN_OFF"`

**Response (200):**
```json
{
  "message": "Comando enviado para o AC",
  "pendingCommand": "TURN_ON"
}
```

**Behavior:**
- Salva comando em `AirConditioner.pendingCommand`
- ESP32 busca na próxima polling (max 30s)
- Comando é executado e `pendingCommand` é limpado

**Errors:**
- `404` - AC não encontrado
- `400` - Comando inválido

---

## Heartbeat (Firmware ↔ Backend)

### Fazer Heartbeat

```http
POST /api/heartbeat
Content-Type: application/json

{
  "deviceId": "esp32-ac-sala",
  "isOn": true
}
```

**Response (200):**
```json
{
  "command": "TURN_OFF",
  "isOn": true,
  "lastHeartbeat": "2025-12-05T14:30:00.000Z"
}
```

**Ou se sem comando:**
```json
{
  "command": "none",
  "isOn": true,
  "lastHeartbeat": "2025-12-05T14:30:00.000Z"
}
```

**Backend behavior:**
- Atualiza `lastHeartbeat` do AC
- Retorna `pendingCommand` (se houver)
- Limpa `pendingCommand` após envio
- Atualiza `isOn` com valor enviado pelo firmware

**Errors:**
- `404` - AC com este deviceId não encontrado

---

## Schedules (Agendamentos)

### Listar Schedules

```http
GET /api/schedules
Authorization: Bearer <token>
```

**Response (200):**
```json
[
  {
    "id": "clpf1a2b3c4d5e6f7g8h",
    "airConditionerId": "clpf1a2b3c4d5e6f7g8h",
    "action": "TURN_ON",
    "scheduledAt": "2025-12-05T19:00:00.000Z",
    "status": "PENDING",
    "airConditioner": {
      "name": "AC Sala",
      "room": "Sala de Estar"
    },
    "createdAt": "2025-12-05T14:00:00.000Z",
    "updatedAt": "2025-12-05T14:00:00.000Z"
  }
]
```

---

### Criar Schedule

```http
POST /api/schedules
Authorization: Bearer <token>
Content-Type: application/json

{
  "airConditionerId": "clpf1a2b3c4d5e6f7g8h",
  "action": "TURN_ON",
  "scheduledAt": "2025-12-05T19:00:00Z"
}
```

**Response (201):**
```json
{
  "id": "clpf1a2b3c4d5e6f7g8i",
  "airConditionerId": "clpf1a2b3c4d5e6f7g8h",
  "action": "TURN_ON",
  "scheduledAt": "2025-12-05T19:00:00.000Z",
  "status": "PENDING",
  "createdAt": "2025-12-05T14:00:00.000Z",
  "updatedAt": "2025-12-05T14:00:00.000Z"
}
```

**Validações:**
- `airConditionerId` deve existir
- `action` deve ser "TURN_ON" ou "TURN_OFF"
- `scheduledAt` deve ser no futuro (ou agora)

**Errors:**
- `404` - AC não encontrado
- `400` - Ação inválida, data inválida

---

### Cancelar Schedule

```http
DELETE /api/schedules/{id}
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "message": "Schedule cancelado com sucesso"
}
```

**Errors:**
- `404` - Schedule não encontrado

---

### Atualizar Schedule

```http
PUT /api/schedules/{id}
Authorization: Bearer <token>
Content-Type: application/json

{
  "action": "TURN_OFF",
  "scheduledAt": "2025-12-05T20:00:00Z"
}
```

**Response (200):**
```json
{
  "id": "clpf1a2b3c4d5e6f7g8i",
  "airConditionerId": "clpf1a2b3c4d5e6f7g8h",
  "action": "TURN_OFF",
  "scheduledAt": "2025-12-05T20:00:00.000Z",
  "status": "PENDING",
  "updatedAt": "2025-12-05T14:05:00.000Z"
}
```

---

## Executor (Automático)

O backend executa um **executor** a cada 30 segundos que:

1. Busca schedules com `status = "PENDING"`
2. Verifica se `scheduledAt <= agora`
3. Se verdade:
   - Define `pendingCommand` no AC correspondente
   - Marca schedule como `EXECUTED`
   - Próximo heartbeat do firmware executa a ação

**Log do executor:**
```
🕒 [executor] now = 2025-12-05T14:30:00.000Z
🕒 [executor] found 1 pending schedules
✅ [executor] executed schedule: clpf1a2b3c4d5e6f7g8i for AC clpf1a2b3c4d5e6f7g8h
```

---

## Exemplo de Fluxo Completo

### 1. Login
```bash
curl -X POST http://localhost:3001/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@local","password":"123456"}'

# Retorna: { "token": "eyJhbGc..." }
```

### 2. Obter ACs
```bash
TOKEN="eyJhbGc..."
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:3001/api/ac

# Retorna lista de ACs
```

### 3. Enviar Comando
```bash
curl -X POST http://localhost:3001/api/ac/clpf1a2b3c4d5e6f7g8h/command \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"command":"TURN_ON"}'

# Retorna: { "message": "Comando enviado", "pendingCommand": "TURN_ON" }
```

### 4. ESP32 Faz Heartbeat
```bash
curl -X POST http://localhost:3001/api/heartbeat \
  -H "Content-Type: application/json" \
  -d '{"deviceId":"esp32-ac-sala","isOn":false}'

# Retorna: { "command": "TURN_ON", "isOn": false, ... }
```

### 5. AC Ligado, Próximo Heartbeat
```bash
# Alguns segundos depois, AC ligado, firmware envia:
curl -X POST http://localhost:3001/api/heartbeat \
  -H "Content-Type: application/json" \
  -d '{"deviceId":"esp32-ac-sala","isOn":true}'

# Retorna: { "command": "none", "isOn": true, ... }
```

---

## Erros Comuns

### Erro: Invalid JWT
```json
{
  "error": "Invalid JWT"
}
```
**Causa**: Token expirado ou malformado
**Solução**: Fazer login novamente

### Erro: Acesso Negado
```json
{
  "error": "Acesso negado. Rota apenas para administradores."
}
```
**Causa**: Usuário não é ADMIN
**Solução**: Criar usuário com role ADMIN

### Erro: AC não encontrado
```json
{
  "error": "AC não encontrado"
}
```
**Causa**: ID inválido ou AC deletado
**Solução**: Verificar ID na lista de ACs

---

## Rate Limits

Atualmente **não há rate limiting**. Em produção, adicionar:
- Login: 5 tentativas por 15 min
- General: 100 requisições por minuto

