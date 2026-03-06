# 📡 Eletrônica para Recepção e Transmissão de Sinais IR

## Visão Geral
Este documento descreve como montar o circuito eletrônico para receber e transmitir sinais infravermelhos (IR) com ESP32 ou ESP8266, permitindo controlar qualquer aparelho por IR (ACs, TVs, ventiladores, etc.).

---

## 1. Componentes Necessários

### Para Recepção de Sinais IR (Aprendizado)
- **1x Receptor IR 38 kHz** (ex: TSOP4838, TSOP1738)
  - Versão 38 kHz é a mais comum em controles remotos
- **1x Resistor 100Ω** (1/4W, 5%) - Opcional, proteção adicional
- **1x Capacitor 10µF** (16V) - **Opcional** - Melhora qualidade da recepção
  - Sem capacitor: Funciona, mas pode ter instabilidade em ambientes com ruído
  - Com capacitor: Recepção mais estável e confiável

### Para Transmissão de Sinais IR (Emissão)
- **1x LED Infravermelho (IR)** (ex: 5mm, 940nm)
  - Típico: ~100mA, ~1.5V queda de tensão
- **1x Resistor 100Ω** (1/4W, 5%)
- **1x Transistor 2N2222 ou BC547** (NPN BJT)
  - Amplifica a corrente do pino GPIO do ESP

### Opcional (Melhoria de Alcance e Segurança)
- **1x Resistor 10kΩ** (pull-down, opcional)
- **1x Capacitor 100nF** (filtro de ruído)

---

## 2. Esquema de Conexão para Receptor IR

```
    TSOP4838 (ou TSOP1738)
    ┌─────────┐
    │ ↙   ↙   │  Pino 1 (↙): Coleta (conectar ao GND)
    │         │  Pino 2 (↙): Saída (conectar a GPIO)
    │         │  Pino 3: VCC (5V ou 3.3V)
    └─────────┘

Pinagem (vista frontal, com cúpula preta para cima):
    1 (GND) | 2 (OUT) | 3 (VCC)

Conexão com ESP32/ESP8266:
────────────────────────────────────────────
    TSOP4838           ESP32/ESP8266
    ─────────────────────────────
    Pino 1 (GND) ──→ GND
    Pino 2 (OUT) ──→ GPIO 4 (rxPinIR) com capacitor 10µF em paralelo
    Pino 3 (VCC) ──→ 3.3V (✓ para 3.3V) ou 5V (com lógica de nível)

Diagrama Completo (Receptor):
    ┌─────────────┐
    │   TSOP4838  │
    │ 1   2   3   │
    └─┬───┬───┬───┘
      │   │   │
      │   │   └──→ 3.3V (alimentação)
      │   │
      │   ├──→ 10µF ──→ GND (filtro)
      │   │
      │   └──→ GPIO 4 (rxPinIR)
      │
      └──→ GND

```

**Notas Importantes:**
- O receptor TSOP é ativo **BAIXO** (LOW = sinal recebido)
- Conecte o capacitor de filtro próximo ao pino de saída
- O resistor serve apenas para limitar corrente, não é crítico neste caso

---

## 3. Esquema de Conexão para Transmissor IR

```
Objetivo: Amplificar o sinal GPIO (3.3V, ~10mA) para acionar o LED IR (100mA @ ~1.5V)

         GPIO D1 (txPinIR - GPIO 5)  Transistor 2N2222
         ┌─→ 100Ω ─→ Base──┐
         │                  │ (NPN)
         │              ┌───∪────┐
         │              │  Coletor├──→ [LED IR] ──→ +5V (VU)
         │              │  Emissor│      ↑
         │              └───┬─────┘      │ Pino pequeno (+)
         │                  │            │ Pino grande (-)
         │                  └──→ GND ←───┘
         │
         └──→ GND (referência)

PINAGEM DO LED IR:
    Pino Pequeno (Curto) = Anodo (+) → +5V (VU)
    Pino Grande (Longo)  = Catodo (-) → GND (via Transistor Coletor)
```

