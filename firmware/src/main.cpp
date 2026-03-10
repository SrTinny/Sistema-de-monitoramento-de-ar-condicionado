#include <Arduino.h>
#if defined(ESP8266)
#include <ESP8266WiFi.h>
#include <ESP8266WebServer.h>
#include <ESP8266HTTPClient.h>
#include <WiFiClientSecureBearSSL.h>
using WebServerType = ESP8266WebServer;
#else
#include <WiFi.h>
#include <WebServer.h>
#include <HTTPClient.h>
#include <WiFiClientSecure.h>
using WebServerType = WebServer;
#endif
#include <WebSocketsServer.h>
#include <IRremote.h>
#include <ArduinoJson.h>
#include <WiFiManager.h>
#include <map>

// ============================================================================
// CONFIGURAÇÃO GERAL
// ============================================================================

// Backend
#ifndef BACKEND_URL
#define BACKEND_URL "https://sistema-de-monitoramento-de-ar.onrender.com"
#endif
const char *backendURL = BACKEND_URL;
String deviceId;
const unsigned long HEARTBEAT_INTERVAL_MS = 10000;

// Pinos IR
#define maxLen 800
#define rxPinIR 4   // GPIO 4 = D2 (Receptor IR - entrada)
#define txPinIR 13  // GPIO 13 = D7 (Transmissor IR - saída)

// Servidores
WebServerType server(80);
WebSocketsServer webSocket(81);

// ============================================================================
// ARMAZENAMENTO DE SINAIS IR APRENDIDOS
// ============================================================================

// Estrutura para armazenar um sinal IR aprendido
struct IRSignal {
  String name;                    // Nome do sinal (ex: "power_on", "mode_cool")
  std::vector<uint16_t> signal;   // Dados do sinal (pares on/off em microsegundos)
  unsigned long timestamp;        // Quando foi aprendido
};

// Mapa de sinais armazenados: nome → dados do sinal
std::map<String, IRSignal> learnedSignals;

// ============================================================================
// VARIÁVEIS GLOBAIS DE ESTADO
// ============================================================================

bool learningActive = false;
String learningCommandId = "";  // ID do comando que está being aprendido
unsigned long learningStartedAt = 0;
bool pendingWifiResetPortal = false;

// Buffers para captura de sinal IR
volatile unsigned long irBuffer[maxLen];
volatile unsigned int x = 0;
volatile unsigned long lastIrEdgeMicros = 0;
#if defined(ESP32)
portMUX_TYPE mux = portMUX_INITIALIZER_UNLOCKED;
#endif

// Feedback de aprendizado pendente
String pendingLearnStatus = "";      // "captured", "timeout", "invalid"
String pendingLearnCommandId = "";   // ID do comando
String pendingLearnRaw = "";         // Raw signal
String pendingLearnMessage = "";     // Mensagem descritiva

// ============================================================================
// FUNÇÕES AUXILIARES
// ============================================================================

String getChipSuffix() {
#if defined(ESP8266)
  uint32_t chipId = ESP.getChipId();
  String suffix = String(chipId, HEX);
#else
  uint64_t chipId = ESP.getEfuseMac();
  String suffix = String(static_cast<uint32_t>(chipId & 0xFFFFFF), HEX);
#endif
  suffix.toUpperCase();
  while (suffix.length() < 6) {
    suffix = "0" + suffix;
  }
  return suffix;
}

void prepareForWifiPortal() {
  // WiFiManager usa a porta 80; precisamos liberar o servidor local antes.
  server.stop();
  delay(100);
}

void startWifiSetupPortalNow() {
  String chipSuffix = getChipSuffix();
  String apName = "AC-SETUP-" + chipSuffix;

  Serial.println("🛜 Iniciando modo de configuracao Wi-Fi imediatamente...");

  prepareForWifiPortal();

#if defined(ESP8266)
  WiFi.disconnect(true);
  delay(250);
  ESP.eraseConfig();
#else
  WiFi.disconnect(true, true);
#endif

  WiFiManager wm;
  wm.resetSettings();
  wm.setConfigPortalTimeout(0);
  wm.setConnectTimeout(20);

  Serial.println("📡 Portal AP ativo em: " + apName);
  Serial.println("🌐 Acesse: http://192.168.4.1");

  bool configured = wm.startConfigPortal(apName.c_str());
  if (configured) {
    Serial.println("✅ Nova rede configurada. Reiniciando para aplicar...");
  } else {
    Serial.println("⚠️ Portal encerrado sem configuracao. Reiniciando...");
  }

  delay(800);
  ESP.restart();
}

