# Sinais Infravermelhos (IR): Conceitos Fundamentais

## 1. O que são sinais infravermelhos
- Radiação eletromagnética logo acima do espectro visível (aprox. 700 nm a 1 mm), invisível aos olhos humanos.
- Utilizada para comunicação de curto alcance linha de visada, principalmente em controles remotos.
- Portadora típica em aplicações de consumo: luz IR emitida por LED em torno de 850–950 nm.

## 2. Por que usar portadora modulada
- A maioria dos receptores IR comerciais é sintonizada para uma frequência de portadora (comum: 36–40 kHz, muito usado 38 kHz).
- A modulação em portadora ajuda a filtrar luz ambiente (lâmpadas, sol) e ruído, melhorando a relação sinal-ruído.

## 3. Modulação mais comum (ASK/OOK)
- OOK (On-Off Keying) ou ASK simples: a portadora é ligada e desligada em intervalos de tempo definidos.
- "Pulso" significa portadora presente; "espaço" significa portadora ausente.
- A informação é transmitida pela duração relativa de pulsos e espaços.

## 4. Codificação temporal (pulsos e espaços)
- Os protocolos definem comprimentos de pulso e de espaço para representar bits.
- Em geral, um bit "0" e um bit "1" diferem pela proporção entre pulso e espaço (por exemplo, curto/longo).
- Exemplo conceitual (genérico):
  - Bit 0: pulso curto + espaço longo
  - Bit 1: pulso longo + espaço curto

## 5. Estrutura típica de um quadro IR
- **Preâmbulo ou líder**: sequência inicial de pulso(es) longo(s) usada para sincronizar receptor e remover ambiguidade.
- **Endereço ou identificador**: identifica o dispositivo ou grupo de dispositivos.
- **Comando ou dados**: indica a ação (ligar, desligar, volume, etc.).
- **Verificação**: alguns protocolos incluem inverso do byte, checksum ou repetição para detecção simples de erros.

## 6. Exemplos de protocolos populares (visão conceitual)
- **NEC**: muito usado em eletrônicos de consumo; líder longo seguido de pulsos/pausas codificando bits; comprimento total típico ~67 ms por quadro completo.
- **RC-5 (Philips)**: usa codificação Manchester (bifásica), com taxa típica de 36 kHz de portadora; cada bit tem transição no meio do intervalo, reduzindo ambiguidade de nível DC.
- **Sony SIRC**: quadros com líder e largura de pulso variando para bits; portadora comum em 40 kHz.
- Observação: detalhes variam entre fabricantes e gerações; sempre consultar o protocolo específico ao projetar emissores/receptores.

## 7. Considerações de hardware
- **Emissor**: LED IR com resistor limitador; frequência de portadora gerada por hardware (temporizador) ou software; corrente de pico deve respeitar limites do LED.
- **Receptor**: módulos integrados (por exemplo, receptores IR de 38 kHz) incluem fotodiodo, filtro de banda, AGC e demodulador; saída é lógica (nivel baixo/alto) representando presença/ausência de portadora.
- **Linha de visada**: objetos opacos bloqueiam IR; superfícies refletem parcialmente; alcance típico em ambientes internos fica na ordem de metros.

## 8. Ruído, interferência e robustez
- Luz solar direta e lâmpadas fluorescentes/LED podem gerar ruído na banda de interesse.
- Modulação em portadora + filtros do receptor reduzem interferência, mas não eliminam totalmente.
- Repetição de quadros e códigos de verificação simples (inversão, checksum) aumentam confiabilidade.

## 9. Vantagens e limitações
- **Vantagens**: baixo custo, baixo consumo, fácil integração, componentes amplamente disponíveis.
- **Limitações**: exige linha de visada, sensível à luz ambiente intensa, alcance curto, largura de banda limitada, comunicação tipicamente unidirecional.

## 10. Boas práticas de projeto
- Escolher portadora que corresponda à banda do receptor (comum: 38 kHz).
- Respeitar corrente máxima de LED e, se necessário, usar transistor para maior corrente de pico com segurança.
- Garantir preâmbulo claro e temporizações estáveis (tolerâncias típicas de ±10% são comuns em receptores comerciais).
- Incluir algum mecanismo simples de detecção de erro (bit invertido, checksum ou repetição).
- Testar sob diferentes condições de iluminação (ambiente interno, luz solar indireta) para validar robustez.

## 11. Aplicações típicas
- Controles remotos de TVs, ar-condicionado, áudio e projetores.
- Brinquedos controlados por IR, sinais de presença e sistemas de interação simples.
- Comunicação de curto alcance entre dispositivos sem necessidade de pareamento complexo.

## 12. Segurança e saúde
- LEDs IR de uso comum operam em potências baixas e são considerados seguros para uso típico em consumo.
- Evitar exposição prolongada a emissores IR de alta potência (raros em aplicações de controle remoto).

## 13. Referências sugeridas para estudo
- Manuais de receptores IR comerciais (ex.: datasheets de receptores 38 kHz).
- Documentação de protocolos populares (NEC, RC-5, SIRC).
- Introduções a modulação ASK/OOK e codificação Manchester em comunicações digitais de baixa taxa.
