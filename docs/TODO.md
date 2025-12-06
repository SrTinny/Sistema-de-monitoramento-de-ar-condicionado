# O Que Falta Fazer ⏳

## Firmware (ESP32)

### 🔴 CRÍTICO - Necessário para funcionamento completo

#### 1. Upload no ESP32 Físico
- [ ] Conectar ESP32 ao computador via USB
- [ ] Identificar porta COM correta (`pio device list`)
- [ ] Atualizar `platformio.ini` com `upload_port` e `monitor_port`
- [ ] Executar `pio run -e esp32dev -t upload`
- [ ] Monitorar logs: `pio device monitor`
- **Bloqueador Atual**: Erro de conexão COM1 "No serial data received"
  - Solução: Confirmar porta COM, atualizar `platformio.ini`, resetar ESP32 em bootloader

#### 2. Configuração de WiFi no Firmware
- [ ] Atualizar SSID e password no `main.cpp`:
  ```cpp
  const char *ssid = "SEU_SSID";
  const char *password = "SUA_SENHA";
  ```
- [ ] Deixar dinâmico (opcional): Portal WiFi no boot
- **Bloqueador**: WiFi hardcoded, não funciona sem ajuste

#### 3. Sinais IR Corretos
- [ ] Capturar sinais IR reais do seu AC usando receptor
- [ ] Substituir `irSignalLigar[]` e `irSignalDesligar[]` em `main.cpp`
- [ ] Testar transmissão localmente com `/ligar` e `/desligar`
- **Status Atual**: Usando sinais de teste (podem não funcionar)

#### 4. Ajuste de Pinos
- [ ] Verificar pinos físicos disponíveis no seu ESP32:
  - rxPinIR = 4 (receptor)
  - txPinIR = 26 (transmissor)
  - ligarPin = 12 (botão)
  - desligarPin = 2 (botão)
- [ ] Ajustar se necessário (alguns pinos podem ser boot pins)
- **Status Atual**: Configurado conforme projeto inicial

### 🟡 IMPORTANTE - Melhorias recomendadas

#### 5. PROGMEM para IR Buffers
- [ ] Mover arrays `irSignalLigar[]` e `irSignalDesligar[]` para PROGMEM
- **Razão**: Economizar RAM (cada array ocupa ~2KB)
- **Ganho**: Deixa mais RAM para tasks
- **Prioridade**: Média (build atual usa 16.4% RAM, ok)

#### 6. Debouncing de Botões
- [ ] Implementar debounce adequado para botões físicos
- **Atual**: Delay 500ms simples
- **Melhor**: Flag + millis() para detecção de borda

#### 7. Reconexão WiFi Automática
- [ ] Verificar WiFi a cada ciclo
- [ ] Reconectar se desconectado
- **Status Atual**: Apenas conecta na inicialização

#### 8. LED de Status
- [ ] LED azul piscando enquanto conecta
- [ ] LED verde quando WiFi OK
- [ ] LED vermelho quando erro
- **Pino Sugerido**: 5 (LED built-in de alguns ESP32)

### 🟢 OPCIONAL - Nice-to-have

#### 9. OTA (Over-The-Air) Updates
- [ ] Implementar atualização de firmware sem USB
- **Impacto**: Facilita manutenção futura
- **Complexidade**: Alta

#### 10. Temperatura & Umidade
- [ ] Adicionar sensor DHT22/BME680
- [ ] Reportar temperatura ao backend
- **Impacto**: Monitoramento mais completo
- **Complexidade**: Média

#### 11. Modo Offline
- [ ] Cache local de último comando
- [ ] Executar schedules mesmo sem internet
- **Complexidade**: Alta

## Backend (Node.js + Express)

### 🟡 IMPORTANTE

#### 1. Validação de Entrada (Input Validation)
- [ ] Instalar `joi` ou `express-validator`
- [ ] Validar campos em todas as rotas
- [ ] Exemplo: email deve ser email, datas devem ser ISO8601
- **Status Atual**: Validação básica apenas

#### 2. Rate Limiting
- [ ] Instalar `express-rate-limit`
- [ ] Aplicar em `/auth/login` (proteger contra força bruta)
- [ ] Limite: 5 tentativas por IP a cada 15 min
- **Status Atual**: Sem proteção

#### 3. Logs Estruturados
- [ ] Integrar Winston ou Pino
- [ ] Logar todas as requisições
- [ ] Logar erros com stack traces
- **Status Atual**: console.log() simples

