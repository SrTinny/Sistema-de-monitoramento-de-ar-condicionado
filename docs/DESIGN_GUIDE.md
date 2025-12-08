# 🎨 Guia de Design - Sistema de Monitoramento de Ar Condicionado

**Status rápido (manter sempre atualizado após cada entrega)**

- ✅ Phase 1 entregue: skeletons, spinners, empty states, toasts
- ✅ Phase 2 entregue: Dashboard header + stats, timeline de agendamentos, animações base (stagger/page), modal com blur e tabs, FAB mobile
- ✅ Phase 3 entregue: dark mode com persistência, gráficos históricos (Recharts), parallax sutil, card de AC em 2 colunas com slider gradiente
- ✅ Fase de Correções: 
  - Tema claro/escuro aplicado corretamente em DashboardHeader e ScheduleTimeline
  - Layout responsivo: grid com minmax(140px) para 2+ colunas em mobile
  - Gráficos: labels rotacionados (-45°), nomes truncados com "..."
  - Removido FAB redundante (usar botão "Adicionar" da nav bar)
  - Título "Salas de Controle" posicionado fora do grid
  - Paralax z-index layering corrigido
- ⏳ Próximos focos: gestos mobile (pull-to-refresh/swipe delete), revisão de contraste/ARIA, onboarding/atalhos, gráficos com dados reais

## 📋 Contexto do Projeto

Sistema web para controle e monitoramento remoto de unidades de ar condicionado via ESP32 e infrared. Usuários podem ligar/desligar ACs, ajustar temperatura (setpoint), criar agendamentos e visualizar status em tempo real.

## 🎯 Objetivo

Criar uma interface moderna, intuitiva e responsiva que transmita **controle**, **confiabilidade** e **simplicidade**, priorizando usabilidade e feedback visual claro.

## 👥 Personas

1. **Usuário Residencial**: Controla ACs de casa pelo celular, busca simplicidade e rapidez
2. **Administrador**: Gerencia múltiplos ambientes, cria agendamentos, visualiza métricas

---

## 🎨 Diretrizes Visuais

### Paleta de Cores

| Papel | Cor | Hex | Uso |
|-------|-----|-----|-----|
| **Primária** | Azul | `#2563EB` | Botões, Links, Destaque |
| **Primária (Dark)** | Azul Escuro | `#1E40AF` | Hover, Selecionado |
| **Sucesso** | Verde | `#10B981` | Status "Ligado", Confirmação |
| **Erro** | Vermelho | `#EF4444` | Status "Desligado", Avisos |
| **Alerta** | Laranja | `#F59E0B` | Alertas, Atenção |
| **Info** | Azul Claro | `#60A5FA` | Informações, Interações |
| **Fundo Light** | Cinza Claro | `#F3F4F6` | Background padrão |
| **Fundo Card** | Branco | `#FFFFFF` | Cards, Containers |
| **Texto Principal** | Cinza Escuro | `#1F2937` | Texto padrão |
| **Texto Secundário** | Cinza Médio | `#6B7280` | Labels, Hints |
| **Borda** | Cinza Claro | `#E5E7EB` | Divisões, Bordas |

### Tipografia

```css
/* Títulos */
font-family: 'Inter', 'Poppins', sans-serif;
font-weight: 600-700;

/* Corpo */
font-family: 'Inter', 'System UI', sans-serif;
font-weight: 400-500;

/* Dados Numéricos */
font-family: 'Inter', monospace;
font-variant-numeric: tabular-nums; /* Alinha números */
```

**Escalas Recomendadas**:
- H1: 32px (600 weight)
- H2: 28px (600 weight)
- H3: 24px (600 weight)
- Body: 16px (400 weight)
- Small: 14px (400 weight)
- Tiny: 12px (500 weight)

### Estilo Visual

