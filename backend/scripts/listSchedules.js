const { PrismaClient } = require('@prisma/client');
(async function() {
  const prisma = new PrismaClient();
  try {
    const s = await prisma.schedule.findMany({ orderBy: { createdAt: 'desc' }, take: 20 });
    console.log(JSON.stringify(s, null, 2));
  } catch (e) {
    console.error(e);
  } finally {
    await prisma.$disconnect();
  }
})();