#### 4. CORS Mais Restritivo
- [ ] Atualmente: `cors()` aceita todas as origens
- [ ] Ajustar para aceitar apenas:
  - `https://sistema-de-monitoramento-de-ar-condicionado-*.vercel.app`
  - `http://localhost:3000` (dev)
- **Status Atual**: Muito permissivo

#### 5. Secrets Management
- [ ] Usar Render Environment Variables (já feito)
- [ ] Nunca commitar `.env` com valores reais
- [ ] Usar `.env.example` como template
- **Status Atual**: Parcialmente implementado

### 🟢 OPCIONAL

#### 6. Refresh Token
- [ ] Implementar access_token (8h) + refresh_token (30d)
- [ ] Endpoint `/auth/refresh` para renovar
- **Benefício**: Segurança melhorada
- **Complexidade**: Média

#### 7. Histórico de Comandos
- [ ] Tabela `CommandLog` para auditar tudo
- [ ] Rastrear quem executou o quê e quando
- **Benefício**: Auditoria completa
- **Complexidade**: Baixa

#### 8. WebSocket para Real-time
- [ ] Atualmente: Frontend polling (60s)
- [ ] Melhor: Backend notifica frontend via WebSocket
- [ ] Quando AC liga/desliga: notificar imediatamente
- **Benefício**: Experiência mais responsiva
- **Complexidade**: Alta

#### 9. Multi-usuário & Permissões
- [ ] Atualmente: ADMIN vs USER simples
- [ ] Melhor: Permissões granulares (view, control, schedule)
- [ ] Compartilhamento de ACs entre usuários
- **Complexidade**: Alta

#### 10. Alertas & Notificações
- [ ] Email quando AC offline > 1h
- [ ] Push notification quando schedule executa
- [ ] Email diário com resumo
- **Complexidade**: Média

## Frontend (React + Vite)

### 🟡 IMPORTANTE

#### 1. Carregamento de Estados
- [ ] Adicionar loaders/skeletons enquanto carrega dados
- **Status Atual**: Sem feedback visual
- **UX**: Melhor para usuário esperando

#### 2. Tratamento de Erros
- [ ] Modal de erro com mensagem detalhada
- [ ] Retry automático para timeouts
- [ ] **Status Atual**: Toast simples apenas

#### 3. Confirmação de Ações
- [ ] Modal pedindo confirmação antes de deletar AC
- [ ] Modal pedindo confirmação antes de cancelar schedule
- **Status Atual**: Sem confirmação

#### 4. Dark Mode
- [ ] Toggle para modo escuro
- [ ] Persistir preferência em localStorage
- **Complexidade**: Baixa

### 🟢 OPCIONAL

#### 5. Gráficos de Uso
- [ ] Chart.js ou Recharts
- [ ] Mostrar quantas horas AC ficou ligado por dia/mês
- [ ] Estimativa de custo
- **Complexidade**: Média

#### 6. Histórico de Ações
- [ ] Página mostrando "2024-12-05 14:30: AC ligado manualmente"
- [ ] Filtro por data/AC
- **Complexidade**: Média

#### 7. Export de Dados
- [ ] Exportar schedules e uso em CSV/PDF
- **Complexidade**: Baixa

#### 8. Configurações de Usuário
- [ ] Página de perfil
- [ ] Alterar senha
- [ ] Notificações preferences (email, push, etc)
- **Complexidade**: Média

#### 9. Modo Offline
- [ ] Service Worker para cache
- [ ] Funcionalidade básica sem internet
- **Complexidade**: Alta

## Infraestrutura & DevOps

### 🟡 IMPORTANTE

#### 1. Environment Variables - Webapp
- [x] `VITE_API_URL` - Já configurado
- [ ] Outros se necessário (API keys de analytics, etc)

#### 2. Environment Variables - Backend
- [x] `DATABASE_URL` - Já configurado
- [x] `JWT_SECRET` - Já configurado
- [ ] `NODE_ENV` - Já setado
- [ ] Adicionar se necessário: SMTP para emails

#### 3. Backup do Banco
- [ ] Configurar backup automático no Neon
- [ ] Testar restore
- **Prioridade**: Alta (dados são críticos)

#### 4. Monitoramento
- [ ] Alertas se backend estiver offline
- [ ] Alertas se banco estiver offline
- [ ] Dashboard de saúde
- **Ferramentas**: Uptime Robot (free), Sentry (errors)

#### 5. SSL/TLS Certificados
- [x] Vercel: automático
- [x] Render: automático
- [x] Neon: automático
- **Status**: Tudo em ordem

### 🟢 OPCIONAL

