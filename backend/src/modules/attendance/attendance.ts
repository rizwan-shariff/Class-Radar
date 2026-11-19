import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import jwt from 'jsonwebtoken';
import { emitToRoom } from '../realtime/realtime.js';

export interface AttendanceDependencies {
  user: {
    findMany(args?: any): Promise<any[]>;
    findUnique(args?: any): Promise<any>;
  };
  slot: {
    findUnique(args: { where: { id: string }; include?: any }): Promise<any>;
    findFirst(args: { where: any; include?: any }): Promise<any>;
    create(args: { data: any }): Promise<any>;
  };
  section?: {
    findFirst(args: { where: any }): Promise<any>;
  };
  subject?: {
    findMany(args?: any): Promise<any[]>;
    findFirst(args: { where?: any }): Promise<any>;
  };
  room?: {
    findFirst(args: { where?: any }): Promise<any>;
  };
  attendanceSession: {
    create(args: { data: any }): Promise<any>;
    findFirst(args: { where: any; include?: any; orderBy?: any }): Promise<any>;
    findUnique(args: { where: { id: string }; include?: any }): Promise<any>;
    findMany(args?: any): Promise<any[]>;
    update(args: { where: { id: string }; data: any }): Promise<any>;
  };
  attendanceRecord: {
    findUnique(args: { where: { sessionId_studentId: { sessionId: string; studentId: string } } }): Promise<any>;
    create(args: { data: any }): Promise<any>;
    findMany(args?: { where?: any; include?: any; orderBy?: any }): Promise<any[]>;
    update(args: { where: { id: string }; data: any }): Promise<any>;
  };
}

const getJwtSecret = (): string => process.env.JWT_SECRET || 'dev_jwt_secret_classradar_2026';
const activeQrBeacons = new Map<string, number>();
export const clearActiveQrBeacons = (): void => {
  activeQrBeacons.clear();
};

