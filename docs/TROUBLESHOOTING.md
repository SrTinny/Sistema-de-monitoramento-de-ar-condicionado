# Guia de Solução de Problemas (Troubleshooting)

## 1 Problemas de Backend

### 1.1 Erro: "JWT_SECRET must have a value"

**Sintoma**:
```
Error: secretOrPrivateKey must have a value
```

**Causa**: Variável de ambiente `JWT_SECRET` não configurada ou vazia.

**Solução**:

1. Verificar arquivo `.env`:
```bash
echo $JWT_SECRET
```

2. Se vazio, gerar novo secret:
```bash
openssl rand -base64 32
```

3. Adicionar ao `.env`:
```
JWT_SECRET=seu_novo_secret_aqui
```

4. Reiniciar servidor:
```bash
npm run dev
```

**Prevenção**: Sempre definir `JWT_SECRET` antes de iniciar servidor.

### 1.2 Erro: "Cannot connect to database"

**Sintoma**:
```
Error: connect ECONNREFUSED 127.0.0.1:5432
```

**Causa**: Banco de dados PostgreSQL não está acessível.

**Solução**:

1. Verificar se PostgreSQL está rodando:
```bash
# Linux/Mac
pg_isready

# Windows
# Abrir Services.msc e verificar PostgreSQL service
```

2. Se usando Neon, verificar CONNECTION_URL em `.env`

3. Testar conectividade:
```bash
psql postgresql://user:password@host:port/database
```

4. Se problema persiste, criar novo banco:
```bash
createdb ac_monitor
```

**Prevenção**: Documentar credenciais do banco em arquivo seguro.

### 1.3 Erro: "Email already registered"

**Sintoma**:
```json
{
  "error": "Email já registrado"
}
```

**Causa**: Usuário com este email já existe no banco.

**Solução**:

1. Usar email diferente para novo registro

2. Se necessário remover usuário anterior (apenas desenvolvimento):
```bash
# Via Prisma Studio
npx prisma studio

# Encontrar usuário e deletar
```

3. Ou redefinir senha via banco de dados

**Prevenção**: Verificar email antes de registrar novo usuário.

### 1.4 Erro: "Request timeout"

**Sintoma**:
```
Error: Request timeout after 30000ms
```

**Causa**: Servidor levando muito tempo para responder.

**Solução**:

1. Verificar logs do servidor para gargalos
2. Verificar uso de CPU/RAM:
```bash
# Linux/Mac
top

# Windows
# Ctrl+Shift+Esc (Task Manager)
```

3. Se banco está lento:
   - Verificar índices: `\d tablename` no psql
   - Considerar migração para instância maior

4. Aumentar timeout no cliente (webapp):
```javascript
// Adicionar timeout em axios
axios.defaults.timeout = 60000;  // 60 segundos
```

**Prevenção**: Monitorar performance em desenvolvimento.

### 1.5 Erro: "CORS error"

**Sintoma**:
```
Access to XMLHttpRequest at 'http://localhost:3001/api/ac' 
from origin 'http://localhost:5173' has been blocked by CORS policy
```

**Causa**: CORS não configurado no backend.

**Solução**:

Se problema em desenvolvimento local (improvável, mas possível):

```javascript
// Em server.js, adicionar antes das rotas:
const cors = require('cors');
app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true
}));
```

Em produção (Vercel → Render), geralmente não é problema pois estão no mesmo domínio.

## 2 Problemas de Frontend

### 2.1 Erro: "VITE_API_URL is undefined"

**Sintoma**:
```
🔗 VITE_API_URL env: undefined
```

**Causa**: Variável de ambiente não configurada em tempo de build.

**Solução**:

1. **Desenvolvimento local**: Criar `.env.local` em `webapp/`:
```
VITE_API_URL=http://localhost:3001
```

2. **Vercel**: Adicionar em Project Settings → Environment Variables:
   - Key: `VITE_API_URL`
   - Value: `https://sistema-de-monitoramento-de-ar.onrender.com`

3. Rebuild/reiniciar:
```bash
npm run dev
```

**Prevenção**: Ter `.env.local` no `.gitignore` e documentar em `.env.example`.

### 2.2 Erro: "Cannot GET /login"

**Sintoma**: Página branca ao acessar `http://localhost:5173/login` após refresh (F5).

**Causa**: Vercel não está configurado para SPA (Single Page Application).

**Solução**:

Criar `webapp/vercel.json`:
```json
{
  "rewrites": [
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
```

