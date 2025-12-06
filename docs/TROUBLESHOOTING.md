# Troubleshooting & FAQ

## Problemas Comuns

### Backend (Node.js + Express)

#### ❌ "Error: secretOrPrivateKey must have a value"

**Sintoma**: Erro ao tentar fazer login
```
Error: secretOrPrivateKey must have a value
```

**Causa**: `JWT_SECRET` não configurada na variável de ambiente

**Solução**:
- **Local**: Adicionar em `.env`:
  ```
  JWT_SECRET=sua-chave-super-secreta-aqui
  ```
- **Render**: Settings → Environment Variables → Adicionar `JWT_SECRET`

---

#### ❌ "Error parsing connection string: invalid domain character"

**Sintoma**: Erro ao conectar no banco
```
PrismaClientInitializationError: Error parsing connection string: 
invalid domain character in database URL
```

**Causa**: `DATABASE_URL` com valores placeholder ou inválido

**Solução**:
```bash
# ❌ Errado (placeholder)
DATABASE_URL="postgresql://SEU_USUARIO:***@SEU_HOST:PORT/SEU_DATABASE"

# ✅ Correto (valores reais)
DATABASE_URL="postgresql://neondb_owner:abcd1234@ep-soft-brook-admmp8yg-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require"
```

**Como obter URL correta:**
- **Neon**: Login → Project → Connection string → Copiar
- **Local**: `postgresql://user:pass@localhost:5432/dbname`

---

#### ❌ "ECONNREFUSED 127.0.0.1:5432"

**Sintoma**: Não consegue conectar ao PostgreSQL local
```
Error: Error connecting to server: ECONNREFUSED 127.0.0.1:5432
```

**Causa**: PostgreSQL não está rodando

**Solução**:
- **Windows**: Services → PostgreSQL → Start
- **Mac**: `brew services start postgresql`
- **Linux**: `sudo systemctl start postgresql`

**Verificar:**
```bash
psql -U postgres -c "SELECT 1"  # Deve retornar 1
```

---

#### ❌ "Cannot GET /"

**Sintoma**: Ao acessar URL do backend, aparece erro 404
```
Cannot GET /
```

**Causa**: Rota raiz não implementada

**Solução**: ✅ Já foi adicionado (`GET /` → retorna status)

Se continuar, rodar:
```bash
npm install && npm run dev
```

---

#### ❌ "CORS error" no navegador

**Sintoma**: Frontend não consegue chamar backend
```
Access to XMLHttpRequest at 'http://localhost:3001/...' 
from origin 'http://localhost:3000' has been blocked by CORS policy
```

**Causa**: CORS não configurado

**Solução**: Backend já tem CORS habilitado. Se problema persistir:
```bash
# Verificar se servidor está rodando
curl http://localhost:3001/

# Deve retornar JSON, não erro
```

---

#### ❌ "Cannot find module 'dotenv'"

**Sintoma**: Erro ao iniciar servidor
```
Error: Cannot find module 'dotenv'
```

**Causa**: Dependências não instaladas

**Solução**:
```bash
cd backend
npm install
npm run dev
```

---

### Frontend (React + Vite)

#### ❌ "VITE_API_URL is undefined"

**Sintoma**: Console mostra `undefined` para API URL
```
🔗 API Base URL: undefined
```

**Causa**: Variável de ambiente não definida

**Solução**:
- **Vercel**: Settings → Environment Variables → Adicionar `VITE_API_URL`
- **Local**: Criar `webapp/.env.local`:
  ```
  VITE_API_URL=http://localhost:3001
  ```

**Teste**:
```bash
cd webapp
echo "VITE_API_URL=http://localhost:3001" > .env.local
npm run dev
```

---

#### ❌ "Failed to load resource: 404"

**Sintoma**: Requisições à API retornam 404
```
GET https://sistema-de-monitoramento-de-ar.onrender.com/api/ac 404
```

**Causas possíveis:**
1. Backend offline
2. URL backend incorreta
3. Rota não existe

**Solução**:
1. Verificar se backend está online:
   ```bash
   curl https://sistema-de-monitoramento-de-ar.onrender.com/
   # Deve retornar JSON
   ```

