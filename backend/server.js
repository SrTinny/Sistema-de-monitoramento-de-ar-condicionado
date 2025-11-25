// backend/server.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');
const cuid = require('cuid');

const app = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 3001;

// Middlewares
app.use(cors());
app.use(express.json());

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

// ROTA 'CREATE': Criar um novo agendamento
app.post('/api/schedules', authenticateToken, async (req, res) => {
  const { airConditionerId, action, scheduledAt } = req.body;
  try {
    const newSchedule = await prisma.schedule.create({
      data: {
        airConditionerId,
        action,
        scheduledAt: new Date(scheduledAt),
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
      orderBy: { scheduledAt: 'asc' },
      include: {
        airConditioner: { // Inclui o nome e a sala para exibição no frontend
          select: { name: true, room: true },
        },
      },
    });
    res.status(200).json(schedules);
  } catch (error) {
    console.error(error);
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
  const { deviceId, status, temperature, humidity } = req.body;

  if (!deviceId || !status) {
    return res.status(400).json({ error: 'deviceId e status são obrigatórios.' });
  }

  try {
    const ac = await prisma.airConditioner.findUnique({
      where: { deviceId },
    });

    if (!ac) {
      return res.status(404).json({ error: 'Dispositivo não registrado.', command: 'reboot' });
    }

    const updatedAC = await prisma.airConditioner.update({
      where: { deviceId },
      data: {
        status,
        temperature,
        humidity,
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

// Inicia o servidor
app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando em http://localhost:${PORT}`);
});

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