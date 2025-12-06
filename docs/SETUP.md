# Guia de Setup Local

## Pré-requisitos

- Node.js 22+ ([download](https://nodejs.org))
- PostgreSQL 14+ ou Neon (serverless)
- Git
- VSCode (recomendado)
- PlatformIO CLI (para firmware)

## Backend (Node.js + Express)

### 1. Clonar e Instalar

```bash
cd backend
npm install
```

### 2. Configurar Variáveis de Ambiente

Criar `.env`:
```bash
# Banco de dados
DATABASE_URL="postgresql://user:password@host:port/database?sslmode=require&channel_binding=require"

# JWT
JWT_SECRET="sua-chave-super-secreta-aqui"

# Servidor
NODE_ENV="development"
PORT=3001
```

**Obtendo DATABASE_URL:**
- Se usar Neon: copie a connection string do painel Neon
- Se usar local: `postgresql://postgres:password@localhost:5432/ac_monitor`

**JWT_SECRET:**
- Gere uma string aleatória: `openssl rand -base64 32`

### 3. Preparar Banco de Dados

```bash
# Criar/atualizar schema
npx prisma migrate dev

# (Opcional) Popular com dados de teste
npx prisma db seed
```

### 4. Iniciar Servidor

```bash
# Desenvolvimento (com nodemon)
npm run dev

# Produção
npm start
```

**Esperado:**
```
Conectando ao banco de dados...
DATABASE_URL preview: postgresql://user:***@host:5432/database?...
Conectado ao banco com sucesso.
🚀 Servidor rodando em http://localhost:3001
🕒 [executor] now = 2025-12-05T14:30:00.000Z
```

### 5. Testar Rotas

```bash
# Health check
curl http://localhost:3001

# Login (obter token)
curl -X POST http://localhost:3001/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@local","password":"123456"}'

# Listar ACs
curl -H "Authorization: Bearer TOKEN_AQUI" \
  http://localhost:3001/api/ac
```

## Frontend (React + Vite)

### 1. Clonar e Instalar

```bash
cd webapp
npm install
```

### 2. Configurar Variáveis de Ambiente

Criar `.env.local`:
```
VITE_API_URL=http://localhost:3001
```

### 3. Iniciar Desenvolvimento

```bash
npm run dev
```

Abrirá em `http://localhost:5173`

### 4. Build para Produção

```bash
npm run build
npm run preview  # Visualizar build
```

## Firmware (ESP32)

### 1. Instalar PlatformIO

```bash
# Via pip (recomendado)
pip install platformio

# Ou via VSCode Extension
# Marketplace → PlatformIO IDE
```

### 2. Configurar Placa e Porta

Editar `firmware/platformio.ini`:

```ini
[env:esp32dev]
platform = espressif32
board = esp32dev
framework = arduino
monitor_speed = 115200
upload_port = COM3      ; Ajuste para sua porta
monitor_port = COM3
lib_deps = 
  z3t0/IRremote@^3.9.0
  bblanchon/ArduinoJson@^6.19.4
  links2004/WebSockets@^2.6.1
```

**Encontrar porta:**
```bash
pio device list
```

### 3. Configurar WiFi

Editar `firmware/src/main.cpp`:

```cpp
const char *ssid = "SEU_WIFI_SSID";
const char *password = "SUA_SENHA_WIFI";
```

### 4. Compilar

```bash
cd firmware
pio run -e esp32dev
```

**Esperado:**
```
Building in release mode
...
RAM:   [==        ]  16.4% (used 53752 bytes from 327680 bytes)
Flash: [=======   ]  74.9% (used 981481 bytes from 1310720 bytes)
========================= [SUCCESS] Took 11.26 seconds =========================
```

### 5. Upload para ESP32

```bash
# Conectar ESP32 via USB
pio run -e esp32dev -t upload

# Se ficar pendurado: pressionar BOOT durante upload
```

### 6. Monitorar Logs

```bash
pio device monitor -p COM3 -b 115200
```

**Esperado:**
```
✅ Conectado ao Wi-Fi!
Endereço IP: 192.168.1.100
🕒 [executor] now = 2025-12-05T14:30:00.000Z
📡 Comando recebido do backend: TURN_ON
🟢 Executando: LIGAR
➡️ Sinal IR enviado para Ligar: 4372, 4336, ...
```

## Banco de Dados

### Via Neon (Recomendado)

1. Criar conta em [neon.tech](https://neon.tech)
2. Criar projeto PostgreSQL
3. Copiar connection string
4. Colar em `DATABASE_URL` no `.env`
5. Rodar: `npx prisma migrate deploy`

### Via PostgreSQL Local

```bash
# Instalar PostgreSQL
# Windows: https://www.postgresql.org/download/windows/
# Mac: brew install postgresql
# Linux: sudo apt install postgresql

# Iniciar serviço
# Windows: Services → PostgreSQL iniciar
# Mac: brew services start postgresql
# Linux: sudo systemctl start postgresql

# Criar banco
createdb ac_monitor

# Criar usuário
createuser -P ac_user  # Digite uma senha

# Atualizar .env
DATABASE_URL="postgresql://ac_user:senha@localhost:5432/ac_monitor"

# Rodar migrations
npx prisma migrate deploy
```

## Prisma (ORM)

### Comandos Úteis

```bash
# Ver schema
npx prisma studio

# Criar migration após mudar schema.prisma
npx prisma migrate dev --name nome_da_mudanca

# Reset banco (CUIDADO! Deleta dados)
npx prisma migrate reset

# Validar schema
npx prisma validate

# Gerar client (automático, mas às vezes precisa manual)
npx prisma generate
```

## Troubleshooting Local

### Backend não conecta ao banco

```
Error: Error parsing connection string: ...
```

**Solução:**
- Verificar `DATABASE_URL` está correto
- Usar formato: `postgresql://user:pass@host:5432/db?sslmode=require`
- Se local: `postgresql://user:pass@localhost:5432/db`

### Frontend não consegue chamar backend

```
GET http://localhost:3001/api/ac 404 (Not Found)
```

**Solução:**
- Verificar se backend está rodando (`npm run dev` na pasta backend)
- Verificar `VITE_API_URL=http://localhost:3001` em `.env.local`
- Verificar CORS habilitado no backend

### ESP32 não entra em bootloader

```
Connecting......................................
Failed to connect to ESP32
```

**Solução:**
1. Desconectar USB
2. Pressionar e segurar BOOT
3. Conectar USB (ainda segurando BOOT)
4. Soltar BOOT
5. Tentar upload novamente

### Porta COM não aparece

```
No port specified for upload. Please use upload_port.
```

**Solução:**
- Instalar driver CH340: [link](https://github.com/nodemcu/ch340g-usb-serial-driver)
- Ou usar CP2102 se outra versão do chip
- Reiniciar VSCode após instalar driver

## IDE Setup

### VSCode Extensions (Recomendadas)

```
ms-vscode.cpptools
ms-vscode.cmake-tools
platformio.platformio-ide
dbaeumer.vscode-eslint
esbenp.prettier-vscode
prisma.prisma
thunder-client.thunder-client
```

### Prettier (Formatting)

Criar `.prettierrc`:
```json
{
  "semi": true,
  "singleQuote": true,
  "tabWidth": 2,
  "trailingComma": "es5"
}
```

## Scripts Úteis

### Backend

```bash
npm run dev        # Iniciar com nodemon
npm run start      # Iniciar sem nodemon
npm run seed       # Popular banco com dados
npx prisma studio # Interface gráfica do banco
```

### Frontend

```bash
npm run dev        # Dev server
npm run build      # Build production
npm run preview    # Preview do build
npm run lint       # ESLint
```

### Firmware

```bash
pio run                        # Compilar
pio run -t upload              # Upload
pio device monitor             # Monitorar serial
pio run -t upload -t monitor   # Upload + monitor
pio update                     # Atualizar pacotes
```

## Próximos Passos

1. ✅ Instalar dependências
2. ✅ Configurar variáveis de ambiente
3. ✅ Iniciar backend (`npm run dev`)
4. ✅ Iniciar frontend (`npm run dev`)
5. ✅ Testar login com `admin@local` / `123456`
6. ⏳ Fazer upload do firmware no ESP32
7. ⏳ Capturar sinais IR reais do seu AC
8. ⏳ Testar integração completa

