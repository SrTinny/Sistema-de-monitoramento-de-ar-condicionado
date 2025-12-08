# Especificação da Interface de Programação de Aplicação (API) REST

## 1 Informações Gerais

### 1.1 URL Base

- **Desenvolvimento**: `http://localhost:3001`
- **Produção**: `https://sistema-de-monitoramento-de-ar.onrender.com`

### 1.2 Protocolo

- **Protocolo**: HTTP/1.1 e HTTP/2
- **Formato de Dados**: JSON (application/json)
- **Codificação**: UTF-8

### 1.3 Autenticação

Todas as rotas (exceto autenticação pública) requerem autenticação via JWT (JSON Web Token).

**Formato de Header**:
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Duração do Token**: 8 horas

**Renovação**: Obter novo token através do endpoint `/auth/login`


| Código | Significado | Descrição |
|--------|-----------|-----------|
| 200 | OK | Requisição bem-sucedida |
| 201 | Created | Recurso criado com sucesso |
| 400 | Bad Request | Erro na requisição (validação) |
| 401 | Unauthorized | Token ausente ou inválido |
| 403 | Forbidden | Usuário sem permissão |
| 404 | Not Found | Recurso não encontrado |
| 500 | Internal Server Error | Erro do servidor |


### 3.1 Verificação de Disponibilidade

```http
GET /
```

**Descrição**: Verifica se o servidor está operacional.

**Autenticação**: Não requerida
**Response (200)**:
```json
{
  "message": "Sistema de Monitoramento de AR Condicionado - Backend OK",
  "timestamp": "2025-12-05T14:30:00.000Z",
  "status": "operational"
}
```

### 3.2 Registro de Novo Usuário

 - `"TURN_ON"` ou "ligar": Ligar unidade
 - `"TURN_OFF"` ou "desligar": Desligar unidade
 - `"set_temp:XX"`: Ajustar setpoint para XX°C (16-30)
```

**Descrição**: Cria novo usuário no sistema.

**Autenticação**: Não requerida

**Request Body**:
```json
{
  "email": "usuario@example.com",
  "password": "senha_segura_123"
}
```

**Response (201)**:
```json
{
  "id": "clp7u8w3r000208ml74a52b3h",
  "email": "usuario@example.com",
  "role": "USER",
  "createdAt": "2025-12-05T14:30:00.000Z"

### 4.7 Alterar Setpoint de Temperatura

```http
POST /api/ac/{id}/setpoint
```

**Descrição**: Define o setpoint (temperatura alvo) para a unidade.

**Parâmetros de URL**:
- `id` (string, obrigatório): Identificador único da unidade (ID do AC, não o `deviceId`)

**Autenticação**: Requerida

**Request Body**:
```json
{
  "setpoint": 23
}
```

**Validação**:
- `setpoint` deve ser numérico entre 16 e 30.

**Response (200)**:
```json
{
  "message": "Setpoint alterado para 23°C",
  "setpoint": 23,
  "pendingCommand": "set_temp:23"
}
```

**Processo**:
1. Armazena `setpoint` no AC e define `pendingCommand` como `set_temp:XX`.
2. Firmware coleta o comando no próximo heartbeat e ajusta o setpoint local.
}
```

**Respostas de Erro**:
- `400`: Email já registrado ou senha fraca
- `500`: Erro ao criar usuário

### 3.3 Autenticação de Usuário

```http
POST /auth/login
```

**Descrição**: Autentica usuário e retorna token JWT.

**Autenticação**: Não requerida

**Request Body**:
```json
{
  "email": "admin@local",
  "password": "123456"
}
```

**Response (200)**:
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "clp7u8w3r000208ml74a52b3h",
    "email": "admin@local",
    "role": "ADMIN"
  }
}
```

**Respostas de Erro**:
- `401`: Email ou senha incorretos
- `400`: Email ou senha ausentes

## 4 Endpoints de Ar-Condicionador

### 4.1 Listar Todas as Unidades

```http
GET /api/ac
```

**Descrição**: Retorna lista de todas as unidades de ar-condicionado do usuário.

**Autenticação**: Requerida

**Response (200)**:
```json
[
  {
    "id": "clp7u8w3r000208ml74a52b3h",
    "deviceId": "esp32-dev-ac-01",
    "name": "AC Sala de Estar",
    "room": "Sala",
    "isOn": true,
    "lastHeartbeat": "2025-12-05T14:29:15.000Z",
    "pendingCommand": null,
    "createdAt": "2025-12-01T10:00:00.000Z",
    "updatedAt": "2025-12-05T14:30:00.000Z"
  },
  {
    "id": "clp7u8w3r000208ml74a52b3i",
    "deviceId": "esp32-dev-ac-02",
    "name": "AC Quarto",
    "room": "Quarto",
    "isOn": false,
    "lastHeartbeat": "2025-12-05T14:28:50.000Z",
    "pendingCommand": null,
    "createdAt": "2025-12-02T14:00:00.000Z",
    "updatedAt": "2025-12-05T14:30:00.000Z"
  }
]
```

