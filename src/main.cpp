#include <WiFi.h>
#include <WebServer.h>
#include <IRremoteESP8266.h>
#include <IRsend.h>
#include <IRrecv.h>
#include <IRutils.h>

// Configurações do Wi-Fi
const char* ssid = "Sobralnet-ENGENHARIA 1060";
const char* password = "apartamento1060";

// Configurações dos pinos
const int ledPin = 2;         // Pino do LED (GPIO 2)
const uint16_t kIrLed = 4;    // Pino para o emissor IR (GPIO 4)
const uint16_t kRecvPin = 15; // Pino para o receptor IR (GPIO 15)

// Instâncias para controle IR
IRsend irsend(kIrLed);
IRrecv irrecv(kRecvPin);
decode_results results;

// Intervalo para envio de sinais IR
const unsigned long kSendInterval = 10000; // 5 segundos em milissegundos
unsigned long lastSendTime = 0;

// Inicializa o servidor HTTP
WebServer server(80);

// ========================
// Funções de controle do LED
// ========================
void ligarLED() {
  digitalWrite(ledPin, HIGH); // Liga o LED
  server.send(200, "text/plain", "LED ligado!");
  Serial.println("LED ligado via HTTP.");
}

void desligarLED() {
  digitalWrite(ledPin, LOW); // Desliga o LED
  server.send(200, "text/plain", "LED desligado!");
  Serial.println("LED desligado via HTTP.");
}

// ========================
// Configuração do ESP32 (setup)
// ========================
void setup() {
  // Inicializa a comunicação serial
  Serial.begin(115200);
  while (!Serial) delay(50);

  // Configura o pino do LED como saída
  pinMode(ledPin, OUTPUT);
  digitalWrite(ledPin, LOW);

  // Inicializa emissor e receptor IR
  irsend.begin();
  irrecv.enableIRIn();

  // Conecta ao Wi-Fi
  Serial.print("Conectando ao Wi-Fi");
  WiFi.begin(ssid, password);
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println("\nConectado ao Wi-Fi!");
  Serial.print("Endereço IP: ");
  Serial.println(WiFi.localIP());

  // Configura rotas HTTP
  server.on("/ligar", ligarLED);
  server.on("/desligar", desligarLED);

  // Inicia o servidor HTTP
  server.begin();
  Serial.println("Servidor HTTP iniciado!");

  // Mensagem inicial
  Serial.println("Sistema IR iniciado.");
  Serial.printf("Receptor IR no pino %d\n", kRecvPin);
  Serial.printf("Emissor IR no pino %d\n", kIrLed);
}

// ========================
// Loop principal do ESP32
// ========================
void loop() {
  // Processa requisições HTTP
  server.handleClient();

  // Envio periódico de sinal IR
  unsigned long currentMillis = millis();
  if (currentMillis - lastSendTime >= kSendInterval) {
    lastSendTime = currentMillis;
    Serial.println("Enviando sinal IR NEC: 0xA000E098C3");
    irsend.sendNEC(0xA000E098C3);
  }

  // Recebe e decodifica sinais IR
  if (irrecv.decode(&results)) {
    Serial.println("Sinal IR recebido:");
    Serial.print(resultToHumanReadableBasic(&results));
    Serial.println(resultToSourceCode(&results));
    irrecv.resume(); // Prepara o receptor para o próximo sinal
  }
}
