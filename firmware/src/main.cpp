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

// Configuração do servidor backend
const char *backendURL = "https://sistema-de-monitoramento-de-ar.onrender.com";
// const char *backendURL = "http://192.168.18.109:3001"; 
String deviceId;

// Definição dos pinos e constantes
#define maxLen 800
#define rxPinIR 4  // Pino de entrada para receptor IR
#define txPinIR 26 // Pino de saída para transmissor IR
#define ligarPin 12  // Pino do botão de ligar
#define desligarPin 2 // Pino do botão de desligar

// Inicialização do servidor Web e WebSocket
WebServerType server(80);
WebSocketsServer webSocket(81);

// Variável de estado do ar-condicionado
bool estadoAC = false;
float setpointAtual = 22.0; // Setpoint padrão

// Buffers para armazenamento dos sinais IR
uint16_t irSignalLigar[] = {4372, 4336, 568, 1572, 564, 528, 568, 1572, 568, 1572, 564, 528, 568, 528, 568, 1572, 568, 524, 568, 528, 568, 1572, 568, 528, 564, 528, 568, 1572, 568, 1568, 572, 528, 564, 1572, 568, 528, 568, 1572, 564, 528, 568, 1572, 568, 1572, 564, 1572, 568, 1572, 564, 1572, 568, 1572, 568, 524, 572, 1568, 568, 528, 568, 528, 568, 524, 572, 524, 568, 528, 568, 528, 568, 528, 568, 1568, 568, 528, 568, 528, 568, 528, 568, 528, 568, 528, 564, 1572, 568, 1568, 572, 524, 572, 1568, 568, 1568, 568, 1572, 568, 1572, 568, 1568, 572, 5196, 4372, 4332, 572, 1568, 568, 528, 568, 1572, 568, 1568, 568, 528, 568, 528, 568, 1572, 564, 528, 568, 528, 568, 1572, 568, 524, 572, 524, 568, 1572, 568, 1568, 568, 528, 568, 1572, 568, 528, 568, 1568, 568, 528, 568, 1572, 564, 1572, 568, 1572, 568, 1568, 572, 1568, 568, 1572, 564, 528, 568, 1572, 568, 528, 564, 528, 568, 532, 564, 532, 564, 528, 568, 528, 568, 528, 564, 1572, 568, 528, 568, 528, 568, 528, 568, 528, 564, 528, 568, 1572, 568, 1572, 564, 528, 568, 1572, 568, 1568, 572, 1568, 568, 1572, 564, 1572, 568}; // Sinal IR para ligar
uint16_t irSignalDesligar[] = {4376, 4336, 568, 1596, 540, 556, 540, 1596, 544, 1596, 540, 556, 540, 556, 540, 1596, 544, 528, 564, 528, 568, 1596, 544, 552, 544, 552, 540, 1596, 544, 1596, 544, 552, 540, 1596, 544, 552, 544, 1596, 540, 1596, 544, 1596, 540, 1596, 544, 556, 540, 1596, 544, 1596, 540, 1596, 540, 532, 564, 532, 564, 556, 540, 532, 564, 1596, 540, 536, 560, 556, 540, 1596, 544, 1592, 544, 1596, 544, 552, 544, 552, 540, 556, 540, 556, 540, 552, 544, 528, 568, 552, 544, 528, 564, 1596, 544, 1596, 540, 1596, 544, 1596, 544, 1596, 540, 5196, 4376, 4340, 564, 1596, 540, 552, 544, 1596, 540, 1600, 540, 556, 540, 552, 544, 1596, 540, 556, 540, 552, 544, 1596, 544, 528, 564, 556, 540, 1596, 544, 1596, 540, 552, 544, 1596, 544, 532, 560, 1600, 540, 1596, 544, 1596, 540, 1596, 544, 528, 568, 1596, 540, 1596, 544, 1596, 540, 556, 544, 528, 564, 552, 544, 528, 568, 1596, 540, 556, 540, 556, 540, 1596, 540, 1596, 544, 1596, 544, 552, 544, 552, 540, 552, 544, 528, 568, 552, 544, 552, 564, 532, 540, 556, 540, 1596, 544, 1596, 540, 1596, 544, 1596, 544, 1592, 544}; // Sinal IR para desligar

// Variáveis voláteis para interrupções IR
volatile unsigned long irBuffer[maxLen];
volatile unsigned int x = 0;
#if defined(ESP32)
portMUX_TYPE mux = portMUX_INITIALIZER_UNLOCKED;
#endif