### 4.2 Obter Detalhes de Unidade Específica

```http
GET /api/ac/{id}
```

**Descrição**: Retorna informações detalhadas de uma unidade específica.

**Parâmetros de URL**:
- `id` (string, obrigatório): Identificador único da unidade

**Autenticação**: Requerida

**Response (200)**:
```json
{
  "id": "clp7u8w3r000208ml74a52b3h",
  "deviceId": "esp32-dev-ac-01",
  "name": "AC Sala de Estar",
  "room": "Sala",
  "isOn": true,
  "lastHeartbeat": "2025-12-05T14:29:15.000Z",
  "pendingCommand": null,
  "createdAt": "2025-12-01T10:00:00.000Z",
  "updatedAt": "2025-12-05T14:30:00.000Z"
}
```

**Respostas de Erro**:
- `404`: Unidade não encontrada

### 4.3 Registrar Nova Unidade

```http
POST /api/ac
```

**Descrição**: Cria nova unidade de ar-condicionado.

**Autenticação**: Requerida

**Request Body**:
```json
{
  "deviceId": "esp32-novo-ac-03",
  "name": "AC Cozinha",
  "room": "Cozinha"
}
```

**Response (201)**:
```json
{
  "id": "clp7u8w3r000208ml74a52b3j",
  "deviceId": "esp32-novo-ac-03",
  "name": "AC Cozinha",
  "room": "Cozinha",
  "isOn": false,
  "lastHeartbeat": null,
  "pendingCommand": null,
  "createdAt": "2025-12-05T14:30:00.000Z",
  "updatedAt": "2025-12-05T14:30:00.000Z"
}
```

**Respostas de Erro**:
- `400`: Campos obrigatórios ausentes
- `400`: deviceId já existe

### 4.4 Atualizar Informações da Unidade

```http
PUT /api/ac/{id}
```

**Descrição**: Atualiza nome ou localização da unidade.

**Parâmetros de URL**:
- `id` (string, obrigatório): Identificador único da unidade

**Autenticação**: Requerida

**Request Body**:
```json
{
  "name": "AC Sala de Estar (Novo)",
  "room": "Sala Principal"
}
```

**Response (200)**:
```json
{
  "id": "clp7u8w3r000208ml74a52b3h",
  "deviceId": "esp32-dev-ac-01",
  "name": "AC Sala de Estar (Novo)",
  "room": "Sala Principal",
  "isOn": true,
  "lastHeartbeat": "2025-12-05T14:29:15.000Z",
  "pendingCommand": null,
  "createdAt": "2025-12-01T10:00:00.000Z",
  "updatedAt": "2025-12-05T14:30:01.000Z"
}
```

### 4.5 Remover Unidade

```http
DELETE /api/ac/{id}
```

**Descrição**: Remove unidade de ar-condicionado do sistema.

**Parâmetros de URL**:
- `id` (string, obrigatório): Identificador único da unidade

**Autenticação**: Requerida

**Response (200)**:
```json
{
  "message": "AC removido com sucesso"
}
```

**Respostas de Erro**:
- `404`: Unidade não encontrada

### 4.6 Enviar Comando Imediato

```http
POST /api/ac/{id}/command
```

**Descrição**: Envia comando de ligar/desligar para unidade específica.

**Parâmetros de URL**:
- `id` (string, obrigatório): Identificador único da unidade

**Autenticação**: Requerida

**Request Body**:
```json
{
  "command": "TURN_ON"
}
```

**Valores Válidos para command**:
- `"TURN_ON"`: Ligar unidade
- `"TURN_OFF"`: Desligar unidade

**Response (200)**:
```json
{
  "message": "Comando enviado para o AC",
  "pendingCommand": "TURN_ON",
  "ac": {
    "id": "clp7u8w3r000208ml74a52b3h",
    "name": "AC Sala de Estar",
    "isOn": true,
    "lastHeartbeat": "2025-12-05T14:29:15.000Z",
    "pendingCommand": "TURN_ON"
  }
}
```

**Processo**:
1. Comando é armazenado em campo `pendingCommand`
2. Firmware busca comando na próxima operação de heartbeat (máximo 30 segundos)
3. Firmware executa comando transmitindo sinal IR
4. Campo `pendingCommand` é limpo após execução

## 5 Endpoints de Operação de Heartbeat

### 5.1 Heartbeat do Firmware

```http
POST /api/heartbeat
```

**Descrição**: Operação de sincronização periódica do firmware com backend.

**Autenticação**: Não requerida (dispositivo autenticado via deviceId)

**Request Body**:
```json
{
  "deviceId": "esp32-dev-ac-01",
  "isOn": true
}
```

**Response (200)**:
```json
{
  "command": "TURN_ON",
  "isOn": true,
  "lastHeartbeat": "2025-12-05T14:30:15.000Z"
}
```

