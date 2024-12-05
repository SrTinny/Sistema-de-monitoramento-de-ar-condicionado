#include <WiFi.h>
#include <WebServer.h>
#include <IRremoteESP8266.h>
#include <IRrecv.h>
#include <IRutils.h>

// Configurações do Wi-Fi
const char* ssid = "Sobralnet-ENGENHARIA 1060";
const char* password = "apartamento1060";

// Pinos onde os LEDs estão conectados
const int ledPins[] = {13, 12, 14}; // D13, D12, D14
const int numLeds = sizeof(ledPins) / sizeof(ledPins[0]);

// Pino onde o sensor IR está conectado
const int irPin = 15;

// Inicializa o receptor IR
IRrecv irrecv(irPin);
decode_results results;

// Inicializa o servidor HTTP na porta 80
WebServer server(80);

// Fila para controlar os LEDs
QueueHandle_t ledQueue;

// Estrutura para representar uma ação de controle do LED
struct LedAction {
  int ledIndex;
  bool state;
};

// ========================
// Funções de controle do LED
// ========================
void ligarLED(int ledIndex) {
  if (ledIndex >= 0 && ledIndex < numLeds) {
    digitalWrite(ledPins[ledIndex], HIGH); // Liga o LED
    Serial.printf("LED %d ligado\n", ledPins[ledIndex]);
  }
}

void desligarLED(int ledIndex) {
  if (ledIndex >= 0 && ledIndex < numLeds) {
    digitalWrite(ledPins[ledIndex], LOW); // Desliga o LED
    Serial.printf("LED %d desligado\n", ledPins[ledIndex]);
  }
}

// Handler para requisição HTTP de ligar o LED
void handleLigarLED() {
  if (server.hasArg("sala")) {
    int sala = server.arg("sala").toInt();
    if (sala >= 101 && sala < 101 + numLeds) {
      int ledIndex = sala - 101;
      LedAction action = {ledIndex, true};
      xQueueSend(ledQueue, &action, portMAX_DELAY);
      server.send(200, "text/plain", "LED ligado na Sala " + String(sala));
      Serial.printf("Requisição recebida: Ligar LED da Sala %d\n", sala);
    } else {
      server.send(400, "text/plain", "Sala inválida!");
      Serial.println("Erro: Sala inválida na requisição de ligar.");
    }
  } else {
    server.send(400, "text/plain", "Parâmetro 'sala' ausente!");
    Serial.println("Erro: Parâmetro 'sala' ausente na requisição de ligar.");
  }
}

// Handler para requisição HTTP de desligar o LED
void handleDesligarLED() {
  if (server.hasArg("sala")) {
    int sala = server.arg("sala").toInt();
    if (sala >= 101 && sala < 101 + numLeds) {
      int ledIndex = sala - 101;
      LedAction action = {ledIndex, false};
      xQueueSend(ledQueue, &action, portMAX_DELAY);
      server.send(200, "text/plain", "LED desligado na Sala " + String(sala));
      Serial.printf("Requisição recebida: Desligar LED da Sala %d\n", sala);
    } else {
      server.send(400, "text/plain", "Sala inválida!");
      Serial.println("Erro: Sala inválida na requisição de desligar.");
    }
  } else {
    server.send(400, "text/plain", "Parâmetro 'sala' ausente!");
    Serial.println("Erro: Parâmetro 'sala' ausente na requisição de desligar.");
  }
}

// ========================
// Tarefas do FreeRTOS
// ========================

// Tarefa para processar requisições HTTP
void taskHttpServer(void* parameter) {
  for (;;) {
    server.handleClient();
    vTaskDelay(10 / portTICK_PERIOD_MS); // Pequeno delay para liberar a CPU
  }
}

// Tarefa para gerenciar os LEDs
void taskLedController(void* parameter) {
  LedAction action;
  for (;;) {
    if (xQueueReceive(ledQueue, &action, portMAX_DELAY)) {
      Serial.printf("Processando ação: LED %d, Estado: %s\n", ledPins[action.ledIndex], action.state ? "Ligado" : "Desligado");
      if (action.state) {
        ligarLED(action.ledIndex);
      } else {
        desligarLED(action.ledIndex);
      }
    }
  }
}

// Tarefa para processar sinais IR
void taskIRReceiver(void* parameter) {
  for (;;) {
    if (irrecv.decode(&results)) {
      if (results.value != 0xFFFFFFFF) { // Ignora repetições de botão
        Serial.printf("Código IR recebido: 0x%llx\n", results.value);
      }
      irrecv.resume(); // Reseta o receptor para o próximo sinal
    }
    vTaskDelay(100 / portTICK_PERIOD_MS); // Verifica sinais IR a cada 100ms
  }
}

// Tarefa para monitorar o Wi-Fi
void taskWiFiMonitor(void* parameter) {
  for (;;) {
    if (WiFi.status() != WL_CONNECTED) {
      Serial.println("Wi-Fi desconectado! Tentando reconectar...");
      WiFi.begin(ssid, password);
      while (WiFi.status() != WL_CONNECTED) {
        delay(500);
        Serial.print(".");
      }
      Serial.println("\nWi-Fi reconectado!");
    }
    vTaskDelay(5000 / portTICK_PERIOD_MS); // Verifica o estado do Wi-Fi a cada 5 segundos
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
    Serial.printf("Configuração inicial: LED %d como saída, estado: Desligado\n", ledPins[i]);
  }

  // Configura o receptor IR
  irrecv.enableIRIn();
  Serial.println("Receptor IR inicializado.");

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
  server.on("/ligar", handleLigarLED);
  server.on("/desligar", handleDesligarLED);

  // Inicia o servidor HTTP
  server.begin();
  Serial.println("Servidor HTTP iniciado!");

  // Cria a fila para comunicação entre tarefas
  ledQueue = xQueueCreate(10, sizeof(LedAction));
  if (ledQueue == NULL) {
    Serial.println("Erro ao criar a fila!");
    while (1);
  }

  // Cria as tarefas do FreeRTOS
  xTaskCreate(taskHttpServer, "HTTP Server", 4096, NULL, 1, NULL);
  xTaskCreate(taskLedController, "LED Controller", 2048, NULL, 1, NULL);
  xTaskCreate(taskIRReceiver, "IR Receiver", 2048, NULL, 1, NULL);
  xTaskCreate(taskWiFiMonitor, "WiFi Monitor", 2048, NULL, 1, NULL);

  Serial.println("Tarefas do FreeRTOS iniciadas!");
}

// ========================
// Loop principal do ESP32
// ========================
void loop() {
  // O loop principal está vazio, pois as tarefas são gerenciadas pelo FreeRTOS
}