- ✅ Design limpo e minimalista
- ✅ Cantos arredondados: `border-radius: 12px` para cards, `16px` para modais
- ✅ Sombras suaves: `box-shadow: 0 4px 6px rgba(0,0,0,0.07)`
- ✅ Glassmorphism sutil: `backdrop-filter: blur(8px)` em overlays
- ✅ Ícones line-style (Lucide, Heroicons ou Phosphor)
- ✅ Espaçamento: múltiplos de 8px (4px, 8px, 12px, 16px, 24px, 32px)

---

## 🖼️ Componentes Principais

### 1. Card de Unidade AC

#### Estado Atual
- Retangular básico
- Informações empilhadas verticalmente
- Slider simples de temperatura

#### Melhorias Desejadas

**Layout**:
```
┌─────────────────────────────────────┐
│ ⚙️ [Sala] ONLINE●                   │
├─────────────────────────────────────┤
│ Status: ●LIGADO                     │
│ Temperatura: 23°C | Setpoint: 22°C  │
│                                     │
│ [↓ DESLIGAR] [⚙ CONFIGURAR]         │
│                                     │
│ Setpoint: [████|───────] 16°C  30°C │
│           (Slider com gradiente)    │
│                                     │
│ Last: 2min ago                      │
└─────────────────────────────────────┘
```

**Elementos**:

1. **Header com Status**
   - Badge colorido no canto superior direito
   - Ícone + texto (● LIGADO em verde, ● DESLIGADO em cinza)
   - Nome da sala à esquerda

2. **Indicador de Conexão**
   - "ONLINE" (ponto verde pulsante) se heartbeat < 1min
   - "OFFLINE" (cinza) se > 2min
   - Pulse animation: `animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite`

3. **Informações de Temperatura**
   ```
   Temperatura Atual: 23°C (leitura do sensor)
   Setpoint (Alvo):   22°C (valor desejado)
   ```
   - Icons: 🌡️ para temperatura

4. **Slider Aprimorado**
   - **Track**: Gradiente linear azul → vermelho
     ```css
     background: linear-gradient(90deg, #3B82F6 0%, #EF4444 100%);
     ```
   - **Marcações**: A cada 2°C (16, 18, 20, 22, 24, 26, 28, 30)
   - **Thumb**: 32px (maior, fácil tocar em mobile)
   - **Tooltip**: Valor flutuante ao arrastar
   - **Range**: 16°C a 30°C

5. **Botões de Ação**
   ```
   Primário: [LIGAR/DESLIGAR] - grande, destaque
   Secundário: [⚙️ CONFIG]     - ícone, menor
   ```
   - Hover: Elevação sutil, cor mais escura
   - Active: Loading spinner enquanto processa
   - Disabled: Opacidade 0.5 se offline

6. **Micro-interações**
   - Fade in ao montar
   - Hover: `transform: translateY(-2px); box-shadow: 0 8px 12px rgba(0,0,0,0.1)`
   - Loading: Spinner no botão de ligar/desligar
   - Feedback: Toast "AC ligado com sucesso" após ação

7. **Skeleton Loader** (durante fetch)
   ```
   ┌─────────────────────────────────────┐
   │ ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓ │
   │ ▓▓▓▓▓▓▓▓ ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓ │
   │ ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓ ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓ │
   └─────────────────────────────────────┘
   ```
   - Pulse animation suave
   - `background: linear-gradient(...)`

---

### 2. Dashboard/Home

#### Estado Atual
- Grid simples de cards
- Sem contexto visual
- Sem resumos

#### Melhorias Desejadas

**Header Contextual**:
```
┌──────────────────────────────────┐
│ 👋 Bom dia, João!                │
│                                  │
│ 📊 Resumo:  2 ligados  |  3 agendados
│ 🔴 2 offline   |   Próximo: 19:00 │
└──────────────────────────────────┘
```

**Estrutura**:
- Cumprimento personalizado (Bom dia/tarde/noite)
- Cards de resumo rápido (número de ACs ligados, agendamentos pendentes)
- Alertas críticos destacados (offline, temperatura anômala)