**Conexão Passo a Passo:**
1. **GPIO D1 (TX)** → Resistor 100Ω → Base do Transistor
2. **Coletor** → Pino Grande do LED IR (catodo, o longo)
3. **Emissor** → GND
4. **Pino Pequeno do LED IR** (anodo, o curto) → +5V (pino **VU** lado esquerdo)

**⚠️ Importante - Não Inverta a Polaridade!**
```
❌ ERRADO:
Pino pequeno → GND
Pino grande → +5V

✅ CORRETO:
Pino pequeno (curto) → +5V
Pino grande (longo) → GND (via transistor)
```

---

## 4. Componentes Eletrônicos - Referência Rápida

| Componente | Valor | Quantidade | Notas |
|-----------|-------|-----------|-------|
| Receptor IR | TSOP4838 (38kHz) | 1 | Mais comum, recomendado |
| LED IR | 5mm, 940nm | 1 | Comprimento de onda padrão |
| Transistor | 2N2222 / BC547 | 1 | NPN BJT para amplificação |
| Resistor (base) | 100Ω | 1 | Limita corrente na base |
| Resistor (LED) | 100-200Ω | 1 | Opcional, proteção LED |
| Capacitor (filtro) | 10µF | 1 | Suaviza picos de recepção |
| Capacitor (ruído) | 100nF | 1 | Opcional, filtro adicional |

---

## 5. Pinagem para Node MCU (ESP8266)

### Layout Físico do Node MCU

```
LADO 1 (esquerda):    LADO 2 (direita):
A0  (ADC)             D0  (GPIO16)
G   (GND)             D1  (GPIO5)
VU  (VDD 5V)          D2  (GPIO4)      ← RECEPTOR IR
S3  (SD3)             D3  (GPIO0)
S2  (SD2)             D4  (GPIO2)
S1  (SD1)             3V  (3.3V)
SC  (SD0)             G   (GND)
S0  (CLK)             D5  (GPIO14)
SK  (MOSI)            D6  (GPIO12)
G   (GND)             D7  (GPIO13)     ← TRANSMISSOR IR
3V  (3.3V)            D8  (GPIO15)
EN  (CHIP EN)         RX  (GPIO3)
RST (RESET)           TX  (GPIO1)
G   (GND)             G   (GND)
VIN (VIN 5-12V)       3V  (3.3V)
```

### Conexões IR - Node MCU ESP8266

**Receptor IR (TSOP4838)**
```
TSOP Pino 1 (GND)   → D0 lado esquerdo (GND)
TSOP Pino 2 (OUT)   → D2 (GPIO 4)
TSOP Pino 3 (VCC)   → 3V (lado direito, qualquer um)

Diretamente no Node MCU:
- GND da TSOP → qualquer GND (lado esquerdo ou lado direito)
- OUT da TSOP → D2
- VCC da TSOP → 3V (pino 3V do lado direito)
```

**Transmissor IR (LED + Transistor)**
```
GPIO D1 (D1 lado direito) → 100Ω resistor → Base do Transistor 2N2222
Transistor Coletor       → LED IR (pino grande/catodo - longo)
Transistor Emissor       → GND (qualquer GND)
LED IR (pino pequeno/anodo - curto) → +5V (pino VU lado esquerdo)

Diretamente no Node MCU:
- D1 → 100Ω → Base Transistor
- VU (+5V lado esquerdo) → LED IR (pino pequeno)
- Coletor Transistor → LED IR (pino grande)
- GND (lado esquerdo) → Emissor Transistor
```

### Diagrama Completo - Node MCU

