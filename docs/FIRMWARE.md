# Especificação do Software Embarcado (Firmware) para ESP32

## 1 Requisitos de Hardware

### 1.1 Microcontrolador

| Especificação | Valor |
|---|---|
| Modelo | ESP32-DevKit-C ou equivalente |
| Processador | Dual-core Xtensa 32-bit |
| Frequência | 160-240 MHz (configurável) |
| RAM | 320 KB (SRAM) |
| Flash | 4 MB (típico) |
| WiFi | 802.11 b/g/n (2.4 GHz) |
| Bluetooth | BLE 4.2 |

### 1.2 Componentes Periféricos Necessários

#### 1.2.1 Transmissor Infravermelhos

- **Componente**: LED IR (comprimento de onda: 950 nm)
- **Pino**: GPIO 26 do ESP32
- **Resistor de Proteção**: 100Ω (obrigatório)
- **Transistor NPN**: 2N2222 ou equivalente (para amplificar sinal)

**Esquema de Conexão**:
```
GPIO26 → 10kΩ → Base transistor NPN
Emissor transistor → GND
Coletor transistor → LED IR (+) → 100Ω → 3.3V
LED IR (-) → GND
```

#### 1.2.2 Receptor Infravermelhos

- **Componente**: Fotodiodo IR com demodulador (TSOP38238 ou equivalente)
- **Pino**: GPIO 4 do ESP32
- **Alimentação**: 5V (com regulador LDO se necessário)

**Esquema de Conexão**:
```
5V → TSOP38238 (VCC)
GPIO4 → TSOP38238 (OUT)
GND → TSOP38238 (GND)
```

#### 1.2.3 Botões de Controle Manual

- **Botão Ligar**: GPIO 12 → GND
- **Botão Desligar**: GPIO 2 → GND
- **Resistor Pull-up**: Interno (habilitado em código)

**Proteção Recomendada**: Capacitor 100nF entre pino e GND para debouncing

### 1.3 Alimentação

- **Fonte de Energia**: USB 5V (durante desenvolvimento)
- **Produção**: Fonte 5V 2A com regulador 3.3V (AMS1117 ou equivalente)
- **Capacitores de Desacoplamento**: 100µF e 100nF próximos ao ESP32

## 2 Arquitetura do Software

### 2.1 Estrutura Geral

O firmware é organizado em camadas:

```
┌─────────────────────────────────────────┐
│     Interface Aplicação (API REST)      │
├─────────────────────────────────────────┤
│         Camada de Lógica de Negócio     │
│  - Execução de comandos IR              │
│  - Comunicação com backend              │
├─────────────────────────────────────────┤
│         Camada de Drivers de Hardware   │
│  - Transmissão IR (IRremote)            │
│  - Receptor IR (IRremote)               │
│  - WiFi (Arduino WiFi)                  │
├─────────────────────────────────────────┤
│         FreeRTOS Scheduler              │
│  - Gerenciamento de Tasks               │
│  - Sincronização entre núcleos          │
└─────────────────────────────────────────┘
```

### 2.2 Estrutura de Tasks FreeRTOS

O firmware executa 4 tasks simultâneas:

| Task | Núcleo | Prioridade | Stack (bytes) | Função |
|------|--------|-----------|---|----------|
| `handleRequests` | 1 | 1 | 4096 | HTTP server + WebSocket |
| `handleBackendPolling` | 0 | 1 | 8192 | Polling /api/heartbeat (30s) |
| `handleIRCommands` | 0 | 1 | 4096 | Monitoramento botões físicos |
| `handleIRReception` | 0 | 1 | 4096 | Captura de sinais IR |

**Alocação Total**: ~20 KB de stack (disponível)

### 2.3 Fluxo de Execução Principal

```cpp
void setup() {
  // 1. Inicialização serial
  Serial.begin(115200);
  
  // 2. Inicialização de hardwares
  IR.begin();
  WiFi.begin();
  
  // 3. Criação de tasks FreeRTOS
  xTaskCreatePinnedToCore(handleRequests, ...);
  xTaskCreatePinnedToCore(handleBackendPolling, ...);
  xTaskCreatePinnedToCore(handleIRCommands, ...);
  xTaskCreatePinnedToCore(handleIRReception, ...);
  
  // 4. Scheduler FreeRTOS inicia automaticamente
}

void loop() {
  // Loop vazio - FreeRTOS controla execução
  delay(1000);
}
```

## 3 Módulos Principais

### 3.1 Módulo de Transmissão IR