#if defined(ESP8266)
const uint8_t buttonMode = INPUT_PULLUP;
const uint8_t buttonPressedState = LOW;
#else
const uint8_t buttonMode = INPUT_PULLDOWN;
const uint8_t buttonPressedState = HIGH;
#endif

String getChipSuffix()
{
#if defined(ESP8266)
    uint32_t chipId = ESP.getChipId();
    String suffix = String(chipId, HEX);
#else
    uint64_t chipId = ESP.getEfuseMac();
    String suffix = String(static_cast<uint32_t>(chipId & 0xFFFFFF), HEX);
#endif
    suffix.toUpperCase();
    while (suffix.length() < 6)
    {
        suffix = "0" + suffix;
    }
    return suffix;
}

void connectWiFiWithPortal()
{
    String chipSuffix = getChipSuffix();
    String apName = "AC-SETUP-" + chipSuffix;

    WiFi.mode(WIFI_STA);
    WiFiManager wm;
    wm.setConfigPortalTimeout(180);
    wm.setConnectTimeout(20);

    Serial.println("\n🌐 Iniciando conexão Wi-Fi...");
    Serial.println("Se não houver rede salva, abrirá portal de configuração: " + apName);

    bool connected = wm.autoConnect(apName.c_str());
    if (!connected)
    {
        Serial.println("❌ Falha ao conectar Wi-Fi via portal. Reiniciando...");
        delay(1500);
        ESP.restart();
        return;
    }

    Serial.println("✅ Conectado ao Wi-Fi!");
    Serial.print("SSID: ");
    Serial.println(WiFi.SSID());
    Serial.print("Endereço IP: ");
    Serial.println(WiFi.localIP());
}

// Função de interrupção para capturar sinais IR recebidos
void IRAM_ATTR rxIR_Interrupt_Handler()
{
#if defined(ESP32)
    portENTER_CRITICAL_ISR(&mux);
#endif
    if (x < maxLen)
    {
        irBuffer[x++] = micros();
    }
#if defined(ESP32)
    portEXIT_CRITICAL_ISR(&mux);
#endif
}

// Envia o estado atual do AC para os clientes WebSocket
void sendStateToClients() {
    String message = estadoAC ? "ligado" : "desligado";
    webSocket.broadcastTXT(message);
}

// Envia sinais IR e imprime os valores de forma organizada
void sendIRSignalToClients(String action, uint16_t signal[], size_t length) {
    Serial.println("\n➡️ Sinal IR enviado para " + action + ":");
    for (size_t i = 0; i < length; i++) {
        Serial.print(signal[i]);
        Serial.print(i < length - 1 ? ", " : "\n");
    }
    String wsMessage = "Sinal IR enviado para " + action;
    webSocket.broadcastTXT(wsMessage);
}

void processIRReception() {
    if (x > 0) {
        Serial.println("\n📡 Sinal IR recebido:");
        for (unsigned int i = 1; i < x; i++) {
            unsigned long delta = irBuffer[i] - irBuffer[i - 1];
            Serial.print(delta);
            Serial.print(i < x - 1 ? ", " : "\n");
        }
        x = 0;
    }
}

void processRequests() {
    server.handleClient();
    webSocket.loop();
}

