import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import jwt from 'jsonwebtoken';
import type { PrismaClient } from '@prisma/client';

const getJwtSecret = (): string => process.env.JWT_SECRET || 'dev_jwt_secret_classradar_2026';

const authenticateStudent = async (req: FastifyRequest, reply: FastifyReply) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    reply.status(401).send({ error: { code: 'UNAUTHORIZED', message: 'Missing token' } });
    return null;
  }
  try {
    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, getJwtSecret()) as { sub: string; role: string };
    if (decoded.role !== 'STUDENT') {
      reply.status(403).send({ error: { code: 'FORBIDDEN', message: 'Only students can access community threads.' } });
      return null;
    }
    return decoded;
  } catch {
    reply.status(401).send({ error: { code: 'UNAUTHORIZED', message: 'Invalid or expired token' } });
    return null;
  }
};

const createPostSchema = z.object({
  content: z.string().min(1, 'Post content is required').max(1000),
  category: z.enum(['ACADEMIC', 'CAMPUS', 'DOUBT', 'EVENT']).default('ACADEMIC'),
});

const createCommentSchema = z.object({
  content: z.string().min(1, 'Comment cannot be empty').max(500),
});

export const registerCommunityRoutes = (app: FastifyInstance, prisma: PrismaClient) => {
  // GET /api/v1/community/posts — List all campus posts with authors, comments, and likes
  app.get('/api/v1/community/posts', async (req: FastifyRequest, reply: FastifyReply) => {
    const auth = await authenticateStudent(req, reply);
    if (!auth) return;

    const posts = await (prisma as any).campusPost.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        author: {
          select: { id: true, name: true, usn: true, department: true, sectionId: true },
        },
        comments: {
          orderBy: { createdAt: 'asc' },
          include: {
            author: { select: { id: true, name: true, usn: true } },
          },
        },
        likes: {
          select: { userId: true },
        },
      },
    });

    const formatted = posts.map((p: any) => ({
      id: p.id,
      content: p.content,
      category: p.category,
      createdAt: p.createdAt,
      authorName: p.author?.name || 'Student',
      authorUsn: p.author?.usn || '',
      likesCount: p.likes?.length || 0,
      isLiked: p.likes?.some((l: any) => l.userId === auth.sub) || false,
      comments: (p.comments || []).map((c: any) => ({
        id: c.id,
        content: c.content,
        createdAt: c.createdAt,
        authorName: c.author?.name || 'Student',
        authorUsn: c.author?.usn || '',
      })),
    }));

    return reply.send({ success: true, posts: formatted });
  });

  // POST /api/v1/community/posts — Create new post
  app.post('/api/v1/community/posts', async (req: FastifyRequest, reply: FastifyReply) => {
    const auth = await authenticateStudent(req, reply);
    if (!auth) return;

    const parseResult = createPostSchema.safeParse(req.body);
    if (!parseResult.success) {
      return reply.status(400).send({ error: { code: 'VALIDATION_ERROR', details: parseResult.error.errors } });
    }

    const { content, category } = parseResult.data;
    const post = await (prisma as any).campusPost.create({
      data: {
        content,
        category,
        authorId: auth.sub,
      },
      include: {
        author: { select: { id: true, name: true, usn: true } },
      },
    });

    return reply.status(201).send({
      success: true,
      post: {
        id: post.id,
        content: post.content,
        category: post.category,
        createdAt: post.createdAt,
        authorName: post.author?.name,
        authorUsn: post.author?.usn,
        likesCount: 0,
        isLiked: false,
        comments: [],
      },
    });
  });

  // POST /api/v1/community/posts/:postId/comments — Add reply
  app.post('/api/v1/community/posts/:postId/comments', async (req: FastifyRequest<{ Params: { postId: string } }>, reply: FastifyReply) => {
    const auth = await authenticateStudent(req, reply);
    if (!auth) return;

    const { postId } = req.params;
    const parseResult = createCommentSchema.safeParse(req.body);
    if (!parseResult.success) {
      return reply.status(400).send({ error: { code: 'VALIDATION_ERROR', details: parseResult.error.errors } });
    }

    const comment = await (prisma as any).postComment.create({
      data: {
        content: parseResult.data.content,
        postId,
        authorId: auth.sub,
      },
      include: {
        author: { select: { id: true, name: true, usn: true } },
      },
    });

    return reply.status(201).send({
      success: true,
      comment: {
        id: comment.id,
        content: comment.content,
        createdAt: comment.createdAt,
        authorName: comment.author?.name,
        authorUsn: comment.author?.usn,
      },
    });
  });

  // POST /api/v1/community/posts/:postId/like — Toggle like
  app.post('/api/v1/community/posts/:postId/like', async (req: FastifyRequest<{ Params: { postId: string } }>, reply: FastifyReply) => {
    const auth = await authenticateStudent(req, reply);
    if (!auth) return;

    const { postId } = req.params;
    const existing = await (prisma as any).postLike.findUnique({
      where: {
        postId_userId: {
          postId,
          userId: auth.sub,
        },
      },
    });

    if (existing) {
      await (prisma as any).postLike.delete({
        where: { id: existing.id },
      });
      return reply.send({ success: true, liked: false });
    } else {
      await (prisma as any).postLike.create({
        data: {
          postId,
          userId: auth.sub,
        },
      });
      return reply.send({ success: true, liked: true });
    }
  });
};
