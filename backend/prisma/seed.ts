import fs from 'fs';
import path from 'path';
import bcrypt from 'bcrypt';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const DEFAULT_PASSWORD = 'admin123';

function parseCsv(filePath: string): Record<string, string>[] {
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split(/\r?\n/).filter((l) => l.trim().length > 0);
  if (lines.length < 2) return [];

  const headers = lines[0]!.split(',').map((h) => h.trim());
  const rows: Record<string, string>[] = [];

  for (let i = 1; i < lines.length; i++) {
    const values: string[] = [];
    let cur = '';
    let inQuotes = false;
    for (const char of lines[i]!) {
      if (char === '"') inQuotes = !inQuotes;
      else if (char === ',' && !inQuotes) {
        values.push(cur.trim());
        cur = '';
      } else {
        cur += char;
      }
    }
    values.push(cur.trim());

    const rowObj: Record<string, string> = {};
    headers.forEach((h, idx) => {
      rowObj[h] = values[idx] || '';
    });
    rows.push(rowObj);
  }
  return rows;
}

const main = async (): Promise<void> => {
  const passwordHash = await bcrypt.hash(DEFAULT_PASSWORD, 10);

  console.log('🧹 Purging all existing records in database...');
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

  console.log('🏛️ Creating official Section (CSE-3F)...');
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

  console.log('📚 Creating official Subjects...');
  const subjectsData = [
    { code: '1BMAT301', name: 'Applied Mathematics-III for CSE' },
    { code: '1BCS302', name: 'Digital Design and Computer Organization' },
    { code: '1BCS303', name: 'Collaborative Development and Devops' },
    { code: '1BCS304', name: 'Data Structures and Applications' },
    { code: '1BCS305', name: 'Object Oriented Programming with JAVA' },
    { code: '1BETC306', name: 'Data Analytics and Visualization' },
    { code: '1BPCCL308', name: 'Data Structures Lab' },
    { code: 'PROCTOR', name: 'Proctor Interaction' },
    { code: 'NSS_PE', name: 'NSS / Physical Education' },
  ];

  const subjectsMap = new Map<string, string>();
  for (const s of subjectsData) {
    const created = await prisma.subject.create({
      data: { code: s.code, name: s.name },
    });
    subjectsMap.set(s.code, created.id);
  }

  console.log('👨‍🏫 Creating official Faculty members & Admin...');
  const facultyData = [
    { name: 'Mr. Darshan N S', email: 'darshan.ns@classradar.edu', dept: 'Mathematics' },
    { name: 'Mrs. Veena Mohan', email: 'veena.mohan@classradar.edu', dept: 'CSE' },
    { name: 'Mr. Goutham R Naik', email: 'goutham.naik@classradar.edu', dept: 'CSE' },
    { name: 'Mrs. Amruthashree V M', email: 'amruthashree.vm@classradar.edu', dept: 'CSE' },
    { name: 'Ms. Sushma M K', email: 'sushma.mk@classradar.edu', dept: 'CSE' },
    { name: 'Mr. Manoj N Sogi', email: 'manoj.sogi@classradar.edu', dept: 'CSE' },
    { name: 'Dr. M R Rashmi', email: 'mrrashmi@classradar.edu', dept: 'CSE' },
    { name: 'Mr. Vignesh R', email: 'vignesh.r@classradar.edu', dept: 'CSE' },
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
    facultyMap.set(f.email, created.id);
  }

  // Admin account
  await prisma.user.create({
    data: {
      name: 'ClassRadar Academic Admin',
      email: 'admin@classradar.edu',
      passwordHash,
      role: 'ADMIN',
      department: 'Dean Academics',
    },
  });

  console.log('🎓 Seeding all real CSE-3F students from CSV with USN...');
  const possiblePaths = [
    path.resolve(__dirname, '../../database'),
    path.resolve(__dirname, '../database'),
    path.resolve(__dirname, '../../../database'),
    path.resolve(process.cwd(), 'database'),
    path.resolve(process.cwd(), '../database'),
    '/app/database',
  ];
  let databaseDir = possiblePaths.find((p) => fs.existsSync(path.join(p, 'CSE-3F-students.csv'))) || '/app/database';
  console.log('Resolved databaseDir:', databaseDir);
  const studentsCsvPath = path.join(databaseDir, 'CSE-3F-students.csv');
  const studentRows = parseCsv(studentsCsvPath);

  const studentsMapByEmail = new Map<string, string>();
  for (const row of studentRows) {
    const usn = row['USN']?.trim();
    const name = row['Student Name']?.trim();
    const email = row['Email']?.trim();

    if (!email || !name) continue;

    const created = await prisma.user.create({
      data: {
        name,
        email,
        usn: usn || null,
        passwordHash,
        role: 'STUDENT',
        department: 'CSE',
        sectionId: section.id,
      },
    });
    studentsMapByEmail.set(email, created.id);
  }
  console.log(`Created ${studentsMapByEmail.size} real CSE-3F students from CSV.`);

  console.log('📅 Inserting weekly timetable slots from database/CSE-3F.csv...');
  const timetableCsvPath = path.join(databaseDir, 'CSE-3F.csv');
  const timetableRows = parseCsv(timetableCsvPath);

  const slotLookup = new Map<string, string>(); // key: `${weekday}_${period}` -> slotId
  for (const row of timetableRows) {
    const weekday = parseInt(row['weekday'] || '0', 10);
    const period = parseInt(row['period'] || '0', 10);
    const subjectCode = row['subject_code']?.trim();
    const facultyEmail = row['faculty_email']?.trim();
    const roomName = row['room']?.trim();

    const subjectId = subjectsMap.get(subjectCode);
    const facultyId = facultyEmail ? facultyMap.get(facultyEmail) : null;
    const roomId = roomsMap.get(roomName) || roomsMap.get('Room 406')!;

    if (!subjectId) {
      console.warn(`Skipping slot: missing subjectId for ${subjectCode}`);
      continue;
    }

    const createdSlot = await prisma.slot.create({
      data: {
        sectionId: section.id,
        weekday,
        period,
        subjectId,
        facultyId: facultyId || null,
        roomId,
      },
    });
    slotLookup.set(`${weekday}_${period}`, createdSlot.id);
  }
  console.log(`Created ${slotLookup.size} weekly slots for CSE-3F.`);

  console.log('📊 Seeding realistic Attendance Sessions from database/CSE-3F-mock-attendance.csv...');
  const attendanceCsvPath = path.join(databaseDir, 'CSE-3F-mock-attendance.csv');
  let attendanceRows: Record<string, string>[] = [];
  if (fs.existsSync(attendanceCsvPath)) {
    attendanceRows = parseCsv(attendanceCsvPath);
    console.log(`Loaded ${attendanceRows.length} attendance rows from CSV.`);
  }

  if (attendanceRows.length > 0) {
    // Group records by session key: `${date}_${weekday}_${period}`
    const sessionGroups = new Map<string, {
      date: string;
      weekday: number;
      period: number;
      subjectCode: string;
      records: Array<{ studentEmail: string; status: string }>;
    }>();

    for (const r of attendanceRows) {
      const date = r['date']?.trim();
      const weekday = parseInt(r['weekday'] || '0', 10);
      const period = parseInt(r['period'] || '0', 10);
      const subjectCode = r['subject_code']?.trim();
      const studentEmail = r['student_email']?.trim();
      const status = r['status']?.trim() === 'ABSENT' ? 'ABSENT' : 'PRESENT';

      if (!date || !weekday || !period || !studentEmail) continue;

      const key = `${date}_${weekday}_${period}`;
      const group = sessionGroups.get(key) || {
        date,
        weekday,
        period,
        subjectCode,
        records: [],
      };
      group.records.push({ studentEmail, status });
      sessionGroups.set(key, group);
    }

    console.log(`Creating ${sessionGroups.size} attendance sessions from CSV...`);
    for (const [key, group] of sessionGroups.entries()) {
      const slotId = slotLookup.get(`${group.weekday}_${group.period}`);
      if (!slotId) continue;

      const slot = await prisma.slot.findUnique({ where: { id: slotId } });
      if (!slot) continue;

      const sessionDate = new Date(group.date);
      const session = await prisma.attendanceSession.create({
        data: {
          slotId: slot.id,
          date: sessionDate,
          startedById: slot.facultyId || (await prisma.user.findFirst({ where: { role: 'ADMIN' } }))!.id,
          status: 'CLOSED',
          startedAt: sessionDate,
          closedAt: new Date(sessionDate.getTime() + 50 * 60 * 1000),
        },
      });

      for (const rec of group.records) {
        const studentId = studentsMapByEmail.get(rec.studentEmail);
        if (!studentId) continue;

        try {
          await prisma.attendanceRecord.create({
            data: {
              sessionId: session.id,
              studentId,
              status: rec.status,
              method: rec.status === 'PRESENT' ? 'SCAN' : 'SYSTEM',
              markedAt: new Date(sessionDate.getTime() + 10 * 60 * 1000),
            },
          });
        } catch {
          // ignore any duplicate
        }
      }
    }
  }

  console.log('✅ SQLite database successfully populated with real CSE-3F data!');
  console.log(`All accounts created with password: "${DEFAULT_PASSWORD}"`);
};

main()
  .catch((err) => {
    console.error('Seeding error:', err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
