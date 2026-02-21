// backend/server.js
// Carrega variáveis de ambiente do .env
// Em desenvolvimento, permitimos que o .env sobrescreva variáveis já definidas na sessão
require('dotenv').config({ override: process.env.NODE_ENV === 'development' });
const express = require('express');
const cors = require('cors');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');
const cuid = require('cuid');
const axios = require('axios');
const os = require('os');

const app = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 3001;

// Middlewares
app.use(cors());
app.use(express.json());

// ==========================================================
// ROTA DE HEALTH CHECK (PÚBLICA)
// ==========================================================
app.get('/', (req, res) => {
  res.json({ 
    message: 'Intelifri - Sistema Inteligente de Monitoramento - Backend OK',
    timestamp: new Date().toISOString(),
    status: 'operational'
  });
});

// ==========================================================
// ROTAS DE AUTENTICAÇÃO (PÚBLICAS)
// ==========================================================
app.post('/auth/register', async (req, res) => {
  const { email, password, role } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email e senha são obrigatórios.' });
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  try {
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        role: role || 'USER',
      },
    });
    res.status(201).json({ id: user.id, email: user.email, role: user.role });
  } catch (error) {
    if (error.code === 'P2002') {
      return res.status(400).json({ error: 'Usuário com este e-mail já existe.' });
    }
    res.status(500).json({ error: 'Não foi possível registrar o usuário.' });
  }
});

app.post('/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      return res.status(401).json({ error: 'Credenciais inválidas.' });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Credenciais inválidas.' });
    }

    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role }, // Dados do usuário no payload
      process.env.JWT_SECRET,
      { expiresIn: '8h' }
    );

    res.json({ token });
  } catch (err) {
    // Log detalhado para debugging de produção (aparecerá nos logs do host)
    console.error('[auth:login] erro ao processar login:', err && err.stack ? err.stack : err);
    // Retorna uma mensagem genérica para o cliente, mas registre o erro completo no servidor
    res.status(500).json({ error: 'Erro interno ao processar login.' });
  }
});

// ==========================================================
// MIDDLEWARES DE AUTENTICAÇÃO E AUTORIZAÇÃO
// ==========================================================
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (token == null) return res.sendStatus(401);

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
};

const isAdmin = (req, res, next) => {
  if (req.user.role !== 'ADMIN') {
    return res.status(403).json({ error: 'Acesso negado. Rota apenas para administradores.' });
  }
  next();
};

// ==========================================================
// ROTAS PROTEGIDAS PARA O FRONTEND (CRUD COMPLETO DE ROOMS)
// ==========================================================

// ROTA 'CREATE': Cadastrar uma nova sala/ar-condicionado. (PROTEGIDA - ADMIN)
app.post('/api/rooms', authenticateToken, isAdmin, async (req, res) => {
  const { name, room } = req.body;

  if (!name || !room) {
    return res.status(400).json({ error: 'Nome e sala são obrigatórios.' });
  }

  try {
    const deviceId = `ESP32-${room.replace(/\s+/g, '-')}-${cuid().slice(-6)}`;
    const newAC = await prisma.airConditioner.create({
      data: { deviceId, name, room },
    });
    res.status(201).json(newAC);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Não foi possível cadastrar a sala.' });
  }
});

// ROTA 'READ (ALL)': Listar todos os aparelhos. (PROTEGIDA - AUTENTICADO)
app.get('/api/rooms', authenticateToken, async (req, res) => {
  try {
    const allACs = await prisma.airConditioner.findMany({
      orderBy: { createdAt: 'desc' },
    });
    res.status(200).json(allACs);
  } catch (error) {
    res.status(500).json({ error: 'Não foi possível buscar as salas.' });
  }
});

// ROTA 'READ (SINGLE)': Buscar um único aparelho por ID. (PROTEGIDA - AUTENTICADO)
app.get('/api/rooms/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;
  try {
    const ac = await prisma.airConditioner.findUnique({
      where: { id },
    });
    if (!ac) {
      return res.status(404).json({ error: 'Aparelho não encontrado.' });
    }
    res.status(200).json(ac);
  } catch (error) {
    res.status(500).json({ error: 'Não foi possível buscar o aparelho.' });
  }
});