2. Verificar URL em `webapp/.env.local` ou Vercel
   ```bash
   # Deve ser exatamente
   VITE_API_URL=https://sistema-de-monitoramento-de-ar.onrender.com
   ```

3. Se local, verificar se backend está rodando:
   ```bash
   cd backend && npm run dev
   ```

---

#### ❌ "Redirected to login, but still seeing login page"

**Sintoma**: Token parece inválido, fica em loop de login

**Causa**: Token expirado (8h) ou inválido

**Solução**:
1. Limpar localStorage:
   ```javascript
   localStorage.clear()
   ```

2. Fazer login novamente

3. Se erro persistir, verificar console para mensagens detalhadas

---

#### ❌ "404 Not Found" ao pressionar F5 no celular

**Sintoma**: Ao fazer refresh no celular, aparece 404
```
Failed to load resource: the server responded with a status of 404
```

**Causa**: Vercel não configurado para SPA routing

**Solução**: ✅ Já foi adicionado (`vercel.json` com rewrites)

Se continuar:
1. Verificar `webapp/vercel.json` tem seção `rewrites`:
   ```json
   {
     "rewrites": [
       {
         "source": "/(.*)",
         "destination": "/index.html"
       }
     ]
   }
   ```

2. Redeploy na Vercel:
   - Dashboard → Deployments → 3 pontos → Redeploy

---

#### ❌ "CSP violation" - Fonts/scripts bloqueadas

**Sintoma**: Console mostra avisos de Content Security Policy
```
Executing inline script violates CSP directive 'default-src 'none''
Loading stylesheet violates CSP directive
```

**Causa**: CSP headers muito restritivo

**Solução**: ✅ Já foi adicionado (`vercel.json` com CSP apropriado)

Se continuar, verificar `webapp/vercel.json`:
```json
{
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "Content-Security-Policy",
          "value": "default-src 'self'; script-src 'self' 'unsafe-inline' https://fonts.googleapis.com; ..."
        }
      ]
    }
  ]
}
```

---

### Firmware (ESP32)

#### ❌ "Failed to connect to ESP32: No serial data received"

**Sintoma**: Upload falha com timeout
```
Connecting......................................
Failed to connect to ESP32: No serial data received.
```

**Causa**: ESP32 não entra em bootloader

**Solução (Método 1):**
1. Desconectar USB
2. Pressionar e segurar **BOOT** (ou **BOOTSEL**)
3. Conectar USB (mantendo BOOT pressionado)
4. Soltar BOOT
5. Fazer upload novamente

**Solução (Método 2):**
1. Verificar porta COM:
   ```bash
   pio device list
   ```
2. Atualizar `platformio.ini`:
   ```ini
   upload_port = COM3  ; Ajuste para sua porta
   ```

**Solução (Método 3):**
1. Instalar driver CH340/CP2102:
   - https://github.com/nodemcu/ch340g-usb-serial-driver
2. Tentar com outro cabo USB (alguns são só de carregamento)

---

#### ❌ "Board espressif32 unknown"

**Sintoma**: Erro ao compilar
```
Error: board 'esp32dev' is unknown
```

**Causa**: PlatformIO não tem plataforma ESP32

**Solução**:
```bash
pio platform install espressif32
pio run -e esp32dev
```

---

#### ❌ "Library IRremote not found"

**Sintoma**: Erro ao compilar
```
.pio/libdeps/esp32dev/IRremote not found
```

**Causa**: Biblioteca não instalada

**Solução**:
```bash
# Em firmware/
pio lib install "IRremote@^3.9.0"
pio run -e esp32dev
```

Ou editar `platformio.ini`:
```ini
lib_deps = 
  z3t0/IRremote@^3.9.0
  bblanchon/ArduinoJson@^6.19.4
  links2004/WebSockets@^2.6.1
```

---

#### ❌ "WiFi não conecta"

**Sintoma**: Serial mostra tentando conectar, mas não consegue
```
...................
✗ WiFi não conectou
```

**Causa**: SSID/password incorretos

