#include "wifi_setup.h"

#if defined(ESP8266)
#include <ESP8266WiFi.h>
#else
#include <WiFi.h>
#endif

#include <WiFiManager.h>

String getChipSuffix() {
#if defined(ESP8266)
  uint32_t chipId = ESP.getChipId();
  String suffix = String(chipId, HEX);
#else
  uint64_t chipId = ESP.getEfuseMac();
  String suffix = String(static_cast<uint32_t>(chipId & 0xFFFFFF), HEX);
#endif
  suffix.toUpperCase();
  while (suffix.length() < 6) {
    suffix = "0" + suffix;
  }
  return suffix;
}

void startWifiSetupPortalNow() {
  Serial.println("🛜 Iniciando modo de configuracao Wi-Fi imediatamente...");
  Serial.println("   Apagando credenciais salvas e reiniciando para o portal...");

  // Apaga somente as credenciais de Wi-Fi salvas e reinicia para abrir o portal.
  ESP.eraseConfig();
  delay(300);
  ESP.restart();
}

void connectWiFiWithPortal() {
  String chipSuffix = getChipSuffix();
  String apName = "AC-SETUP-" + chipSuffix;

  WiFi.mode(WIFI_STA);
  WiFiManager wm;
  wm.setConfigPortalTimeout(0);
  wm.setConnectTimeout(20);

  bool portalSavedConfig = false;
  wm.setSaveConfigCallback([&portalSavedConfig]() {
    portalSavedConfig = true;
  });

  Serial.println("\n🌐 Iniciando conexão Wi-Fi...");
  Serial.println("AP Portal: " + apName);

  bool connected = wm.autoConnect(apName.c_str());
  if (!connected) {
    Serial.println("❌ Falha ao conectar Wi-Fi via portal. Reiniciando...");
    delay(1500);
    ESP.restart();
    return;
  }

  if (portalSavedConfig) {
    Serial.println("✅ Rede configurada via portal. Reiniciando para estado limpo...");
    delay(500);
    ESP.restart();
  }

  Serial.println("✅ Conectado ao Wi-Fi!");
  Serial.print("SSID: ");
  Serial.println(WiFi.SSID());
  Serial.print("IP: ");
  Serial.println(WiFi.localIP());
}