**Grid Responsivo**:
- **Desktop** (≥1024px): 3 colunas
- **Tablet** (768-1023px): 2 colunas
- **Mobile** (<768px): 1 coluna (stack vertical)

**Estados Vazios**:
```
🎨 ILUSTRAÇÃO [Ar condicionado]

  Nenhuma unidade registrada

  Comece adicionando sua primeira unidade
  de ar condicionado.

  [+ ADICIONAR UNIDADE]
```

**FAB (Floating Action Button)** - Mobile Only:
- Botão "+" fixo inferior direito
- Background: `#2563EB` com sombra
- Ao clicar: Abre modal de nova sala
- `position: fixed; bottom: 24px; right: 24px`

---

### 3. Controle de Temperatura

#### Aprimoramentos

**Display Atual vs Setpoint**:
```
┌─────────────────────────────────┐
│ 🌡️ Temperatura Atual: 23°C      │
│ 🎯 Setpoint (Alvo): 22°C        │
│                                 │
│ 📊 Status: Resfriando...        │
└─────────────────────────────────┘
```

**Visual Aprimorado**:
- Ícone termômetro com fill proporcional
  ```
  Vazio: ▭ | Meio: ▬ | Cheio: ▮
  ```
- Cor muda com temperatura:
  - Azul frio: < 20°C
  - Verde neutro: 20-24°C
  - Laranja quente: > 24°C

**Mensagens de Estado**:
- "Aquecendo para 24°C" (se setpoint > temp atual)
- "Resfriando para 20°C" (se setpoint < temp atual)
- "Temperatura estável em 22°C" (se setpoint ≈ temp atual)

**Slider com Feedback Visual**:
- Gradiente no track
- Marcações de temperatura (16, 18, 20, 22, 24, 26, 28, 30)
- Valor em tempo real ao arrastar
- Animação suave ao liberar

---

### 4. Página de Agendamentos

#### Melhorias

**Timeline Visual**:
```
HÁ-────────────────────────────────AMANHÃ
     │ │ │
  7:00 12:00 18:00 23:00

   ●─────────────────────────────────●
 LIGAR    Sala                  DESLIGAR

[Detalhes] [Editar] [Deletar]
```

**Cards Compactos**:
```
┌────────────────────────────────────┐
│ 19:00 - LIGAR - Sala de Estar      │
│ ✏️ [Editar]  🗑️ [Deletar]          │
│ Em: 2 horas 30 minutos             │
└────────────────────────────────────┘
```

**Filtros**:
- Tabs: "Hoje" | "Semana" | "Todos"
- Ícones e labels claros

**Criação Simplificada** (Modal):
```
┌────────────────────────────────────┐
│ Novo Agendamento                ✕  │
├────────────────────────────────────┤
│                                    │
│ Unidade:     [Sala de Estar ▼]    │
│ Ação:        [LIGAR ▼]            │
│ Data:        [08/12/2025]         │
│ Hora:        [19:00]              │
│                                    │
│         [Cancelar] [Salvar]        │
└────────────────────────────────────┘
```

---

### 5. Modal de Configurações

#### Aprimoramentos

**Animação**:
- Entrada: Fade + scale (0.95 → 1)
- Backdrop: `backdrop-filter: blur(8px)`, opacity 0.5

**Estrutura com Tabs**:
```
┌────────────────────────────────────┐
│ Configurações - Sala de Estar   ✕  │
├────────────────────────────────────┤
│ [Informações] [Histórico] [Avançado]│
├────────────────────────────────────┤
│ Nome:    [Sala de Estar______]    │
│ Sala:    [Sala Principal_____]    │
│ DeviceID: esp32-dev-ac-01 (read)  │
│                                    │
│ Status:  ONLINE • Última atualização
│          há 2 min                  │
│                                    │
│         [Cancelar] [Salvar]        │
└────────────────────────────────────┘
```

