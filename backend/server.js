// backend/server.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { PrismaClient } = require('@prisma/client');
const { cuid } = require('@prisma/client/runtime/library'); // Import para gerar IDs

const app = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 3001;

// Middlewares
app.use(cors());
app.use(express.json());

// ==========================================================
// ROTAS PARA O FRONTEND (PAINEL DE ADMINISTRAÇÃO)
// ==========================================================

// ROTA 1: Cadastrar uma nova sala/ar-condicionado.
// O frontend envia apenas o nome e a sala, e nós geramos o deviceId.
app.post('/api/rooms', async (req, res) => {
  const { name, room } = req.body;

  if (!name || !room) {
    return res.status(400).json({ error: 'Nome e sala são obrigatórios.' });
  }

  try {
    // Gera um ID único e fácil de ler para o dispositivo
    const deviceId = `ESP32-${room.replace(/\s+/g, '-')}-${cuid().slice(-6)}`;

    const newAC = await prisma.airConditioner.create({
      data: {
        deviceId, // Nosso ID gerado
        name,
        room,
      },
    });
    // Retornamos o objeto completo, incluindo o deviceId que deve ser gravado no ESP32
    res.status(201).json(newAC);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Não foi possível cadastrar a sala.' });
  }
});

// ROTA 2: Listar todos os aparelhos cadastrados.
app.get('/api/rooms', async (req, res) => {
  try {
    const allACs = await prisma.airConditioner.findMany({
      orderBy: { createdAt: 'desc' },
    });
    res.status(200).json(allACs);
  } catch (error) {
    res.status(500).json({ error: 'Não foi possível buscar as salas.' });
  }
});

// ROTA 3: Enviar um comando para um ar-condicionado específico.
// O frontend diz "quero que o dispositivo X execute o comando Y".
app.post('/api/command', async (req, res) => {
  const { deviceId, command } = req.body; // ex: { "deviceId": "ESP32-SALA101-...", "command": "ligar" }

  if (!deviceId || !command) {
    return res.status(400).json({ error: 'deviceId e command são obrigatórios.' });
  }

  try {
    // Apenas atualizamos o campo 'pendingCommand' no banco de dados.
    // O ESP32 vai pegar esse comando na próxima vez que ele se comunicar.
    await prisma.airConditioner.update({
      where: { deviceId },
      data: { pendingCommand: command },
    });
    res.status(200).json({ message: `Comando '${command}' enfileirado para o dispositivo ${deviceId}.` });
  } catch (error) {
    res.status(404).json({ error: 'Dispositivo não encontrado.' });
  }
});

// ==========================================================
// ROTA PARA OS ESP32s (DISPOSITIVOS IoT)
// ==========================================================

// ROTA 4: O "Heartbeat" do ESP32.
// O ESP32 chama essa rota a cada X segundos para reportar seu estado e pegar comandos.
app.post('/api/heartbeat', async (req, res) => {
  const { deviceId, status, temperature, humidity } = req.body;

  if (!deviceId || !status) {
    return res.status(400).json({ error: 'deviceId e status são obrigatórios.' });
  }

  try {
    // 1. Atualiza os dados do dispositivo com as informações recebidas
    const updatedAC = await prisma.airConditioner.update({
      where: { deviceId },
      data: {
        status,
        temperature,
        humidity,
        // Limpamos o comando pendente, pois o ESP vai executá-lo agora
        pendingCommand: null,
      },
    });

    // 2. Responde ao ESP32 com o comando que estava pendente (se houver)
    res.status(200).json({
      command: updatedAC.pendingCommand || 'none',
    });

  } catch (error) {
    // Se o deviceId não for encontrado, o ESP está desconfigurado ou não foi cadastrado.
    res.status(404).json({ error: 'Dispositivo não registrado.', command: 'reboot' });
  }
});


// Inicia o servidor
app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando em http://localhost:${PORT}`);
});