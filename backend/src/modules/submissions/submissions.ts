import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import jwt from 'jsonwebtoken';
import { emitToRoom } from '../realtime/realtime.js';

export interface SubmissionsDependencies {
  submissionDeadline: {
    create(args: any): Promise<any>;
    findUnique(args: any): Promise<any>;
    findMany(args: any): Promise<any[]>;
    update(args: any): Promise<any>;
    delete?(args: any): Promise<any>;
  };
  user: {
    findUnique(args: any): Promise<any>;
  };
  section: {
    findUnique(args: any): Promise<any>;
    findMany?(args?: any): Promise<any[]>;
  };
  subject: {
    findUnique(args: any): Promise<any>;
    findMany?(args?: any): Promise<any[]>;
  };
}

const getJwtSecret = (): string => process.env.JWT_SECRET || 'dev_jwt_secret_classradar_2026';

const createDeadlineSchema = z.object({
  subjectId: z.string().min(1, 'Subject is required'),
  sectionId: z.string().min(1, 'Section is required'),
  title: z.string().min(1, 'Title is required').max(150, 'Title is too long'),
  description: z.string().optional().nullable(),
  dueDate: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: 'Invalid ISO date string for dueDate',
  }),
});

const updateDeadlineSchema = z.object({
  title: z.string().min(1).max(150).optional(),
  description: z.string().optional().nullable(),
  dueDate: z
    .string()
    .refine((val) => !isNaN(Date.parse(val)), {
      message: 'Invalid ISO date string for dueDate',
    })
    .optional(),
  extendReason: z.string().optional(),
});