**Solução**:
1. Editar `src/main.cpp`:
   ```cpp
   const char *ssid = "SEU_SSID_AQUI";
   const char *password = "SUA_SENHA_AQUI";
   ```

2. Verificar se WiFi é 2.4GHz (ESP32 não suporta 5GHz)

3. Recompile e upload:
   ```bash
   pio run -e esp32dev -t upload
   ```

4. Monitorar:
   ```bash
   pio device monitor
   ```

---

#### ❌ "Backend não responde"

**Sintoma**: Serial mostra erro ao fazer heartbeat
```
❌ Erro na requisição heartbeat: 404
```

**Causa**: Backend offline, URL incorreta, ou rota `/api/heartbeat` não existe

**Solução**:
1. Verificar backend está online:
   ```bash
   curl https://sistema-de-monitoramento-de-ar.onrender.com/
   # Deve retornar JSON
   ```

2. Verificar URL em `main.cpp`:
   ```cpp
   const char *backendURL = "https://sistema-de-monitoramento-de-ar.onrender.com";
   ```

3. Verificar logs do Render:
   - Render Dashboard → seu service → Logs

4. Se usando backend local, deve estar rodando:
   ```bash
   cd backend && npm run dev
   ```

---

#### ❌ "IR signal não funciona"

**Sintoma**: AC não liga/desliga quando firmware envia sinal

**Causa**: 
- Sinais IR incorretos
- Pinos errados
- Hardware defeituoso

**Solução**:

**Opção 1: Capturar sinais reais**
1. Apontar receptor IR para controle remoto do AC
2. Pressionar LIGAR
3. Ver no serial:
   ```
   📡 Sinal IR recebido:
   4372, 4336, 568, 1572, ...
   ```
4. Copiar valores
5. Colar em `irSignalLigar[]` em `main.cpp`
6. Recompile e upload

**Opção 2: Verificar pinos**
```cpp
// Verificar se pinos estão corretos para seu ESP32
#define txPinIR 26      // Transmissor (ajustar se necessário)
#define rxPinIR 4       // Receptor

// Alguns ESP32 têm restrições de pinos:
// GPIO 0, 2: boot pins (use com cuidado)
// GPIO 6-11: reserved para flash
// GPIO 34-39: input-only
```

**Opção 3: Testar com oscilloscope/analisador**
- Medir se sinal está sendo enviado em GPIO26
- Verificar frequência (deve ser ~38kHz para IR)

---

#### ❌ "Cannot allocate memory for task"

**Sintoma**: Erro ao iniciar
```
xTaskCreatePinnedToCore failed: ...
```

**Causa**: RAM insuficiente

**Solução**:
1. Reduzir tamanho de stacks em `xTaskCreatePinnedToCore`:
   ```cpp
   // Antes:
   xTaskCreatePinnedToCore(handleBackendPolling, "...", 8192, NULL, ...);
   
   // Depois (reduzir para 4096):
   xTaskCreatePinnedToCore(handleBackendPolling, "...", 4096, NULL, ...);
   ```

2. Mover IR arrays para PROGMEM:
   ```cpp
   const uint16_t irSignalLigar[] PROGMEM = { ... };
   ```

---

### Banco de Dados (Neon)

#### ❌ "too many connections"

**Sintoma**: Erro ao conectar ao banco
```
Error: too many connections
```

**Causa**: Pool de conexões esgotado

**Solução**:
1. Usar connection pooling (PgBouncer):
   - Neon → Project settings → Connection pooling → Enable

2. Aumentar limite em Neon dashboard

---

#### ❌ "Password authentication failed"

**Sintoma**: Erro ao conectar ao banco
```
Error: password authentication failed
```

**Causa**: Senha incorreta

**Solução**:
1. Verificar password em `DATABASE_URL`
2. Resetar password em Neon dashboard
3. Gerar nova connection string

---

### Git & Repositório

#### ❌ "Permission denied" ao fazer push

**Sintoma**: Erro ao fazer push
```
Permission denied (publickey).
fatal: Could not read from remote repository.
```

**Causa**: SSH key não configurada

