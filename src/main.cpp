#include <WiFi.h>
#include <WebServer.h>
#include <WebSocketsServer.h>
#include <Arduino.h>
#include <IRremote.h>

const char *ssid = "Sobralnet-ENGENHARIA 1060";
const char *password = "apartamento1060";

#define maxLen 800
#define rxPinIR 4
#define txPinIR 26
#define ligarPin 12
#define desligarPin 2

WebServer server(80);
WebSocketsServer webSocket(81);

bool estadoAC = false;

uint16_t irSignalLigar[] = {4372, 4336, 568, 1572, 564, 528, 568, 1572, 568, 1572, 564, 528, 568, 528, 568, 1572, 568, 524, 568, 528, 568, 1572, 568, 528, 564, 528, 568, 1572, 568, 1568, 572, 528, 564, 1572, 568, 528, 568, 1572, 564, 528, 568, 1572, 568, 1572, 564, 1572, 568, 1572, 564, 1572, 568, 1572, 568, 524, 572, 1568, 568, 528, 568, 528, 568, 524, 572, 524, 568, 528, 568, 528, 568, 528, 568, 1568, 568, 528, 568, 528, 568, 528, 568, 528, 568, 528, 564, 1572, 568, 1568, 572, 524, 572, 1568, 568, 1568, 568, 1572, 568, 1572, 568, 1568, 572, 5196, 4372, 4332, 572, 1568, 568, 528, 568, 1572, 568, 1568, 568, 528, 568, 528, 568, 1572, 564, 528, 568, 528, 568, 1572, 568, 524, 572, 524, 568, 1572, 568, 1568, 568, 528, 568, 1572, 568, 528, 568, 1568, 568, 528, 568, 1572, 564, 1572, 568, 1572, 568, 1568, 572, 1568, 568, 1572, 564, 528, 568, 1572, 568, 528, 564, 528, 568, 532, 564, 532, 564, 528, 568, 528, 568, 528, 564, 1572, 568, 528, 568, 528, 568, 528, 568, 528, 564, 528, 568, 1572, 568, 1572, 564, 528, 568, 1572, 568, 1568, 572, 1568, 568, 1572, 564, 1572, 568}; // Sinal IR para ligar
uint16_t irSignalDesligar[] = {4376, 4336, 568, 1596, 540, 556, 540, 1596, 544, 1596, 540, 556, 540, 556, 540, 1596, 544, 528, 564, 528, 568, 1596, 544, 552, 544, 552, 540, 1596, 544, 1596, 544, 552, 540, 1596, 544, 552, 544, 1596, 540, 1596, 544, 1596, 540, 1596, 544, 556, 540, 1596, 544, 1596, 540, 1596, 540, 532, 564, 532, 564, 556, 540, 532, 564, 1596, 540, 536, 560, 556, 540, 1596, 544, 1592, 544, 1596, 544, 552, 544, 552, 540, 556, 540, 556, 540, 552, 544, 528, 568, 552, 544, 528, 564, 1596, 544, 1596, 540, 1596, 544, 1596, 544, 1596, 540, 5196, 4376, 4340, 564, 1596, 540, 552, 544, 1596, 540, 1600, 540, 556, 540, 552, 544, 1596, 540, 556, 540, 552, 544, 1596, 544, 528, 564, 556, 540, 1596, 544, 1596, 540, 552, 544, 1596, 544, 532, 560, 1600, 540, 1596, 544, 1596, 540, 1596, 544, 528, 568, 1596, 540, 1596, 544, 1596, 540, 556, 544, 528, 564, 552, 544, 528, 568, 1596, 540, 556, 540, 556, 540, 1596, 540, 1596, 544, 1596, 544, 552, 544, 552, 540, 552, 544, 528, 568, 552, 544, 552, 564, 532, 540, 556, 540, 1596, 544, 1596, 540, 1596, 544, 1596, 544, 1592, 544}; // Sinal IR para desligar

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

void handleRequests(void *pvParameters) {
    while (true) {
        server.handleClient();
        webSocket.loop();
        vTaskDelay(10 / portTICK_PERIOD_MS);
    }
}

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

    xTaskCreatePinnedToCore(handleRequests, "Tarefa Requisições", 4096, NULL, 1, NULL, 1);
    xTaskCreatePinnedToCore(handleIRCommands, "Tarefa IR", 4096, NULL, 1, NULL, 0);
}

void loop() { vTaskDelay(portMAX_DELAY); }