**Possíveis Valores de Comando**:
- `"TURN_ON"`: Ligar o ar-condicionado
- `"TURN_OFF"`: Desligar o ar-condicionado
- `"none"`: Nenhum comando pendente

**Frequência Recomendada**: A cada 30 segundos (implementado no firmware)

## 6 Endpoints de Agendamentos

### 6.1 Listar Agendamentos

```http
GET /api/schedules
```

**Descrição**: Retorna lista de agendamentos do usuário.

**Autenticação**: Requerida

**Response (200)**:
```json
[
  {
    "id": "clp7u8w3r000208ml74a52b3k",
    "airConditionerId": "clp7u8w3r000208ml74a52b3h",
    "action": "TURN_ON",
    "scheduledAt": "2025-12-05T19:00:00.000Z",
    "status": "PENDING",
    "createdAt": "2025-12-05T14:00:00.000Z",
    "updatedAt": "2025-12-05T14:00:00.000Z"
  }
]
```

### 6.2 Criar Agendamento

```http
POST /api/schedules
```

**Descrição**: Cria novo agendamento de operação automática.

**Autenticação**: Requerida

**Request Body**:
```json
{
  "airConditionerId": "clp7u8w3r000208ml74a52b3h",
  "action": "TURN_ON",
  "scheduledAt": "2025-12-05T19:00:00Z"
}
```

**Response (201)**:
```json
{
  "id": "clp7u8w3r000208ml74a52b3k",
  "airConditionerId": "clp7u8w3r000208ml74a52b3h",
  "action": "TURN_ON",
  "scheduledAt": "2025-12-05T19:00:00.000Z",
  "status": "PENDING",
  "createdAt": "2025-12-05T14:30:00.000Z",
  "updatedAt": "2025-12-05T14:30:00.000Z"
}
```

### 6.3 Atualizar Agendamento

```http
PUT /api/schedules/{id}
```

**Descrição**: Modifica agendamento existente.

**Response (200)**:
```json
{
  "id": "clp7u8w3r000208ml74a52b3k",
  "action": "TURN_OFF",
  "scheduledAt": "2025-12-05T22:00:00.000Z",
  "status": "PENDING"
}
```

### 6.4 Remover Agendamento

```http
DELETE /api/schedules/{id}
```

**Descrição**: Remove agendamento (marca como CANCELLED).

**Response (200)**:
```json
{
  "message": "Schedule cancelado com sucesso"
}
```

## 7 Modelos de Dados

### 7.1 User

```
{
  id: String (CUID)
  email: String (único)
  password: String (hash bcrypt)
  role: "ADMIN" | "USER"
  createdAt: DateTime
  updatedAt: DateTime
}
```

### 7.2 AirConditioner

```
{
  id: String (CUID)
  deviceId: String (único)
  name: String
  room: String
  isOn: Boolean
  temperature: Float | null
  setpoint: Float | null
  lastHeartbeat: DateTime | null
  pendingCommand: "TURN_ON" | "TURN_OFF" | "set_temp:XX" | null
  createdAt: DateTime
  updatedAt: DateTime
}
```

### 7.3 Schedule

```
{
  id: String (CUID)
  airConditionerId: String (FK)
  action: "TURN_ON" | "TURN_OFF"
  scheduledAt: DateTime
  status: "PENDING" | "EXECUTED" | "CANCELLED"
  createdAt: DateTime
  updatedAt: DateTime
}
```

## 8 Exemplos de Uso com cURL

### Login e Obtenção de Token

```bash
curl -X POST http://localhost:3001/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@local",
    "password": "123456"
  }'
```

Resposta contém `token` a ser usado em requisições subsequentes.

### Listar ACs com Token

```bash
curl -H "Authorization: Bearer TOKEN_AQUI" \
  http://localhost:3001/api/ac
```

### Enviar Comando de Ligar

```bash
curl -X POST http://localhost:3001/api/ac/DEVICE_ID/command \
  -H "Authorization: Bearer TOKEN_AQUI" \
  -H "Content-Type: application/json" \
  -d '{
    "command": "TURN_ON"
  }'
```

### Simular Heartbeat do Firmware

```bash
curl -X POST http://localhost:3001/api/heartbeat \
  -H "Content-Type: application/json" \
  -d '{
    "deviceId": "esp32-dev-ac-01",
    "isOn": true
  }'
```

## 9 Tratamento de Erros

Todos os erros retornam JSON com formato padronizado:

```json
{
  "error": "Mensagem de erro descritiva",
  "statusCode": 400
}
```

**Exemplos**:

```json
{
  "error": "Token inválido ou expirado",
  "statusCode": 401
}
```

```json
{
  "error": "AC não encontrado",
  "statusCode": 404
}
```

## 10 Rate Limiting

Não implementado atualmente. Consultar TODO.md para melhorias futuras.

## 11 Conclusão

A API REST fornece interface completa para gerenciamento de sistema de ar-condicionado. Toda comunicação é realizada via HTTP com autenticação JWT para endpoints protegidos.
