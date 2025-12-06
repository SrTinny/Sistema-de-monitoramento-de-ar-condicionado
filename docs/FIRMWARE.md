# Documentação do Firmware (ESP32)

## Visão Geral

Firmware completo para ESP32 que:
- Se conecta ao WiFi
- Faz polling do backend a cada 30 segundos
- Controla AC via sinais IR
- Monitorar botões físicos
- Expõe WebServer local e WebSocket

## Hardware

### Componentes Necessários

| Componente | Pino | Função |
|---|---|---|
| **Transmissor IR** | GPIO 26 | Enviar sinais para AC |
| **Receptor IR** | GPIO 4 | Capturar sinais para aprendizado |
| **Botão LIGAR** | GPIO 12 | Pressionar para ligar (pull-down) |
| **Botão DESLIGAR** | GPIO 2 | Pressionar para desligar (pull-down) |
| **LED Status** | GPIO 5 | (Opcional) LED de status |

### Circuito IR Transmissor (5V)

```
           VCC (5V)
            |
            R1 (100Ω)
            |
GPIO26 ----+---[MOSFET]---+---- GND
                           |
                          LED IR
                           |
                          GND
```

### Circuito IR Receptor (3.3V)

```
         VCC (3.3V)
            |
            R1 (10kΩ)
            |
GPIO4 ------+---- Receptor TSOP38238
                    |
                   GND
```

### Botões (Pull-down)

```
GPIO12 ----[Button]---- VCC (3.3V)
           |
           R1 (10kΩ)
           |
          GND

GPIO2 ----[Button]---- VCC (3.3V)
          |
          R1 (10kΩ)
          |
         GND
```

## Software

### Dependências

```ini
lib_deps = 
  z3t0/IRremote@^3.9.0           # Controle IR
  bblanchon/ArduinoJson@^6.19.4  # Parsing JSON
  links2004/WebSockets@^2.6.1    # WebSocket real-time
```

### Configurações Iniciais

Editar `src/main.cpp`:

```cpp
// WiFi
const char *ssid = "SEU_SSID";
const char *password = "SUA_SENHA";

// Backend
const char *backendURL = "https://sistema-de-monitoramento-de-ar.onrender.com";
const char *deviceId = "esp32-dev-ac-01";  // ID único
```

### Pinos

```cpp
#define rxPinIR 4       // Pino receptor IR
#define txPinIR 26      // Pino transmissor IR
#define ligarPin 12     // Botão LIGAR
#define desligarPin 2   // Botão DESLIGAR
```

## Arquitetura

### Tasks (FreeRTOS)

```
┌─────────────────────────────────────────────────────┐
│                   ESP32 (240MHz)                    │
├─────────────────────────────────────────────────────┤
│ Core 0          │          │      Core 1            │
├─────────────────┤          ├──────────────────────┤
│ handleIRReception            │ handleRequests      │
│ (Processa IR)                │ (HTTP + WebSocket)  │
├─────────────────┤            ├──────────────────┤
│ handleIRCommands             │ handleBackendPolling
│ (Monitora botões)            │ (Polling 30s)       │
└─────────────────────────────────────────────────────┘
```

### Task: handleRequests

**Função**: Processa HTTP GET/POST e WebSocket

**Loop:**
```cpp
while(true) {
  server.handleClient();    // Processa HTTP
  webSocket.loop();         // Processa WebSocket
  vTaskDelay(10ms);
}
```

**Rotas HTTP:**
- `GET /ligar` - Liga AC
- `GET /desligar` - Desliga AC

**Resposta:**
```
HTTP/1.1 200 OK
Access-Control-Allow-Origin: *
Content-Type: text/plain

OK
```

**WebSocket:**
- Broadcast: `"ligado"` quando AC liga
- Broadcast: `"desligado"` quando AC desliga
- Broadcast: Sinal IR enviado

### Task: handleIRCommands

**Função**: Monitora botões físicos

**Comportamento:**
- Lê GPIO12 (LIGAR)
- Lê GPIO2 (DESLIGAR)
- Se pressionado e estado diferente:
  - Chama `IrSender.sendRaw(...)`
  - Atualiza `estadoAC`
  - Broadcast WebSocket

**Debouncing:** 500ms delay entre pressionamentos

### Task: handleIRReception

**Função**: Captura e processa sinais IR recebidos

**Hardware:** Interrupção em GPIO4 (receptor IR)

**Processo:**
1. Interrupção captura timestamp (micros)
2. Armazena em `irBuffer[maxLen]`
3. Task processa a cada 100ms
4. Calcula deltas entre timestamps
5. Imprime no serial

**Output:**
```
📡 Sinal IR recebido:
4372, 4336, 568, 1572, 564, 528, 568, 1572, ...
```

### Task: handleBackendPolling

**Função**: Faz polling do backend a cada 30 segundos

**Período:** 30s

**Payload enviado:**
```json
{
  "deviceId": "esp32-dev-ac-01",
  "isOn": true
}
```

**Resposta esperada:**
```json
{
  "command": "TURN_ON",
  "isOn": true,
  "lastHeartbeat": "2025-12-05T14:30:00.000Z"
}
```

**Processamento de comando:**
- Se `command == "TURN_ON"` e `estadoAC == false`:
  - Chama `IrSender.sendRaw(irSignalLigar, ...)`
  - Seta `estadoAC = true`
  - Broadcast WebSocket
- Se `command == "TURN_OFF"` e `estadoAC == true`:
  - Chama `IrSender.sendRaw(irSignalDesligar, ...)`
  - Seta `estadoAC = false`
  - Broadcast WebSocket
- Se `command == "none"`:
  - Nenhuma ação