// ROTA 'UPDATE': Atualizar um aparelho por ID. (PROTEGIDA - ADMIN)
app.put('/api/rooms/:id', authenticateToken, isAdmin, async (req, res) => {
  const { id } = req.params;
  const { name, room } = req.body;

  if (!name || !room) {
    return res.status(400).json({ error: 'Nome e sala são obrigatórios.' });
  }

  try {
    // Log para depuração em ambiente dev
    console.log('[rooms:update] user=', req.user && { id: req.user.userId, email: req.user.email, role: req.user.role });
    console.log('[rooms:update] body=', { name, room });
    const updatedAC = await prisma.airConditioner.update({
      where: { id },
      data: { name, room },
    });
    res.status(200).json(updatedAC);
  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Aparelho não encontrado.' });
    }
    res.status(500).json({ error: 'Não foi possível atualizar o aparelho.' });
  }
});

// Rota útil para debug: retorna dados do usuário a partir do token
app.get('/auth/me', authenticateToken, (req, res) => {
  // Não retorna dados sensíveis
  res.json({ userId: req.user.userId, email: req.user.email, role: req.user.role });
});

// ROTA 'DELETE': Deletar um aparelho por ID. (PROTEGIDA - ADMIN)
app.delete('/api/rooms/:id', authenticateToken, isAdmin, async (req, res) => {
  const { id } = req.params;
  try {
    await prisma.airConditioner.delete({
      where: { id },
    });
    res.status(204).send();
  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Aparelho não encontrado.' });
    }
    res.status(500).json({ error: 'Não foi possível deletar o aparelho.' });
  }
});

// ==========================================================
// OUTRAS ROTAS PROTEGIDAS
// ==========================================================

// ROTA: Enviar um comando para um ar-condicionado específico. (PROTEGIDA - AUTENTICADO)
app.post('/api/command', authenticateToken, async (req, res) => {
  const { deviceId, command } = req.body;

  if (!deviceId || !command) {
    return res.status(400).json({ error: 'deviceId e command são obrigatórios.' });
  }

  try {
    await prisma.airConditioner.update({
      where: { deviceId },
      data: { pendingCommand: command },
    });
    res.status(200).json({ message: `Comando '${command}' enfileirado para o dispositivo ${deviceId}.` });
  } catch (error) {
    res.status(404).json({ error: 'Dispositivo não encontrado.' });
  }
});

// --- ROTAS CRUD PARA AGENDAMENTOS ---

// ROTA: Alterar setpoint de temperatura. (PROTEGIDA - AUTENTICADO)
app.post('/api/ac/:id/setpoint', authenticateToken, async (req, res) => {
  const { id } = req.params;
  const { setpoint } = req.body;

  if (setpoint === undefined || setpoint === null) {
    return res.status(400).json({ error: 'Setpoint é obrigatório.' });
  }

  const tempSetpoint = parseFloat(setpoint);
  
  if (isNaN(tempSetpoint) || tempSetpoint < 16 || tempSetpoint > 30) {
    return res.status(400).json({ error: 'Setpoint deve ser um número entre 16 e 30.' });
  }

  try {
    const ac = await prisma.airConditioner.findUnique({
      where: { id },
    });

    if (!ac) {
      return res.status(404).json({ error: 'Aparelho não encontrado.' });
    }

    // Cria comando para o firmware ajustar a temperatura
    const command = `set_temp:${tempSetpoint}`;

    const updatedAC = await prisma.airConditioner.update({
      where: { id },
      data: {
        setpoint: tempSetpoint,
        pendingCommand: command,
      },
    });

    res.status(200).json({
      message: `Setpoint alterado para ${tempSetpoint}°C`,
      setpoint: updatedAC.setpoint,
      pendingCommand: updatedAC.pendingCommand,
    });
  } catch (error) {
    console.error('Erro ao atualizar setpoint:', error);
    res.status(500).json({ error: 'Não foi possível atualizar o setpoint.' });
  }
});

