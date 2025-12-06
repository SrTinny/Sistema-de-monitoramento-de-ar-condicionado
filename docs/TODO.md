# Plano de Trabalhos Futuros - Sistema de Monitoramento de Ar-Condicionado

## 1 Introdução

Este documento descreve as atividades necessárias para completar e aprimorar o sistema de monitoramento de ar-condicionado. Os trabalhos são organizados por prioridade e componente.

## 2 Atividades Críticas

Estas atividades são essenciais para o funcionamento completo do sistema.

### 2.1 Validação em Hardware do Firmware

#### 2.1.1 Upload do Firmware para ESP32

**Descrição**: Transferir o binário compilado para o microcontrolador ESP32 física.

**Procedimento**:
1. Conectar ESP32 ao computador via cabo USB
2. Identificar porta de comunicação serial correta mediante comando `pio device list`
3. Atualizar arquivo `platformio.ini` com os parâmetros `upload_port` e `monitor_port`
4. Executar comando `pio run -e esp32dev -t upload`
5. Monitorar saída serial mediante `pio device monitor`

**Bloqueador Atual**: Erro de conexão "No serial data received" na porta COM1
- Possíveis causas: Porta incorreta, botão BOOT não acionado, cabo com mau contato
- Referência: Consultar seção 3 de TROUBLESHOOTING.md

**Esforço Estimado**: 2 horas

#### 2.1.2 Configuração de Credenciais WiFi

**Descrição**: Atualizar as credenciais de rede WiFi no firmware.

**Modificações Necessárias**: Em `firmware/src/main.cpp`, linha ~15:
```cpp
const char *ssid = "SEU_SSID";
const char *password = "SUA_SENHA";
```

**Alternativa Melhorada** (opcional): Implementar portal de configuração WiFi no boot, permitindo configuração dinâmica via navegador.

**Bloqueador Atual**: Credenciais hardcoded não funcionam para a rede do usuário

**Esforço Estimado**: 1 hora (simples) até 8 horas (com portal)

#### 2.1.3 Calibração de Sinais Infravermelhos

**Descrição**: Capturar os sinais infravermelhos reais do ar-condicionado do usuário.

**Procedimento**:
1. Conectar receptor IR ao pino 4 do ESP32
2. Acessar rota `/ir` no servidor web local
3. Pressionar botões do controle remoto do AC
4. Copiar valores de frequência e pulsos do serial monitor
5. Substituir arrays `irSignalLigar[]` e `irSignalDesligar[]` em `main.cpp`
6. Recompilar e reuploaded firmware

**Referência**: Documentação completa em FIRMWARE.md seção 4.5

**Bloqueador Atual**: Sistema usando sinais de teste que podem não funcionar com AC específico

**Esforço Estimado**: 3 horas

#### 2.1.4 Validação de Atribuição de Pinos

**Descrição**: Confirmar que os pinos utilizados são apropriados para o modelo específico de ESP32.

**Pinos Atuais**:
- Pino 4: Receptor IR
- Pino 26: Transmissor IR
- Pino 12: Botão de ligar (evitar se boot pin)
- Pino 2: Botão de desligar

**Considerações**: Alguns pinos são reservados para boot ou função especial em certas variações de ESP32.

**Referência**: Datasheet do ESP32 e pinout documentation em FIRMWARE.md

**Esforço Estimado**: 1 hora

### 2.2 Teste de Integração Completa

**Descrição**: Validar o fluxo fim-a-fim da aplicação: usuário → backend → firmware → AC.

**Cenários de Teste**:
1. Controle manual: Acionar botão "Ligar" na interface e verificar execução no AC
2. Agendamento: Criar schedule com horário próximo e verificar execução automática
3. Heartbeat: Monitorar saída serial para confirmar comunicação periódica
4. Falhas: Desconectar WiFi e verificar comportamento do sistema

**Esforço Estimado**: 4 horas

## 3 Atividades Importante de Médio Prazo

Estas melhorias aprimoram funcionalidade ou desempenho do sistema.

### 3.1 Otimização de Memória do Firmware

#### 3.1.1 Movimento de Buffers para PROGMEM

**Problema**: Arrays de sinais IR (`irSignalLigar[]` e `irSignalDesligar[]`) ocupam ~2KB da RAM.

