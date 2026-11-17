const { PrismaClient } = require('./backend/node_modules/@prisma/client');
const prisma = new PrismaClient({ datasources: { db: { url: 'file:./backend/prisma/dev.db' } } });
async function run() {
  const students = await prisma.user.findMany({ where: { role: 'STUDENT' }, select: { id: true, name: true, email: true, sectionId: true } });
  console.log('Students:', students);
  const slots = await prisma.slot.findMany({ take: 3, include: { subject: true, faculty: true } });
  console.log('Slots:', slots);
  const sessions = await prisma.attendanceSession.findMany({ where: { status: 'OPEN' } });
  console.log('Open sessions:', sessions);
}
run().then(() => prisma.$disconnect());