void connectWiFiWithPortal() {
  String chipSuffix = getChipSuffix();
  String apName = "AC-SETUP-" + chipSuffix;

  WiFi.mode(WIFI_STA);
  WiFiManager wm;
  wm.setConfigPortalTimeout(0);
  wm.setConnectTimeout(20);

  Serial.println("\n🌐 Iniciando conexão Wi-Fi...");
  Serial.println("AP Portal: " + apName);

  bool connected = wm.autoConnect(apName.c_str());
  if (!connected) {
    Serial.println("❌ Falha ao conectar Wi-Fi via portal. Reiniciando...");
    delay(1500);
    ESP.restart();
    return;
  }

  Serial.println("✅ Conectado ao Wi-Fi!");
  Serial.print("SSID: ");
  Serial.println(WiFi.SSID());
  Serial.print("IP: ");
  Serial.println(WiFi.localIP());
}

// ============================================================================
// FUNÇÕES DE INTERRUPÇÃO E CAPTURA IR
// ============================================================================

void IRAM_ATTR rxIR_Interrupt_Handler() {
#if defined(ESP32)
  portENTER_CRITICAL_ISR(&mux);
#endif
  if (x < maxLen) {
    irBuffer[x++] = micros();
    lastIrEdgeMicros = irBuffer[x - 1];
  }
#if defined(ESP32)
  portEXIT_CRITICAL_ISR(&mux);
#endif
}

// ============================================================================
// FUNÇÕES DE APRENDIZADO DE SINAIS IR
// ============================================================================

void startLearningMode(const String &commandId) {
  learningActive = true;
  learningCommandId = commandId;
  learningStartedAt = millis();

#if defined(ESP32)
  portENTER_CRITICAL(&mux);
#endif
  x = 0;
  lastIrEdgeMicros = 0;
#if defined(ESP32)
  portEXIT_CRITICAL(&mux);
#endif

  Serial.println("🎯 Modo aprendizado IR iniciado para comando: " + commandId);
  Serial.println("   ⏱️ 15 segundos para capturar sinal...");
  
  String learnMessage = "Modo aprendizado ativo para: " + commandId;
  webSocket.broadcastTXT(learnMessage);
}