**Função**: `void transmitCommand(const char *command)`

**Descrição**: Transmite sinal infravermelhos para ligar/desligar AC.

**Parâmetros**:
- `command`: String "TURN_ON" ou "TURN_OFF"

**Implementação**:
```cpp
void transmitCommand(const char *command) {
  if (strcmp(command, "TURN_ON") == 0) {
    IrSender.sendRaw(irSignalLigar, sizeof(irSignalLigar) / sizeof(irSignalLigar[0]), 38);
    Serial.println("📡 Transmitindo sinal IR: LIGAR");
  } else if (strcmp(command, "TURN_OFF") == 0) {
    IrSender.sendRaw(irSignalDesligar, sizeof(irSignalDesligar) / sizeof(irSignalDesligar[0]), 38);
    Serial.println("📡 Transmitindo sinal IR: DESLIGAR");
  }
}
```

**Frequência**: 38 kHz (padrão para controles IR)

### 3.2 Módulo de Comunicação WiFi

**Função**: `void setupWiFi()`

**Descrição**: Conecta ESP32 à rede WiFi.

**Processo**:
1. Aguarda conexão com timeout de 20 segundos
2. Se conectado: exibe IP local
3. Se falho: reinicia loop de tentativa

**Logs Esperados**:
```
WiFi connecting...
Connected! IP: 192.168.1.100
```

### 3.3 Módulo de Polling Backend

**Função**: `void handleBackendPolling(void *pvParameters)`

**Descrição**: Task que realiza polling periódico com backend.

**Frequência**: A cada 30 segundos

**Processo**:
1. Cria cliente HTTP
2. Monta JSON: `{"deviceId": "...", "isOn": bool}`
3. Envia POST para `/api/heartbeat`
4. Parseia resposta JSON
5. Se comando presente: executa `transmitCommand()`
6. Aguarda 30 segundos e repete

**JSON de Requisição**:
```json
{
  "deviceId": "esp32-dev-ac-01",
  "isOn": true
}
```

**JSON de Resposta Esperada**:
```json
{
  "command": "TURN_ON",
  "isOn": true,
  "lastHeartbeat": "2025-12-05T14:30:15.000Z"
}
```

### 3.4 Módulo de HTTP Server Local

**Função**: `void handleRequests(void *pvParameters)`

**Descrição**: Servidor web local para testes e interface.

**Portas**:
- HTTP: 80 (main server)
- WebSocket: 81 (para broadcast de estado)

**Rotas Locais Disponíveis**:

#### GET `/status`
Retorna estado atual do AC.

```json
{
  "deviceId": "esp32-dev-ac-01",
  "isOn": true,
  "signal": "good",
  "ip": "192.168.1.100"
}
```

#### GET `/ligar`
Aciona transmissão de sinal IR de ligar (teste).

#### GET `/desligar`
Aciona transmissão de sinal IR de desligar (teste).

#### GET `/ir`
Interface para captura de sinais IR (seção 4.5).

### 3.5 Módulo de Recepção IR

**Função**: `void handleIRReception(void *pvParameters)`

**Descrição**: Monitora receptor IR para captura de sinais.

**Uso**: Calibração de sinais reais do AC.

## 4 Procedimentos Operacionais

### 4.1 Compilação

```bash
cd firmware
pio run -e esp32dev
```

**Saída Esperada**:
```
Compiling .pio/build/esp32dev/src/main.cpp.o
Linking .pio/build/esp32dev/firmware.elf
RAM:   [===       ]  16.4% (used 53752 bytes from 327680 bytes)
Flash: [=======   ]  74.9% (used 981481 bytes from 1310720 bytes)
```

### 4.2 Upload para ESP32

```bash
pio run -e esp32dev -t upload --upload-port=COM3
```

Substituir COM3 pela porta correta.

### 4.3 Monitoramento Serial

```bash
pio device monitor --port=COM3 --baud=115200
```

**Saída Esperada**:
```
WiFi connecting...
Connected! IP: 192.168.1.100
WebSocket server listening on port 81
Backend URL: https://sistema-de-monitoramento-de-ar.onrender.com
Iniciando heartbeat polling...
📡 Enviando heartbeat para backend...
✅ Heartbeat enviado com sucesso!
```

### 4.4 Teste Local

Acessar `http://esp32_ip:80/status` (ex: `http://192.168.1.100/status`)

Deverá retornar JSON com estado atual.

### 4.5 Captura de Sinais IR Reais

**Procedimento**:

