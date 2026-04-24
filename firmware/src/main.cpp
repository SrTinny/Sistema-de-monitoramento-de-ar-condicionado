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
#ifndef RAW_BUFFER_LENGTH
#define RAW_BUFFER_LENGTH 1200
#endif
#ifndef RECORD_GAP_MICROS
#define RECORD_GAP_MICROS 20000
#endif
#include <IRremote.hpp>
#include <ArduinoJson.h>
#include <map>

#include "wifi_setup.h"

float lerTemperaturaC();

// ============================================================================
// CONFIGURAÇÃO GERAL
// ============================================================================

// Backend
#ifndef BACKEND_URL
#define BACKEND_URL "https://sistema-de-monitoramento-de-ar.onrender.com"
#endif
#ifndef BACKEND_PORT
#define BACKEND_PORT 3001
#endif
const char *backendURL = BACKEND_URL;
String activeBackendURL = BACKEND_URL;
unsigned long lastBackendDiscoveryAttempt = 0;
const unsigned long BACKEND_DISCOVERY_INTERVAL_MS = 60000;
String deviceId;
const unsigned long HEARTBEAT_INTERVAL_MS = 10000;
const unsigned long LEARNING_TIMEOUT_MS = 30000;

// Pinos IR
#define maxLen 2000
#if defined(ESP8266)
constexpr uint8_t rxPinIR = D5;   // GPIO 14 (Receptor IR - entrada)
constexpr uint8_t txPinIR = D2;   // GPIO 4  (Transmissor IR - saida)
#else
constexpr uint8_t rxPinIR = 4;    // GPIO 4  (Receptor IR - entrada)
constexpr uint8_t txPinIR = 13;   // GPIO 13 (Transmissor IR - saida)
#endif

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
  bool isNEC = false;             // Sinal salvo como protocolo NEC
  uint16_t necAddress = 0;        // Endereco NEC
  uint8_t necCommand = 0;         // Comando NEC
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
bool learningAwaitingConfirm = false;
String learningFirstCaptureRaw = "";
bool pendingWifiResetPortal = false;
unsigned long lastIrTxAt = 0;
bool powerStateOn = false;
unsigned long lastLearningNoiseLogAt = 0;

// Feedback de aprendizado pendente
String pendingLearnStatus = "";      // "captured", "timeout", "invalid"
String pendingLearnCommandId = "";   // ID do comando
String pendingLearnRaw = "";         // Raw signal
String pendingLearnMessage = "";     // Mensagem descritiva

// ============================================================================
// FUNÇÕES AUXILIARES
// ============================================================================

// ============================================================================
// FUNÇÕES DE APRENDIZADO DE SINAIS IR
// ============================================================================

void cancelLearningMode(const String &reason) {
  if (!learningActive) {
    return;
  }

  pendingLearnStatus = "cancelled";
  pendingLearnCommandId = learningCommandId;
  pendingLearnRaw = "";
  pendingLearnMessage = reason;

  learningActive = false;
  learningAwaitingConfirm = false;
  learningFirstCaptureRaw = "";

  Serial.println("🛑 Aprendizado cancelado: " + reason);
}

void startLearningMode(const String &commandId) {
  if (learningActive && learningCommandId == commandId) {
    Serial.println("ℹ️ Aprendizado ja ativo para: " + commandId);
    return;
  }

  learningActive = true;
  learningCommandId = commandId;
  learningStartedAt = millis();
  learningAwaitingConfirm = false;
  learningFirstCaptureRaw = "";

  Serial.println("🎯 Modo aprendizado IR iniciado para comando: " + commandId);
  Serial.println("   ⏱️ 30 segundos para capturar e confirmar sinal...");
  Serial.println("   1) Aponte o controle para o receptor IR");
  Serial.println("   2) Pressione o botao uma vez (captura)");
  Serial.println("   3) Pressione novamente para confirmar");
  
  String learnMessage = "Modo aprendizado ativo para: " + commandId;
  webSocket.broadcastTXT(learnMessage);
}