**Solução**:
```bash
# Usar HTTPS em vez de SSH
git remote set-url origin https://github.com/SrTinny/Sistema-de-monitoramento-de-ar-condicionado.git

# Ou gerar SSH key:
ssh-keygen -t ed25519 -C "seu-email@example.com"
# Adicionar chave em GitHub → Settings → SSH and GPG keys
```

---

#### ❌ "Uncommitted changes"

**Sintoma**: Não consegue fazer pull/push
```
error: your local changes to the following files would be overwritten by merge
```

**Solução**:
```bash
# Ver mudanças
git status

# Stash (salvar temporariamente)
git stash

# Ou descartar
git restore .

# Depois fazer pull
git pull
```

---

## Performance & Otimização

### Frontend é Lento

**Solução:**
1. Verificar Network tab no DevTools (F12)
   - Se API lenta: problema é backend
   - Se muito JS: problema é bundle size

2. Build otimizado:
   ```bash
   npm run build
   npm run preview  # Visualizar
   ```

3. Usar lighthouse no DevTools

---

### Backend responde lento

**Solução:**
1. Verificar logs do Render:
   - Render dashboard → Logs
   - Procurar por operações lentas no banco

2. Otimizar queries Prisma:
   ```javascript
   // ❌ Lento (N+1 query)
   const acs = await prisma.airConditioner.findMany();
   acs.forEach(ac => console.log(ac.room.name)); // Extra query!

   // ✅ Rápido (include)
   const acs = await prisma.airConditioner.findMany({
     include: { room: true }
   });
   ```

3. Adicionar índices no banco:
   ```prisma
   model AirConditioner {
     id String @id @default(cuid())
     deviceId String @unique
     // ...
     @@index([lastHeartbeat])  // Para queries por heartbeat
   }
   ```

---

### Firmware travando

**Solução:**
1. Verificar stack overflow:
   - Aumentar tamanho de stack em `xTaskCreatePinnedToCore`

2. Verificar watchdog timer:
   - Adicionar `vTaskDelay()` em loops críticos
   - Não fazer operações bloqueantes

3. Monitorar memory:
   ```cpp
   Serial.println(esp_get_free_heap_size());  // RAM livre
   ```

---

## Logs Detalhados

### Como Ativar Verbose Logging

**Backend:**
```bash
NODE_ENV=development npm run dev  # Já ativa mais logs
```

**Frontend (DevTools):**
```javascript
// No console do DevTools:
localStorage.setItem('DEBUG', 'app:*');
location.reload();
```

**Firmware:**
```bash
pio run -e esp32dev -v  # Verbose durante build
pio device monitor -p COM3 -b 115200 -v  # Verbose no monitor
```

---

## Recursos Úteis

| Recurso | Link |
|---------|------|
| Docs ESP32 | https://docs.espressif.com/projects/esp-idf/en/latest/esp32/ |
| Arduino IR | https://github.com/Arduino-IRremote/Arduino-IRremote |
| Prisma | https://www.prisma.io/docs |
| React | https://react.dev |
| Express | https://expressjs.com |
| Neon | https://neon.tech/docs |
| Render | https://render.com/docs |
| Vercel | https://vercel.com/docs |

---

## Quando Tudo Mais Falhar

1. **Verificar logs completamente:**
   ```bash
   # Backend
   cd backend && npm run dev
   
   # Frontend
   cd webapp && npm run dev
   
   # Firmware
   pio device monitor
   ```

2. **Testar cada camada isoladamente:**
   - Backend: `curl http://localhost:3001/`
   - Frontend: `http://localhost:5173/`
   - Firmware: Serial output deve mostrar WiFi conectado

3. **Resetar tudo:**
   ```bash
   # Backend
   npx prisma migrate reset  # CUIDADO! Deleta dados
   
   # Frontend
   rm -rf node_modules && npm install
   
   # Firmware
   rm -rf .pio && pio run
   ```

4. **Procurar em issues do GitHub:**
   - https://github.com/SrTinny/Sistema-de-monitoramento-de-ar-condicionado/issues

5. **Contactar autor** (se aberto para suporte)

