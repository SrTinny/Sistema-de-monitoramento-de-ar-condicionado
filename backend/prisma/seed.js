// backend/prisma/seed.js
require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const cuid = require('cuid');

const prisma = new PrismaClient();

async function main() {
  console.log('Iniciando seed...');

  // Proteção: não rodar seed automaticamente em produção
  if (process.env.NODE_ENV === 'production') {
    console.log('NODE_ENV=production — abortando seed por segurança.');
    return;
  }

  // Senhas para desenvolvimento (pode ser sobrescrito via env)
  const adminEmail = process.env.SEED_ADMIN_EMAIL || 'admin@local';
  // Para facilitar o desenvolvimento solicitou-se senha padrão '123456'
  const adminPassword = process.env.SEED_ADMIN_PASSWORD || '123456';
  const userEmail = process.env.SEED_USER_EMAIL || 'user@local';
  const userPassword = process.env.SEED_USER_PASSWORD || '123456';

  // Usuário admin (upsert — cria ou atualiza a senha)
  const hashedAdmin = await bcrypt.hash(adminPassword, 10);
  await prisma.user.upsert({
    where: { email: adminEmail },
    update: { password: hashedAdmin, role: 'ADMIN' },
    create: { email: adminEmail, password: hashedAdmin, role: 'ADMIN' },
  });
  console.log('Usuário admin criado/atualizado:', adminEmail);

  // Usuário padrão (upsert)
  const hashedUser = await bcrypt.hash(userPassword, 10);
  await prisma.user.upsert({
    where: { email: userEmail },
    update: { password: hashedUser, role: 'USER' },
    create: { email: userEmail, password: hashedUser, role: 'USER' },
  });
  console.log('Usuário padrão criado/atualizado:', userEmail);

  // Garante que uma lista fixa de aparelhos exista (upsert por deviceId determinístico)
  const desiredRooms = [
    'Sala 101',
    'Sala 102',
    'Laboratório A',
    'Escritório 1',
    'Sala dos Professores',
    'Sala de Reuniões',
  ];

  for (const rn of desiredRooms) {
    // deviceId determinístico baseado no nome da sala (sem espaços)
    const deviceId = `ESP32-${rn.replace(/\s+/g, '-').replace(/[^a-zA-Z0-9-]/g, '')}`;
    const existing = await prisma.airConditioner.findUnique({ where: { deviceId } });
    if (!existing) {
      const created = await prisma.airConditioner.create({
        data: {
          deviceId,
          name: `Ar Condicionado - ${rn}`,
          room: rn,
          status: 'offline',
        },
      });
      console.log('Criado AC:', created.deviceId, created.name);
    } else {
      // Atualiza metadados caso necessário
      await prisma.airConditioner.update({
        where: { deviceId },
        data: { name: `Ar Condicionado - ${rn}`, room: rn },
      });
      console.log('Atualizado AC existente:', deviceId);
    }
  }

  // Cria alguns agendamentos de teste (caso não existam)
  const allACs = await prisma.airConditioner.findMany({ orderBy: { createdAt: 'asc' } });
  if (allACs && allACs.length > 0) {
    const now = Date.now();
    for (let i = 0; i < Math.min(3, allACs.length); i++) {
      const ac = allACs[i];
      const scheduledAt = new Date(now + (i + 1) * 60 * 1000); // 1min, 2min, 3min
      const exists = await prisma.schedule.findFirst({ where: { airConditionerId: ac.id, scheduledAt } });
      if (!exists) {
        const schedule = await prisma.schedule.create({
          data: {
            airConditionerId: ac.id,
            action: i % 2 === 0 ? 'DESLIGAR' : 'LIGAR',
            scheduledAt,
          },
        });
        console.log('Agendamento de teste criado:', schedule.id, 'para', ac.deviceId, scheduledAt.toISOString());
      }
    }
  }

  console.log('\nSeed finalizado.');
  console.log('Credenciais geradas (dev):');
  console.log(`  ADMIN -> ${adminEmail} / ${adminPassword}`);
  console.log(`  USER  -> ${userEmail} / ${userPassword}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