void processIRReception() {
  if (!IrReceiver.decode()) {
    if (learningActive && millis() - learningStartedAt > LEARNING_TIMEOUT_MS) {
      learningActive = false;
      learningAwaitingConfirm = false;
      learningFirstCaptureRaw = "";
      pendingLearnStatus = "timeout";
      pendingLearnCommandId = learningCommandId;
      pendingLearnMessage = "Tempo esgotado para capturar/confirmar sinal IR.";
      Serial.println("⏱️ Timeout no aprendizado IR para: " + learningCommandId);
    }
    return;
  }

  // Evita interpretar o próprio disparo do emissor como sinal recebido.
  if ((millis() - lastIrTxAt) < 250) {
    IrReceiver.resume();
    return;
  }

  const IRData &dados = IrReceiver.decodedIRData;

  bool isEmptyFrame = (dados.rawDataPtr == nullptr) || (dados.rawDataPtr->rawlen <= 2);
  if (learningActive && isEmptyFrame) {
    if (millis() - lastLearningNoiseLogAt > 1000) {
      lastLearningNoiseLogAt = millis();
      Serial.println("ℹ️ Frame IR vazio/ruido ignorado durante aprendizado. Aguardando sinal valido...");
    }
    IrReceiver.resume();
    return;
  }

  // Filtra ruído elétrico/ambiental: pulsos UNKNOWN muito curtos inundam o serial
  // e escondem os logs úteis de heartbeat/comandos reais.
  bool isShortUnknown = (dados.protocol == UNKNOWN)
    && ((dados.rawDataPtr == nullptr) || (dados.rawDataPtr->rawlen <= 2) || (dados.decodedRawData == 0));

  if (isShortUnknown && !learningActive) {
    IrReceiver.resume();
    return;
  }

  Serial.print("[RECEPTOR] t=");
  Serial.print(millis());
  Serial.print(" ms | protocolo=");
  Serial.print(getProtocolString(dados.protocol));
  Serial.print(" | endereco=0x");
  Serial.print(dados.address, HEX);
  Serial.print(" | comando=0x");
  Serial.print(dados.command, HEX);
  Serial.print(" | raw=0x");
  Serial.print(dados.decodedRawData, HEX);
  Serial.print(" | repeticao=");
  Serial.println((dados.flags & IRDATA_FLAGS_IS_REPEAT) ? "sim" : "nao");

  Serial.print("[RECEPTOR] raw bytes: ");
  for (uint16_t i = 1; i < dados.rawDataPtr->rawlen; i++) {
    Serial.print(dados.rawDataPtr->rawbuf[i] * MICROS_PER_TICK);
    if (i < dados.rawDataPtr->rawlen - 1) {
      Serial.print(",");
    }
  }
  Serial.println();

  IrReceiver.printIRResultShort(&Serial);
  IrReceiver.printIRSendUsage(&Serial);

  if (learningActive) {
    pendingLearnCommandId = learningCommandId;

    String rawCsv = "";
    uint16_t validCount = 0;
    if (dados.rawDataPtr != nullptr) {
      for (uint16_t i = 1; i < dados.rawDataPtr->rawlen; i++) {
        unsigned long pulse = dados.rawDataPtr->rawbuf[i] * MICROS_PER_TICK;
        if (pulse < 50 || pulse > 40000) {
          continue;
        }
        if (rawCsv.length() > 0) {
          rawCsv += ",";
        }
        rawCsv += String(pulse);
        validCount++;
      }
    }

    String encoded = "";
    if (dados.protocol == NEC) {
      encoded = "NEC:" + String(dados.address) + ":" + String(dados.command);
    }

    if (encoded.length() > 0 || validCount >= 10) {
      String capturedRaw = encoded.length() > 0 ? encoded : rawCsv;

      if (!learningAwaitingConfirm) {
        learningAwaitingConfirm = true;
        learningFirstCaptureRaw = capturedRaw;
        learningStartedAt = millis();

        pendingLearnStatus = "awaiting_confirmation";
        pendingLearnRaw = "";
        pendingLearnMessage = "Sinal IR recebido. Pressione o mesmo botao novamente para confirmar.";

        Serial.println("✅ Sinal IR recebido (1/2). Aguardando confirmacao...");
        Serial.println("   Pressione o mesmo botao novamente no controle.");
      } else {
        pendingLearnStatus = "captured";
        pendingLearnRaw = capturedRaw;
        pendingLearnMessage = "Botao clonado com sucesso.";

        learningActive = false;
        learningAwaitingConfirm = false;
        learningFirstCaptureRaw = "";

        Serial.println("✅ SINAL IR CONFIRMADO E CLONADO COM SUCESSO!");
        Serial.println("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
        Serial.print("Comando: ");
        Serial.println(pendingLearnCommandId);
        Serial.print("Codigo clonado: ");
        Serial.println(pendingLearnRaw);
        Serial.println("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
      }
    } else {
      pendingLearnStatus = learningAwaitingConfirm ? "awaiting_confirmation" : "invalid";
      pendingLearnRaw = "";
      pendingLearnMessage = learningAwaitingConfirm
        ? "Sinal invalido na confirmacao. Pressione novamente o mesmo botao."
        : "Sinal capturado invalido ou curto demais para clonagem.";
      Serial.println("⚠️ Sinal inválido para aprendizado: " + String(getProtocolString(dados.protocol)));
    }
  }

  IrReceiver.resume();
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
  lastIrTxAt = millis();
  IrSender.sendRaw(testSignal, sizeof(testSignal) / sizeof(testSignal[0]), 38);
  Serial.println("✅ Sinal de teste enviado!\n");
}

String resolveStoredCommandId(const String &requestedCommandId) {
  if (learnedSignals.find(requestedCommandId) != learnedSignals.end()) {
    return requestedCommandId;
  }

  if (requestedCommandId == "ligar") {
    const char *candidates[] = {"power_on", "on", "liga", "power", "turn_on"};
    for (const char *candidate : candidates) {
      String candidateStr(candidate);
      if (learnedSignals.find(candidateStr) != learnedSignals.end()) {
        return candidateStr;
      }
    }
  }

  if (requestedCommandId == "desligar") {
    const char *candidates[] = {"power_off", "off", "desliga", "turn_off"};
    for (const char *candidate : candidates) {
      String candidateStr(candidate);
      if (learnedSignals.find(candidateStr) != learnedSignals.end()) {
        return candidateStr;
      }
    }
  }

  if (requestedCommandId == "temp_up" || requestedCommandId == "aumentar_temp") {
    const char *candidates[] = {"temp_up", "aumentar_temp", "increase_temp", "increase", "up", "temp+"};
    for (const char *candidate : candidates) {
      String candidateStr(candidate);
      if (learnedSignals.find(candidateStr) != learnedSignals.end()) {
        return candidateStr;
      }
    }
  }

  if (requestedCommandId == "temp_down" || requestedCommandId == "diminuir_temp") {
    const char *candidates[] = {"temp_down", "diminuir_temp", "decrease_temp", "decrease", "down", "temp-"};
    for (const char *candidate : candidates) {
      String candidateStr(candidate);
      if (learnedSignals.find(candidateStr) != learnedSignals.end()) {
        return candidateStr;
      }
    }
  }

  return "";
}

void logStoredCommands() {
  Serial.print("📚 Sinais armazenados (");
  Serial.print(learnedSignals.size());
  Serial.println("): ");
  for (auto &pair : learnedSignals) {
    Serial.print("   - ");
    Serial.println(pair.first);
  }
}

bool isDirectReplayCommand(const String &commandId) {
  return commandId == "ligar"
    || commandId == "desligar"
    || commandId == "temp_up"
    || commandId == "temp_down"
    || commandId == "aumentar_temp"
    || commandId == "diminuir_temp";
}

void applyCommandSideEffects(const String &requestedCommandId, const String &resolvedCommandId) {
  if (requestedCommandId == "ligar" || resolvedCommandId == "ligar") {
    powerStateOn = true;
    Serial.println("🔛 Estado do ar atualizado: ligado");
    return;
  }

  if (requestedCommandId == "desligar" || resolvedCommandId == "desligar") {
    powerStateOn = false;
    Serial.println("🔌 Estado do ar atualizado: desligado");
    return;
  }

  if (requestedCommandId == "temp_up" || requestedCommandId == "aumentar_temp" || resolvedCommandId == "temp_up") {
    Serial.println("🌡️ Comando de temperatura transmitido: aumentar");
    return;
  }

  if (requestedCommandId == "temp_down" || requestedCommandId == "diminuir_temp" || resolvedCommandId == "temp_down") {
    Serial.println("🌡️ Comando de temperatura transmitido: diminuir");
    return;
  }
}

bool sendStoredSignal(const String &commandId) {
  String resolvedCommandId = resolveStoredCommandId(commandId);
  if (resolvedCommandId.length() == 0) {
    Serial.println("❌ Sinal não encontrado: " + commandId);
    logStoredCommands();
    return false;
  }

  if (resolvedCommandId != commandId) {
    Serial.println("↪️ Usando alias de comando: " + commandId + " -> " + resolvedCommandId);
  }

  IRSignal &signal = learnedSignals[resolvedCommandId];

  if (!signal.isNEC && signal.signal.empty()) {
    Serial.println("❌ Sinal vazio para: " + resolvedCommandId);
    return false;
  }

  Serial.println("📤 Transmitindo sinal: " + resolvedCommandId);

  if (signal.isNEC) {
    Serial.print("   NEC addr=0x");
    Serial.print(signal.necAddress, HEX);
    Serial.print(" cmd=0x");
    Serial.println(signal.necCommand, HEX);
    Serial.print("   Codigo enviado: NEC:");
    Serial.print(signal.necAddress);
    Serial.print(":");
    Serial.println(signal.necCommand);
    lastIrTxAt = millis();
    IrSender.sendNEC(signal.necAddress, signal.necCommand, 0);
  } else {
    Serial.print("   Comprimento: ");
    Serial.print(signal.signal.size());
    Serial.println(" pares on/off");

    Serial.print("   Codigo enviado: ");
    for (size_t i = 0; i < signal.signal.size(); i++) {
      Serial.print(signal.signal[i]);
      if (i < signal.signal.size() - 1) {
        Serial.print(",");
      }
    }
    Serial.println();

    // Converte vector de volta para array e transmite
    uint16_t *signalArray = new uint16_t[signal.signal.size()];
    std::copy(signal.signal.begin(), signal.signal.end(), signalArray);
    lastIrTxAt = millis();
    IrSender.sendRaw(signalArray, signal.signal.size(), 38); // 38 kHz e o padrao
    delete[] signalArray;
  }

  applyCommandSideEffects(commandId, resolvedCommandId);

  String wsMessage = "Sinal transmitido: " + resolvedCommandId;
  webSocket.broadcastTXT(wsMessage);
  
  return true;
}

bool storeLearnedSignal(const String &commandId, const String &rawSignal) {
  if (rawSignal.length() == 0) {
    Serial.println("❌ Raw signal vazio para: " + commandId);
    return false;
  }

  if (rawSignal.startsWith("NEC:")) {
    int firstSep = rawSignal.indexOf(':');
    int secondSep = rawSignal.indexOf(':', firstSep + 1);
    if (firstSep > -1 && secondSep > -1) {
      String addrStr = rawSignal.substring(firstSep + 1, secondSep);
      String cmdStr = rawSignal.substring(secondSep + 1);

      long addr = addrStr.toInt();
      long cmd = cmdStr.toInt();
      if (addr >= 0 && addr <= 0xFFFF && cmd >= 0 && cmd <= 0xFF) {
        IRSignal newSignal;
        newSignal.name = commandId;
        newSignal.isNEC = true;
        newSignal.necAddress = static_cast<uint16_t>(addr);
        newSignal.necCommand = static_cast<uint8_t>(cmd);
        newSignal.timestamp = millis();
        learnedSignals[commandId] = newSignal;

        Serial.println("✅ Sinal NEC armazenado: " + commandId);
        Serial.print("   Addr=0x");
        Serial.print(newSignal.necAddress, HEX);
        Serial.print(" Cmd=0x");
        Serial.println(newSignal.necCommand, HEX);
        return true;
      }
    }

    Serial.println("⚠️ Formato NEC invalido para: " + commandId);
    return false;
  }

  std::vector<uint16_t> parsedSignal;
  int start = 0;

  // Parse CSV do raw signal
  while (start < static_cast<int>(rawSignal.length()) && parsedSignal.size() < maxLen) {
    int commaPos = rawSignal.indexOf(',', start);
    String token = (commaPos == -1) ? rawSignal.substring(start) : rawSignal.substring(start, commaPos);
    token.trim();

    long value = token.toInt();
    if (value >= 50 && value <= 40000) {
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
  newSignal.isNEC = false;
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

String buildBackendUrlFromIp(const IPAddress &ip) {
  return String("http://") + ip.toString() + ":" + String(BACKEND_PORT);
}

bool probeBackendUrl(const String &candidateUrl) {
  HTTPClient http;
  String probeUrl = candidateUrl;
  if (!probeUrl.endsWith("/")) {
    probeUrl += "/";
  }

  String probeUrlLower = probeUrl;
  probeUrlLower.toLowerCase();
  bool isHttps = probeUrlLower.startsWith("https://");

#if defined(ESP8266)
  static BearSSL::WiFiClientSecure secureClient;
  static WiFiClient plainClient;
  bool beginOk = false;

  if (isHttps) {
    secureClient.setInsecure();
    secureClient.setBufferSizes(512, 512);
    secureClient.setTimeout(4000);
    beginOk = http.begin(secureClient, probeUrl);
  } else {
    beginOk = http.begin(plainClient, probeUrl);
  }
#else
  static WiFiClientSecure secureClient;
  static WiFiClient plainClient;
  bool beginOk = false;

  if (isHttps) {
    secureClient.setInsecure();
    secureClient.setTimeout(4000);
    beginOk = http.begin(secureClient, probeUrl);
  } else {
    beginOk = http.begin(plainClient, probeUrl);
  }
#endif

  if (!beginOk) {
    return false;
  }

  http.setTimeout(4000);
  int code = http.GET();
  http.end();
  return code == 200;
}

String discoverBackendUrlOnLocalSubnet() {
  if (WiFi.status() != WL_CONNECTED) {
    return "";
  }

  IPAddress localIp = WiFi.localIP();
  IPAddress subnetMask = WiFi.subnetMask();
  IPAddress networkBase(
    localIp[0] & subnetMask[0],
    localIp[1] & subnetMask[1],
    localIp[2] & subnetMask[2],
    0
  );

  Serial.print("🔎 Procurando backend na sub-rede ");
  Serial.println(localIp.toString());

  for (int host = 1; host <= 254; host++) {
    IPAddress candidate = networkBase;
    candidate[3] = host;
    String candidateUrl = buildBackendUrlFromIp(candidate);

    if (probeBackendUrl(candidateUrl)) {
      Serial.print("✅ Backend localizado em ");
      Serial.println(candidateUrl);
      return candidateUrl;
    }
  }

  Serial.println("⚠️ Nenhum backend local encontrado na sub-rede.");
  return "";
}

int postHeartbeatJson(const String &heartbeatUrl, const String &jsonBody, String &responseOut) {
  HTTPClient http;
  String heartbeatUrlLower = heartbeatUrl;
  heartbeatUrlLower.toLowerCase();
  bool isHttps = heartbeatUrlLower.startsWith("https://");

#if defined(ESP8266)
  static BearSSL::WiFiClientSecure secureClient;
  static WiFiClient plainClient;
  bool beginOk = false;

  if (isHttps) {
    secureClient.setInsecure();
    secureClient.setBufferSizes(512, 512);
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
    return -1;
  }

  http.setTimeout(15000);
  http.addHeader("Content-Type", "application/json");
  int httpCode = http.POST(jsonBody);

  if (httpCode == 200) {
    responseOut = http.getString();
  } else if (httpCode < 0) {
    responseOut = http.errorToString(httpCode);
  }

  http.end();
  return httpCode;
}

void processBackendPolling() {
  static unsigned long lastHeartbeat = 0;
  static unsigned long lastWifiConnectedTime = 0;
  static const unsigned long WIFI_DISCONNECT_TIMEOUT_MS = 60000; // 60 segundos para iniciar portal

  // Rastrear quando o Wi-Fi estava conectado
  if (WiFi.status() == WL_CONNECTED) {
    lastWifiConnectedTime = millis();
  } else {
    // Verificar se desconectado por muito tempo → iniciar portal
    if (millis() - lastWifiConnectedTime > WIFI_DISCONNECT_TIMEOUT_MS) {
      Serial.println("🛜 Wi-Fi desconectado por >60s. Iniciando portal AC-SETUP...");
      delay(500);
      startWifiSetupPortalNow();
      return;
    }
  }

  if (millis() - lastHeartbeat <= HEARTBEAT_INTERVAL_MS) {
    return;
  }
  lastHeartbeat = millis();

  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("❌ Wi-Fi desconectado. Heartbeat não enviado.");
    return;
  }

  DynamicJsonDocument doc(4096);
  doc["deviceId"] = deviceId;
  doc["status"] = powerStateOn ? "ligado" : "desligado";
  doc["deviceType"] = "IR_CONTROLLER";
  doc["signalsStored"] = learnedSignals.size();
  doc["learningActive"] = learningActive;

  float ambientTemperature = lerTemperaturaC();
  if (!isnan(ambientTemperature)) {
    doc["temperature"] = roundf(ambientTemperature * 10.0f) / 10.0f;
  }

  if (learningActive) {
    JsonObject learning = doc.createNestedObject("learning");
    learning["button"] = learningCommandId;
    learning["stage"] = learningAwaitingConfirm ? "awaiting_confirmation" : "awaiting_signal";
    learning["message"] = learningAwaitingConfirm
      ? "Sinal recebido, confirme pressionando o botao novamente."
      : "Aguardando sinal IR do controle.";
  }

  if (pendingLearnStatus.length() > 0 && pendingLearnCommandId.length() > 0) {
    JsonObject learned = doc.createNestedObject("learnedSignal");
    learned["status"] = pendingLearnStatus;
    learned["button"] = pendingLearnCommandId;
    if (pendingLearnRaw.length() > 0) {
      learned["raw"] = pendingLearnRaw;
    }
    if (pendingLearnMessage.length() > 0) {
      learned["message"] = pendingLearnMessage;
    }
  }

  String jsonBody;
  serializeJson(doc, jsonBody);

  if (!isnan(ambientTemperature)) {
    Serial.println("🌡️ Temperatura ambiente: " + String(doc["temperature"].as<float>(), 1) + "°C");
  }

  Serial.println("⏳ Enviando heartbeat para backend...");
  String response;
  String heartbeatUrl = String(activeBackendURL) + "/api/heartbeat";
  int httpCode = postHeartbeatJson(heartbeatUrl, jsonBody, response);

  if (httpCode < 0) {
    unsigned long now = millis();
    if (now - lastBackendDiscoveryAttempt >= BACKEND_DISCOVERY_INTERVAL_MS) {
      lastBackendDiscoveryAttempt = now;
      String discoveredUrl = discoverBackendUrlOnLocalSubnet();
      if (discoveredUrl.length() > 0) {
        activeBackendURL = discoveredUrl;
        heartbeatUrl = discoveredUrl + "/api/heartbeat";
        httpCode = postHeartbeatJson(heartbeatUrl, jsonBody, response);
      }
    }
  }

  Serial.println("📡 Resposta heartbeat: " + String(httpCode));

  if (httpCode == 200) {
    Serial.println("📥 Body (" + String(response.length()) + "b): " + response.substring(0, 120));
    // O payload pode carregar learnedSignal.raw com centenas de bytes.
    // Usamos capacidade dinâmica para evitar NoMemory em respostas maiores.
    const size_t jsonCapacity = response.length() + 512;
    DynamicJsonDocument responseDoc(jsonCapacity);
    DeserializationError error = deserializeJson(responseDoc, response);

    if (error) {
      Serial.println("❌ JSON parse error: " + String(error.c_str()));
      Serial.println("   JSON capacity usada: " + String(jsonCapacity));
    }

    if (!error) {
      const char *command = responseDoc["command"];
      Serial.println("💓 Heartbeat OK | cmd=" + String(command ? command : "null"));

      Serial.print("📦 Heartbeat payload bruto: ");
      serializeJson(responseDoc, Serial);
      Serial.println();

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

        if (cmdStr.startsWith("learn:")) {
          cmdIdStr = cmdStr.substring(String("learn:").length());
          cmdStr = "learn";
        } else if (cmdStr.startsWith("learn_confirm:")) {
          cmdIdStr = cmdStr.substring(String("learn_confirm:").length());
          cmdStr = "learn";
        }

        Serial.println("🧭 Comando recebido do backend: " + cmdStr);
        if (cmdIdStr.length() > 0) {
          Serial.println("🆔 commandId: " + cmdIdStr);
        }
        if (learnedRawStr.length() > 0) {
          Serial.println("🧾 raw recebido: " + learnedRawStr);
        }

        if (cmdStr == "learn" && cmdIdStr.length() > 0) {
          Serial.println("📚 Backend solicita aprendizado de: " + cmdIdStr);
          startLearningMode(cmdIdStr);
        }
        else if (cmdStr == "learn_cancel" || cmdStr == "cancel_learn") {
          cancelLearningMode("Cancelado pelo usuario.");
        }
        else if (cmdStr == "transmit" && cmdIdStr.length() > 0) {
          Serial.println("📤 Backend solicita transmissão de: " + cmdIdStr);
          sendStoredSignal(cmdIdStr);
        }
        else if (cmdStr == "store" && cmdIdStr.length() > 0 && learnedRaw != nullptr) {
          Serial.println("💾 Backend solicita armazenar sinal: " + cmdIdStr);
          storeLearnedSignal(cmdIdStr, String(learnedRaw));
        }
        else if (isDirectReplayCommand(cmdStr)) {
          Serial.println("🕹️ Comando manual recebido do painel: " + cmdStr);

          bool sent = false;
          if (learnedRawStr.length() > 0) {
            Serial.println("💾 Sinal salvo no banco recebido para o comando: " + cmdStr);
            Serial.print("   raw = ");
            Serial.println(learnedRawStr);
            if (storeLearnedSignal(cmdStr, learnedRawStr)) {
              sent = sendStoredSignal(cmdStr);
            } else {
              Serial.println("❌ Não foi possível armazenar o sinal vindo do banco para: " + cmdStr);
            }
          } else {
            Serial.println("⚠️ Nenhum sinal IR salvo no banco para: " + cmdStr);
            sent = false;
          }

          if (!sent) {
            Serial.println("❌ Comando ignorado: não há sinal IR salvo no banco para " + cmdStr);
          }
        }
        else if (cmdStr == "wifi_reset" || cmdStr == "reset_wifi") {
          Serial.println("🛜 Backend solicitou reset de Wi-Fi. Portal sera iniciado apos heartbeat.");
          pendingWifiResetPortal = true;
        }
      }
    }
  } else {
    Serial.println("⚠️ Erro no heartbeat: " + String(httpCode));
    if (response.length() > 0) {
      Serial.println("   HTTPClient: " + response);
    }
    Serial.println("   URL: " + heartbeatUrl);
    Serial.println("   WiFi SSID: " + WiFi.SSID());
    Serial.println("   WiFi IP: " + WiFi.localIP().toString());
  }

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

  // Cancelar aprendizado
  server.on("/learn/cancel", HTTP_POST, []() {
    cancelLearningMode("Cancelado via API local.");
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
  pinMode(txPinIR, OUTPUT);

  IrSender.begin(txPinIR, DISABLE_LED_FEEDBACK);
  IrReceiver.begin(rxPinIR, DISABLE_LED_FEEDBACK);

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
