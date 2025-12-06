#include <WiFi.h>
#include <WebServer.h>
#include <WebSocketsServer.h>
#include <Arduino.h>
#include <IRremote.h>
#include <ArduinoJson.h>
#include <HTTPClient.h>

// Configurações de WiFi
const char *ssid = "Sobralnet-ENGENHARIA 1060";
const char *password = "apartamento1060";

// Configuração do servidor backend
const char *backendURL = "https://sistema-de-monitoramento-de-ar.onrender.com";
const char *deviceId = "esp32-dev-ac-01"; // ID único do dispositivo

// Definição dos pinos e constantes
#define maxLen 800
#define rxPinIR 4  // Pino de entrada para receptor IR
#define txPinIR 26 // Pino de saída para transmissor IR
#define ligarPin 12  // Pino do botão de ligar
#define desligarPin 2 // Pino do botão de desligar

// Inicialização do servidor Web e WebSocket
WebServer server(80);
WebSocketsServer webSocket(81);

// Variável de estado do ar-condicionado
bool estadoAC = false;

// Buffers para armazenamento dos sinais IR
uint16_t irSignalLigar[] = {4372, 4336, 568, 1572, 564, 528, 568, 1572, 568, 1572, 564, 528, 568, 528, 568, 1572, 568, 524, 568, 528, 568, 1572, 568, 528, 564, 528, 568, 1572, 568, 1568, 572, 528, 564, 1572, 568, 528, 568, 1572, 564, 528, 568, 1572, 568, 1572, 564, 1572, 568, 1572, 564, 1572, 568, 1572, 568, 524, 572, 1568, 568, 528, 568, 528, 568, 524, 572, 524, 568, 528, 568, 528, 568, 528, 568, 1568, 568, 528, 568, 528, 568, 528, 568, 528, 568, 528, 564, 1572, 568, 1568, 572, 524, 572, 1568, 568, 1568, 568, 1572, 568, 1572, 568, 1568, 572, 5196, 4372, 4332, 572, 1568, 568, 528, 568, 1572, 568, 1568, 568, 528, 568, 528, 568, 1572, 564, 528, 568, 528, 568, 1572, 568, 524, 572, 524, 568, 1572, 568, 1568, 568, 528, 568, 1572, 568, 528, 568, 1568, 568, 528, 568, 1572, 564, 1572, 568, 1572, 568, 1568, 572, 1568, 568, 1572, 564, 528, 568, 1572, 568, 528, 564, 528, 568, 532, 564, 532, 564, 528, 568, 528, 568, 528, 564, 1572, 568, 528, 568, 528, 568, 528, 568, 528, 564, 528, 568, 1572, 568, 1572, 564, 528, 568, 1572, 568, 1568, 572, 1568, 568, 1572, 564, 1572, 568}; // Sinal IR para ligar
uint16_t irSignalDesligar[] = {4376, 4336, 568, 1596, 540, 556, 540, 1596, 544, 1596, 540, 556, 540, 556, 540, 1596, 544, 528, 564, 528, 568, 1596, 544, 552, 544, 552, 540, 1596, 544, 1596, 544, 552, 540, 1596, 544, 552, 544, 1596, 540, 1596, 544, 1596, 540, 1596, 544, 556, 540, 1596, 544, 1596, 540, 1596, 540, 532, 564, 532, 564, 556, 540, 532, 564, 1596, 540, 536, 560, 556, 540, 1596, 544, 1592, 544, 1596, 544, 552, 544, 552, 540, 556, 540, 556, 540, 552, 544, 528, 568, 552, 544, 528, 564, 1596, 544, 1596, 540, 1596, 544, 1596, 544, 1596, 540, 5196, 4376, 4340, 564, 1596, 540, 552, 544, 1596, 540, 1600, 540, 556, 540, 552, 544, 1596, 540, 556, 540, 552, 544, 1596, 544, 528, 564, 556, 540, 1596, 544, 1596, 540, 552, 544, 1596, 544, 532, 560, 1600, 540, 1596, 544, 1596, 540, 1596, 544, 528, 568, 1596, 540, 1596, 544, 1596, 540, 556, 544, 528, 564, 552, 544, 528, 568, 1596, 540, 556, 540, 556, 540, 1596, 540, 1596, 544, 1596, 544, 552, 544, 552, 540, 552, 544, 528, 568, 552, 544, 552, 564, 532, 540, 556, 540, 1596, 544, 1596, 540, 1596, 544, 1596, 544, 1592, 544}; // Sinal IR para desligar

// Variáveis voláteis para interrupções IR
volatile unsigned long irBuffer[maxLen];
volatile unsigned int x = 0;
portMUX_TYPE mux = portMUX_INITIALIZER_UNLOCKED;

// Função de interrupção para capturar sinais IR recebidos
void IRAM_ATTR rxIR_Interrupt_Handler()
{
    portENTER_CRITICAL_ISR(&mux);
    if (x < maxLen)
    {
        irBuffer[x++] = micros();
    }
    portEXIT_CRITICAL_ISR(&mux);
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
    webSocket.broadcastTXT("Sinal IR enviado para " + action);
}

// Tarefa que processa e exibe sinais IR recebidos
void handleIRReception(void *pvParameters) {
    while (true) {
        if (x > 0) {
            Serial.println("\n📡 Sinal IR recebido:");
            for (unsigned int i = 1; i < x; i++) {
                unsigned long delta = irBuffer[i] - irBuffer[i - 1];
                Serial.print(delta);
                Serial.print(i < x - 1 ? ", " : "\n");
            }
            x = 0; // Reseta o buffer
        }
        vTaskDelay(100 / portTICK_PERIOD_MS);
    }
}