#### 6. CI/CD Melhorado
- [ ] Testes automatizados no GitHub Actions
- [ ] Linting (ESLint, Prettier)
- [ ] Test coverage reports
- **Complexidade**: Média

#### 7. Docker
- [ ] Dockerfile para backend
- [ ] docker-compose.yml para dev local
- **Benefício**: Replicar produção localmente
- **Complexidade**: Média

#### 8. Database Encryption
- [ ] Criptografar campos sensíveis (senhas já são)
- [ ] Considerar column-level encryption se requerido
- **Complexidade**: Alta

## Documentação

### 🟡 IMPORTANTE

#### 1. API Docs (Swagger/OpenAPI)
- [ ] Gerar docs automáticas das rotas
- [ ] Endpoint interativo para testar API
- [ ] URL: `/api/docs`
- **Ferramenta**: Swagger UI + OpenAPI 3.0

#### 2. Firmware Pinout Diagram
- [ ] Desenho visual dos pinos do ESP32
- [ ] Onde conectar transmissor IR, receptor, botões
- [ ] Tensões, resistores, circuito

#### 3. Arquitetura Detalhada
- [ ] Diagrama C4 (contexto, containers, componentes, código)
- [ ] Fluxo de dados entre sistemas

#### 4. Guia de Contribuição
- [ ] Como fazer fork/branch/PR
- [ ] Padrões de código
- [ ] Checklist antes de submeter PR

### 🟢 OPCIONAL

#### 5. Video Walkthrough
- [ ] Vídeo de 5min mostrando como usar
- [ ] Demo do fluxo completo

#### 6. FAQ
- [ ] Perguntas frequentes e respostas
- [ ] Troubleshooting expandido

## Testes

### 🔴 NÃO IMPLEMENTADO

#### 1. Testes Unitários (Backend)
- [ ] Jest para testes Node.js
- [ ] Cobertura: Controllers, Services, Middleware
- **Alvo**: 80% code coverage

#### 2. Testes de Integração (Backend)
- [ ] Testes E2E de fluxos completos
- [ ] Database test fixtures

#### 3. Testes Frontend
- [ ] Vitest + React Testing Library
- [ ] Testar componentes isolados
- [ ] Testar fluxos de autenticação

#### 4. Testes E2E (Full Stack)
- [ ] Cypress ou Playwright
- [ ] Simular usuário real
- [ ] Testar login → criar schedule → executar → logout

## Segurança

### 🟡 IMPORTANTE

#### 1. Validação de CORS
- [ ] Já descrito acima

#### 2. Rate Limiting
- [ ] Já descrito acima

#### 3. SQL Injection
- [x] Prisma previne (parameterized queries)
- [ ] Validar entrada mesmo assim

#### 4. XSS (Cross-Site Scripting)
- [x] React escapa HTML por padrão
- [ ] Adicionar CSP header (já em vercel.json)

#### 5. CSRF
- [ ] Atualmente: POST sem verificação CSRF
- [ ] Adicionar `csrf-protection` middleware
- **Prioridade**: Média

### 🟢 OPCIONAL

#### 6. Penetration Testing
- [ ] Teste de segurança profissional
- [ ] Identificar vulnerabilidades

## Priorização (Por Ordem de Importância)

### 🔴 CRÍTICO (Faça primeiro)
1. Upload firmware no ESP32
2. Capturar sinais IR reais
3. Configurar WiFi correto
4. Testar integração completa

### 🟡 IMPORTANTE (Faça em seguida)
1. Validação de entrada no backend
2. Rate limiting em login
3. CORS mais restritivo
4. Carregamento de estados no frontend
5. Confirmação de ações destrutivas

### 🟢 OPCIONAL (Quando tiver tempo)
1. PROGMEM para IR buffers
2. Dark mode no frontend
3. Logs estruturados
4. Refresh token
5. WebSocket real-time
6. Gráficos de uso
7. Tests

## Estimativa de Tempo

| Tarefa | Tempo | Dificuldade |
|--------|-------|------------|
| Upload ESP32 | 1h | Média |
| Capturar sinais IR | 2h | Média |
| Input validation | 3h | Baixa |
| Rate limiting | 1h | Baixa |
| CORS config | 30min | Baixa |
| Loaders/Skeletons | 2h | Baixa |
| Dark mode | 1h | Baixa |
| API Docs Swagger | 2h | Média |
| Testes unitários | 4h | Média |
| WebSocket real-time | 4h | Alta |
| Gráficos | 3h | Média |
| E2E tests | 5h | Alta |

**Total restante**: ~30 horas para completar tudo