**Ações Destaque**:
- Botão primário (Salvar) - azul destaque
- Botão secundário (Cancelar) - cinza
- Botão deletar (perigo) - vermelho, separado

---

## 📱 Responsividade

### Mobile-First

**Touch Targets**:
- Mínimo: 44x44px
- Slider thumb: 32px
- Botões: 48x48px (confortável)

**Bottom Navigation Bar** (Mobile):
```
┌─────────────────────────────────────┐
│                                     │
│          [Conteúdo]                 │
│                                     │
├─────────────────────────────────────┤
│ 🏠 Início | 📅 Agenda | ⚙️ Config  │
└─────────────────────────────────────┘
```

**Gestos**:
- Swipe esquerda/direita: Deletar agendamento
- Pull-to-refresh: Atualizar lista de ACs
- Long press: Abrir menu de contexto

### Desktop

**Sidebar Fixa**:
```
┌──────────────────────────────────┐
│  LOGO                            │
├──────────────────────────────────┤
│ 🏠 Início                        │
│ 📅 Agendamentos                  │
│ ⚙️ Configurações                │
│ 👤 Perfil                        │
│                                  │
│ (espaço)                         │
│                                  │
│ 🚪 Sair                          │
└──────────────────────────────────┘
[CONTEÚDO PRINCIPAL]
```

**Keyboard Shortcuts**:
- `Space`: Ligar/desligar AC selecionado
- `Esc`: Fechar modal
- `? / H`: Mostrar atalhos

**Hover States**:
- Tooltips informativos
- Cor de hover mais clara
- Elevação sutil em cards

---

## ♿ Acessibilidade (WCAG 2.1 AA)

### Contraste
- Texto vs fundo: mínimo 4.5:1
- Ícones vs fundo: mínimo 3:1
- Verificar com: WebAIM Contrast Checker

### Semântica HTML
```html
<!-- ✅ Correto -->
<button aria-label="Ligar AC">
  <span aria-hidden="true">⚡</span>
</button>

<!-- ✅ Labels em inputs -->
<label for="ac-name">Nome da sala:</label>
<input id="ac-name" type="text" />

<!-- ✅ ARIA attributes -->
<div role="progressbar" aria-valuenow="50" aria-valuemin="0" aria-valuemax="100">
  Loading...
</div>
```

### Indicadores Visuais + Textuais
- Não usar apenas cores para transmitir informação
- Exemplo: "● LIGADO" (cor + ícone + texto)
- Alertas: Ícone ⚠️ + texto

### Navegação por Teclado
- Tab order lógico
- Foco visível: `outline: 2px solid #2563EB`
- Modais: Focus trap (Tab dentro do modal apenas)

### Redução de Motion
```css
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

---

## 🎭 Estados e Feedback

### Loading States

**Skeleton Loaders**:
```css
.skeleton {
  background: linear-gradient(
    90deg,
    #f3f4f6 0%,
    #e5e7eb 50%,
    #f3f4f6 100%
  );
  background-size: 200% 100%;
  animation: loading 2s infinite;
}

@keyframes loading {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}
```

**Spinner em Botões**:
```jsx
<button disabled={isLoading}>
  {isLoading ? (
    <span className="spinner">⏳</span>
  ) : (
    'Ligar AC'
  )}
</button>
```

**Progress Bar Global** (operações longas):
```jsx
<div className="progress-bar" style={{ width: `${progress}%` }} />
```

### Notificações (Toasts)

**Posicionamento**: Canto superior direito
**Auto-dismiss**: 4 segundos (exceto erros)
**Tipos**:

```
✅ Success (Verde)
  "AC ligado com sucesso"

❌ Error (Vermelho)
  "Erro ao ligar AC: Dispositivo offline"

ℹ️ Info (Azul)
  "Temperatura alterada para 22°C"

