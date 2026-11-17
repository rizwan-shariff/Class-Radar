import bcrypt from 'bcrypt';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const DEMO_PASSWORD = 'classradar123';

const main = async (): Promise<void> => {
  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 10);

  console.log('🧹 Purging all existing timetable, slots, bookings, sessions, and attendance...');
  // Delete child records first to respect foreign key constraints
  await prisma.attendanceRecord.deleteMany();
  await prisma.attendanceSession.deleteMany();
  await prisma.substitution.deleteMany();
  await prisma.absence.deleteMany();
  await prisma.roomBooking.deleteMany();
  await prisma.slot.deleteMany();
  await prisma.user.deleteMany();
  await prisma.subject.deleteMany();
  await prisma.room.deleteMany();
  await prisma.section.deleteMany();

  console.log('🏛️ Creating official Section (Sem III, Sec F, Room 406)...');
  const section = await prisma.section.create({
    data: {
      name: 'CSE-3F',
      department: 'CSE',
      semester: 3,
    },
  });

  console.log('🏫 Creating Rooms...');
  const roomsData = [
    { name: 'Room 406', type: 'CLASSROOM', capacity: 70 },
    { name: 'CS Lab 7 (DDCO)', type: 'LAB', capacity: 40 },
    { name: 'IS Lab 8', type: 'LAB', capacity: 40 },
    { name: 'IS Lab 2 (CDD/DSA)', type: 'LAB', capacity: 40 },
    { name: 'CS Lab 5 (DAV)', type: 'LAB', capacity: 40 },
    { name: 'CS Lab 4', type: 'LAB', capacity: 40 },
    { name: 'Turing Hall 302', type: 'CLASSROOM', capacity: 120 },
    { name: 'Seminar Hall B', type: 'CLASSROOM', capacity: 150 },
  ];

  const roomsMap = new Map<string, string>();
  for (const r of roomsData) {
    const created = await prisma.room.create({
      data: { name: r.name, type: r.type, capacity: r.capacity },
    });
    roomsMap.set(r.name, created.id);
  }

  console.log('📚 Creating official Subjects from image...');
  const subjectsData = [
    { code: '1BMAT301', name: 'Applied Mathematics-III for CSE', short: 'MATHS' },
    { code: '1BCS302', name: 'Digital Design and Computer Organization', short: 'DDCO' },
    { code: '1BCS303', name: 'Collaborative Development and Devops', short: 'CDD' },
    { code: '1BCS304', name: 'Data Structures and Applications', short: 'DSA' },
    { code: '1BCS305', name: 'Object Oriented Programming with JAVA', short: 'OOPS JAVA' },
    { code: '1BETC306', name: 'Data Analytics and Visualization', short: 'DAV' },
    { code: '1BPCCL308', name: 'Data Structures Lab', short: 'DSA LAB' },
    { code: 'PROCTOR', name: 'Proctor Interaction', short: 'Proctor Interaction' },
    { code: 'NSS_PE', name: 'NSS / Physical Education', short: 'NSS/PE' },
  ];

  const subjectsMap = new Map<string, string>();
  for (const s of subjectsData) {
    const created = await prisma.subject.create({
      data: { code: s.code, name: s.name },
    });
    subjectsMap.set(s.short, created.id);
  }

  console.log('👨‍🏫 Creating official Faculty members from image...');
  const facultyData = [
    { name: 'Mr. Darshan N S', email: 'darshan.ns@classradar.edu', initial: 'DNS', dept: 'Mathematics' },
    { name: 'Mrs. Veena Mohan', email: 'veena.mohan@classradar.edu', initial: 'VM', dept: 'CSE' },
    { name: 'Mr. Goutham R Naik', email: 'goutham.naik@classradar.edu', initial: 'GRN', dept: 'CSE' },
    { name: 'Mrs. Amruthashree V M', email: 'amruthashree.vm@classradar.edu', initial: 'AVM', dept: 'CSE' },
    { name: 'Ms. Sushma M K', email: 'sushma.mk@classradar.edu', initial: 'SMK', dept: 'CSE' },
    { name: 'Mr. Manoj N Sogi', email: 'manoj.sogi@classradar.edu', initial: 'MNS', dept: 'CSE' },
    { name: 'Dr. M R Rashmi', email: 'mrrashmi@classradar.edu', initial: 'MRR', dept: 'CSE' },
    { name: 'Mr. Vignesh R', email: 'vignesh.r@classradar.edu', initial: 'VR', dept: 'CSE' },
  ];

  const facultyMap = new Map<string, string>();
  for (const f of facultyData) {
    const created = await prisma.user.create({
      data: {
        name: f.name,
        email: f.email,
        passwordHash,
        role: 'FACULTY',
        department: f.dept,
      },
    });
    facultyMap.set(f.initial, created.id);
  }

  // Also create a demo faculty alias for quick login
  await prisma.user.create({
    data: {
      name: 'Mrs. Veena Mohan (Faculty 1)',
      email: 'faculty1@classradar.edu',
      passwordHash,
      role: 'FACULTY',
      department: 'CSE',
    },
  });
  facultyMap.set('FACULTY1_ALIAS', (await prisma.user.findUnique({ where: { email: 'faculty1@classradar.edu' } }))!.id);

  console.log('🛡️ Creating Admin & 🎓 Student accounts...');
  await prisma.user.create({
    data: {
      name: 'ClassRadar Academic Admin',
      email: 'admin@classradar.edu',
      passwordHash,
      role: 'ADMIN',
      department: 'Dean Academics',
    },
  });

  const studentUser = await prisma.user.create({
    data: {
      name: 'Shaik Zayan Ahmed',
      email: 'student1@classradar.edu',
      passwordHash,
      role: 'STUDENT',
      department: 'CSE',
      sectionId: section.id,
    },
  });

  // Additional section classmates
  const classmates = [
    'Mohammed Rizwan Shariff',
    'Chirag Sharma',
    'Ananya Patel',
    'Deepak Reddy',
    'Sneha Kulkarni',
  ];
  for (let i = 0; i < classmates.length; i++) {
    await prisma.user.create({
      data: {
        name: classmates[i]!,
        email: `student${i + 2}@classradar.edu`,
        passwordHash,
        role: 'STUDENT',
        department: 'CSE',
        sectionId: section.id,
      },
    });
  }

  console.log('📅 Inserting Exact Real Weekly Timetable (Sem III, Sec F, Room 406)...');

  // Helper to map period and time slot
  // Period 1: 09:00 - 10:00 am
  // Period 2: 10:00 - 11:00 am
  // BREAK
  // Period 3: 11:30 - 12:30 pm
  // Period 4: 12:30 - 01:30 pm
  // LUNCH
  // Period 5: 02:30 - 03:30 pm
  // Period 6: 03:30 - 04:30 pm
  // Period 7: 04:30 - 05:00 pm

  const defaultRoomId = roomsMap.get('Room 406')!;
  const ddcoLabRoomId = roomsMap.get('CS Lab 7 (DDCO)')!;
  const davLabRoomId = roomsMap.get('CS Lab 5 (DAV)')!;
  const cddLabRoomId = roomsMap.get('IS Lab 2 (CDD/DSA)')!;

  interface SlotDef {
    weekday: number; // 1 = Mon, 2 = Tue, 3 = Wed, 4 = Thu, 5 = Fri
    period: number;
    subjectShort: string;
    facultyInitial: string;
    roomId?: string;
  }

  const weeklySchedule: SlotDef[] = [
    // ----------------- MONDAY (weekday: 1) -----------------
    { weekday: 1, period: 1, subjectShort: 'DDCO', facultyInitial: 'VM' },
    { weekday: 1, period: 2, subjectShort: 'DSA', facultyInitial: 'AVM' },
    { weekday: 1, period: 3, subjectShort: 'CDD', facultyInitial: 'GRN' },
    { weekday: 1, period: 4, subjectShort: 'MATHS', facultyInitial: 'DNS' },
    { weekday: 1, period: 5, subjectShort: 'Proctor Interaction', facultyInitial: 'VM' },
    { weekday: 1, period: 6, subjectShort: 'Proctor Interaction', facultyInitial: 'VM' },
    { weekday: 1, period: 7, subjectShort: 'NSS/PE', facultyInitial: 'MNS' },

    // ----------------- TUESDAY (weekday: 2) -----------------
    { weekday: 2, period: 1, subjectShort: 'DAV', facultyInitial: 'MNS' },
    { weekday: 2, period: 2, subjectShort: 'DSA', facultyInitial: 'AVM' },
    { weekday: 2, period: 3, subjectShort: 'DDCO', facultyInitial: 'VM' },
    { weekday: 2, period: 4, subjectShort: 'OOPS JAVA', facultyInitial: 'SMK' },
    { weekday: 2, period: 5, subjectShort: 'MATHS', facultyInitial: 'DNS' }, // MATHS TUTORIAL
    { weekday: 2, period: 6, subjectShort: 'MATHS', facultyInitial: 'DNS' }, // MATHS TUTORIAL

    // ----------------- WEDNESDAY (weekday: 3) -----------------
    // 09:00 - 11:00 am: DDCO / DSA Lab
    { weekday: 3, period: 1, subjectShort: 'DDCO', facultyInitial: 'VM', roomId: ddcoLabRoomId },
    { weekday: 3, period: 2, subjectShort: 'DSA LAB', facultyInitial: 'AVM', roomId: cddLabRoomId },
    { weekday: 3, period: 3, subjectShort: 'CDD', facultyInitial: 'GRN' },
    { weekday: 3, period: 4, subjectShort: 'DDCO', facultyInitial: 'VM' },
    { weekday: 3, period: 5, subjectShort: 'OOPS JAVA', facultyInitial: 'SMK' }, // OOPS JAVA TUTORIAL
    { weekday: 3, period: 6, subjectShort: 'OOPS JAVA', facultyInitial: 'SMK' }, // OOPS JAVA TUTORIAL
    { weekday: 3, period: 7, subjectShort: 'NSS/PE', facultyInitial: 'MNS' },

    // ----------------- THURSDAY (weekday: 4) -----------------
    // 09:00 - 11:00 am: DAV / CDD Lab
    { weekday: 4, period: 1, subjectShort: 'DAV', facultyInitial: 'MNS', roomId: davLabRoomId },
    { weekday: 4, period: 2, subjectShort: 'CDD', facultyInitial: 'GRN', roomId: cddLabRoomId },
    { weekday: 4, period: 3, subjectShort: 'DSA', facultyInitial: 'AVM' },
    { weekday: 4, period: 4, subjectShort: 'CDD', facultyInitial: 'GRN' },
    // 02:30 - 04:30 pm: DDCO / DSA Lab
    { weekday: 4, period: 5, subjectShort: 'DDCO', facultyInitial: 'VM', roomId: ddcoLabRoomId },
    { weekday: 4, period: 6, subjectShort: 'DSA LAB', facultyInitial: 'AVM', roomId: cddLabRoomId },

    // ----------------- FRIDAY (weekday: 5) -----------------
    { weekday: 5, period: 1, subjectShort: 'MATHS', facultyInitial: 'DNS' },
    { weekday: 5, period: 2, subjectShort: 'DAV', facultyInitial: 'MNS' },
    // 11:30 - 01:30 pm: DAV / CDD Lab
    { weekday: 5, period: 3, subjectShort: 'DAV', facultyInitial: 'MNS', roomId: davLabRoomId },
    { weekday: 5, period: 4, subjectShort: 'CDD', facultyInitial: 'GRN', roomId: cddLabRoomId },
    { weekday: 5, period: 5, subjectShort: 'OOPS JAVA', facultyInitial: 'SMK' },
    { weekday: 5, period: 6, subjectShort: 'Proctor Interaction', facultyInitial: 'VM' },
  ];

  for (const s of weeklySchedule) {
    const subjectId = subjectsMap.get(s.subjectShort);
    const facultyId = facultyMap.get(s.facultyInitial);
    const roomId = s.roomId || defaultRoomId;

    if (!subjectId || !facultyId) {
      console.warn(`Could not resolve slot: ${s.subjectShort} / ${s.facultyInitial}`);
      continue;
    }

    await prisma.slot.create({
      data: {
        sectionId: section.id,
        weekday: s.weekday,
        period: s.period,
        subjectId,
        facultyId,
        roomId,
      },
    });
  }

  console.log('✅ Successfully loaded real Class timetable (Sem III, Sec F, Room 406)!');
  console.log('Login credentials:');
  console.log('  Student: student1@classradar.edu / classradar123 (Shaik Zayan Ahmed - Sec F)');
  console.log('  Faculty: veena.mohan@classradar.edu / classradar123 (Mrs. Veena Mohan - DDCO)');
  console.log('           faculty1@classradar.edu    / classradar123 (Quick login alias)');
  console.log('  Admin:   admin@classradar.edu       / classradar123');
};

main()
  .catch((err) => {
    console.error('Seeding error:', err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