```
                NODE MCU (ESP8266)
    ┌───────────────────────────────────────┐
    │  LADO 1          │     LADO 2         │
    │                  │                    │
    │ A0 (ADC)         │ D0 (GPIO16)        │
    │ G  (GND) ────────┼─→ D1 (GPIO5)       │
    │ VU (5V)  ────┐   │ D2 (GPIO4)  ← TSOP│
    │ S3 (SD3)     │   │ D3 (GPIO0)        │
    │ S2 (SD2)     │   │ D4 (GPIO2)        │
    │ S1 (SD1)     │   │ 3V (3.3V) ← TSOP  │
    │ SC (SD0)     │   │ G (GND) ─→ TSOP   │
    │ S0 (CLK)     │   │ D5 (TX IR Base)   │
    │ SK (MOSI)    │   │ D6 (GPIO12)       │
    │ G  (GND) ────┼───┼─ D7 (GPIO13)      │
    │ 3V (3.3V)    │   │ D8 (GPIO15)       │
    │ EN (EN)      │   │ RX (GPIO3)        │
    │ RST (RST)    │   │ TX (GPIO1)        │
    │ G  (GND) ────┼───┼─ G (GND)          │
    │ VIN (5-12V)  └───┼─ 3V (3.3V)        │
    │                  │                    │
    └───────────────────────────────────────┘
         ↓
    ┌─────────────────────────────────────────────────┐
    │  RECEPTOR IR + TRANSMISSOR IR                   │
    │                                                 │
    │  TSOP4838 (Receptor)     2N2222 (Amplificador) │
    │  ┌──────────┐               ┌────────┐         │
    │  │ 1  2  3  │               │ B C E  │         │
    │  └┬─┬──┬────┘               └┬─┬──┬──┘         │
    │   │ │  │ 3.3V                │ │  │            │
    │   │ │  ├─────────────────────┘ │  │            │
    │   │ │  │   D2 (GPIO4)          │  │            │
    │   │ │  │                    100Ω│  │            │
    │   │ │  │              D5 ───────┘  │            │
    │   │ │  │                           │            │
    │ GND│ │  │                    ┌─────┘            │
    │   │ │  │                 LED IR (+)             │
    │   │ │  │                     │                  │
    │   └─┴──┴─────────────────────┤                  │
    │        GND                    5V (VU)           │
    │                               │                 │
    │                              GND (Emissor)      │
    │                                                 │
    └─────────────────────────────────────────────────┘
```

### Resumo dos Pinos Usados

| Componente | Conexão | Pino Node MCU |
|-----------|---------|---------------|
| TSOP GND | GND | G (lado esquerdo) |
| TSOP OUT | Sinal IR | D2 |
| TSOP VCC | Alimentação | 3V (lado direito) |
| Transistor Base | 100Ω → GPIO | D1 |
| Transistor Coletor | LED IR (pino grande/catodo) | Conecta direto |
| Transistor Emissor | GND | G (lado esquerdo) |
| LED IR (pino pequeno/anodo) | +5V | VU (lado esquerdo) |

---

## 6. Teste de Funcionamento

### Teste do Receptor (Aprendizado)
1. Monte o receptor conforme esquema
2. Aponte um controle remoto para o TSOP
3. Envie solicitação de aprendizado via backend/webapp
4. Pressione um botão no controle remoto
5. O sinal deve ser capturado em ~15 segundos

### Teste do Transmissor (Emissão)
1. Monte o transmissor conforme esquema
2. Coloque um LED IR de teste em um smartphone (câmera IR) ou célula selene
3. Envie comando de emissão via backend/webapp
4. O LED IR deve piscar (visto em câmera IR ou foto em modo noturno)

---

## 7. Solução de Problemas

**Receptor não recebe sinal:**
- Verifique a orientação do TSOP (cúpula preta para frente, receptora)
- Confirme se está alimentado (testador de tensão no pino 3)
- Teste com outro controle remoto IR
- Tente uma frequência diferente (TSOP1738 é 38kHz, mais sensível)