// ROTA 'CREATE': Criar um novo agendamento
app.post('/api/schedules', authenticateToken, async (req, res) => {
  const { airConditionerId, action, scheduledAt, isRecurring, recurringTime } = req.body;
  try {
    // Validação básica
    if (!airConditionerId || !action) {
      return res.status(400).json({ error: 'airConditionerId e action são obrigatórios.' });
    }

    // Se não for recorrente, scheduledAt é obrigatório
    if (!isRecurring && !scheduledAt) {
      return res.status(400).json({ error: 'scheduledAt é obrigatório para agendamentos únicos.' });
    }

    // Se for recorrente, recurringTime é obrigatório
    if (isRecurring && !recurringTime) {
      return res.status(400).json({ error: 'recurringTime é obrigatório para agendamentos recorrentes.' });
    }

    const newSchedule = await prisma.schedule.create({
      data: {
        airConditionerId,
        action,
        scheduledAt: !isRecurring ? new Date(scheduledAt) : null,
        isRecurring: Boolean(isRecurring),
        recurringTime: isRecurring ? recurringTime : null,
      },
      include: {
        airConditioner: {
          select: { name: true, room: true },
        },
      },
    });
    res.status(201).json(newSchedule);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Não foi possível criar o agendamento.' });
  }
});

// ROTA 'READ': Listar agendamentos pendentes
app.get('/api/schedules', authenticateToken, async (req, res) => {
  try {
    const schedules = await prisma.schedule.findMany({
      where: { status: 'PENDENTE' },
      orderBy: [
        { isRecurring: 'desc' }, // Recorrentes primeiro
        { scheduledAt: 'asc' },  // Depois ordena por data (nulls last)
      ],
      include: {
        airConditioner: {
          select: { name: true, room: true },
        },
      },
    });
    res.status(200).json(schedules);
  } catch (error) {
    console.error('[schedules:get] erro ao buscar agendamentos:', error && error.stack ? error.stack : error);
    res.status(500).json({ error: 'Não foi possível buscar os agendamentos.' });
  }
});

// ROTA 'DELETE': Deletar um agendamento
app.delete('/api/schedules/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;
  try {
    await prisma.schedule.delete({ where: { id } });
    res.status(204).send();
  } catch (error) {
    console.error(error);
    res.status(404).json({ error: 'Agendamento não encontrado.' });
  }
});


// ==========================================================
// ROTA PÚBLICA PARA OS ESP32s (DISPOSITIVOS IoT)
// ==========================================================
app.post('/api/heartbeat', async (req, res) => {
  const { deviceId, status, isOn, temperature, humidity, setpoint } = req.body;

  const normalizedStatus = status ?? (typeof isOn === 'boolean' ? (isOn ? 'ligado' : 'desligado') : null);

  if (!deviceId || !normalizedStatus) {
    return res.status(400).json({ error: 'deviceId e status são obrigatórios.' });
  }

  try {
    let ac = await prisma.airConditioner.findUnique({
      where: { deviceId },
    });

    if (!ac) {
      ac = await prisma.airConditioner.create({
        data: {
          deviceId,
          name: `AC ${deviceId.slice(-6).toUpperCase()}`,
          room: 'Não configurada',
          status: normalizedStatus,
          temperature,
          humidity,
          setpoint: typeof setpoint === 'number' ? setpoint : 22,
          lastHeartbeat: new Date(),
        },
      });
    }

    await prisma.airConditioner.update({
      where: { deviceId },
      data: {
        status: normalizedStatus,
        temperature,
        humidity,
        setpoint: typeof setpoint === 'number' ? setpoint : undefined,
        lastHeartbeat: new Date(),
        pendingCommand: null,
      },
    });

    res.status(200).json({
      command: ac.pendingCommand || 'none',
    });

  } catch (error) {
    res.status(500).json({ error: 'Erro interno no servidor.', command: 'reboot' });
  }
});

// ==========================================================
// ROTAS PARA DESCOBERTA E CONFIGURAÇÃO DE ESPs
// ==========================================================

function isPrivateIPv4(ip) {
  if (!ip || typeof ip !== 'string') return false;
  if (ip.startsWith('10.')) return true;
  if (ip.startsWith('192.168.')) return true;

  const parts = ip.split('.').map((p) => parseInt(p, 10));
  if (parts.length !== 4 || parts.some((n) => Number.isNaN(n))) return false;
  return parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31;
}