void processBackendPolling() {
    static unsigned long lastHeartbeat = 0;
    if (millis() - lastHeartbeat <= 30000) {
        return;
    }
    lastHeartbeat = millis();

    HTTPClient http;
    String heartbeatUrl = String(backendURL) + "/api/heartbeat";
    String heartbeatUrlLower = heartbeatUrl;
    heartbeatUrlLower.toLowerCase();
    bool isHttps = heartbeatUrlLower.startsWith("https://");

    if (WiFi.status() != WL_CONNECTED) {
        Serial.println("❌ Wi-Fi desconectado. Heartbeat não enviado.");
        return;
    }

#if defined(ESP8266)
    static BearSSL::WiFiClientSecure secureClient;
    static WiFiClient plainClient;
    bool beginOk = false;

    if (isHttps) {
        secureClient.setInsecure();
        beginOk = http.begin(secureClient, heartbeatUrl);
    } else {
        beginOk = http.begin(plainClient, heartbeatUrl);
    }

    if (!beginOk) {
        Serial.println("❌ Falha ao iniciar conexão HTTP (ESP8266)");
        return;
    }
#else
    static WiFiClientSecure secureClient;
    static WiFiClient plainClient;
    bool beginOk = false;

    if (isHttps) {
        secureClient.setInsecure();
        beginOk = http.begin(secureClient, heartbeatUrl);
    } else {
        beginOk = http.begin(plainClient, heartbeatUrl);
    }

    if (!beginOk) {
        Serial.println("❌ Falha ao iniciar conexão HTTP (ESP32)");
        return;
    }
#endif
    http.addHeader("Content-Type", "application/json");

    StaticJsonDocument<256> doc;
    doc["deviceId"] = deviceId;
    doc["status"] = estadoAC ? "ligado" : "desligado";
    doc["setpoint"] = setpointAtual;

    String jsonBody;
    serializeJson(doc, jsonBody);

    int httpCode = http.POST(jsonBody);

    if (httpCode == 200) {
        String response = http.getString();

        StaticJsonDocument<512> responseDoc;
        DeserializationError error = deserializeJson(responseDoc, response);

        if (!error) {
            const char *command = responseDoc["command"];

            if (command != nullptr && String(command) != "none") {
                Serial.println("📡 Comando recebido do backend: " + String(command));

                if ((String(command) == "TURN_ON" || String(command) == "ligar") && !estadoAC) {
                    Serial.println("🟢 Executando: LIGAR");
                    IrSender.sendRaw(irSignalLigar, sizeof(irSignalLigar) / sizeof(irSignalLigar[0]), 38);
                    estadoAC = true;
                    sendStateToClients();
                    sendIRSignalToClients("Ligar", irSignalLigar, sizeof(irSignalLigar) / sizeof(irSignalLigar[0]));
                }
                else if ((String(command) == "TURN_OFF" || String(command) == "desligar") && estadoAC) {
                    Serial.println("🔴 Executando: DESLIGAR");
                    IrSender.sendRaw(irSignalDesligar, sizeof(irSignalDesligar) / sizeof(irSignalDesligar[0]), 38);
                    estadoAC = false;
                    sendStateToClients();
                    sendIRSignalToClients("Desligar", irSignalDesligar, sizeof(irSignalDesligar) / sizeof(irSignalDesligar[0]));
                }
                else if (String(command).startsWith("set_temp:")) {
                    String valor = String(command).substring(String("set_temp:").length());
                    float novoSetpoint = valor.toFloat();
                    if (novoSetpoint >= 16 && novoSetpoint <= 30) {
                        setpointAtual = novoSetpoint;
                        Serial.println("🌡️ Ajustar setpoint para: " + String(novoSetpoint) + "°C");
                        String wsSetpointMessage = "Setpoint atualizado para " + String(novoSetpoint) + "°C";
                        webSocket.broadcastTXT(wsSetpointMessage);
                    } else {
                        Serial.println("⚠️ Comando set_temp inválido: " + valor);
                    }
                }
                else if (String(command) == "WIFI_RESET" || String(command) == "wifi_reset") {
                    Serial.println("🛜 Comando recebido: resetar configuração Wi-Fi");
                    String wsWifiMessage = "Reconfiguração de Wi-Fi solicitada";
                    webSocket.broadcastTXT(wsWifiMessage);

                    WiFiManager wm;
                    wm.resetSettings();
                    delay(1000);
                    ESP.restart();
                }
            }
        }
    } else {
        Serial.println("❌ Erro na requisição heartbeat: " + String(httpCode) + " - " + HTTPClient::errorToString(httpCode));
        Serial.println("🔎 URL heartbeat: " + heartbeatUrl);
        Serial.println("🔎 IP local do dispositivo: " + WiFi.localIP().toString());
    }

    http.end();
}

void processIRCommands() {
    static unsigned long lastButtonAction = 0;
    if (millis() - lastButtonAction < 500) {
        return;
    }

    if (digitalRead(ligarPin) == buttonPressedState && !estadoAC) {
        Serial.println("🟢 Botão físico pressionado: LIGAR");
        IrSender.sendRaw(irSignalLigar, sizeof(irSignalLigar) / sizeof(irSignalLigar[0]), 38);
        estadoAC = true;
        sendStateToClients();
        sendIRSignalToClients("Ligar", irSignalLigar, sizeof(irSignalLigar) / sizeof(irSignalLigar[0]));
        lastButtonAction = millis();
    }
    if (digitalRead(desligarPin) == buttonPressedState && estadoAC) {
        Serial.println("🔴 Botão físico pressionado: DESLIGAR");
        IrSender.sendRaw(irSignalDesligar, sizeof(irSignalDesligar) / sizeof(irSignalDesligar[0]), 38);
        estadoAC = false;
        sendStateToClients();
        sendIRSignalToClients("Desligar", irSignalDesligar, sizeof(irSignalDesligar) / sizeof(irSignalDesligar[0]));
        lastButtonAction = millis();
    }
}

