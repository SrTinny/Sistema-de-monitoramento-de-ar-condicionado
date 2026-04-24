#include <Arduino.h>
#include <math.h>

// KY-013 no ESP8266: usar o pino analógico A0.
#define PINO_SENSOR A0

// Ajuste confirmado pelos logs do hardware atual.
// O divisor parece usar resistor de 100k com o termistor ligado ao GND.
const bool TERMISTOR_LIGADO_AO_GND = true;
const float RESISTOR_FIXO = 100000.0f;
const float TERMISTOR_NOMINAL = 10000.0f;
const float TEMPERATURA_NOMINAL = 25.0f;
const float BETA = 3950.0f;
const float OFFSET_CALIBRACAO_C = 6.5f;

float calcularTemperatura(float adc) {
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

  Serial.print("🌡️ ADC bruto temperatura: ");
  Serial.println(adc, 1);
  float temperatura = calcularTemperatura(adc);
  temperatura += OFFSET_CALIBRACAO_C;
  Serial.print("🌡️ Temperatura calculada: ");
  Serial.print(temperatura, 1);
  Serial.println("C");

  return temperatura;
}

// Este arquivo agora expõe apenas a rotina de leitura para uso pelo firmware.
// O ponto de entrada do projeto continua em src/main.cpp.