1. Acessar `http://esp32_ip/ir`
2. Colocar controle remoto do AC perto do receptor IR
3. Pressionar botão de ligar no controle
4. Observar saída serial para valores capturados
5. Copiar valores e substituir em `irSignalLigar[]` no código

**Exemplo de Output Serial**:
```
🔴 Sinal IR capturado:
Frequência: 38 kHz
Pulsos: 67
[9000, 4500, 600, 560, 560, 620, 560, 620, ...]
```

**Inserção no Código**:
```cpp
const uint16_t irSignalLigar[] = {
  9000, 4500, 600, 560, 560, 620, 560, 620,
  // ... copiar todos os valores capturados
};
```

## 5 Formato de Dados Utilizados

### 5.1 Estrutura JSON no Polling

**Requisição** (`POST /api/heartbeat`):
```cpp
StaticJsonDocument<256> doc;
doc["deviceId"] = deviceId;
doc["isOn"] = estadoAC;
String jsonBody;
serializeJson(doc, jsonBody);
```

**Parsing de Resposta**:
```cpp
StaticJsonDocument<512> responseDoc;
deserializeJson(responseDoc, response);
const char* command = responseDoc["command"];
```

### 5.2 Tipos de Dados

- **deviceId**: String única identificando o ESP32
- **isOn**: Boolean representando estado (ligado/desligado)
- **command**: String "TURN_ON", "TURN_OFF" ou "none"

## 6 Parâmetros de Configuração

### 6.1 Constantes em main.cpp

```cpp
// WiFi
const char *ssid = "NOME_DA_REDE";
const char *password = "SENHA_REDE";

// Backend
const char *backendURL = "https://sistema-de-monitoramento-de-ar.onrender.com";
const char *deviceId = "esp32-dev-ac-01";

// Hardware
const int rxPinIR = 4;      // Pino receptor IR
const int txPinIR = 26;     // Pino transmissor IR
const int ligarPin = 12;    // Pino botão ligar
const int desligarPin = 2;  // Pino botão desligar

// Timings
const unsigned long HEARTBEAT_INTERVAL = 30000;  // 30 segundos
```

## 7 Dependências

As seguintes bibliotecas devem estar instaladas:

- **IRremote** (3.9.0+): Controle IR
- **ArduinoJson** (6.19.4+): Parsing JSON
- **WebSockets** (2.6.1+): Comunicação WebSocket
- **HTTPClient** (2.0.0+): Requisições HTTP

Todas especificadas em `platformio.ini`:
```ini
lib_deps =
    IRremote@^3.9.0
    ArduinoJson@^6.19.4
    WebSockets@^2.6.1
```

## 8 Diagnóstico e Troubleshooting

### 8.1 WiFi Não Conecta

**Sintoma**: "WiFi connecting..." loop infinito

**Causas Possíveis**:
1. SSID/Password incorretos
2. Rede WiFi não disponível
3. Problema de hardware

**Solução**: Verificar credenciais em main.cpp, seção 6.1

### 8.2 Heartbeat Falha

**Sintoma**: Backend URL não responde

**Causas Possíveis**:
1. Servidor backend offline
2. Problema de conectividade de rede
3. Timeout de conexão

**Solução**: Verificar se backend está online, aguardar reconexão (tentativa a cada 30s)

### 8.3 Sinal IR Não Funciona

**Sintoma**: Transmissão de IR mas AC não responde

**Causas Possíveis**:
1. Sinais IR incorretos
2. Hardware danificado
3. LED IR não emitindo

**Solução**: Capturar sinais do controle original conforme seção 4.5

## 9 Logs e Mensagens de Debug

O firmware emite logs estruturados via serial:

```
📡 Enviando heartbeat para backend...
✅ Heartbeat enviado com sucesso!
🔴 Sinal IR capturado
📌 Comando recebido: TURN_ON
🚀 Transmitindo sinal IR
⚠️ Conexão WiFi perdida
```

Úteis para debug durante desenvolvimento.

## 10 Limitações Atuais

1. Credenciais WiFi hardcoded (sem portal de configuração)
2. Sem OTA (Over-The-Air) updates
3. Sem sincronização de hora via NTP
4. Sem compressão de payload JSON
5. Sinais IR iniciais são testes (devem ser calibrados)

Consultar TODO.md para melhorias futuras.

## 11 Conclusão

O firmware implementa sistema robusto de comunicação entre ESP32 e backend, com suporte a controle remoto via IR e sincronização periódica. Está pronto para produção após calibração de sinais IR.