**Transmissor não emite:**
- Verifique o LED IR com câmera de smartphone (deve aparecer em modo noturno)
- Confirme tensão no coletor do transistor (~5V sem sinal, menor com sinal)
- Teste o transistor isoladamente com fonte de 5V e LED IR
- Reduza a resistência de base se necessário (tente 68Ω para maior ganho)

**Sinal fraco ou Alcance curto:**
- Aumentar corrente do LED IR: reduza resistor série (min ~50Ω)
- Use fonte de 5V em vez de 3.3V
- Coloque LED IR em ângulo de 45° (leque de transmissão)
- Aumente potência PWM se implementar PWM no GPIO

---

## 10. Sem Capacitor? Sem Problema!

Se você não tem capacitor, **pode funcionar normalmente**. Aqui está o que muda:

### Conexão Simplificada (Sem Capacitor)

```
TSOP4838         Node MCU
Pino 1 (GND) ──→ G (GND)
Pino 2 (OUT) ──→ D2 (GPIO 4)  [Conexão direta, sem capacitor]
Pino 3 (VCC) ──→ 3V
```

### Quando Você REALMENTE Precisa de Capacitor

**SEM Capacitor = OK para:**
- ✅ Testes iniciais
- ✅ Ambientes com pouca interferência eletromagnética
- ✅ Controles remotos bem potentes (perto do ESP)
- ✅ Desenvolvimento/prototipagem

**COM Capacitor = Melhor para:**
- ✅ Recepção de sinais fracos ou de longe
- ✅ Ambientes com muito ruído (próximo a fontes de 110V/220V)
- ✅ Sistema em produção
- ✅ Máxima confiabilidade

### Alternativa com Resistores (Se Houver Problemas)

Se a recepção for ruim sem capacitor, você pode tentar:

```
TSOP Pino 3 (VCC) ──→ 3V
                     ↓
                  10kΩ (pull-up)
                     ↓
TSOP Pino 2 (OUT) ──→ D2 + 10kΩ em série → GND
                        (divisor resistivo improvisado)
```

Mas honestamente, **comece sem capacitor**. Se funcionar bem, perfeito. Se tiver problemas de recepção instável, aí você adiciona o capacitor depois.

### Resumo: Testando Agora

1. **Sem Capacitor** → Monte e teste
   - Se funcionar = ✅ Pronto, não precisa de mais nada
   - Se não funcionar = ❌ Adiciona capacitor depois

2. **Ordem de Compras** (por prioridade):
   - 🔴 Crítico: LED IR + TSOP + Transistor
   - 🟡 Importante: Resistores (100Ω, 10kΩ)
   - 🟢 Opcional: Capacitor 10µF (adiciona depois se necessário)

- **TSOP4838**: https://www.vishay.com/doc?83852
- **2N2222**: https://www.onsemi.com/pdf/datasheet/2n2222-d.pdf
- **Biblioteca IRremote**: https://github.com/Arduino-IRremote/Arduino-IRremote

---

## 9. Diagrama de Bloco Final

```
┌─────────────────────────────────────────────────────┐
│                    ESP32/ESP8266                    │
├─────────────────────────────────────────────────────┤
│                                                     │
│  WiFi             GPIO 4 (RX)     GPIO 26 (TX)    │
│   ↕                   ↓               ↓            │
│ Backend ←→ Processamento IR ←→ Amplificação       │
│                                                     │
└─────────────────────────────────────────────────────┘
         ↓                           ↓
    ┌────────────┐             ┌──────────┐
    │  Receptor  │             │  LED IR  │
    │   TSOP     │             │ (940nm)  │
    └────────────┘             └──────────┘
         ↑                           ↓
    Controles Remotos          Aparelhos IR
    (TV, AC, etc)             (AC, TV, etc)
```

---

Pronto! Agora o código foi refatorado para ser **genérico e aprender/emitir qualquer sinal IR**.
