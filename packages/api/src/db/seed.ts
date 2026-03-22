import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const password = await bcrypt.hash('organize123', 10);

  const users = [
    { username: 'user1', name: 'User 1', color: '#3B82F6', password, role: 'admin' },
    { username: 'user2', name: 'User 2', color: '#EF4444', password, role: 'admin' },
    { username: 'user3', name: 'User 3', color: '#10B981', password, role: 'member' },
    { username: 'user4', name: 'User 4', color: '#F59E0B', password, role: 'member' },
  ];

  for (const user of users) {
    await prisma.user.upsert({
      where: { username: user.username },
      update: {},
      create: user,
    });
  }

  console.log('Seeded 4 users');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