**Solução**: Marcar arrays com qualificador `PROGMEM` para armazenamento em memória flash.

**Código**:
```cpp
const uint16_t irSignalLigar[] PROGMEM = { 9000, 4500, 600, 560, ... };
const uint16_t irSignalDesligar[] PROGMEM = { 9000, 4500, 600, 560, ... };
```

**Benefício**: Libera ~4KB de RAM para uso de tasks FreeRTOS.

**Impacto Atual**: Uso 16.4% de RAM; otimização reduziria para ~15%.

**Prioridade**: Média (não crítico agora, importante para escalabilidade)

**Esforço Estimado**: 2 horas

### 3.2 Implementação de Debouncing Robusto

**Problema**: Botões físicos podem gerar múltiplos acionamentos por pressão.

**Solução Atual**: Delay fixo de 500ms (inadequado).

**Implementação Recomendada**: Algoritmo de debouncing com estado:
```cpp
bool isButtonPressed(int pin) {
  static unsigned long lastPressTime = 0;
  if (millis() - lastPressTime < 50) return false;
  if (digitalRead(pin) == LOW) {
    lastPressTime = millis();
    return true;
  }
  return false;
}
```

**Benefício**: Melhor resposta a pressionamentos rápidos múltiplos.

**Esforço Estimado**: 2 horas

### 3.3 Validação de Entrada Aprimorada

**Escopo**:
- Validação de email no registro
- Validação de força de senha
- Validação de horários de agendamento
- Validação de campos obrigatórios

**Implementação**: Adicionar schemas de validação em rotas de POST/PUT.

**Exemplo**:
```javascript
const scheduleSchema = {
  airConditionerId: { required: true, type: 'string' },
  action: { required: true, enum: ['TURN_ON', 'TURN_OFF'] },
  scheduledAt: { required: true, type: 'datetime', futureOnly: true }
};
```

**Prioridade**: Alta para produção

**Esforço Estimado**: 6 horas

### 3.4 Rate Limiting na API

**Objetivo**: Proteger a API contra abuso e ataques de força bruta.

**Implementação**:
- 10 requisições por minuto por IP para autenticação
- 100 requisições por minuto por usuário para APIs normais
- 5 requisições por minuto por dispositivo para heartbeat

**Bibliotecas Recomendadas**:
- `express-rate-limit`: Simples e maduro
- `redis`: Backend de armazenamento distribuído (opcional)

**Prioridade**: Alta para produção

**Esforço Estimado**: 4 horas

## 4 Melhorias de Interface de Usuário

### 4.1 Modo Escuro (Dark Mode)

**Descrição**: Implementar tema escuro na aplicação web.

**Abordagem**: Usar Context API para gerenciar tema + Tailwind CSS classes.

**Modificações**:
1. Criar `ThemeContext.jsx` com estados dark/light
2. Atualizar componentes para usar classes de tema
3. Adicionar toggle de tema na interface
4. Persistir preferência em localStorage

**Benefício**: Melhor experiência visual em ambientes de baixa luminosidade.

**Prioridade**: Baixa (feature cosmética)

**Esforço Estimado**: 8 horas

### 4.2 Responsive Design Aprimorado

**Objetivo**: Otimizar layout para tablets e dispositivos ultralargos.

**Pontos de Quebra**:
- Mobile: < 640px
- Tablet: 640px - 1024px
- Desktop: > 1024px
- Ultra-wide: > 1920px

**Modificações**: Atualizar grid de ACs e layouts modais para cada breakpoint.

**Prioridade**: Média

**Esforço Estimado**: 6 horas

## 5 Funcionalidades Avançadas

### 5.1 Histórico de Operações

**Descrição**: Registrar todas as ações realizadas no sistema.

**Modelo de Dados**:
```prisma
model AuditLog {
  id      String   @id @default(cuid())
  userId  String
  action  String
  target  String
  details Json?
  timestamp DateTime @default(now())
}
```

**Casos de Uso**:
- Rastreamento de quem ligou/desligou um AC
- Verificação de quando um schedule foi executado
- Análise de padrões de uso

**Prioridade**: Média

**Esforço Estimado**: 10 horas

### 5.2 Alertas e Notificações

