# Firmware

Firmware para ESP8266/ESP32 via PlatformIO.

## Build e upload

```powershell
cd firmware
pio run
pio run -t upload
```

Para porta específica:

```powershell
pio run -e esp8266dev -t upload --upload-port COM3
```

## Monitor serial

```powershell
pio device monitor
```

## Provisionamento Wi-Fi

- Na primeira execução, o ESP abre `AC-SETUP-XXXXXX`.
- Conecte nessa rede e abra `http://192.168.4.1`.
- Informe SSID/senha da rede local e salve.

O backend padrão do firmware está em `platformio.ini` (`BACKEND_URL`).
