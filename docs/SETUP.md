# Guia de Configuração do Ambiente de Desenvolvimento

## 1 Pré-requisitos

As seguintes ferramentas devem estar instaladas no ambiente de desenvolvimento:

| Ferramenta | Versão | Propósito |
|-----------|--------|----------|
| Node.js | 22+ | Runtime JavaScript |
| PostgreSQL | 14+ | Sistema gerenciador de banco de dados (ou Neon serverless) |
| Git | Qualquer | Controle de versão |
| Visual Studio Code | Qualquer | Editor de código (recomendado) |
| PlatformIO CLI | 6.x | Ferramenta de build para firmware |

**Instruções de Instalação**:
- Node.js: https://nodejs.org
- PostgreSQL: https://www.postgresql.org/download/
- Git: https://git-scm.com/
- VS Code: https://code.visualstudio.com/
- PlatformIO: `pip install platformio` (requer Python 3.x)

## 2 Configuração do Banco de Dados

### 2.1 Opção 1: PostgreSQL Local

Criar banco de dados local:

```bash
createdb ac_monitor
```

Ou via psql:

```sql
CREATE DATABASE ac_monitor;
```

String de conexão:
```
postgresql://postgres:password@localhost:5432/ac_monitor
```

### 2.2 Opção 2: Neon Serverless (Recomendado)

1. Criar conta em https://neon.tech
2. Criar novo projeto
3. Copiar connection string do painel
4. Formatar como: `postgresql://user:password@host/database?sslmode=require`

## 3 Configuração do Backend

### 3.1 Instalação de Dependências

```bash
cd backend
npm install
```

### 3.2 Variáveis de Ambiente

Criar arquivo `.env` na raiz do diretório `backend/`:

```bash
# Banco de dados
DATABASE_URL="postgresql://user:password@host:port/database"

# Autenticação JWT
JWT_SECRET="gerar-com-openssl-rand-base64-32"

# Ambiente
NODE_ENV="development"
PORT=3001
```

**Geração de JWT_SECRET Seguro**:

```bash
openssl rand -base64 32
```

**Obtenção de DATABASE_URL**:
- Neon: Copiar da dashboard do projeto
- Local: `postgresql://postgres:password@localhost:5432/ac_monitor`

### 3.3 Inicialização do Banco de Dados

Executar migrações do Prisma:

```bash
npx prisma migrate dev
```

Este comando:
1. Cria as tabelas conforme schema.prisma
2. Aplica todas as migrações da pasta `migrations/`
3. Gera tipos TypeScript para cliente Prisma

**Carregar dados de teste** (opcional):

```bash
npx prisma db seed
```

Dados carregados:
- Usuário ADMIN: `admin@local` / `123456`
- Usuário normal: `user@local` / `123456`
- 2 unidades de AC de teste
- 3 agendamentos de teste

### 3.4 Iniciar Servidor Backend

**Modo desenvolvimento** (com recarregamento automático):

```bash
npm run dev
```

**Modo produção**:

```bash
npm start
```

**Saída Esperada**:

```
Conectando ao banco de dados...
DATABASE_URL preview: postgresql://user:***@host:5432/database?...
Conectado ao banco com sucesso.
🚀 Servidor rodando em http://localhost:3001
🕒 [executor] now = 2025-12-05T14:30:00.000Z
```

### 3.5 Validação de Conectividade

Testar endpoints do backend:

```bash
# Health check
curl http://localhost:3001

# Autenticação (obter JWT)
curl -X POST http://localhost:3001/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@local","password":"123456"}'

# Listar ACs (substituir TOKEN_AQUI)
curl -H "Authorization: Bearer TOKEN_AQUI" \
  http://localhost:3001/api/ac
```

## 4 Configuração do Frontend

### 4.1 Instalação de Dependências

```bash
cd webapp
npm install
```

### 4.2 Variáveis de Ambiente

Criar arquivo `.env.local` na raiz do diretório `webapp/`:

```bash
VITE_API_URL=http://localhost:3001
```

### 4.3 Iniciar Servidor de Desenvolvimento

```bash
npm run dev
```

**Saída Esperada**:

```
  VITE v5.x.x  build tool

  ➜  Local:   http://localhost:5173/
  ➜  press h to show help
```

### 4.4 Acessar Aplicação

Abrir navegador em `http://localhost:5173`

**Credenciais de Teste**:
- Email: `admin@local`
- Senha: `123456`

## 5 Configuração do Firmware

### 5.1 Instalação de PlatformIO

**Via pip** (recomendado):

```bash
pip install platformio
```

**Verificar instalação**:

```bash
pio --version
```

### 5.2 Preparar Placa Fisicamente

Conectar a placa alvo ao computador via USB.

Identificar porta COM:

```bash
pio device list
```

Saída esperada:

```
/dev/cu.SLAB_USBtoUART - Silicon Labs CP210x USB to UART Bridge
COM3 - USB Serial Device (VID: 10C4, PID: EA60)
```

### 5.3 Atualizar Credenciais WiFi

Editar `firmware/src/main.cpp`, aproximadamente linha 15:

```cpp
const char *ssid = "SEU_SSID_AQUI";
const char *password = "SUA_SENHA_AQUI";
```

Substituir com credenciais reais da rede.

### 5.4 Compilar Firmware