Fazer deploy novamente:
```bash
git add vercel.json
git commit -m "Adicionar SPA rewrites"
git push
```

**Prevenção**: Configurar `vercel.json` no repositório.

### 2.3 Erro: "Content-Security-Policy violation"

**Sintoma**:
```
Refused to load the font 'https://fonts.googleapis.com/...' 
because it violates the following Content-Security-Policy directive
```

**Causa**: CSP headers muito restritivos.

**Solução**:

Atualizar `webapp/vercel.json`:
```json
{
  "headers": [{
    "source": "/(.*)",
    "headers": [{
      "key": "Content-Security-Policy",
      "value": "default-src 'self'; script-src 'self' 'unsafe-inline'; font-src 'self' https://fonts.googleapis.com; connect-src 'self' https://sistema-de-monitoramento-de-ar.onrender.com"
    }]
  }]
}
```

**Prevenção**: Documentar CSP requirements ao configurar novas dependências.

### 2.4 Erro: "Token expired"

**Sintoma**:
```
Error: 401 Unauthorized
Redirect to login page
```

**Causa**: JWT expirou após 8 horas.

**Solução**:

Fazer login novamente para obter novo token:
```
1. Clicar em "Sair" ou atualizar página
2. Login com email/senha
3. Novo token será armazenado em localStorage
```

**Prevenção** (futuro): Implementar refresh token para renovação automática.

### 2.5 Erro: Dados não carregam no dashboard

**Sintoma**:
- Página de login funciona
- Dashboard fica em branco ou mostra "Nenhum AC registrado"

**Causa**: 
1. Backend offline
2. API retornando erro
3. Dados não foram seeded

**Solução**:

1. Verificar se backend está online:
```bash
curl https://sistema-de-monitoramento-de-ar.onrender.com
```

2. Verificar logs no Render:
   - Acessar dashboard do Render
   - Ver seção "Logs"
   - Procurar por erros 500

3. Se local, rodar seed:
```bash
cd backend
npx prisma db seed
```

4. Verificar console do navegador (F12):
   - Aba "Network" - ver requisição para `/api/ac`
   - Aba "Console" - procurar por erros JavaScript

**Prevenção**: Fazer testes de integração antes de deploy.

## 3 Problemas de Firmware (ESP32)

### 3.1 Erro: "Failed to connect to ESP32: No serial data received"

**Sintoma**:
```
esptool.py v4.x
A fatal error occurred: Failed to connect to ESP32: No serial data received.
For troubleshooting steps visit: https://docs.espressif.com/...
```

**Causa**:
1. Porta COM incorreta
2. ESP32 não em modo bootloader
3. Cabo USB com problema
4. Driver USB não instalado

**Solução - Passo 1: Verificar Porta**:

```bash
pio device list
```

Identificar porta correta (ex: COM3, /dev/ttyUSB0).

Atualizar `platformio.ini`:
```ini
upload_port = COM3
monitor_port = COM3
```

**Solução - Passo 2: Modo Bootloader**:

Durante o upload, manter pressionado:
1. Botão **BOOT** (continuamente)
2. Clicar **EN** (Reset) uma vez
3. Soltar **BOOT** após aparecer "Connecting..."

Ou automaticamente se cabo está correto.

**Solução - Passo 3: Verificar Cabo/Driver**:

```bash
# Windows - listar portas seriais
mode

# Linux/Mac - listar portas
ls /dev/tty*

# Testar conexão básica
pio device monitor --port=COM3 --baud=115200
```

Se nenhuma porta aparecer: problema de driver ou cabo.

**Instalar Driver CP210x** (USB-to-UART):
- Baixar: https://www.silabs.com/developers/usb-to-uart-bridge-vcp-drivers
- Instalar para seu SO
- Reiniciar computador
- Tentar novamente

**Prevenção**: Usar cabo USB original de qualidade.

### 3.2 Erro: "WiFi connecting... loop infinito"

**Sintoma**:
```
WiFi connecting...
WiFi connecting...
WiFi connecting...
(continua indefinidamente)
```

**Causa**: Credenciais WiFi incorretas ou rede não disponível.

**Solução**:

1. Verificar SSID e senha em `firmware/src/main.cpp`:
```cpp
const char *ssid = "NOME_DA_REDE";
const char *password = "SENHA";
```

2. Confirmar que rede está 2.4 GHz (ESP32 não suporta 5 GHz)

3. Recompilar e fazer upload:
```bash
cd firmware
pio run -e esp32dev -t upload --upload-port=COM3
```

