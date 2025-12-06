# Firmware (PlatformIO)

Pasta `firmware/` contém o código para microcontroladores (ex.: ESP32) utilizado nos dispositivos.

Como abrir

- Recomenda-se abrir a pasta no VS Code com a extensão PlatformIO instalada.

Build e upload

- Configure a placa no `platformio.ini` e use a interface do PlatformIO para compilar e subir para o dispositivo.
 
Passos rápidos (CLI):

```powershell
cd firmware
# Instala dependências listadas em lib_deps
pio lib update
pio run -e esp32dev
# Para enviar ao dispositivo
pio run -e esp32dev -t upload
```

Notas

- O firmware faz requests HTTP ao backend para heartbeat e busca de comandos pendentes.
- Arquivo principal: `src/main.cpp`.

Notas de manutenção:
- `.pio/` e arquivos de build são ignorados por `.gitignore` para evitar commits de artefatos.
- Se houver erros de compilação por bibliotecas, execute `pio lib install` conforme instruções acima.
