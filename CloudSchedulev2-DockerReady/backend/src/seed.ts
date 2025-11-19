import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // Create seed users
  const hashedPassword = await bcrypt.hash('123', 10);

  const instructor = await prisma.user.upsert({
    where: { email: 'instructor@fau.edu' },
    update: {},
    create: {
      email: 'instructor@fau.edu',
      password: hashedPassword,
      displayName: 'Dr. FAU Instructor',
      role: 'INSTRUCTOR'
    }
  });

  const student = await prisma.user.upsert({
    where: { email: 'student@fau.edu' },
    update: {},
    create: {
      email: 'student@fau.edu',
      password: hashedPassword,
      displayName: 'FAU Student',
      role: 'STUDENT'
    }
  });

  console.log('Seeded users:', { instructor: instructor.email, student: student.email });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

