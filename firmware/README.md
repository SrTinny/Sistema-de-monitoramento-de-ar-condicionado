# Firmware (PlatformIO)

Pasta `firmware/` contém o firmware para dois ambientes:

- `esp8266dev` (`nodemcuv2`) — ambiente padrão atual (`default_envs`)
- `esp32dev` (`esp32dev`) — compatibilidade

## Fluxo recomendado (plug-and-upload)

```powershell
cd firmware

# Build do ambiente padrão (atual: esp8266dev)
pio run

# Upload do ambiente padrão com auto-detecção de porta
pio run -t upload
```

Se houver apenas uma placa conectada, não é necessário informar COM.

## Provisionamento Wi-Fi (sem hardcode)

- Ao ligar sem credenciais salvas, o ESP cria um AP `AC-SETUP-XXXXXX`.
- O usuário conecta nesse AP e informa SSID/senha na página de configuração.
- As credenciais ficam salvas na flash e são reutilizadas no próximo boot.

Rotas de suporte no firmware:

- `GET /wifi/status` retorna status de conexão (SSID/IP/deviceId)
- `POST /wifi/reset` limpa credenciais Wi-Fi e reinicia o ESP

## Fluxo explícito por placa (avançado)

```powershell
# ESP8266
pio run -e esp8266dev
pio run -e esp8266dev -t upload --upload-port COM3

# ESP32
pio run -e esp32dev
pio run -e esp32dev -t upload --upload-port COM3
```

## Boas práticas

- Sempre usar `-e` quando tiver mais de uma placa no projeto.
- Não versionar porta COM fixa no repositório.
- Validar com `pio device list` antes de upload.
- Arquivo principal do firmware: `src/main.cpp`.