export const registerSubmissionsRoutes = (
  app: FastifyInstance,
  deps: SubmissionsDependencies,
): void => {
  // Shared Auth helper
  const authMiddleware = async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const header = request.headers.authorization;
      if (!header || !header.startsWith('Bearer ')) {
        return reply.status(401).send({ error: { code: 'UNAUTHORIZED', message: 'Missing or malformed Authorization header' } });
      }
      const token = header.slice(7);
      const decoded = jwt.verify(token, getJwtSecret()) as { sub: string; role: string; sectionId?: string };
      (request as any).user = { id: decoded.sub, role: decoded.role, sectionId: decoded.sectionId };
    } catch {
      return reply.status(401).send({ error: { code: 'UNAUTHORIZED', message: 'Invalid or expired token' } });
    }
  };

  /**
   * GET /api/v1/submissions/meta
   * Fetch available subjects and sections for deadline creation dropdowns
   */
  app.get('/api/v1/submissions/meta', { preHandler: authMiddleware }, async (_request, reply) => {
    const [sections, subjects] = await Promise.all([
      deps.section.findMany ? deps.section.findMany({ orderBy: { name: 'asc' } }) : [],
      deps.subject.findMany ? deps.subject.findMany({ orderBy: { code: 'asc' } }) : [],
    ]);
    return reply.send({ sections, subjects });
  });

  /**
   * POST /api/v1/submissions/deadlines
   * Faculty creates a new submission deadline
   */
  app.post('/api/v1/submissions/deadlines', { preHandler: authMiddleware }, async (request, reply) => {
    const user = (request as any).user;
    if (user.role !== 'FACULTY' && user.role !== 'ADMIN') {
      return reply.status(403).send({ error: { code: 'FORBIDDEN', message: 'Only faculty or admins can create submission deadlines' } });
    }

    const parseResult = createDeadlineSchema.safeParse(request.body);
    if (!parseResult.success) {
      return reply.status(400).send({
        error: { code: 'BAD_REQUEST', message: parseResult.error.errors[0]?.message || 'Validation failed' },
      });
    }

    const { subjectId, sectionId, title, description, dueDate } = parseResult.data;
    const dueDateTime = new Date(dueDate);

    // Prevent past date on initial creation
    if (dueDateTime.getTime() < Date.now() - 60000) {
      return reply.status(400).send({
        error: { code: 'INVALID_DUE_DATE', message: 'Submission due date must be in the future' },
      });
    }

    const deadline = await deps.submissionDeadline.create({
      data: {
        subjectId,
        sectionId,
        facultyId: user.id,
        title,
        description: description || null,
        dueDate: dueDateTime,
        isFinalized: false,
      },
      include: {
        subject: true,
        section: true,
        faculty: { select: { id: true, name: true, email: true } },
      },
    });

    return reply.status(201).send(deadline);
  });

  /**
   * PUT /api/v1/submissions/deadlines/:id
   * Edit or extend a submission deadline
   */
  app.put('/api/v1/submissions/deadlines/:id', { preHandler: authMiddleware }, async (request, reply) => {
    const user = (request as any).user;
    const { id } = request.params as { id: string };

    const deadline = await deps.submissionDeadline.findUnique({
      where: { id },
      include: { subject: true, section: true },
    });

    if (!deadline) {
      return reply.status(404).send({ error: { code: 'NOT_FOUND', message: 'Deadline not found' } });
    }

    if (user.role !== 'ADMIN' && deadline.facultyId !== user.id) {
      return reply.status(403).send({ error: { code: 'FORBIDDEN', message: 'You do not own this submission deadline' } });
    }

    const parseResult = updateDeadlineSchema.safeParse(request.body);
    if (!parseResult.success) {
      return reply.status(400).send({
        error: { code: 'BAD_REQUEST', message: parseResult.error.errors[0]?.message || 'Validation failed' },
      });
    }

    const { title, description, dueDate } = parseResult.data;
    const updateData: any = {};
    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (dueDate !== undefined) updateData.dueDate = new Date(dueDate);

    const updated = await deps.submissionDeadline.update({
      where: { id },
      data: updateData,
      include: {
        subject: true,
        section: true,
        faculty: { select: { id: true, name: true, email: true } },
      },
    });

    // Notify section room in real time if finalized
    if (updated.isFinalized) {
      emitToRoom(
        `section:${updated.sectionId}`,
        'deadline:updated',
        { id: updated.id, title: updated.title, dueDate: updated.dueDate }
      );
    }

    return reply.send(updated);
  });

  /**
   * PATCH /api/v1/submissions/deadlines/:id/finalize
   * Finalize and lock the deadline, immediately broadcasting to enrolled students
   */
  app.patch('/api/v1/submissions/deadlines/:id/finalize', { preHandler: authMiddleware }, async (request, reply) => {
    const user = (request as any).user;
    const { id } = request.params as { id: string };

    const deadline = await deps.submissionDeadline.findUnique({
      where: { id },
    });

    if (!deadline) {
      return reply.status(404).send({ error: { code: 'NOT_FOUND', message: 'Deadline not found' } });
    }

    if (user.role !== 'ADMIN' && deadline.facultyId !== user.id) {
      return reply.status(403).send({ error: { code: 'FORBIDDEN', message: 'You do not own this submission deadline' } });
    }

    const updated = await deps.submissionDeadline.update({
      where: { id },
      data: {
        isFinalized: true,
        finalizedAt: new Date(),
      },
      include: {
        subject: true,
        section: true,
        faculty: { select: { id: true, name: true, email: true } },
      },
    });

    // Real-time broadcast to section room
    emitToRoom(
      `section:${updated.sectionId}`,
      'deadline:finalized',
      {
        id: updated.id,
        title: updated.title,
        subjectName: updated.subject?.name,
        subjectCode: updated.subject?.code,
        dueDate: updated.dueDate,
        finalizedAt: updated.finalizedAt,
      }
    );

    return reply.send(updated);
  });

  /**
   * GET /api/v1/submissions/deadlines/faculty
   * Fetch all deadlines created by the logged-in faculty
   */
  app.get('/api/v1/submissions/deadlines/faculty', { preHandler: authMiddleware }, async (request, reply) => {
    const user = (request as any).user;
    if (user.role !== 'FACULTY' && user.role !== 'ADMIN') {
      return reply.status(403).send({ error: { code: 'FORBIDDEN', message: 'Access denied' } });
    }

    const whereClause: any = user.role === 'ADMIN' ? {} : { facultyId: user.id };

    const deadlines = await deps.submissionDeadline.findMany({
      where: whereClause,
      include: {
        subject: true,
        section: true,
      },
      orderBy: { dueDate: 'asc' },
    });

    const now = Date.now();
    const formatted = deadlines.map((d) => {
      let status = 'DRAFT';
      if (d.isFinalized) {
        status = new Date(d.dueDate).getTime() < now ? 'EXPIRED' : 'FINALIZED';
      }
      return {
        ...d,
        status,
      };
    });

    return reply.send(formatted);
  });

  /**
   * GET /api/v1/submissions/deadlines/student
   * Fetch all active & finalized deadlines relevant to the student's enrolled section
   */
  app.get('/api/v1/submissions/deadlines/student', { preHandler: authMiddleware }, async (request, reply) => {
    const user = (request as any).user;
    if (user.role !== 'STUDENT') {
      return reply.status(403).send({ error: { code: 'FORBIDDEN', message: 'Access denied' } });
    }

    // Lookup student's sectionId
    const studentUser = await deps.user.findUnique({
      where: { id: user.id },
      select: { sectionId: true },
    });

    if (!studentUser || !studentUser.sectionId) {
      return reply.send([]);
    }

    const deadlines = await deps.submissionDeadline.findMany({
      where: {
        sectionId: studentUser.sectionId,
        isFinalized: true, // Students only see official finalized deadlines
      },
      include: {
        subject: true,
        section: true,
        faculty: { select: { id: true, name: true, email: true } },
      },
      orderBy: { dueDate: 'asc' },
    });

    const now = Date.now();
    const formatted = deadlines.map((d) => {
      const dueTime = new Date(d.dueDate).getTime();
      const diffMs = dueTime - now;
      const isPastDue = diffMs < 0;

      let urgency = 'NORMAL';
      let countdown = '';

      if (isPastDue) {
        urgency = 'EXPIRED';
        countdown = 'Deadline Passed';
      } else {
        const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
        const diffDays = Math.floor(diffHours / 24);

        if (diffHours < 24) {
          urgency = 'CRITICAL';
          const dueTimeStr = new Date(d.dueDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
          countdown = `Due Today at ${dueTimeStr}`;
        } else if (diffDays === 1) {
          urgency = 'URGENT';
          countdown = 'Due Tomorrow';
        } else {
          countdown = `Due in ${diffDays} days`;
        }
      }

      return {
        ...d,
        urgency,
        countdown,
      };
    });

    return reply.send(formatted);
  });
};

