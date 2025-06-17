#include <WiFi.h>
#include <WebServer.h>
#include <WebSocketsServer.h>
#include <Arduino.h>
#include <IRremote.h>

// Configurações de WiFi
const char *ssid = "Sobralnet-ENGENHARIA 1060";
const char *password = "apartamento1060";

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
uint16_t irSignalLigar[] = {...}; // Sinal IR para ligar
uint16_t irSignalDesligar[] = {...}; // Sinal IR para desligar

// Variáveis voláteis para interrupções IR
volatile uint16_t irBuffer[maxLen];
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

void sendIRSignalToClients(String action, uint16_t signal[], size_t length) {
    String signalStr = "[ ";
    for (size_t i = 0; i < length; i++) {
        signalStr += String(signal[i]) + (i < length - 1 ? ", " : "");
    }
    signalStr += " ]";
    Serial.println("➡️ Sinal IR enviado para " + action + ": " + signalStr);
    webSocket.broadcastTXT("Sinal IR enviado para " + action + ": " + signalStr);
}

// Tarefa que lida com as requisições HTTP e WebSockets
void handleRequests(void *pvParameters) {
    while (true) {
        server.handleClient();
        webSocket.loop();
        vTaskDelay(10 / portTICK_PERIOD_MS);
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

    // Definição das rotas HTTP
    server.on("/ligar", HTTP_GET, []() {
        Serial.println("🔴 Recebida requisição para LIGAR.");
        IrSender.sendRaw(irSignalLigar, sizeof(irSignalLigar) / sizeof(irSignalLigar[0]), 38);
        server.send(200, "text/plain", "OK");
        estadoAC = true;
        sendStateToClients();
        sendIRSignalToClients("Ligar", irSignalLigar, sizeof(irSignalLigar) / sizeof(irSignalLigar[0]));
    });

    server.on("/desligar", HTTP_GET, []() {
        Serial.println("🔴 Recebida requisição para DESLIGAR.");
        IrSender.sendRaw(irSignalDesligar, sizeof(irSignalDesligar) / sizeof(irSignalDesligar[0]), 38);
        server.send(200, "text/plain", "OK");
        estadoAC = false;
        sendStateToClients();
        sendIRSignalToClients("Desligar", irSignalDesligar, sizeof(irSignalDesligar) / sizeof(irSignalDesligar[0]));
    });

    server.begin();
    webSocket.begin();

    pinMode(rxPinIR, INPUT_PULLUP);
    pinMode(txPinIR, OUTPUT);
    pinMode(ligarPin, INPUT_PULLDOWN);
    pinMode(desligarPin, INPUT_PULLDOWN);

    IrSender.begin(txPinIR, ENABLE_LED_FEEDBACK, 38);
    attachInterrupt(digitalPinToInterrupt(rxPinIR), rxIR_Interrupt_Handler, CHANGE);

    // Criação das tarefas FreeRTOS
    xTaskCreatePinnedToCore(handleRequests, "Tarefa Requisições", 4096, NULL, 1, NULL, 1);
    xTaskCreatePinnedToCore(handleIRCommands, "Tarefa IR", 4096, NULL, 1, NULL, 0);
}

// Loop principal (mantido apenas para evitar reset)
void loop() { vTaskDelay(portMAX_DELAY); }