⚠️ Warning (Laranja)
  "AC offline há 5 minutos"
```

**Animação**:
- Entrada: Slide from right + fade
- Saída: Fade out

### Success/Error States

**Ação Bem-Sucedida**:
```
Button: LIGAR → Loading → ✅ AC LIGADO (cor verde)
Após 2s: Volta ao estado normal
Toast: "AC ligado com sucesso"
```

**Erro**:
```
Button: LIGAR → Loading → ❌ Falha
Toast: "Erro ao ligar AC: Dispositivo offline"
Button ativa novamente para retry
```

### Empty States

**Ilustração**:
- Estilo amigável e moderno
- Fonte: Undraw.co, Storyset ou similar

**CTA Claro**:
```
[+ ADICIONAR PRIMEIRA UNIDADE]
```

---

## 🚀 Melhorias de UX

### 1. Confirmações Inteligentes

**NÃO pedir confirmação para**:
- Ligar/desligar AC
- Alterar temperatura
- Qualquer ação reversível

**PEDIR confirmação para**:
- Deletar sala
- Deletar agendamento
- Ações irreversíveis

**Modal de Confirmação**:
```
┌────────────────────────────────────┐
│ Confirmar Ação                   ✕ │
├────────────────────────────────────┤
│                                    │
│ Tem certeza que deseja deletar    │
│ "Sala de Estar"?                  │
│                                    │
│ Essa ação não pode ser desfeita.  │
│                                    │
│       [Cancelar] [Deletar]         │
└────────────────────────────────────┘
```

### 2. Feedback Imediato (Optimistic UI)

```javascript
// ✅ Forma correta
setRooms(prev => 
  prev.map(r => r.id === id ? {...r, setpoint: 23} : r)
);
try {
  await api.post(`/api/ac/${id}/setpoint`, {setpoint: 23});
} catch (err) {
  // Rollback visual
  setRooms(prev => 
    prev.map(r => r.id === id ? {...r, setpoint: oldValue} : r)
  );
  toast.error("Erro ao alterar temperatura");
}
```

### 3. Persistência Local

**localStorage**:
```javascript
// Salvar preferências
localStorage.setItem('theme', 'dark');
localStorage.setItem('sortBy', 'name');
localStorage.setItem('lastSetpoint', '22');

// Restaurar ao carregar
const savedTheme = localStorage.getItem('theme') || 'light';
```

### 4. Onboarding

**Tour Guiado** (primeira visita):
```
┌──────────────────────────────────┐
│ 👋 Bem-vindo!                    │
│                                  │
│ Aqui você controla seus ACs      │
│ e cria agendamentos.             │
│                                  │
│ [Próximo >] [Pular tour]        │
└──────────────────────────────────┘
```

**Tooltips Contextuais**:
- Aparecer ao pairar (desktop)
- Aparecer ao tocar (mobile)
- Ícone de ajuda "?" para informações

### 5. Dark Mode

**Toggle de Tema**:
```
☀️ [●  ○] 🌙
```

**Paleta Dark**:
| Elemento | Dark Mode |
|----------|-----------|
| Background | `#0F172A` |
| Card | `#1E293B` |
| Texto Principal | `#F1F5F9` |
| Texto Secundário | `#94A3B8` |
| Primária | `#3B82F6` (mais clara) |
| Sucesso | `#10B981` (saturado) |

**Implementação CSS**:
```css
:root {
  --bg-primary: #FFFFFF;
  --bg-secondary: #F3F4F6;
  --text-primary: #1F2937;
}

html[data-theme="dark"] {
  --bg-primary: #0F172A;
  --bg-secondary: #1E293B;
  --text-primary: #F1F5F9;
}
```

---

## 📊 Referências de Design