void processIRReception() {
  if (learningActive) {
    // Timeout de 15 segundos
    if (millis() - learningStartedAt > 15000) {
      learningActive = false;
      pendingLearnStatus = "timeout";
      pendingLearnCommandId = learningCommandId;
      pendingLearnMessage = "Tempo esgotado para capturar sinal IR.";
      Serial.println("⏱️ Timeout no aprendizado IR para: " + learningCommandId);
      return;
    }

    unsigned int sampleCount = x;
    unsigned long lastEdge = lastIrEdgeMicros;
    unsigned long nowMicros = micros();

    // Verifica se houve pausa longa (fim do sinal)
    if (sampleCount > 15 && lastEdge > 0 && (nowMicros - lastEdge) > 70000) {
      String rawSignal = "";
      
      // Converte o buffer de timestamps em deltas (on/off durations)
      for (unsigned int i = 1; i < sampleCount; i++) {
        unsigned long delta = irBuffer[i] - irBuffer[i - 1];
        if (delta < 50 || delta > 25000) {
          continue;
        }
        rawSignal += String(delta);
        if (i < sampleCount - 1) {
          rawSignal += ",";
        }
      }

      learningActive = false;
      pendingLearnCommandId = learningCommandId;

      if (rawSignal.length() > 0) {
        pendingLearnStatus = "captured";
        pendingLearnRaw = rawSignal;
        pendingLearnMessage = "Sinal IR capturado com sucesso.";
        Serial.println("✅ SINAL IR CAPTURADO COM SUCESSO!");
        Serial.println("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
        Serial.print("Comando: ");
        Serial.println(learningCommandId);
        Serial.print("Tamanho: ");
        Serial.print(rawSignal.length());
        Serial.println(" caracteres");
        Serial.println("\n📋 CÓDIGO IR (copie e guarde este código):");
        Serial.println("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
        Serial.println(rawSignal);
        Serial.println("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");
      } else {
        pendingLearnStatus = "invalid";
        pendingLearnRaw = "";
        pendingLearnMessage = "Sinal capturado inválido.";
        Serial.println("⚠️ Sinal inválido para: " + learningCommandId);
      }

#if defined(ESP32)
      portENTER_CRITICAL(&mux);
#endif
      x = 0;
      lastIrEdgeMicros = 0;
#if defined(ESP32)
      portEXIT_CRITICAL(&mux);
#endif
    }
    return;
  }

  // Mostrar sinais IR recebidos fora do modo de aprendizado
  if (x > 15) {
    unsigned long lastEdge = lastIrEdgeMicros;
    unsigned long nowMicros = micros();

    if ((nowMicros - lastEdge) > 70000) {
      String debugSignal = "";
      
      for (unsigned int i = 1; i < x; i++) {
        unsigned long delta = irBuffer[i] - irBuffer[i - 1];
        if (delta < 50 || delta > 25000) {
          continue;
        }
        debugSignal += String(delta);
        if (i < x - 1) {
          debugSignal += ",";
        }
      }

      if (debugSignal.length() > 0) {
        Serial.println("\n📡 SINAL IR RECEBIDO (DEBUG):");
        Serial.println("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
        Serial.println(debugSignal);
        Serial.println("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");
      }

#if defined(ESP32)
      portENTER_CRITICAL(&mux);
#endif
      x = 0;
      lastIrEdgeMicros = 0;
#if defined(ESP32)
      portEXIT_CRITICAL(&mux);
#endif
    }
  }
}

// ============================================================================
// FUNÇÕES DE TRANSMISSÃO DE SINAIS IR
// ============================================================================

// Sinal IR de teste simples (padrão NEC)
uint16_t testSignal[] = {
  9000, 4500,   // Leader code
  560, 560,     // 0
  560, 1680,    // 1
  560, 560,     // 0
  560, 560,     // 0
  560, 1680,    // 1
  560, 1680,    // 1
  560, 1680,    // 1
  560, 560,     // 0
  560, 560,     // 0
  560, 560,     // 0
  560, 560,     // 0
  560, 560,     // 0
  560, 1680,    // 1
  560, 1680,    // 1
  560, 1680,    // 1
  560, 40000    // Silence
};

void sendTestSignal() {
  Serial.println("\n📤 Enviando sinal IR de teste...");
  IrSender.sendRaw(testSignal, sizeof(testSignal) / sizeof(testSignal[0]), 38);
  Serial.println("✅ Sinal de teste enviado!\n");
}

bool sendStoredSignal(const String &commandId) {
  if (learnedSignals.find(commandId) == learnedSignals.end()) {
    Serial.println("❌ Sinal não encontrado: " + commandId);
    return false;
  }

  IRSignal &signal = learnedSignals[commandId];
  
  if (signal.signal.empty()) {
    Serial.println("❌ Sinal vazio para: " + commandId);
    return false;
  }

  Serial.println("📤 Transmitindo sinal: " + commandId);
  Serial.print("   Comprimento: ");
  Serial.print(signal.signal.size());
  Serial.println(" pares on/off");

  // Converte vector de volta para array e transmite
  uint16_t *signalArray = new uint16_t[signal.signal.size()];
  std::copy(signal.signal.begin(), signal.signal.end(), signalArray);
  
  IrSender.sendRaw(signalArray, signal.signal.size(), 38); // 38 kHz é o padrão
  
  delete[] signalArray;

  String wsMessage = "Sinal transmitido: " + commandId;
  webSocket.broadcastTXT(wsMessage);
  
  return true;
}

bool storeLearnedSignal(const String &commandId, const String &rawSignal) {
  if (rawSignal.length() == 0) {
    Serial.println("❌ Raw signal vazio para: " + commandId);
    return false;
  }

  std::vector<uint16_t> parsedSignal;
  int start = 0;

  // Parse CSV do raw signal
  while (start < rawSignal.length() && parsedSignal.size() < maxLen) {
    int commaPos = rawSignal.indexOf(',', start);
    String token = (commaPos == -1) ? rawSignal.substring(start) : rawSignal.substring(start, commaPos);
    token.trim();

    long value = token.toInt();
    if (value >= 50 && value <= 25000) {
      parsedSignal.push_back((uint16_t)value);
    }

    if (commaPos == -1) break;
    start = commaPos + 1;
  }

  if (parsedSignal.size() < 10) {
    Serial.println("⚠️ Sinal muito curto para: " + commandId);
    return false;
  }

  IRSignal newSignal;
  newSignal.name = commandId;
  newSignal.signal = parsedSignal;
  newSignal.timestamp = millis();

  learnedSignals[commandId] = newSignal;

  Serial.println("✅ Sinal armazenado: " + commandId);
  Serial.print("   Comprimento: ");
  Serial.print(parsedSignal.size());
  Serial.println(" valores");

  return true;
}

// ============================================================================
// FUNÇÕES DE POLLING DO BACKEND
// ============================================================================

void processBackendPolling() {
  static unsigned long lastHeartbeat = 0;
  if (millis() - lastHeartbeat <= HEARTBEAT_INTERVAL_MS) {
    return;
  }
  lastHeartbeat = millis();

  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("❌ Wi-Fi desconectado. Heartbeat não enviado.");
    return;
  }

  HTTPClient http;
  String heartbeatUrl = String(backendURL) + "/api/heartbeat";
  String heartbeatUrlLower = heartbeatUrl;
  heartbeatUrlLower.toLowerCase();
  bool isHttps = heartbeatUrlLower.startsWith("https://");

#if defined(ESP8266)
  static BearSSL::WiFiClientSecure secureClient;
  static WiFiClient plainClient;
  bool beginOk = false;

  if (isHttps) {
    secureClient.setInsecure();
    secureClient.setTimeout(15000);
    beginOk = http.begin(secureClient, heartbeatUrl);
  } else {
    beginOk = http.begin(plainClient, heartbeatUrl);
  }
#else
  static WiFiClientSecure secureClient;
  static WiFiClient plainClient;
  bool beginOk = false;

  if (isHttps) {
    secureClient.setInsecure();
    secureClient.setTimeout(15000);
    beginOk = http.begin(secureClient, heartbeatUrl);
  } else {
    beginOk = http.begin(plainClient, heartbeatUrl);
  }
#endif

  if (!beginOk) {
    Serial.println("❌ Falha ao iniciar conexão HTTP");
    return;
  }

  http.setTimeout(15000);
  http.addHeader("Content-Type", "application/json");

  DynamicJsonDocument doc(4096);
  doc["deviceId"] = deviceId;
  doc["status"] = "ativo";  // Status do deviceId IR (sempre ativo quando conectado)
  doc["deviceType"] = "IR_CONTROLLER";
  doc["signalsStored"] = learnedSignals.size();

  if (pendingLearnStatus.length() > 0 && pendingLearnCommandId.length() > 0) {
    JsonObject learned = doc.createNestedObject("learnedSignal");
    learned["status"] = pendingLearnStatus;
    learned["commandId"] = pendingLearnCommandId;
    if (pendingLearnRaw.length() > 0) {
      learned["raw"] = pendingLearnRaw;
    }
    if (pendingLearnMessage.length() > 0) {
      learned["message"] = pendingLearnMessage;
    }
  }

  String jsonBody;
  serializeJson(doc, jsonBody);

  int httpCode = http.POST(jsonBody);

  if (httpCode == 200) {
    String response = http.getString();
    DynamicJsonDocument responseDoc(12288);
    DeserializationError error = deserializeJson(responseDoc, response);

    if (!error) {
      const char *command = responseDoc["command"];
      const char *commandId = responseDoc["commandId"];
      const char *learnedRaw = responseDoc["learnedSignal"]["raw"];

      // Limpar pending
      if (pendingLearnStatus.length() > 0) {
        pendingLearnStatus = "";
        pendingLearnCommandId = "";
        pendingLearnRaw = "";
        pendingLearnMessage = "";
      }

      if (command != nullptr) {
        String cmdStr = String(command);
        String cmdIdStr = (commandId != nullptr) ? String(commandId) : "";
        String learnedRawStr = (learnedRaw != nullptr) ? String(learnedRaw) : "";

        if (cmdStr == "learn" && cmdIdStr.length() > 0) {
          Serial.println("📚 Backend solicita aprendizado de: " + cmdIdStr);
          startLearningMode(cmdIdStr);
        }
        else if (cmdStr == "transmit" && cmdIdStr.length() > 0) {
          Serial.println("📤 Backend solicita transmissão de: " + cmdIdStr);
          sendStoredSignal(cmdIdStr);
        }
        else if (cmdStr == "store" && cmdIdStr.length() > 0 && learnedRaw != nullptr) {
          Serial.println("💾 Backend solicita armazenar sinal: " + cmdIdStr);
          storeLearnedSignal(cmdIdStr, String(learnedRaw));
        }
        else if (cmdStr == "ligar" || cmdStr == "desligar") {
          Serial.println("🕹️ Comando manual recebido do painel: " + cmdStr);

          bool sent = false;
          if (learnedRawStr.length() > 0) {
            if (storeLearnedSignal(cmdStr, learnedRawStr)) {
              sent = sendStoredSignal(cmdStr);
            }
          } else {
            sent = sendStoredSignal(cmdStr);
          }

          if (!sent) {
            Serial.println("⚠️ Nao foi possivel transmitir IR para: " + cmdStr);
          }
        }
        else if (cmdStr == "wifi_reset" || cmdStr == "reset_wifi") {
          Serial.println("🛜 Backend solicitou reset de Wi-Fi. Portal sera iniciado apos heartbeat.");
          pendingWifiResetPortal = true;
        }
      }
    }
  } else {
    Serial.println("⚠️ Erro no heartbeat: " + String(httpCode) + " (" + http.errorToString(httpCode) + ")");
    Serial.println("   URL: " + heartbeatUrl);
    Serial.println("   WiFi SSID: " + WiFi.SSID());
    Serial.println("   WiFi IP: " + WiFi.localIP().toString());
  }

  http.end();

  if (pendingWifiResetPortal) {
    pendingWifiResetPortal = false;
    startWifiSetupPortalNow();
    return;
  }
}

// ============================================================================
// HANDLER DO SERVIDOR WEB
// ============================================================================

void processRequests() {
  server.handleClient();
  webSocket.loop();
}

#if defined(ESP32)
void handleRequests(void *pvParameters) {
  while (true) {
    processRequests();
    vTaskDelay(10 / portTICK_PERIOD_MS);
  }
}

void handleIRReception(void *pvParameters) {
  while (true) {
    processIRReception();
    vTaskDelay(100 / portTICK_PERIOD_MS);
  }
}

void handleBackendPolling(void *pvParameters) {
  while (true) {
    processBackendPolling();
    vTaskDelay(1000 / portTICK_PERIOD_MS);
  }
}
#endif

// ============================================================================
// SETUP
// ============================================================================

void setup() {
  Serial.begin(115200);
  delay(1000);

  Serial.println("\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  Serial.println("   🌐 CONTROLADOR IR GENÉRICO - INICIALIZANDO");
  Serial.println("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

  deviceId = "ir-device-" + getChipSuffix();
  connectWiFiWithPortal();

  Serial.print("Device ID: ");
  Serial.println(deviceId);
  Serial.print("Backend URL: ");
  Serial.println(backendURL);

  // ========== Rotas do Servidor Web ==========

  // Status do dispositivo
  server.on("/status", HTTP_GET, []() {
    StaticJsonDocument<512> statusDoc;
    statusDoc["deviceId"] = deviceId;
    statusDoc["connected"] = (WiFi.status() == WL_CONNECTED);
    statusDoc["ssid"] = WiFi.SSID();
    statusDoc["ip"] = WiFi.localIP().toString();
    statusDoc["signalsStored"] = learnedSignals.size();
    statusDoc["learningActive"] = learningActive;

    String payload;
    serializeJson(statusDoc, payload);
    server.sendHeader("Access-Control-Allow-Origin", "*");
    server.send(200, "application/json", payload);
  });

  // Listar sinais armazenados
  server.on("/signals", HTTP_GET, []() {
    DynamicJsonDocument doc(2048);
    JsonArray signals = doc.createNestedArray("signals");

    for (auto &pair : learnedSignals) {
      JsonObject sig = signals.createNestedObject();
      sig["commandId"] = pair.first;
      sig["length"] = pair.second.signal.size();
      sig["timestamp"] = pair.second.timestamp;
    }

    String payload;
    serializeJson(doc, payload);
    server.sendHeader("Access-Control-Allow-Origin", "*");
    server.send(200, "application/json", payload);
  });

  // Iniciar aprendizado
  server.on("/learn", HTTP_POST, []() {
    if (!server.hasArg("plain")) {
      server.send(400, "application/json", "{\"error\":\"JSON body required\"}");
      return;
    }

    StaticJsonDocument<256> doc;
    DeserializationError error = deserializeJson(doc, server.arg("plain"));
    if (error) {
      server.send(400, "application/json", "{\"error\":\"JSON parse error\"}");
      return;
    }

    const char *commandId = doc["commandId"];
    if (!commandId) {
      server.send(400, "application/json", "{\"error\":\"commandId required\"}");
      return;
    }

    startLearningMode(String(commandId));
    server.sendHeader("Access-Control-Allow-Origin", "*");
    server.send(200, "application/json", "{\"ok\":true}");
  });

  // Transmitir sinal
  server.on("/transmit", HTTP_POST, []() {
    if (!server.hasArg("plain")) {
      server.send(400, "application/json", "{\"error\":\"JSON body required\"}");
      return;
    }

    StaticJsonDocument<256> doc;
    DeserializationError error = deserializeJson(doc, server.arg("plain"));
    if (error) {
      server.send(400, "application/json", "{\"error\":\"JSON parse error\"}");
      return;
    }

    const char *commandId = doc["commandId"];
    if (!commandId) {
      server.send(400, "application/json", "{\"error\":\"commandId required\"}");
      return;
    }

    bool success = sendStoredSignal(String(commandId));
    if (success) {
      server.sendHeader("Access-Control-Allow-Origin", "*");
      server.send(200, "application/json", "{\"ok\":true}");
    } else {
      server.send(404, "application/json", "{\"error\":\"Signal not found\"}");
    }
  });

  // Armazenar sinal manualmente
  server.on("/store", HTTP_POST, []() {
    if (!server.hasArg("plain")) {
      server.send(400, "application/json", "{\"error\":\"JSON body required\"}");
      return;
    }

    DynamicJsonDocument doc(8192);
    DeserializationError error = deserializeJson(doc, server.arg("plain"));
    if (error) {
      server.send(400, "application/json", "{\"error\":\"JSON parse error\"}");
      return;
    }

    const char *commandId = doc["commandId"];
    const char *rawSignal = doc["raw"];
    if (!commandId || !rawSignal) {
      server.send(400, "application/json", "{\"error\":\"commandId and raw required\"}");
      return;
    }

    bool success = storeLearnedSignal(String(commandId), String(rawSignal));
    if (success) {
      server.sendHeader("Access-Control-Allow-Origin", "*");
      server.send(200, "application/json", "{\"ok\":true}");
    } else {
      server.send(400, "application/json", "{\"error\":\"Failed to store signal\"}");
    }
  });

  // Resetar Wi-Fi
  server.on("/wifi/reset", HTTP_POST, []() {
    server.sendHeader("Access-Control-Allow-Origin", "*");
    server.send(200, "application/json", "{\"ok\":true}");
    pendingWifiResetPortal = true;
  });

  server.onNotFound([]() {
    server.send(404, "text/plain", "Erro 404: Rota não encontrada");
  });

  server.begin();
  webSocket.begin();

  if (pendingWifiResetPortal) {
    pendingWifiResetPortal = false;
    startWifiSetupPortalNow();
  }

  // ========== Configurar Pinos IR ==========
  pinMode(rxPinIR, INPUT);
  pinMode(txPinIR, OUTPUT);

  IrSender.begin(txPinIR, ENABLE_LED_FEEDBACK);
  attachInterrupt(digitalPinToInterrupt(rxPinIR), rxIR_Interrupt_Handler, CHANGE);

  Serial.println("\n✅ Sistema IR inicializado com sucesso!");
  Serial.println("   Receptor IR: GPIO " + String(rxPinIR));
  Serial.println("   Transmissor IR: GPIO " + String(txPinIR));
  Serial.println("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

#if defined(ESP32)
  xTaskCreatePinnedToCore(handleRequests, "Web Requests", 4096, NULL, 1, NULL, 1);
  xTaskCreatePinnedToCore(handleIRReception, "IR Reception", 4096, NULL, 1, NULL, 0);
  xTaskCreatePinnedToCore(handleBackendPolling, "Backend Poll", 8192, NULL, 1, NULL, 0);
#endif
}

// ============================================================================
// LOOP PRINCIPAL
// ============================================================================

void loop() {
#if defined(ESP32)
  vTaskDelay(portMAX_DELAY);
#else
  processRequests();
  processIRReception();
  processBackendPolling();
  delay(10);
#endif
}