**Objetivo**: Notificar usuário de eventos importantes.

**Tipos de Alerta**:
- AC não responde ao heartbeat por 5 minutos
- Comando executado com sucesso
- Schedule executado automaticamente
- Mudança de estado inesperada

**Implementação**:
- Armazenar preferências em User model
- Enviar notificações via email (opcional)
- Exibir notificações na interface (toast)

**Prioridade**: Média

**Esforço Estimado**: 8 horas

### 5.3 Controle Multiusuário com Permissões Granulares

**Objetivo**: Permitir compartilhamento de ACs entre usuários com permissões específicas.

**Modificações**:
- Nova tabela `AirConditionerPermission` com relação many-to-many
- Níveis: VIEW, CONTROL, SCHEDULE, ADMIN
- Validação em cada rota baseada em permissões

**Prioridade**: Baixa (requer mudanças significativas)

**Esforço Estimado**: 20 horas

## 6 Funcionalidades Embarcadas Avançadas

### 6.1 Sensor de Temperatura

**Objetivo**: Adicionar monitoramento de temperatura ambiente.

**Hardware**: Sensor DHT22 ou equivalente

**Implementação**:
- Conectar sensor ao pino 14
- Ler temperatura a cada 10 segundos
- Enviar via heartbeat para backend
- Armazenar histórico em banco

**Prioridade**: Média

**Esforço Estimado**: 6 horas

### 6.2 Detecção de Anomalias

**Objetivo**: Alertar quando AC se comporta fora do esperado.

**Critérios**:
- AC não responde a comando
- Temperatura não muda após ligação
- Heartbeat falha por > 5 minutos

**Implementação**:
- Lógica de validação no firmware
- Alertas no backend
- Notificações ao usuário

**Prioridade**: Baixa

**Esforço Estimado**: 12 horas

## 7 Testes e Qualidade

### 7.1 Testes Unitários

**Escopo**:
- Backend: Validação de autenticação, CRUD de ACs, executor de schedules
- Frontend: Parseamento de resposta da API, Context API

**Framework Recomendado**: Jest para ambos backend e frontend

**Cobertura Alvo**: 80%+ de linhas de código

**Esforço Estimado**: 20 horas

### 7.2 Testes de Integração

**Escopo**: Fluxos fim-a-fim (login → criar AC → agendar → executar)

**Framework**: Testcontainers para ambiente isolado

**Esforço Estimado**: 15 horas

### 7.3 Testes End-to-End (E2E)

**Scope**: Teste com navegador real (Cypress ou Playwright)

**Cenários**:
- Fluxo completo de usuário novo
- Agendamento e execução
- Tratamento de erros

**Esforço Estimado**: 12 horas

## 8 Documentação Adicional

### 8.1 Documentação de API OpenAPI/Swagger

**Objetivo**: Gerar documentação interativa da API.

**Ferramenta**: Swagger UI + `express-swagger-generator`

**Benefício**: Facilita testes e integração com terceiros

**Esforço Estimado**: 4 horas

### 8.2 Guia de Contribuição

**Conteúdo**:
- Setup de desenvolvimento
- Convenções de código
- Processo de pull request
- Roadmap do projeto

**Esforço Estimado**: 3 horas

## 9 Cronograma Estimado

| Fase | Atividades | Duração | Prioridade |
|------|-----------|---------|-----------|
| **Fase 1** | Upload hardware, WiFi, IR | 6 horas | 🔴 Crítica |
| **Fase 2** | Teste integração completa | 4 horas | 🔴 Crítica |
| **Fase 3** | Validação, rate limiting, debouncing | 12 horas | 🟡 Alta |
| **Fase 4** | Dark mode, UI aprimorada | 14 horas | 🟢 Média |
| **Fase 5** | Histórico, alertas, avançado | 30+ horas | 🟢 Média |
| **Fase 6** | Testes e qualidade | 47 horas | 🟢 Média |

**Total Estimado**: ~113 horas de desenvolvimento

## 10 Conclusão

O sistema possui uma base sólida com todas as funcionalidades centrais implementadas. As atividades críticas devem ser concluídas para validação em ambiente real. As melhorias subsequentes aprofundarão funcionalidade e confiabilidade.