| App | Aspecto | Inspiração |
|-----|---------|-----------|
| **Nest Thermostat** | Controles circulares | Slider circular para temperatura |
| **Philips Hue** | Feedback visual claro | Status icons e cores vibrantes |
| **Apple Home** | Minimalismo | Cards simples e eficientes |
| **Vercel Dashboard** | Estética moderna | Tipografia e espaçamento |
| **Spotify** | Dark mode | Aplicação de tema |

---

## 🛠️ Stack Técnico

| Tecnologia | Propósito | Status |
|------------|-----------|--------|
| **Tailwind CSS** | Estilos (já em uso) | ✅ Ativo |
| **Framer Motion** | Animações | ✅ Em uso (stagger, page transitions, modal) |
| **Lucide React** | Ícones | ✅ Em uso (Dashboard, Timeline, FAB) |
| **Headless UI** | Componentes acessíveis | 🔄 A considerar |
| **Recharts** | Gráficos (futura) | ⏳ Futura |

**Instalação**:
```bash
npm install framer-motion lucide-react
npm install @headlessui/react @radix-ui/react-dialog
```

---

## 📝 Priorização (MVP → v2 → v3)

### ✅ MVP (Fase 1) - Semanas 1-2

- [ ] Melhorar cards de AC:
  - ✅ Status visual (Online/Offline com pulsing)
  - ✅ Slider com gradiente de cores
  - ✅ Exibir setpoint e temperatura atual
  - ✅ Hover effects e animações suaves
  
- ✅ Sistema de notificações (Toasts):
  - ✅ Toast success/error/warning
  - ✅ Auto-dismiss em 4s
  - ✅ Posicionamento top-right
  
- ✅ Estados de loading e erro:
  - ✅ Skeleton loaders em cards
  - ✅ Spinner em botões
  - ✅ Empty states com ilustração

### 🔄 Fase 2 (Semanas 3-4)

- ✅ Dashboard contextual:
  - ✅ Header com cumprimento + resumo
  - ✅ Cards de resumo rápido
  - ✅ FAB para mobile
  
- ✅ Timeline de agendamentos:
  - ✅ Visual timeline
  - ✅ Cards compactos
  - ✅ Filtros (Hoje/Semana/Todos)
  
- ✅ Modais aprimorados:
  - ✅ Backdrop blur
  - ✅ Animações de entrada
  - ✅ Tabs (Informações/Histórico/Avançado)

### ⏳ Fase 3 (Semanas 5-6)

- ✅ Dark mode:
  - ✅ Toggle de tema
  - ✅ Persistência em localStorage
  - ✅ Paleta adaptada
  
- ✅ Gráficos de histórico:
  - ✅ Temperatura ao longo do tempo (linha)
  - ✅ Hora de uso (ON/OFF) por sala (barras)
  - ⏳ Consumo energético (estimado) — opcional futuro
  
- ✅ Animações com Framer Motion:
  - ✅ Page transitions / Stagger (base feitos)
  - ✅ Card stagger animations
  - ✅ Parallax effects (sutil em gráficos)

---

## 📝 Checklist de Implementação

### Componente: Card de AC

- ✅ Layout em 2 colunas (info + controles)
- ✅ Badge de status (Online/Offline)
- ✅ Indicador pulsante para Online
- ✅ Exibição de temperatura atual vs setpoint
- ✅ Slider com gradiente azul → vermelho
- ✅ Marcações a cada 2°C
- ✅ Thumb de 32px
- ✅ Tooltip ao arrastar slider
- ✅ Botão ligar/desligar com loading state
- ✅ Botão configurações
- ✅ Hover effect com elevação
- ✅ Skeleton loader durante fetch
- ✅ Toast de sucesso/erro ao mudar setpoint

### Dashboard/Home
- ✅ Header com cumprimento personalizado
- ✅ Cards de resumo rápido
- ✅ Grid responsivo (3 col desktop, 2 tablet, 1 mobile)
- ✅ Empty state com ilustração
- ✅ FAB em mobile
- [ ] Pull-to-refresh (mobile)

