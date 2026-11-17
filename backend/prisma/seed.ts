import bcrypt from 'bcrypt';
import { PrismaClient } from '@prisma/client';

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
      getOrCreateSection(`${department}-3A`, department, index + 1),
    ),
  );

  // 1. Admin account (support both demo and standard institution domains)
  const adminEmails = ['admin@classradar.edu', 'admin@classradar.demo'];
  for (const email of adminEmails) {
    await prisma.user.upsert({
      where: { email },
      update: { name: 'ClassRadar Administrator', passwordHash, role: 'ADMIN', department: 'Academic Affairs', sectionId: null },
      create: {
        name: 'ClassRadar Administrator',
        email,
        passwordHash,
        role: 'ADMIN',
        department: 'Academic Affairs',
      },
    });
  }

  // 2. Faculty accounts
  const facultyList = [
    { name: 'Dr. Alan Vance', email: 'faculty1@classradar.edu', dept: 'CSE' },
    { name: 'Prof. Rajesh Kumar', email: 'faculty1@classradar.demo', dept: 'CSE' },
    { name: 'Prof. Ananya Rao', email: 'faculty2@classradar.edu', dept: 'CSE' },
    { name: 'Dr. Vikram Patel', email: 'faculty3@classradar.edu', dept: 'CSE' },
    { name: 'Dr. Elena Rostova', email: 'faculty4@classradar.edu', dept: 'CSE' },
    { name: 'Prof. Marcus Sterling', email: 'faculty5@classradar.edu', dept: 'ECE' },
  ];

  const createdFaculty = [];
  for (const f of facultyList) {
    createdFaculty.push(
      await prisma.user.upsert({
        where: { email: f.email },
        update: { name: f.name, passwordHash, role: 'FACULTY', department: f.dept, sectionId: null },
        create: { name: f.name, email: f.email, passwordHash, role: 'FACULTY', department: f.dept },
      }),
    );
  }

  // 3. Subjects
  const subjectsData = [
    { code: 'CS301', name: 'Design & Analysis of Algorithms' },
    { code: 'CS402', name: 'Advanced Distributed Systems' },
    { code: 'CS410', name: 'Computer Networks & Security' },
    { code: 'CS580', name: 'Human-Computer Interaction' },
    { code: 'CS590', name: 'Distributed Machine Learning' },
    { code: 'MATH201', name: 'Linear Algebra & Discrete Math' },
    { code: 'PHYS310', name: 'Quantum Information Lab' },
    { code: 'ARCH304', name: 'Spatial Systems & Architecture' },
  ];

  const createdSubjects = [];
  for (const s of subjectsData) {
    createdSubjects.push(
      await prisma.subject.upsert({
        where: { code: s.code },
        update: { name: s.name },
        create: { code: s.code, name: s.name },
      }),
    );
  }

  // 4. Rooms
  const roomsData = [
    { name: 'Turing Hall 302', type: 'CLASSROOM', capacity: 120 },
    { name: 'Turing Hall 304B', type: 'CLASSROOM', capacity: 70 },
    { name: 'Euler Lab 2', type: 'LAB', capacity: 45 },
    { name: 'Tesla Net-Lab 104', type: 'LAB', capacity: 60 },
    { name: 'Glass Pavilion 12', type: 'CLASSROOM', capacity: 35 },
    { name: 'Lecture Hall C-10', type: 'CLASSROOM', capacity: 250 },
    { name: 'Maxwell Annex 204', type: 'CLASSROOM', capacity: 60 },
    { name: 'Tesla Hall 509', type: 'CLASSROOM', capacity: 90 },
  ];

  const createdRooms = [];
  for (const r of roomsData) {
    createdRooms.push(
      await prisma.room.upsert({
        where: { name: r.name },
        update: { type: r.type, capacity: r.capacity },
        create: { name: r.name, type: r.type, capacity: r.capacity },
      }),
    );
  }

  // 5. Students
  const primarySection = sections[0]!;
  const studentEmails = [
    { email: 'student1@classradar.edu', name: 'Aarav Sharma' },
    { email: 'student1@classradar.demo', name: 'Student 1' },
    { email: 'student2@classradar.edu', name: 'Marcus Vance Jr.' },
    { email: 'student3@classradar.edu', name: 'Chloe Zhao' },
    { email: 'student4@classradar.edu', name: 'David Sterling' },
    { email: 'student5@classradar.edu', name: 'Elena Novak' },
  ];

  for (const st of studentEmails) {
    await prisma.user.upsert({
      where: { email: st.email },
      update: {
        name: st.name,
        passwordHash,
        role: 'STUDENT',
        department: primarySection.department,
        sectionId: primarySection.id,
      },
      create: {
        name: st.name,
        email: st.email,
        passwordHash,
        role: 'STUDENT',
        department: primarySection.department,
        sectionId: primarySection.id,
      },
    });
  }

  // 6. Timetable Slots (Monday to Friday, periods 1 through 5)
  for (let weekday = 1; weekday <= 5; weekday++) {
    for (let period = 1; period <= 4; period++) {
      const subjectIndex = (weekday + period) % createdSubjects.length;
      const facultyIndex = (period) % createdFaculty.length;
      const roomIndex = (weekday + period) % createdRooms.length;

      const sub = createdSubjects[subjectIndex]!;
      const fac = createdFaculty[facultyIndex]!;
      const rm = createdRooms[roomIndex]!;

      await prisma.slot.upsert({
        where: {
          sectionId_weekday_period: {
            sectionId: primarySection.id,
            weekday,
            period,
          },
        },
        update: {
          subjectId: sub.id,
          facultyId: fac.id,
          roomId: rm.id,
        },
        create: {
          sectionId: primarySection.id,
          weekday,
          period,
          subjectId: sub.id,
          facultyId: fac.id,
          roomId: rm.id,
        },
      });
    }
  }

  console.log('✅ Real SQL Database Seeded successfully!');
  console.log('Credentials:');
  console.log('  Admin:   admin@classradar.edu   / classradar123');
  console.log('  Faculty: faculty1@classradar.edu / classradar123');
  console.log('  Student: student1@classradar.edu / classradar123');
};

main()
  .catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