#if defined(ESP32)
void handleIRReception(void *pvParameters) {
    while (true) {
        processIRReception();
        vTaskDelay(100 / portTICK_PERIOD_MS);
    }
}

void handleRequests(void *pvParameters) {
    while (true) {
        processRequests();
        vTaskDelay(10 / portTICK_PERIOD_MS);
    }
}

void handleBackendPolling(void *pvParameters) {
    while (true) {
        processBackendPolling();
        vTaskDelay(1000 / portTICK_PERIOD_MS);
    }
}

void handleIRCommands(void *pvParameters) {
    while (true) {
        processIRCommands();
        vTaskDelay(50 / portTICK_PERIOD_MS);
    }
}
#endif

// Configuração inicial do sistema
void setup() {
    Serial.begin(115200);

    deviceId = "ac-node-" + getChipSuffix();
    connectWiFiWithPortal();

    Serial.print("Device ID: ");
    Serial.println(deviceId);
    Serial.print("Backend URL: ");
    Serial.println(backendURL);

    server.on("/wifi/status", HTTP_OPTIONS, []() {
        server.sendHeader("Access-Control-Allow-Origin", "*");
        server.sendHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
        server.sendHeader("Access-Control-Allow-Headers", "Content-Type");
        server.send(204);
    });

    server.on("/wifi/status", HTTP_GET, []() {
        StaticJsonDocument<256> statusDoc;
        statusDoc["deviceId"] = deviceId;
        statusDoc["connected"] = (WiFi.status() == WL_CONNECTED);
        statusDoc["ssid"] = WiFi.SSID();
        statusDoc["ip"] = WiFi.localIP().toString();

        String payload;
        serializeJson(statusDoc, payload);
        server.sendHeader("Access-Control-Allow-Origin", "*");
        server.send(200, "application/json", payload);
    });

    server.on("/wifi/reset", HTTP_POST, []() {
        server.sendHeader("Access-Control-Allow-Origin", "*");
        server.send(200, "application/json", "{\"ok\":true,\"message\":\"Reiniciando configuração Wi-Fi\"}");

        WiFiManager wm;
        wm.resetSettings();
        delay(1000);
        ESP.restart();
    });

    server.on("/wifi/networks", HTTP_OPTIONS, []() {
        server.sendHeader("Access-Control-Allow-Origin", "*");
        server.sendHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
        server.sendHeader("Access-Control-Allow-Headers", "Content-Type");
        server.send(204);
    });

    server.on("/wifi/networks", HTTP_GET, []() {
        Serial.println("📡 Escaneando redes WiFi disponíveis...");
        
        StaticJsonDocument<512> networksDoc;
        JsonArray networks = networksDoc.createNestedArray("networks");
        
        int numNetworks = WiFi.scanNetworks();
        Serial.print("Redes encontradas: ");
        Serial.println(numNetworks);
        
        for (int i = 0; i < numNetworks; i++) {
            JsonObject net = networks.createNestedObject();
            net["ssid"] = WiFi.SSID(i);
            net["rssi"] = WiFi.RSSI(i);
            net["channel"] = WiFi.channel(i);
            #if defined(ESP8266)
            net["encryptionType"] = (int)WiFi.encryptionType(i);
            #endif
        }
        
        String payload;
        serializeJson(networksDoc, payload);
        server.sendHeader("Access-Control-Allow-Origin", "*");
        server.send(200, "application/json", payload);
    });

    server.on("/wifi/configure", HTTP_OPTIONS, []() {
        server.sendHeader("Access-Control-Allow-Origin", "*");
        server.sendHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
        server.sendHeader("Access-Control-Allow-Headers", "Content-Type");
        server.send(204);
    });

    server.on("/wifi/configure", HTTP_POST, []() {
        if (!server.hasArg("plain")) {
            server.send(400, "application/json", "{\"error\":\"JSON body required\"}");
            return;
        }
        
        StaticJsonDocument<256> configDoc;
        DeserializationError error = deserializeJson(configDoc, server.arg("plain"));
        
        if (error) {
            server.send(400, "application/json", "{\"error\":\"JSON parse error\"}");
            return;
        }
        
        const char* ssid = configDoc["ssid"];
        const char* password = configDoc["password"];
        
        if (!ssid || !password) {
            server.send(400, "application/json", "{\"error\":\"ssid and password required\"}");
            return;
        }
        
        Serial.println("🔧 Configurando WiFi via requisição...");
        Serial.print("SSID: ");
        Serial.println(ssid);
        
        server.sendHeader("Access-Control-Allow-Origin", "*");
        server.send(200, "application/json", "{\"ok\":true,\"message\":\"Configuração recebida. Reiniciando...\"}");
        
        delay(250);
        WiFi.mode(WIFI_STA);
        WiFi.disconnect();
        delay(200);
        WiFi.begin(ssid, password);

        unsigned long wifiStart = millis();
        while (WiFi.status() != WL_CONNECTED && millis() - wifiStart < 15000) {
            delay(500);
            Serial.print(".");
        }
        Serial.println();

        if (WiFi.status() == WL_CONNECTED) {
            Serial.println("✅ Nova rede aplicada com sucesso.");
            Serial.print("Novo IP: ");
            Serial.println(WiFi.localIP());
        } else {
            Serial.println("⚠️ Não foi possível conectar com as credenciais enviadas. Reiniciando para modo portal.");
        }

        WiFi.disconnect();
        ESP.restart();
    });

    server.on("/ligar", HTTP_GET, []() {
        Serial.println("🔴 Recebida requisição para LIGAR.");
        IrSender.sendRaw(irSignalLigar, sizeof(irSignalLigar) / sizeof(irSignalLigar[0]), 38);
        
        server.sendHeader("Access-Control-Allow-Origin", "*"); // Permite requisições de qualquer origem
        server.sendHeader("Access-Control-Allow-Methods", "GET"); // Permite apenas método GET
        server.send(200, "text/plain", "OK");
    
        estadoAC = true;
        sendStateToClients();
        sendIRSignalToClients("Ligar", irSignalLigar, sizeof(irSignalLigar) / sizeof(irSignalLigar[0]));
    });
    
    server.on("/desligar", HTTP_GET, []() {
        Serial.println("🔴 Recebida requisição para DESLIGAR.");
        IrSender.sendRaw(irSignalDesligar, sizeof(irSignalDesligar) / sizeof(irSignalDesligar[0]), 38);
        
        server.sendHeader("Access-Control-Allow-Origin", "*");
        server.sendHeader("Access-Control-Allow-Methods", "GET");
        server.send(200, "text/plain", "OK");
    
        estadoAC = false;
        sendStateToClients();
        sendIRSignalToClients("Desligar", irSignalDesligar, sizeof(irSignalDesligar) / sizeof(irSignalDesligar[0]));
    });
    

    server.onNotFound([]() {
        Serial.println("⚠️ Rota não encontrada: " + server.uri());
        server.send(404, "text/plain", "Erro 404: Rota não encontrada");
    });

    server.begin();
    webSocket.begin();

    pinMode(rxPinIR, INPUT_PULLUP);
    pinMode(txPinIR, OUTPUT);
    pinMode(ligarPin, buttonMode);
    pinMode(desligarPin, buttonMode);

    IrSender.begin(txPinIR, ENABLE_LED_FEEDBACK);
    attachInterrupt(digitalPinToInterrupt(rxPinIR), rxIR_Interrupt_Handler, CHANGE);

#if defined(ESP32)
    xTaskCreatePinnedToCore(handleRequests, "Tarefa Requisições", 4096, NULL, 1, NULL, 1);
    xTaskCreatePinnedToCore(handleIRCommands, "Tarefa IR", 4096, NULL, 1, NULL, 0);
    xTaskCreatePinnedToCore(handleIRReception, "Tarefa Recebimento IR", 4096, NULL, 1, NULL, 0);
    xTaskCreatePinnedToCore(handleBackendPolling, "Tarefa Backend Polling", 8192, NULL, 1, NULL, 0);
#endif
}

void loop() {
#if defined(ESP32)
    vTaskDelay(portMAX_DELAY);
#else
    processRequests();
    processIRCommands();
    processIRReception();
    processBackendPolling();
    delay(10);
#endif
}