### Notificações
- ✅ Toast component reutilizável
- ✅ Estados: success, error, warning, info
- ✅ Auto-dismiss em 4s
- ✅ Posicionamento top-right
- ✅ Animação suave

### Accessibility

- [ ] Contraste WCAG AA (4.5:1)
- [ ] Semantic HTML
- [ ] ARIA labels
- [ ] Focus visible
- [ ] Keyboard navigation
- [ ] Reduced motion support

### Dark Mode

- ✅ CSS variables para cores
- ✅ Toggle visível
- ✅ Persistência em localStorage
- ✅ Paleta escura completa

## 🔜 Pendências principais (resumido)
- ✅ Layout responsivo com grid minmax dinâmico (2+ colunas em mobile)
- ✅ Tema claro/escuro com CSS variables (localStorage persistence)
- ✅ Gráficos responsivos com labels rotacionados e truncados
- ⏳ Gestos mobile: pull-to-refresh e swipe para deletar agendamento
- ⏳ Revisão de contraste/ARIA em páginas e formulários; garantir focus visible consistente
- ⏳ Onboarding/atalhos de teclado (help overlay)
- ⏳ Gráficos com dados reais e consumo energético (quando disponível)
- ⏳ Code splitting (Recharts > 500kB warning)

---

## 🎬 Entregáveis Esperados

### 1. Figma/Mockup
- [x] Telas principais (Home, Agendamentos, Config)
- [x] Componentes reutilizáveis
- [x] Flows de interação

### 2. Style Guide
- [x] Paleta de cores (hex codes)
- [x] Escalas de tipografia
- [x] Componentes documentados
- [x] Ícones utilizados

### 3. Protótipo Interativo
- [x] Navegação entre telas
- [ ] Simulação de estados
- [ ] Feedback de ações

### 4. Código Implementado
- [ ] Componentes React
- [ ] Estilos Tailwind
- [ ] Animações Framer Motion
- [ ] Testes de acessibilidade

---

## 📞 Dúvidas e Ajustes

**Dúvidas frequentes**:

1. **Como implementar o slider com gradiente?**
   - Usar `<input type="range">` com CSS custom
   - Ou usar biblioteca como `react-slider` com tema customizado

2. **O design deve suportar múltiplos temas?**
   - Sim, dark mode será implementado em fase 3

3. **Quantos níveis de responsividade?**
   - 3: Mobile (<768px), Tablet (768-1023px), Desktop (≥1024px)

4. **Usar bibliotecas de componentes (Headless UI)?**
   - Recomendado para modais e dropdowns
   - Facilita acessibilidade

---

## 📅 Timeline Sugerida

| Semana | Atividade | Responsável |
|--------|-----------|-------------|
| 1 | Design mockups no Figma | Designer |
| 1-2 | Implementar MVP (cards, toasts) | Dev Frontend |
| 2-3 | Testar acessibilidade | QA + Dev |
| 3-4 | Fase 2 (dashboard, agendamentos) | Dev Frontend |
| 4-5 | Validar com stakeholders | PM |
| 5-6 | Fase 3 (dark mode, gráficos) | Dev Frontend |
| 6 | Testes finais e ajustes | QA |

---

## 🔗 Recursos Úteis

- **Paleta de cores**: https://coolors.co/
- **Tipografia**: https://fonts.google.com/
- **Ícones**: https://lucide.dev/ ou https://heroicons.com/
- **Ilustrações**: https://undraw.co/ ou https://storyset.com/
- **Acessibilidade**: https://www.w3.org/WAI/WCAG21/quickref/
- **Tailwind Docs**: https://tailwindcss.com/docs
- **Framer Motion**: https://www.framer.com/motion/

---

**Versão**: 1.0
**Data**: 08/12/2025
**Última atualização**: 08/12/2025

**Para dúvidas ou sugestões, abra uma issue no repositório** 🎨
