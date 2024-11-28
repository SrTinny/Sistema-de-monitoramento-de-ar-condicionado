#include <WiFi.h>
#include <WebServer.h>

// Configurações do Wi-Fi
const char* ssid = "Sobralnet-ENGENHARIA 1060";        // Substitua pelo nome da sua rede Wi-Fi
const char* password = "apartamento1060";   // Substitua pela senha da sua rede Wi-Fi

// Pino onde o LED está conectado
const int ledPin = 13;

// Inicializa o servidor HTTP na porta 80
WebServer server(80);

// ========================
// Funções de controle do LED
// ========================

// Função para ligar o LED
void ligarLED() {
  digitalWrite(ledPin, HIGH); // Liga o LED
  server.send(200, "text/plain", "LED ligado!"); // Resposta HTTP
}

// Função para desligar o LED
void desligarLED() {
  digitalWrite(ledPin, LOW); // Desliga o LED
  server.send(200, "text/plain", "LED desligado!"); // Resposta HTTP
}

// ========================
// Configuração do ESP32 (setup)
// ========================
void setup() {
  // Inicializa a comunicação serial
  Serial.begin(115200);

  // Configura o pino do LED como saída
  pinMode(ledPin, OUTPUT);
  digitalWrite(ledPin, LOW); // Garante que o LED inicie desligado

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
  Serial.println(WiFi.localIP()); // Mostra o IP do ESP32

  // Define rotas HTTP para controle do LED
  server.on("/ligar", ligarLED);    // Rota para ligar o LED
  server.on("/desligar", desligarLED); // Rota para desligar o LED

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
