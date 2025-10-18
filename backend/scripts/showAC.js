const { PrismaClient } = require('@prisma/client');
(async function() {
  const prisma = new PrismaClient();
  try {
    const ac = await prisma.airConditioner.findUnique({ where: { id: 'cmgvlgm1n0005fvak5gf4lkz2' } });
    console.log(JSON.stringify(ac, null, 2));
  } catch (e) {
    console.error(e);
  } finally {
    await prisma.$disconnect();
  }
})();