4. Monitorar saída serial:
```bash
pio device monitor --port=COM3
```

**Se ainda assim falhar**:

Editar `firmware/src/main.cpp`, função `setupWiFi()`:
```cpp
// Aumentar timeout
WiFi.begin(ssid, password);
int maxAttempts = 40;  // Era 20, agora 40 (40 segundos)
int attempts = 0;

while (WiFi.status() != WL_CONNECTED && attempts < maxAttempts) {
  delay(1000);
  Serial.print(".");
  attempts++;
}
```

**Prevenção**: Testar rede antes de esperar firmware conectar.

### 3.3 Erro: "Heartbeat failed - connection timeout"

**Sintoma**:
```
[backend] Enviando heartbeat para backend...
[error] Connection timeout
```

**Causa**: Backend não está acessível da rede do ESP32.

**Solução**:

1. Verificar se backend está online:
```bash
# Do computador onde ESP32 está conectado
curl https://sistema-de-monitoramento-de-ar.onrender.com
```

2. Se localhost, verificar IP:
```bash
# No terminal do backend
echo "http://192.168.x.x:3001"
```

Atualizar em `firmware/src/main.cpp`:
```cpp
const char *backendURL = "http://192.168.1.x:3001";  // Se local
```

3. Se Render, adicionar delay para testes:
```cpp
// Em handleBackendPolling()
delay(5000);  // Dar 5 segundos para conexão estabilizar
```

**Prevenção**: Testar conectividade antes de rodar firmware em produção.

### 3.4 Erro: "insufficient memory"

**Sintoma**:
```
FAILED: src/main.cpp.o
error: 'ArduinoJson' undeclared
Stack overflow error
```

**Causa**: Stack overflow ou falta de memória.

**Solução**:

1. Aumentar heap do Arduino:
```cpp
// Em main.cpp, antes de setup()
extern "C" {
  void *_malloc_r(struct _reent *r, size_t sz) {
    return malloc(sz);
  }
}
```

2. Otimizar alocação de memória:
```cpp
// Usar StaticJsonDocument em vez de DynamicJsonDocument
StaticJsonDocument<256> doc;  // Melhor que DynamicJsonDocument
```

3. Mover arrays para PROGMEM (flash):
```cpp
const uint16_t irSignalLigar[] PROGMEM = { ... };
```

4. Verificar uso de stack em tasks:
```cpp
// Aumentar stack alocado
xTaskCreatePinnedToCore(
  handleBackendPolling,
  "Polling",
  8192,    // ERA 4096, AUMENTADO PARA 8192
  NULL,
  1,
  NULL,
  0
);
```

**Prevenção**: Compilar com `pio run` antes de fazer upload - ele verificará uso de memória.

### 3.5 Erro: "WiFi.h not found"

**Sintoma**:
```
fatal error: WiFi.h: No such file or directory
```

**Causa**: Plataforma Arduino não está configurada em c_cpp_properties.json.

**Solução**:

O VS Code mostra este erro mas **a compilação funciona** se usar PlatformIO CLI:

```bash
pio run -e esp32dev
```

Se realmente não compila, atualizar PlatformIO:

```bash
pio update
pio run -e esp32dev
```

Se ainda assim falhar, reiniciar VS Code completamente.

**Nota**: Este é um erro de IntelliSense (client-side), não do compilador.

## 4 Problemas de Integração

### 4.1 Cenário: Webapp conecta, mas commands não executam

**Sintoma**:
- Dashboard carrega, lista ACs
- Botão "Ligar" funciona no webapp
- Mas AC não ligaEsp32 não recebe comando

**Diagnóstico**:

1. Verificar heartbeat serial do ESP32:
```
✅ Heartbeat enviado com sucesso!
Resposta: {"command":"TURN_ON",...}
```

Se `command` é `"none"`, backend não tem pendingCommand.

2. Verificar logs do backend:
```bash
# Render dashboard → Logs
# Procurar por "pendingCommand"
```

3. Testar POST direto:
```bash
curl -X POST https://sistema-de-monitoramento-de-ar.onrender.com/api/ac/{id}/command \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"command":"TURN_ON"}'
```

**Solução**:

Se command é `"none"`:
- Verificar se `pendingCommand` foi limpo após envio anterior
- Reenviar comando
- Aguardar próximo heartbeat (máximo 30 segundos)

Se erro na resposta:
- Verificar token JWT válido
- Verificar ID do AC correto
- Consultar logs do Render para erro detalhado

