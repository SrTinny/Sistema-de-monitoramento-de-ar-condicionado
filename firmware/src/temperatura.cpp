#include <Arduino.h>
#include <math.h>

// KY-013 no ESP8266: usar o pino analógico A0.
#define PINO_SENSOR A0

// Ajuste típico para KY-013 com NTC 10k.
// No seu módulo, o termistor parece estar no lado do GND do divisor.
// Se a leitura voltar a ficar invertida, troque para true.
const bool TERMISTOR_LIGADO_AO_GND = false;
const float RESISTOR_FIXO = 10000.0f;
const float TERMISTOR_NOMINAL = 10000.0f;
const float TEMPERATURA_NOMINAL = 25.0f;
const float BETA = 3950.0f;

float lerTemperaturaC() {
  const int amostras = 10;
  long soma = 0;

  for (int i = 0; i < amostras; i++) {
    soma += analogRead(PINO_SENSOR);
    delay(5);
  }

  float adc = soma / (float)amostras;

  if (adc <= 0.0f) {
    adc = 1.0f;
  }
  if (adc >= 1023.0f) {
    adc = 1022.0f;
  }

  float resistencia;
  if (TERMISTOR_LIGADO_AO_GND) {
    resistencia = RESISTOR_FIXO * (1023.0f / adc - 1.0f);
  } else {
    resistencia = RESISTOR_FIXO * adc / (1023.0f - adc);
  }

  float steinhart = resistencia / TERMISTOR_NOMINAL;
  steinhart = log(steinhart);
  steinhart /= BETA;
  steinhart += 1.0f / (TEMPERATURA_NOMINAL + 273.15f);
  steinhart = 1.0f / steinhart;

  return steinhart - 273.15f;
}

void setup() {
  Serial.begin(115200);
  delay(200);
  Serial.println("Leitura do KY-013 iniciada");
}

void loop() {
  float temperaturaC = lerTemperaturaC();

  Serial.print("Temperatura ambiente: ");
  Serial.print(temperaturaC, 1);
  Serial.println(" C");

  delay(2000);
}