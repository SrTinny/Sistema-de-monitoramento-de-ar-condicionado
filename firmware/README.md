# Firmware (PlatformIO)

Pasta `firmware/` contém o código para microcontroladores (ex.: ESP32) utilizado nos dispositivos.

Como abrir

- Recomenda-se abrir a pasta no VS Code com a extensão PlatformIO instalada.

Build e upload

- Configure a placa no `platformio.ini` e use a interface do PlatformIO para compilar e subir para o dispositivo.

Notas

- O firmware faz requests HTTP ao backend para heartbeat e busca de comandos pendentes.
- Arquivo principal: `src/main.cpp`.