### 4.2 Cenário: Agendamento não executa automaticamente

**Sintoma**:
- Schedule criado com sucesso
- Horário chegou
- Mas AC não ligou

**Diagnóstico**:

1. Verificar logs do backend no horário agendado:
```
[executor] Checando schedules...
[executor] Schedule due: TURN_ON para AC xyz
[executor] Setting pendingCommand
```

Se não aparecer, executor não está rodando.

2. Verificar status do schedule:
```bash
# Via Prisma Studio
npx prisma studio

# Procurar por Schedule
# Status deve estar "PENDING" antes do horário
```

**Solução**:

1. Se executor não está rodando:
   - Verificar se `setInterval` está no `server.js`
   - Verificar logs de startup

2. Se schedule tem status errado:
   - Deletar e recriar schedule
   - Verificar timezone do servidor (UTC vs local)

3. Teste manual:
```bash
# Ir diretamente para o horário do schedule no banco
UPDATE schedules SET scheduledAt = NOW() - INTERVAL '1 second' WHERE id = 'xxx';

# Aguardar 30 segundos e verificar se pendingCommand foi setado
```

### 4.3 Cenário: Sinal IR transmitido mas AC não responde

**Sintoma**:
- Serial mostra "📡 Transmitindo sinal IR: LIGAR"
- Mas AC não ligaledAC não pisca

**Diagnóstico**:

1. Verificar se sinal está sendo gerado:
   - Apontar smartphone camera para LED IR
   - Ao transmitir, LED deve piscar (visível em câmera mesmo se IR invisível ao olho)

2. Verificar se sinais capturados estão corretos:
```cpp
// Verificar irSignalLigar[] e irSignalDesligar[]
// Devem ser arrays grandes (100+ elementos) com valores 500-10000
```

Se arrays estão vazios ou muito pequenos:
- Sinais não foram capturados corretamente
- Rever seção 4.5 de FIRMWARE.md

**Solução**:

1. Recapturar sinais do AC original:
   - Acessar `http://esp32_ip/ir`
   - Pressionar botão ligar do controle
   - Copiar array completo
   - Substituir em `main.cpp`

2. Se problema persiste:
   - Verificar pino do transmissor (GPIO 26)
   - Verificar voltagem (deve ser 3.3V)
   - Medir com voltímetro se sinal está presente

## 5 Matriz de Decisão de Troubleshooting

| Problema | Verificar Primeiro | Ação Recomendada | Referência |
|----------|-------------------|------------------|-----------|
| Backend não sobe | JWT_SECRET | Gerar novo secret | 1.1 |
| Frontend branco | VITE_API_URL | Configurar env | 2.1 |
| ESP32 não conecta | Porta COM | Identificar porta correta | 3.1 |
| WiFi loop infinito | SSID/Password | Atualizar credenciais | 3.2 |
| Comando não executa | heartbeat logs | Verificar pendingCommand | 4.1 |
| Sinal IR falha | LED piscando | Recapturar sinais | 4.3 |

## 6 Logs Esperados por Componente

### 6.1 Backend (expected output)

```
Conectando ao banco de dados...
DATABASE_URL preview: postgresql://user:***@host:5432/database?...
Conectado ao banco com sucesso.
🚀 Servidor rodando em http://localhost:3001
🕒 [executor] now = 2025-12-05T14:30:00.000Z
```

### 6.2 Frontend (expected output - F12 console)

```
🔗 API Base URL: http://localhost:3001
🔗 VITE_API_URL env: http://localhost:3001
✅ Login bem-sucedido
```

### 6.3 Firmware (expected output - serial monitor)

```
WiFi connecting...
Connected! IP: 192.168.1.100
WebSocket server listening on port 81
Backend URL: https://sistema-de-monitoramento-de-ar.onrender.com
Iniciando heartbeat polling...
📡 Enviando heartbeat para backend...
✅ Heartbeat enviado com sucesso!
🕒 Resposta: {"command":"none",...}
```

## 7 Recursos de Ajuda Externos

- **ESP32 Troubleshooting**: https://docs.espressif.com/projects/esptool/en/latest/troubleshooting.html
- **Prisma Docs**: https://www.prisma.io/docs/
- **React Documentation**: https://react.dev
- **Express.js Guide**: https://expressjs.com/

## 8 Conclusão

Este guia cobre os principais cenários de problema encontrados durante desenvolvimento. Se problema não está listado, consultar logs específicos do componente e trabalhar retroativamente a partir das mensagens de erro.