function getLocalSubnetPrefixes() {
  const interfaces = os.networkInterfaces();
  const prefixes = new Set();

  Object.values(interfaces).forEach((entries) => {
    (entries || []).forEach((entry) => {
      if (!entry || entry.family !== 'IPv4' || entry.internal || !isPrivateIPv4(entry.address)) {
        return;
      }

      const octets = entry.address.split('.');
      if (octets.length === 4) {
        prefixes.add(`${octets[0]}.${octets[1]}.${octets[2]}`);
      }
    });
  });

  return [...prefixes];
}

function buildDiscoveryIpList() {
  const ips = new Set();

  for (let i = 1; i <= 10; i++) {
    ips.add(`192.168.4.${i}`);
  }

  const localPrefixes = getLocalSubnetPrefixes();
  localPrefixes.forEach((prefix) => {
    for (let i = 1; i <= 254; i++) {
      ips.add(`${prefix}.${i}`);
    }
  });

  return [...ips];
}

async function discoverEspFromIp(ip) {
  try {
    const response = await axios.get(`http://${ip}/wifi/status`, { timeout: 1200 });
    const data = response.data || {};

    if (!data.deviceId) {
      return null;
    }

    return {
      deviceId: data.deviceId,
      ip,
      ssid: data.ssid || 'Not configured',
      connected: Boolean(data.connected),
      apName: `AC-SETUP-${String(data.deviceId).slice(-6).toUpperCase()}`,
    };
  } catch (_) {
    return null;
  }
}

async function scanIpsWithConcurrency(ips, concurrency = 30) {
  const found = [];
  let index = 0;

  async function worker() {
    while (true) {
      const current = index;
      index += 1;
      if (current >= ips.length) break;

      const result = await discoverEspFromIp(ips[current]);
      if (result) {
        found.push(result);
      }
    }
  }

  const workers = [];
  for (let i = 0; i < concurrency; i++) {
    workers.push(worker());
  }

  await Promise.all(workers);
  return found;
}

// Endpoint para procurar ESPs disponíveis na rede local (não configurados)
app.get('/api/esp/discover', async (req, res) => {
  try {
    const ips = buildDiscoveryIpList();
    const discovered = await scanIpsWithConcurrency(ips, 30);

    const uniqueByDevice = new Map();
    discovered.forEach((esp) => {
      uniqueByDevice.set(esp.deviceId, esp);
    });

    const foundESPs = [...uniqueByDevice.values()];
    
    res.json({ 
      success: true, 
      espList: foundESPs,
      message: foundESPs.length > 0 ? `${foundESPs.length} ESP(s) encontrado(s)` : 'Nenhum ESP encontrado'
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: 'Erro ao procurar ESPs',
      details: error.message 
    });
  }
});

// Endpoint para configurar WiFi de um ESP específico
app.post('/api/esp/configure', async (req, res) => {
  const { espIp, ssid, password } = req.body;
  
  if (!espIp || !ssid || !password) {
    return res.status(400).json({ error: 'espIp, ssid e password são obrigatórios' });
  }
  
  try {
    // Relaja uma requisição para o AP do ESP com as credenciais WiFi
    const response = await axios.post(
      `http://${espIp}/wifi/configure`,
      { ssid, password },
      { timeout: 5000 }
    );
    
    res.json({ 
      success: true, 
      message: 'Configuração enviada. O ESP vai reiniciar em alguns segundos.',
      espResponse: response.data
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: 'Erro ao configurar WiFi no ESP',
      details: error.message
    });
  }
});

// Endpoint alternativo para obter redes WiFi disponíveis de um ESP
app.get('/api/esp/:ip/networks', async (req, res) => {
  const { ip } = req.params;
  
  try {
    const response = await axios.get(`http://${ip}/wifi/networks`, { timeout: 5000 });
    const payload = response.data;
    const networks = Array.isArray(payload) ? payload : (Array.isArray(payload?.networks) ? payload.networks : []);

    res.json({ 
      success: true, 
      networks
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: 'Erro ao obter redes disponíveis',
      details: error.message
    });
  }
});

