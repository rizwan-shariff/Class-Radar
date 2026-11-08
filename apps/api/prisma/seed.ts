import bcrypt from 'bcrypt';
import { PrismaClient, Role, RoomType } from '@prisma/client';

const prisma = new PrismaClient();
const DEMO_PASSWORD = 'classradar123';

const departments = ['CSE', 'ECE', 'MECH'];

const getOrCreateSection = async (name: string, department: string, semester: number) => {
  const existing = await prisma.section.findFirst({ where: { name, department, semester } });
  return existing ?? prisma.section.create({ data: { name, department, semester } });
};

const main = async (): Promise<void> => {
  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 10);
  const sections = await Promise.all(
    departments.map((department, index) =>
      getOrCreateSection(`${department}-A`, department, index + 1),
    ),
  );

  const admin = await prisma.user.upsert({
    where: { email: 'admin@classradar.demo' },
    update: { name: 'ClassRadar Admin', passwordHash, role: Role.ADMIN, department: 'ADMIN', sectionId: null },
    create: {
      name: 'ClassRadar Admin',
      email: 'admin@classradar.demo',
      passwordHash,
      role: Role.ADMIN,
      department: 'ADMIN',
    },
  });

  const faculty = [];
  for (let index = 0; index < 15; index += 1) {
    const department = departments[index % departments.length]!;
    faculty.push(
      await prisma.user.upsert({
        where: { email: `faculty${index + 1}@classradar.demo` },
        update: {
          name: `Faculty ${index + 1}`,
          passwordHash,
          role: Role.FACULTY,
          department,
          sectionId: null,
        },
        create: {
          name: `Faculty ${index + 1}`,
          email: `faculty${index + 1}@classradar.demo`,
          passwordHash,
          role: Role.FACULTY,
          department,
        },
      }),
    );
  }

  for (let index = 0; index < 12; index += 1) {
    await prisma.subject.upsert({
      where: { code: `SUB${String(index + 1).padStart(2, '0')}` },
      update: { name: `Demo Subject ${index + 1}` },
      create: {
        code: `SUB${String(index + 1).padStart(2, '0')}`,
        name: `Demo Subject ${index + 1}`,
      },
    });
  }

  for (let index = 0; index < 12; index += 1) {
    await prisma.room.upsert({
      where: { name: `Room ${101 + index}` },
      update: {
        type: index < 8 ? RoomType.CLASSROOM : RoomType.LAB,
        capacity: index < 8 ? 60 + index * 5 : 30 + index * 5,
      },
      create: {
        name: `Room ${101 + index}`,
        type: index < 8 ? RoomType.CLASSROOM : RoomType.LAB,
        capacity: index < 8 ? 60 + index * 5 : 30 + index * 5,
      },
    });
  }

  for (let index = 0; index < 60; index += 1) {
    const section = sections[index % sections.length]!;
    await prisma.user.upsert({
      where: { email: `student${index + 1}@classradar.demo` },
      update: {
        name: `Student ${index + 1}`,
        passwordHash,
        role: Role.STUDENT,
        department: section.department,
        sectionId: section.id,
      },
      create: {
        name: `Student ${index + 1}`,
        email: `student${index + 1}@classradar.demo`,
        passwordHash,
        role: Role.STUDENT,
        department: section.department,
        sectionId: section.id,
      },
    });
  }

  console.log('ClassRadar demo credentials');
  console.log(`Admin: admin@classradar.demo / ${DEMO_PASSWORD}`);
  console.log(`Faculty: faculty1@classradar.demo / ${DEMO_PASSWORD}`);
  console.log(`Student: student1@classradar.demo / ${DEMO_PASSWORD}`);
  console.log(`Created or updated admin ${admin.email}, ${faculty.length} faculty, 12 subjects, 12 rooms, 3 sections, and 60 students.`);
};

main()
  .catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
