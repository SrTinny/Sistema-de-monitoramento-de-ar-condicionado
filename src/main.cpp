#include <WiFi.h>
#include <WebServer.h>

// Configurações do Wi-Fi
const char* ssid = "Sobralnet-ENGENHARIA 1060";
const char* password = "apartamento1060";

// Pinos onde os LEDs estão conectados
const int ledPins[] = {13, 12, 14}; // D13, D12, D14
const int numLeds = sizeof(ledPins) / sizeof(ledPins[0]);

// Inicializa o servidor HTTP na porta 80
WebServer server(80);

// ========================
// Funções de controle dos LEDs
// ========================

// Função para ligar um LED específico
void ligarLED() {
  if (server.hasArg("sala")) {
    int sala = server.arg("sala").toInt();
    if (sala >= 101 && sala < 101 + numLeds) {
      int ledIndex = sala - 101;
      digitalWrite(ledPins[ledIndex], HIGH);
      server.send(200, "text/plain", "LED ligado na Sala " + String(sala));
    } else {
      server.send(400, "text/plain", "Sala inválida!");
    }
  } else {
    server.send(400, "text/plain", "Parâmetro 'sala' ausente!");
  }
}

// Função para desligar um LED específico
void desligarLED() {
  if (server.hasArg("sala")) {
    int sala = server.arg("sala").toInt();
    if (sala >= 101 && sala < 101 + numLeds) {
      int ledIndex = sala - 101;
      digitalWrite(ledPins[ledIndex], LOW);
      server.send(200, "text/plain", "LED desligado na Sala " + String(sala));
    } else {
      server.send(400, "text/plain", "Sala inválida!");
    }
  } else {
    server.send(400, "text/plain", "Parâmetro 'sala' ausente!");
  }
}

// ========================
// Configuração do ESP32 (setup)
// ========================
void setup() {
  // Inicializa a comunicação serial
  Serial.begin(115200);

  // Configura os pinos dos LEDs como saída e garante que iniciem desligados
  for (int i = 0; i < numLeds; i++) {
    pinMode(ledPins[i], OUTPUT);
    digitalWrite(ledPins[i], LOW);
  }

  // Conecta ao Wi-Fi
  Serial.print("Conectando ao Wi-Fi");
  WiFi.begin(ssid, password);
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }

  // Exibe informações da conexão Wi-Fi
  Serial.println("\nConectado ao Wi-Fi!");
  Serial.print("Endereço IP: ");
  Serial.println(WiFi.localIP());

  // Define rotas HTTP para controle dos LEDs
  server.on("/ligar", ligarLED);
  server.on("/desligar", desligarLED);

  // Inicia o servidor HTTP
  server.begin();
  Serial.println("Servidor HTTP iniciado!");
}

// ========================
// Loop principal do ESP32
// ========================
void loop() {
  server.handleClient(); // Processa requisições HTTP
}