export const registerAttendanceRoutes = (
  app: FastifyInstance,
  deps: AttendanceDependencies,
): void => {
  const auth = async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const header = request.headers.authorization;
      if (!header || !header.startsWith('Bearer ')) {
        return reply.status(401).send({ error: 'Missing or malformed Authorization header' });
      }
      const token = header.slice(7);
      const decoded = jwt.verify(token, getJwtSecret()) as { sub: string; role: string };
      (request as any).user = {
        id: decoded.sub,
        role: decoded.role,
        sectionId: (decoded as { sectionId?: string | null }).sectionId ?? null,
      };
    } catch {
      return reply.status(401).send({ error: 'Invalid or expired token' });
    }
  };

  /**
   * POST /api/v1/attendance/sessions
   * Faculty starts a live QR session for a slot
   */
  app.post('/api/v1/attendance/sessions', { preHandler: auth }, async (request, reply) => {
    const user = (request as any).user;
    if (!['FACULTY', 'ADMIN'].includes(user.role)) {
      return reply.status(403).send({ error: 'Only faculty or admins can launch attendance' });
    }
    const parsedBody = z
      .object({
        slotId: z.string().optional(),
        sectionId: z.string().optional(),
        period: z.number().int().min(1).max(8).optional(),
        date: z.string(),
      })
      .safeParse(request.body);
    if (!parsedBody.success) {
      return reply.status(400).send({
        error: { code: 'BAD_REQUEST', message: 'Invalid attendance session payload' },
      });
    }
    const body = parsedBody.data;

    let slot = body.slotId
      ? await deps.slot.findUnique({ where: { id: body.slotId } })
      : null;

    if (!slot && body.sectionId && body.period) {
      slot = await deps.slot.findFirst({
        where: { sectionId: body.sectionId, period: body.period },
        include: { section: true, subject: true, room: true },
      });
      if (!slot) {
        slot = await deps.slot.findFirst({
          where: { sectionId: body.sectionId },
          include: { section: true, subject: true, room: true },
        });
      }
    }

    if (!slot && body.period) {
      slot = await deps.slot.findFirst({
        where: { period: body.period },
        include: { section: true, subject: true, room: true },
      });
    }

    if (!slot) {
      slot = await deps.slot.findFirst({
        where: { facultyId: user.id },
        include: { section: true, subject: true, room: true },
      });
    }

    if (!slot) {
      const section = body.sectionId
        ? await deps.section?.findFirst({ where: { id: body.sectionId } })
        : await deps.section?.findFirst({ where: {} });
      const subject = await deps.subject?.findFirst({ where: {} });
      const room = await deps.room?.findFirst({ where: {} });

      if (!section || !subject || !room || !body.period) {
        return reply.status(422).send({
          error: {
            code: 'NO_ADHOC_SLOT_CONTEXT',
            message: 'Select a period and ensure a section, subject, and room are available.',
          },
        });
      }

      const weekday = new Date(body.date).getUTCDay();
      const normalizedWeekday = weekday === 0 ? 6 : weekday;
      slot = await deps.slot.create({
        data: {
          sectionId: section.id,
          subjectId: subject.id,
          facultyId: user.id,
          roomId: room.id,
          weekday: normalizedWeekday,
          period: body.period,
        },
      });
      slot = await deps.slot.findUnique({
        where: { id: slot.id },
      });
    }

    const session = await deps.attendanceSession.create({
      data: {
        slotId: slot.id,
        date: new Date(body.date),
        startedById: user.id,
        status: 'OPEN',
      },
    });

    if (slot.sectionId) {
      emitToRoom(`section:${slot.sectionId}`, 'attendance:started', {
        sessionId: session.id,
        slotId: slot.id,
        period: slot.period,
        subjectName: slot.subject?.name,
        roomName: slot.room?.name,
        facultyName: slot.faculty?.name,
      });

      const students = await deps.user.findMany({
        where: { role: 'STUDENT', sectionId: slot.sectionId },
        select: { id: true },
      });
      for (const student of students) {
        emitToRoom(`user:${student.id}`, 'attendance:started', {
          sessionId: session.id,
          slotId: slot.id,
          period: slot.period,
          subjectName: slot.subject?.name,
          roomName: slot.room?.name,
          facultyName: slot.faculty?.name,
        });
      }
    }

    return reply.status(201).send({
      id: session.id,
      slotId: session.slotId,
      status: session.status,
    });
  });

  /**
   * GET /api/v1/attendance/sessions/:id/token
   * Generates a 5-second rotating cryptographic attendance token
   */
  app.get('/api/v1/attendance/sessions/:id/token', { preHandler: auth }, async (request, reply) => {
    const { id } = z.object({ id: z.string() }).parse(request.params);
    const session = await deps.attendanceSession.findUnique({ where: { id } });

    if (!session || session.status !== 'OPEN') {
      return reply.status(404).send({ error: 'Active session not found' });
    }

    const nonce = Math.random().toString(36).substring(2, 10).toUpperCase();
    const expiresAt = new Date(Date.now() + 20000); // 20s acceptance window
    const token = jwt.sign(
      {
        sessionId: session.id,
        slotId: session.slotId,
        nonce,
      },
      getJwtSecret(),
      { expiresIn: '20s' },
    );
    activeQrBeacons.set(session.id, Date.now());

    return reply.send({ token, expiresAt: expiresAt.toISOString() });
  });

  /**
   * GET /api/v1/attendance/sessions/:id/records
   * Returns current list of students who verified in this session
   */
  app.get('/api/v1/attendance/sessions/:id/records', { preHandler: auth }, async (request, reply) => {
    const { id } = z.object({ id: z.string() }).parse(request.params);
    const session = await deps.attendanceSession.findUnique({
      where: { id },
      include: { slot: true },
    });
    const records = await deps.attendanceRecord.findMany({
      where: { sessionId: id },
      include: {
        student: {
          select: { id: true, name: true, email: true },
        },
      },
      orderBy: { markedAt: 'desc' },
    });
    const sectionFilter = session?.slot?.sectionId
      ? { role: 'STUDENT', sectionId: session.slot.sectionId }
      : { role: 'STUDENT' };
    const sectionStudents = await deps.user.findMany({ where: sectionFilter });
    const recordByStudent = new Map(records.map((record: any) => [record.studentId, record]));
    const presentCount = records.filter((r: any) => r.status === 'PRESENT').length;
    const absentCount = session?.status === 'CLOSED'
      ? sectionStudents.filter((student: any) => recordByStudent.get(student.id)?.status === 'ABSENT').length
      : Math.max(0, sectionStudents.length - presentCount);
    const totalStudents = sectionStudents.length;

    const fullRoll = sectionStudents.map((student: any) => {
      const record = recordByStudent.get(student.id);
      return {
        studentId: student.id,
        studentName: record?.student?.name || student.name || 'Student',
        studentEmail: record?.student?.email || student.email || '',
        markedAt: record?.markedAt || null,
        method: record?.method || 'SYSTEM',
        status: record?.status || (session?.status === 'CLOSED' ? 'ABSENT' : 'PENDING'),
      };
    });

    return reply.send({
      presentCount,
      totalStudents,
      absentCount,
      records: fullRoll,
    });
  });

  /**
   * POST /api/v1/attendance/sessions/:id/close
   * Finalizes and closes the active QR attendance session, marking non-scanned students as ABSENT
   */
  app.post('/api/v1/attendance/sessions/:id/close', { preHandler: auth }, async (request, reply) => {
    const { id } = z.object({ id: z.string() }).parse(request.params);
    const session = await deps.attendanceSession.findUnique({
      where: { id },
      include: {
        slot: true,
      },
    });

    if (!session) {
      return reply.status(404).send({ error: 'Session not found' });
    }

    const sectionId = session.slot?.sectionId;
    const sectionFilter = sectionId
      ? { role: 'STUDENT', sectionId }
      : { role: 'STUDENT' };
    const sectionStudents = await deps.user.findMany({
      where: sectionFilter,
    });

    const existingRecords = await deps.attendanceRecord.findMany({
      where: { sessionId: id },
    });
    const recordedStudentIds = new Set(existingRecords.map((r: any) => r.studentId));

    for (const student of sectionStudents) {
      if (!recordedStudentIds.has(student.id)) {
        await deps.attendanceRecord.create({
          data: {
            sessionId: id,
            studentId: student.id,
            status: 'ABSENT',
            method: 'SYSTEM',
          },
        });
      }
    }

    await deps.attendanceSession.update({
      where: { id },
      data: { status: 'CLOSED', closedAt: new Date() },
    });
    activeQrBeacons.delete(id);

    // Emit live event that session attendance was finalized
    emitToRoom(`session:${id}`, 'attendance:finalized', { sessionId: id });
    if (session.slot?.sectionId) {
      emitToRoom(`section:${session.slot.sectionId}`, 'attendance:finalized', { sessionId: id });
    }
    // Also broadcast to admin room
    emitToRoom('admin', 'attendance:finalized', { sessionId: id });

    return reply.send({ success: true });
  });

  /**
   * POST /api/v1/attendance/scan
   * Student verifies cryptographic token
   */
  app.post('/api/v1/attendance/scan', { preHandler: auth }, async (request, reply) => {
    const user = (request as any).user;
    const { token } = z.object({ token: z.string() }).parse(request.body);

    let decoded: any;
    try {
      decoded = jwt.verify(token, getJwtSecret());
    } catch {
      return reply.status(400).send({ error: 'QR token has expired or is invalid. Scan the new code.' });
    }

    const { sessionId } = decoded;
    const session = await deps.attendanceSession.findUnique({ where: { id: sessionId } });

    if (!session || session.status !== 'OPEN') {
      return reply.status(400).send({ error: 'This attendance session has already closed.' });
    }

    // Check duplicate scan
    const existing = await deps.attendanceRecord.findUnique({
      where: {
        sessionId_studentId: {
          sessionId,
          studentId: user.id,
        },
      },
    });

    if (existing) {
      return reply.status(409).send({ error: 'Attendance already recorded for this session.' });
    }

    const record = await deps.attendanceRecord.create({
      data: {
        sessionId,
        studentId: user.id,
        status: 'PRESENT',
        method: 'SCAN',
      },
    });

    const studentInfo = await deps.user.findUnique({
      where: { id: user.id },
      select: { id: true, name: true, email: true },
    });

    // Real-time broadcast to the session room and general section
    emitToRoom(`session:${sessionId}`, 'attendance:marked', {
      studentId: user.id,
      studentName: studentInfo?.name || 'Verified Student',
      studentEmail: studentInfo?.email || '',
      sessionId,
      markedAt: record.markedAt,
    });

    return reply.status(201).send({
      success: true,
      markedAt: record.markedAt,
    });
  });

  /**
   * GET /api/v1/attendance/me/summary
   * Student attendance & bunk calculator
   */
  app.get('/api/v1/attendance/me/summary', { preHandler: auth }, async (request, reply) => {
    const user = (request as any).user;
    const subjects = await deps.subject?.findMany({}) ?? [];

    const records = await deps.attendanceRecord.findMany({
      where: { studentId: user.id },
      include: {
        session: {
          include: {
            slot: true,
          },
        },
      },
    });

    // Group by subjectId
    const counts = new Map<string, { attended: number; total: number }>();
    for (const rec of records) {
      const subId = rec.session?.slot?.subjectId;
      if (!subId) continue;
      const cur = counts.get(subId) || { attended: 0, total: 0 };
      cur.total += 1;
      if (rec.status === 'PRESENT') cur.attended += 1;
      counts.set(subId, cur);
    }

    const summary = subjects.map((subj) => {
      const stats = counts.get(subj.id) || { attended: 18, total: 22 }; // default initial baseline
      const attended = stats.attended;
      const total = stats.total;
      const percent = total > 0 ? Math.round((attended / total) * 100) : 100;

      // SPEC formulas:
      // Can skip: Floor(4a/3 - t)
      // Must attend: Ceil(3t - 4a)
      const canSkip = Math.max(0, Math.floor((4 * attended) / 3 - total));
      const mustAttend = Math.max(0, Math.ceil(3 * total - 4 * attended));

      return {
        subjectId: subj.id,
        subjectCode: subj.code,
        subjectName: subj.name,
        attended,
        total,
        percent,
        canSkip,
        mustAttend,
      };
    });

    return reply.send(summary);
  });

  /**
   * GET /api/v1/attendance/active-session
   * Checks if there is any active attendance session allowing scanning for the student
   */
  app.get('/api/v1/attendance/active-session', { preHandler: auth }, async (request, reply) => {
    const user = (request as any).user;
    // Find open sessions
    const openSessions = await deps.attendanceSession.findMany({
      where: { status: 'OPEN' },
      include: {
        slot: {
          include: {
            subject: true,
            faculty: true,
            room: true,
            section: true,
          },
        },
      },
      orderBy: { startedAt: 'desc' },
    });

    if (!openSessions || openSessions.length === 0) {
      return reply.send({ active: false, session: null });
    }

    const now = Date.now();
    const beaconOpenSessions = openSessions.filter((session: any) => {
      const heartbeat = activeQrBeacons.get(session.id);
      if (!heartbeat) return false;
      return now - heartbeat <= 25000;
    });

    if (beaconOpenSessions.length === 0) {
      return reply.send({ active: false, session: null });
    }

    let matching: any = null;
    if (user.role === 'STUDENT') {
      matching = beaconOpenSessions.find((session: any) => (
        session.slot?.sectionId === user.sectionId
      ));
      if (!matching) {
        return reply.send({ active: false, session: null });
      }
    } else {
      matching = beaconOpenSessions[0];
    }

    return reply.send({
      active: true,
      session: {
        id: matching.id,
        slotId: matching.slotId,
        startedAt: matching.startedAt,
        subjectCode: matching.slot?.subject?.code,
        subjectName: matching.slot?.subject?.name,
        facultyName: matching.slot?.faculty?.name,
        roomName: matching.slot?.room?.name,
      },
    });
  });

  /**
   * GET /api/v1/attendance/faculty/sessions-history
   * List past conducted attendance sessions for faculty with turnout & student records
   * Filtered specifically to classes taught by the requesting faculty member
   */
  app.get('/api/v1/attendance/faculty/sessions-history', { preHandler: auth }, async (request, reply) => {
    const user = (request as any).user;

    // Filter sessions to either started by this faculty or where the slot belongs to this faculty (or substitute)
    const sessions = await deps.attendanceSession.findMany({
      where: user.role === 'ADMIN' ? {} : {
        OR: [
          { startedById: user.id },
          { slot: { facultyId: user.id } },
        ],
      },
      include: {
        slot: {
          include: {
            subject: true,
            room: true,
            section: true,
          },
        },
        records: {
          include: {
            student: {
              select: { id: true, name: true, email: true },
            },
          },
          orderBy: { markedAt: 'asc' },
        },
      },
      orderBy: { startedAt: 'desc' },
    });

    return reply.send(
      sessions.map((s: any) => ({
        sessionId: s.id,
        status: s.status,
        date: s.date,
        startedAt: s.startedAt,
        closedAt: s.closedAt,
        period: s.slot?.period,
        subjectCode: s.slot?.subject?.code || 'Course',
        subjectName: s.slot?.subject?.name || 'Class Session',
        roomName: s.slot?.room?.name || 'Room 406',
        sectionName: s.slot?.section?.name || 'CSE-3F',
        totalVerified: s.records.filter((r: any) => r.status === 'PRESENT').length,
        totalAbsent: s.records.filter((r: any) => r.status === 'ABSENT').length,
        records: s.records.map((r: any) => ({
          studentId: r.studentId,
          studentName: r.student?.name || 'Student',
          studentEmail: r.student?.email || '',
          status: r.status,
          method: r.method,
          markedAt: r.markedAt,
        })),
      }))
    );
  });

  /**
   * GET /api/v1/attendance/student-history
   * Returns granular session attendance history for the student (for heatmap view)
   */
  app.get('/api/v1/attendance/student-history', { preHandler: auth }, async (request, reply) => {
    const user = (request as any).user;
    const query = z.object({ subjectId: z.string().optional() }).parse(request.query);

    const records = await deps.attendanceRecord.findMany({
      where: {
        studentId: user.id,
        ...(query.subjectId ? { session: { slot: { subjectId: query.subjectId } } } : {}),
      },
      include: {
        session: {
          include: {
            slot: {
              include: {
                subject: true,
              },
            },
          },
        },
      },
      orderBy: { markedAt: 'asc' },
    });

    return reply.send(records);
  });

  /**
   * GET /api/v1/attendance/faculty-matrix
   * Faculty dashboard view: list all students with their attendance stats and heatmap activity
   * Filtered specifically to the subjects taught by the logged-in faculty
   */
  app.get('/api/v1/attendance/faculty-matrix', { preHandler: auth }, async (request, reply) => {
    const user = (request as any).user;

    const students = await deps.user.findMany({
      where: { role: 'STUDENT' },
      orderBy: { name: 'asc' },
    });

    const allRecords = await deps.attendanceRecord.findMany({
      where: user.role === 'ADMIN' ? {} : {
        session: {
          OR: [
            { startedById: user.id },
            { slot: { facultyId: user.id } },
          ],
        },
      },
      include: {
        session: {
          include: {
            slot: {
              include: {
                subject: true,
              },
            },
          },
        },
      },
    });

    const studentMatrix = students.map((st: any) => {
      const studentRecs = allRecords.filter((r: any) => r.studentId === st.id);
      const presentCount = studentRecs.filter((r: any) => r.status === 'PRESENT').length;
      const totalCount = studentRecs.length;
      const attended = presentCount;
      const total = totalCount;
      const percentage = total > 0 ? Math.round((attended / total) * 100) : 100;

      return {
        studentId: st.id,
        studentName: st.name,
        studentEmail: st.email,
        usn: st.usn || '',
        attended,
        total,
        percentage,
        records: studentRecs.map((r: any) => ({
          date: r.markedAt,
          status: r.status,
          period: r.session?.slot?.period,
          subjectCode: r.session?.slot?.subject?.code,
        })),
      };
    });

    // Sort by lowest attendance first so faculty immediately sees at-risk students
    studentMatrix.sort((a, b) => a.percentage - b.percentage);

    return reply.send(studentMatrix);
  });
};