Compilação padrão (usa `default_envs` de `platformio.ini`):

```bash
cd firmware
pio run
```

Compilação explícita por ambiente (avançado):

```bash
cd firmware
pio run -e esp8266dev
pio run -e esp32dev
```

**Esperado**:

```
Compiling .pio/build/esp32dev/src/main.cpp.o
Linking .pio/build/esp32dev/firmware.elf
RAM:   [===       ]  16.4% (used 53752 bytes from 327680 bytes)
Flash: [=======   ]  74.9% (used 981481 bytes from 1310720 bytes)
```

### 5.5 Upload do Firmware

Upload padrão (recomendado, sem COM fixa):

```bash
pio run -t upload
```

O PlatformIO detecta automaticamente a porta quando há apenas uma placa conectada.

Upload explícito por ambiente e porta (avançado):

```bash
pio run -e esp8266dev -t upload --upload-port=COM3
pio run -e esp32dev -t upload --upload-port=COM3
```

Use `--upload-port` apenas quando necessário (múltiplas portas/dispositivos conectados).

**Durante o upload**:
1. PlatformIO compila o projeto
2. Inicia comunicação serial com a placa alvo
3. Transfere binário para flash
4. Reseta device

**Se falhar**: Consultar seção de troubleshooting em TROUBLESHOOTING.md

### 5.6 Monitorar Saída Serial

Após upload bem-sucedido:

```bash
pio device monitor
```

Se houver mais de uma porta serial ativa, informe a porta manualmente:

```bash
pio device monitor --port=COM3
```

**Esperado**:

```
WiFi connecting...
Connected! IP: 192.168.1.100
WebSocket server listening on port 81
Backend URL: https://sistema-de-monitoramento-de-ar.onrender.com
Iniciando heartbeat polling...
```

## 6 Teste Integrado (Local)

### 6.1 Verificar Componentes

1. **Backend**: Acessar http://localhost:3001 - deve retornar JSON
2. **Frontend**: Acessar http://localhost:5173 - deve exibir tela de login
3. **Firmware**: Saída serial deve mostrar "WiFi connecting..."

### 6.2 Fluxo de Login

1. Abrir http://localhost:5173
2. Inserir credenciais: `admin@local` / `123456`
3. Clicar "Entrar"
4. Verificar se redireciona para dashboard

### 6.3 Listar ACs

No dashboard, aguardar carregamento da lista de ACs. Devem aparecer ACs do seed ou criados manualmente.

### 6.4 Teste de Agendamento

1. Ir para aba "Agendamentos"
2. Clicar "+ Novo Agendamento"
3. Preencher formulário
4. Salvar
5. Verificar se aparece na lista

## 7 Implantação em Produção

### 7.1 Deploy do Backend (Render)

1. Fazer push para GitHub
2. Conectar repositório ao Render
3. Configurar variáveis de ambiente:
   - `DATABASE_URL`: String de conexão PostgreSQL (Neon)
   - `JWT_SECRET`: Chave segura gerada
4. Render fará deploy automático

**URL Esperada**: `https://sistema-de-monitoramento-de-ar.onrender.com`

### 7.2 Deploy do Frontend (Vercel)

1. Fazer push para GitHub
2. Conectar repositório ao Vercel
3. Configurar variável de ambiente:
   - `VITE_API_URL`: `https://sistema-de-monitoramento-de-ar.onrender.com`
4. Vercel fará deploy automático

**URL Esperada**: `https://sistema-de-monitoramento-de-ar-condicionado-*.vercel.app`

### 7.3 Firmware em Produção

Atualizar em `firmware/src/main.cpp`:

```cpp
const char *backendURL = "https://sistema-de-monitoramento-de-ar.onrender.com";
```

Recompilar e fazer upload para a placa final.

## 8 Checklist de Validação

- [ ] Node.js 22+ instalado: `node --version`
- [ ] Git instalado: `git --version`
- [ ] PostgreSQL/Neon acessível
- [ ] Backend iniciando sem erros
- [ ] Frontend carregando em localhost:5173
- [ ] Login funcionando
- [ ] Dashboard exibindo ACs
- [ ] PlatformIO CLI instalado: `pio --version`
- [ ] Firmware compilando sem erros
- [ ] Firmware fazendo upload com sucesso
- [ ] Saída serial mostrando conexão WiFi

## 9 Estrutura de Diretórios após Setup

```
Sistema-de-monitoramento-de-ar-condicionado/
├── backend/
│   ├── .env (configurar)
│   ├── node_modules/
│   ├── prisma/
│   ├── server.js
│   └── package.json
├── webapp/
│   ├── .env.local (configurar)
│   ├── node_modules/
│   ├── src/
│   └── package.json
├── firmware/
│   ├── src/main.cpp (atualizar WiFi)
│   ├── platformio.ini
│   └── .pio/build/
└── docs/
    ├── OVERVIEW.md
    ├── API.md
    └── ...
```

## 10 Próximos Passos

Após configuração bem-sucedida:

1. Consultar OVERVIEW.md para entender arquitetura
2. Ler API.md para documentação de endpoints
3. Consultar FIRMWARE.md para detalhes de hardware
4. Usar TROUBLESHOOTING.md se encontrar problemas

## 11 Suporte

Para problemas específicos, consulte TROUBLESHOOTING.md que contém 20+ cenários comuns de resolução.