**Erros:**
- HTTP 4xx/5xx: Log de erro, tenta novamente em 30s
- Parse error: Log de erro, continua

## Sinais IR

### Formato

Array `uint16_t` contendo durações em microsegundos:

```cpp
uint16_t irSignalLigar[] = {
  4372,    // Burst 1 (on)
  4336,    // Burst 1 (off)
  568,     // Burst 2 (on)
  1572,    // Burst 2 (off)
  564,     // ...
  // ... mais valores
};
```

### Como Capturar Sinais Reais

1. Carregar firmware com receptor IR configurado
2. Conectar serial monitor: `pio device monitor`
3. Pressionar botão de LIGAR do controle remoto perto do receptor
4. Copiar valores impressos:
   ```
   📡 Sinal IR recebido:
   4372, 4336, 568, 1572, ...
   ```
5. Substituir em `irSignalLigar[]`
6. Repetir para DESLIGAR
7. Recompile e re-upload

### Status Atual

**Sinais usados são de teste** - não garantem funcionamento com seu AC real.

## Serial Output

### Baud Rate
115200

### Inicialização

```
✅ Conectado ao Wi-Fi!
Endereço IP: 192.168.1.100
```

### Polling (a cada 30s)

```
🕒 [backend] Enviando heartbeat: deviceId=esp32-dev-ac-01, isOn=true
📡 Resposta: {"command":"TURN_ON","isOn":true,"lastHeartbeat":"..."}
```

### Comando Recebido

```
📡 Comando recebido do backend: TURN_ON
🟢 Executando: LIGAR
➡️ Sinal IR enviado para Ligar: 4372, 4336, 568, ...
```

### Botão Físico

```
🟢 Botão físico pressionado: LIGAR
➡️ Sinal IR enviado para Ligar: 4372, 4336, 568, ...
```

### Erro

```
❌ Erro na requisição heartbeat: 404
[Tentará novamente em 30s]
```

## Compilação

### Build

```bash
cd firmware
pio run -e esp32dev
```

**Expected Output:**
```
Building in release mode
...
RAM:   [==        ]  16.4% (used 53752 bytes from 327680 bytes)
Flash: [=======   ]  74.9% (used 981481 bytes from 1310720 bytes)
========================= [SUCCESS] Took 11.26 seconds =========================
```

### Upload

```bash
pio run -e esp32dev -t upload
```

Se ficar pendurado em "Connecting...":
1. Desconectar USB
2. Pressionar e segurar BOOT (ou BOOTSEL)
3. Conectar USB (ainda segurando BOOT)
4. Soltar BOOT
5. Retry upload

### Monitor

```bash
pio device monitor -p COM3 -b 115200
```

**Pressione `Ctrl+C` para sair**

## Memory Usage

| Seção | Uso |
|-------|-----|
| RAM | 16.4% (53.7 KB / 320 KB) |
| Flash | 74.9% (981 KB / 1.3 MB) |

**Status:** Saudável, com margem para melhorias

### Como Reduzir

1. Mover IR arrays para PROGMEM:
   ```cpp
   const uint16_t irSignalLigar[] PROGMEM = { ... };
   ```
   - Economiza ~4KB RAM
   - Mais lento para acessar (ainda aceitável)

2. Remover logs desnecessários
3. Reduzir tamanho de buffers

## Troubleshooting

### Erro: "No serial data received"

**Causa**: ESP32 não entra em bootloader

**Solução:**
1. Usar cabo USB com dados (não só carregamento)
2. Tentar com resistor de 10kΩ entre GPIO0 e GND
3. Pressionar BOOT + EN (reset) durante conexão
4. Instalar driver CH340 se usando esse chip

### Erro: "Out of Memory"

**Causa**: RAM insuficiente

**Solução:**
1. Mover IR arrays para PROGMEM
2. Reduzir tamanho de buffers
3. Simplificar JSON

### WiFi não conecta

**Causa**: SSID/password incorretos

**Solução:**
1. Verificar SSID/password em `main.cpp`
2. Verificar se WiFi está 2.4GHz (ESP32 não suporta 5GHz)
3. Ver serial output para diagnóstico

### Backend não responde

**Causa**: URL backend incorreta, sem internet

**Solução:**
1. Testar `https://sistema-de-monitoramento-de-ar.onrender.com` no navegador
2. Verificar `backendURL` em `main.cpp`
3. Verificar logs do Render
4. Se local: backend deve estar rodando em `http://localhost:3001`

### IR não funciona

**Causa**: Sinais incorretos, pinos errados, hardware defeituoso

**Solução:**
1. Capturar sinais reais do seu AC (ver seção "Como Capturar Sinais")
2. Verificar pinos em circuito
3. Testar transmissor com oscilloscope ou sensor IR
4. Testar receptação primeiro (serial output)

## Checklist de Deploy

- [ ] WiFi SSID/password configurado
- [ ] Backend URL correto
- [ ] Device ID único e documentado
- [ ] Sinais IR capturados e testados
- [ ] Pinos verificados no hardware
- [ ] Firmware compilado sem erros
- [ ] Upload realizado com sucesso
- [ ] Serial output mostrando "Conectado ao WiFi"
- [ ] Teste manual: pressionar botão → AC responde
- [ ] Teste backend: webhook heartbeat retorna comando
- [ ] Teste webapp: clicar ligar → AC liga

## Próximas Melhorias

1. OTA (Over-The-Air) updates
2. Portal WiFi para configuração
3. Sensor de temperatura/umidade
4. LED de status (azul/verde/vermelho)
5. PROGMEM para IR buffers
6. Modo offline com cache
7. Histórico de ações no SPIFFS
8. Recalibração automática de sinais IR