// Inicialização segura: valida variáveis e conecta ao banco antes de iniciar o servidor
const init = async () => {
  // Verifica variáveis essenciais
  if (!process.env.JWT_SECRET || process.env.JWT_SECRET.includes('<')) {
    if (process.env.NODE_ENV === 'production') {
      console.error('Falta JWT_SECRET válido no ambiente. Configure JWT_SECRET antes de iniciar.');
      process.exit(1);
    }

    process.env.JWT_SECRET = 'dev-local-jwt-secret';
    console.warn('JWT_SECRET ausente/inválido. Usando segredo padrão de desenvolvimento (NÃO usar em produção).');
  }

  try {
    console.log('Conectando ao banco de dados...');
    // Mostrar uma versão mascarada da DATABASE_URL para ajudar no diagnóstico (não exibe senha)
    try {
      const raw = process.env.DATABASE_URL || '';
      const masked = raw.replace(/(postgresql:\/\/[^:]+:)([^@]+)(@)/, '$1***$3');
      console.log('DATABASE_URL preview:', masked);

      // Tenta parsear a URL para detectar portas inválidas antes do Prisma
      try {
        const parsed = new URL(raw);
        if (parsed.port && Number.isNaN(Number(parsed.port))) {
          console.error('O valor da porta na DATABASE_URL não é numérico:', parsed.port);
        }
      } catch (parseErr) {
        // Se new URL falhar, registra uma mensagem útil
        console.warn('Aviso: não foi possível parsear a DATABASE_URL com URL(), pode não seguir o formato URL padrão. Detalhes:', parseErr && parseErr.message ? parseErr.message : parseErr);
      }

    } catch (maskErr) {
      console.warn('Erro ao mascarar DATABASE_URL para debug:', maskErr);
    }

    await prisma.$connect();
    console.log('Conectado ao banco com sucesso.');
  } catch (err) {
    console.error('Falha ao conectar ao banco de dados:', err && err.stack ? err.stack : err);
    process.exit(1);
  }

  app.listen(PORT, () => {
    console.log(`🚀 Servidor rodando em http://localhost:${PORT}`);
  });

  // Executa o executor após a conexão bem-sucedida
  try {
    await executePendingSchedules();
  } catch (err) {
    console.error('Erro ao executar agendamentos iniciais:', err && err.stack ? err.stack : err);
  }
  setInterval(executePendingSchedules, 30 * 1000);
};

// Inicia o processo de inicialização
init();

// Handlers globais para capturar erros não tratados e rejeições de promise
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception thrown:', err && err.stack ? err.stack : err);
  // Opcional: fechar o processo ou notificar
});

// ==========================================================
// EXECUTOR DE AGENDAMENTOS (RODA A CADA 30s)
// ==========================================================
const executePendingSchedules = async () => {
  try {
    const now = new Date();
    console.log('🕒 [executor] now =', now.toISOString());
    const pending = await prisma.schedule.findMany({
      where: {
        status: 'PENDENTE',
        scheduledAt: {
          lte: now,
        },
      },
      orderBy: { scheduledAt: 'asc' },
    });

    console.log(`🕒 [executor] found ${pending.length} pending schedules`);

    if (!pending || pending.length === 0) return;

    for (const s of pending) {
      try {
        console.log(`🕒 [executor] processing schedule id=${s.id} scheduledAt=${s.scheduledAt ? new Date(s.scheduledAt).toISOString() : s.scheduledAt}`);
        // Determina o comando a enviar para o AC (string em português, compatível com pendingCommand existente)
        const command = s.action === 'LIGAR' ? 'ligar' : 'desligar';

        // Faz a atualização em transação: marca schedule como EXECUTADO e seta pendingCommand no AC
        await prisma.$transaction([
          prisma.schedule.update({ where: { id: s.id }, data: { status: 'EXECUTADO' } }),
          prisma.airConditioner.update({ where: { id: s.airConditionerId }, data: { pendingCommand: command } }),
        ]);

        console.log(`⏱️ Executado agendamento ${s.id} -> dispositivo ${s.airConditionerId} comando=${command}`);
      } catch (innerErr) {
        console.error('Erro ao processar agendamento', s.id, innerErr);
        // Opcional: continuar com os próximos
      }
    }
  } catch (err) {
    console.error('Erro ao buscar/agendar schedules:', err);
  }
};

// Executa uma vez na inicialização e depois a cada 30 segundos
executePendingSchedules();
setInterval(executePendingSchedules, 30 * 1000);