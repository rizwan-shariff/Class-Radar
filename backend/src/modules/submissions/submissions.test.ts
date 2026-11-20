import { describe, it, expect, vi, beforeEach } from 'vitest';
import Fastify from 'fastify';
import jwt from 'jsonwebtoken';
import { registerSubmissionsRoutes } from './submissions.js';

describe('Submissions Deadlines API', () => {
  const secret = 'dev_jwt_secret_classradar_2026';
  process.env.JWT_SECRET = secret;

  const facultyToken = jwt.sign(
    { sub: 'faculty-1', role: 'FACULTY' },
    secret,
  );

  const otherFacultyToken = jwt.sign(
    { sub: 'faculty-2', role: 'FACULTY' },
    secret,
  );

  const studentToken = jwt.sign(
    { sub: 'student-1', role: 'STUDENT', sectionId: 'sec-1' },
    secret,
  );

  let mockDeps: any;
  let deadlinesStore: any[];

  beforeEach(() => {
    deadlinesStore = [];

    mockDeps = {
      submissionDeadline: {
        create: vi.fn(async ({ data }: any) => {
          const item = { id: `deadline-${deadlinesStore.length + 1}`, ...data };
          deadlinesStore.push(item);
          return item;
        }),
        findUnique: vi.fn(async ({ where }: any) => {
          return deadlinesStore.find((d) => d.id === where.id) || null;
        }),
        findMany: vi.fn(async ({ where }: any) => {
          return deadlinesStore.filter((d) => {
            if (where.facultyId && d.facultyId !== where.facultyId) return false;
            if (where.sectionId && d.sectionId !== where.sectionId) return false;
            if (where.isFinalized !== undefined && d.isFinalized !== where.isFinalized) return false;
            return true;
          });
        }),
        update: vi.fn(async ({ where, data }: any) => {
          const index = deadlinesStore.findIndex((d) => d.id === where.id);
          if (index === -1) return null;
          deadlinesStore[index] = { ...deadlinesStore[index], ...data };
          return deadlinesStore[index];
        }),
      },
      user: {
        findUnique: vi.fn(async ({ where }: any) => {
          if (where.id === 'student-1') return { id: 'student-1', sectionId: 'sec-1' };
          return null;
        }),
      },
      section: {
        findUnique: vi.fn(async () => ({ id: 'sec-1', name: 'CSE-3F' })),
      },
      subject: {
        findUnique: vi.fn(async () => ({ id: 'sub-1', code: '1BCS304', name: 'Data Structures' })),
      },
    };
  });

  it('rejects unauthenticated requests', async () => {
    const app = Fastify();
    registerSubmissionsRoutes(app, mockDeps);

    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/submissions/deadlines',
      payload: {
        subjectId: 'sub-1',
        sectionId: 'sec-1',
        title: 'Project 1',
        dueDate: new Date(Date.now() + 86400000).toISOString(),
      },
    });

    expect(res.statusCode).toBe(401);
  });

  it('allows faculty to create a submission deadline as draft', async () => {
    const app = Fastify();
    registerSubmissionsRoutes(app, mockDeps);

    const futureDate = new Date(Date.now() + 86400000 * 5).toISOString();
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/submissions/deadlines',
      headers: { authorization: `Bearer ${facultyToken}` },
      payload: {
        subjectId: 'sub-1',
        sectionId: 'sec-1',
        title: 'Mini Project Submission',
        description: 'Submit report and code repository',
        dueDate: futureDate,
      },
    });

    expect(res.statusCode).toBe(201);
    const body = res.json();
    expect(body.title).toBe('Mini Project Submission');
    expect(body.isFinalized).toBe(false);
    expect(body.facultyId).toBe('faculty-1');
  });

  it('prevents students from creating deadlines', async () => {
    const app = Fastify();
    registerSubmissionsRoutes(app, mockDeps);

    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/submissions/deadlines',
      headers: { authorization: `Bearer ${studentToken}` },
      payload: {
        subjectId: 'sub-1',
        sectionId: 'sec-1',
        title: 'Student deadline attempt',
        dueDate: new Date(Date.now() + 86400000).toISOString(),
      },
    });

    expect(res.statusCode).toBe(403);
  });

  it('allows faculty to finalize a deadline and locks it', async () => {
    const app = Fastify();
    registerSubmissionsRoutes(app, mockDeps);

    // Seed a draft
    deadlinesStore.push({
      id: 'deadline-101',
      facultyId: 'faculty-1',
      sectionId: 'sec-1',
      subjectId: 'sub-1',
      title: 'Lab Assignment 1',
      dueDate: new Date(Date.now() + 86400000 * 2),
      isFinalized: false,
    });

    const res = await app.inject({
      method: 'PATCH',
      url: '/api/v1/submissions/deadlines/deadline-101/finalize',
      headers: { authorization: `Bearer ${facultyToken}` },
    });

    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.isFinalized).toBe(true);
    expect(body.finalizedAt).toBeDefined();
  });

  it('prevents other faculty from editing or finalizing someone else deadline', async () => {
    const app = Fastify();
    registerSubmissionsRoutes(app, mockDeps);

    deadlinesStore.push({
      id: 'deadline-102',
      facultyId: 'faculty-1',
      sectionId: 'sec-1',
      subjectId: 'sub-1',
      title: 'Lab Assignment 2',
      dueDate: new Date(Date.now() + 86400000 * 2),
      isFinalized: false,
    });

    const res = await app.inject({
      method: 'PATCH',
      url: '/api/v1/submissions/deadlines/deadline-102/finalize',
      headers: { authorization: `Bearer ${otherFacultyToken}` },
    });

    expect(res.statusCode).toBe(403);
  });

  it('students only see finalized deadlines with calculated urgency', async () => {
    const app = Fastify();
    registerSubmissionsRoutes(app, mockDeps);

    // One draft, one finalized
    deadlinesStore.push({
      id: 'd-draft',
      facultyId: 'faculty-1',
      sectionId: 'sec-1',
      subjectId: 'sub-1',
      title: 'Unpublished Assignment',
      dueDate: new Date(Date.now() + 86400000 * 3),
      isFinalized: false,
    });

    deadlinesStore.push({
      id: 'd-final',
      facultyId: 'faculty-1',
      sectionId: 'sec-1',
      subjectId: 'sub-1',
      title: 'Finalized Project Submission',
      dueDate: new Date(Date.now() + 86400000 * 3),
      isFinalized: true,
      finalizedAt: new Date(),
    });

    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/submissions/deadlines/student',
      headers: { authorization: `Bearer ${studentToken}` },
    });

    expect(res.statusCode).toBe(200);
    const list = res.json();
    expect(list.length).toBe(1);
    expect(list[0].id).toBe('d-final');
    expect(list[0].countdown).toBe('Due in 3 days');
  });
});