// Tarefa que lida com as requisições HTTP e WebSockets
void handleRequests(void *pvParameters) {
    while (true) {
        server.handleClient();
        webSocket.loop();
        vTaskDelay(10 / portTICK_PERIOD_MS);
    }
}

// Tarefa que faz polling do backend para verificar comandos pendentes
void handleBackendPolling(void *pvParameters) {
    HTTPClient http;
    unsigned long lastHeartbeat = 0;
    
    while (true) {
        // Faz heartbeat a cada 30 segundos
        if (millis() - lastHeartbeat > 30000) {
            lastHeartbeat = millis();
            
            http.begin(backendURL);
            http.addHeader("Content-Type", "application/json");
            
            // Cria JSON com o deviceId e estado atual
            StaticJsonDocument<256> doc;
            doc["deviceId"] = deviceId;
            doc["isOn"] = estadoAC;
            
            String jsonBody;
            serializeJson(doc, jsonBody);
            
            // Envia POST para /api/heartbeat
            int httpCode = http.POST(jsonBody);
            
            if (httpCode == 200) {
                String response = http.getString();
                
                // Parseia resposta JSON
                StaticJsonDocument<512> responseDoc;
                DeserializationError error = deserializeJson(responseDoc, response);
                
                if (!error) {
                    const char* command = responseDoc["command"];
                    
                    // Processa comando recebido
                    if (command != nullptr && String(command) != "none") {
                        Serial.println("📡 Comando recebido do backend: " + String(command));
                        
                        if (String(command) == "TURN_ON" && !estadoAC) {
                            Serial.println("🟢 Executando: LIGAR");
                            IrSender.sendRaw(irSignalLigar, sizeof(irSignalLigar) / sizeof(irSignalLigar[0]), 38);
                            estadoAC = true;
                            sendStateToClients();
                            sendIRSignalToClients("Ligar", irSignalLigar, sizeof(irSignalLigar) / sizeof(irSignalLigar[0]));
                        } 
                        else if (String(command) == "TURN_OFF" && estadoAC) {
                            Serial.println("🔴 Executando: DESLIGAR");
                            IrSender.sendRaw(irSignalDesligar, sizeof(irSignalDesligar) / sizeof(irSignalDesligar[0]), 38);
                            estadoAC = false;
                            sendStateToClients();
                            sendIRSignalToClients("Desligar", irSignalDesligar, sizeof(irSignalDesligar) / sizeof(irSignalDesligar[0]));
                        }
                    }
                }
            } else {
                Serial.println("❌ Erro na requisição heartbeat: " + String(httpCode));
            }
            
            http.end();
        }
        
        vTaskDelay(1000 / portTICK_PERIOD_MS);
    }
}

// Tarefa que lida com os comandos IR via botões físicos
void handleIRCommands(void *pvParameters) {
    while (true) {
        if (digitalRead(ligarPin) == HIGH && !estadoAC) {
            Serial.println("🟢 Botão físico pressionado: LIGAR");
            IrSender.sendRaw(irSignalLigar, sizeof(irSignalLigar) / sizeof(irSignalLigar[0]), 38);
            estadoAC = true;
            sendStateToClients();
            sendIRSignalToClients("Ligar", irSignalLigar, sizeof(irSignalLigar) / sizeof(irSignalLigar[0]));
            vTaskDelay(500 / portTICK_PERIOD_MS);
        }
        if (digitalRead(desligarPin) == HIGH && estadoAC) {
            Serial.println("🔴 Botão físico pressionado: DESLIGAR");
            IrSender.sendRaw(irSignalDesligar, sizeof(irSignalDesligar) / sizeof(irSignalDesligar[0]), 38);
            estadoAC = false;
            sendStateToClients();
            sendIRSignalToClients("Desligar", irSignalDesligar, sizeof(irSignalDesligar) / sizeof(irSignalDesligar[0]));
            vTaskDelay(500 / portTICK_PERIOD_MS);
        }
        vTaskDelay(50 / portTICK_PERIOD_MS);
    }
}

// Configuração inicial do sistema
void setup() {
    Serial.begin(115200);
    WiFi.begin(ssid, password);
    while (WiFi.status() != WL_CONNECTED) {
        delay(500);
        Serial.print(".");
    }
    Serial.println("\n✅ Conectado ao Wi-Fi!");
    Serial.print("Endereço IP: ");
    Serial.println(WiFi.localIP());

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
    pinMode(ligarPin, INPUT_PULLDOWN);
    pinMode(desligarPin, INPUT_PULLDOWN);

    IrSender.begin(txPinIR, ENABLE_LED_FEEDBACK);
    attachInterrupt(digitalPinToInterrupt(rxPinIR), rxIR_Interrupt_Handler, CHANGE);

    xTaskCreatePinnedToCore(handleRequests, "Tarefa Requisições", 4096, NULL, 1, NULL, 1);
    xTaskCreatePinnedToCore(handleIRCommands, "Tarefa IR", 4096, NULL, 1, NULL, 0);
    xTaskCreatePinnedToCore(handleIRReception, "Tarefa Recebimento IR", 4096, NULL, 1, NULL, 0);
    xTaskCreatePinnedToCore(handleBackendPolling, "Tarefa Backend Polling", 8192, NULL, 1, NULL, 0);
}

void loop() { vTaskDelay(portMAX_DELAY); }