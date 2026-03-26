import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import jwt from 'jsonwebtoken';

vi.mock('../db/client', () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
    },
    task: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      updateMany: vi.fn(),
      delete: vi.fn(),
      aggregate: vi.fn(),
    },
    taskAssignment: {
      create: vi.fn(),
      deleteMany: vi.fn(),
    },
    $transaction: vi.fn(),
  },
}));

import app from '../app';
import { prisma } from '../db/client';

const JWT_SECRET = 'test-secret';

function makeToken(userId = 'user-1') {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: '1h' });
}

function authHeader(userId = 'user-1') {
  return { Authorization: `Bearer ${makeToken(userId)}` };
}

const adminUser = { id: 'admin-1', role: 'admin' };
const memberUser = { id: 'user-1', role: 'member' };

const baseTask = {
  id: 'task-1',
  title: 'Fix the bilge pump',
  description: null,
  status: 'TODO',
  priority: 'MEDIUM',
  category: 'BOAT',
  position: 0,
  dueDate: null,
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
  assignments: [],
};

describe('Tasks — /api/v1/tasks', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('GET /', () => {
    it('returns task list with assignees flattened', async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValue(memberUser as any);
      vi.mocked(prisma.task.findMany).mockResolvedValue([baseTask] as any);

      const res = await request(app)
        .get('/api/v1/tasks')
        .set(authHeader());

      expect(res.status).toBe(200);
      expect(res.body).toHaveLength(1);
      expect(res.body[0].title).toBe('Fix the bilge pump');
      expect(res.body[0].assignees).toEqual([]);
      expect(res.body[0]).not.toHaveProperty('assignments');
    });

    it('returns 401 without token', async () => {
      const res = await request(app).get('/api/v1/tasks');
      expect(res.status).toBe(401);
    });
  });

  describe('GET /:id', () => {
    it('returns a single task by id', async () => {
      vi.mocked(prisma.task.findUnique).mockResolvedValue(baseTask as any);

      const res = await request(app)
        .get('/api/v1/tasks/task-1')
        .set(authHeader());

      expect(res.status).toBe(200);
      expect(res.body.id).toBe('task-1');
    });

    it('returns 404 when task does not exist', async () => {
      vi.mocked(prisma.task.findUnique).mockResolvedValue(null);

      const res = await request(app)
        .get('/api/v1/tasks/nonexistent')
        .set(authHeader());

      expect(res.status).toBe(404);
      expect(res.body.error).toBe('Task not found');
    });
  });

  describe('POST /', () => {
    it('creates a task and returns 201', async () => {
      vi.mocked(prisma.task.aggregate).mockResolvedValue({ _max: { position: null } } as any);
      vi.mocked(prisma.task.create).mockResolvedValue(baseTask as any);

      const res = await request(app)
        .post('/api/v1/tasks')
        .set(authHeader())
        .send({ title: 'Fix the bilge pump', category: 'BOAT' });

      expect(res.status).toBe(201);
      expect(res.body.title).toBe('Fix the bilge pump');
    });

    it('returns 400 when required fields are missing', async () => {
      const res = await request(app)
        .post('/api/v1/tasks')
        .set(authHeader())
        .send({ title: 'Missing category' });

      expect(res.status).toBe(400);
    });

    it('returns 400 for invalid category value', async () => {
      const res = await request(app)
        .post('/api/v1/tasks')
        .set(authHeader())
        .send({ title: 'Bad category', category: 'INVALID' });

      expect(res.status).toBe(400);
    });
  });

  describe('PATCH /:id', () => {
    it('updates a task field and returns updated task', async () => {
      const updated = { ...baseTask, title: 'Updated title' };
      vi.mocked(prisma.task.update).mockResolvedValue(updated as any);

      const res = await request(app)
        .patch('/api/v1/tasks/task-1')
        .set(authHeader())
        .send({ title: 'Updated title' });

      expect(res.status).toBe(200);
      expect(res.body.title).toBe('Updated title');
    });
  });

  describe('DELETE /:id', () => {
    it('deletes a task and returns 204 for admin', async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValue(adminUser as any);
      vi.mocked(prisma.task.delete).mockResolvedValue(baseTask as any);

      const res = await request(app)
        .delete('/api/v1/tasks/task-1')
        .set(authHeader('admin-1'));

      expect(res.status).toBe(204);
    });

    it('returns 403 for non-admin user', async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValue(memberUser as any);

      const res = await request(app)
        .delete('/api/v1/tasks/task-1')
        .set(authHeader('user-1'));

      expect(res.status).toBe(403);
    });
  });

  describe('POST /:id/assign', () => {
    it('assigns a user to a task', async () => {
      const assignment = {
        taskId: 'task-1',
        userId: 'user-2',
        user: { id: 'user-2', name: 'Marcus', color: '#10B981' },
      };
      vi.mocked(prisma.taskAssignment.create).mockResolvedValue(assignment as any);

      const res = await request(app)
        .post('/api/v1/tasks/task-1/assign')
        .set(authHeader())
        .send({ userId: 'user-2' });

      expect(res.status).toBe(201);
      expect(res.body.userId).toBe('user-2');
    });

    it('returns 400 when userId is missing from body', async () => {
      const res = await request(app)
        .post('/api/v1/tasks/task-1/assign')
        .set(authHeader())
        .send({});

      expect(res.status).toBe(400);
      expect(res.body.error).toBe('userId required');
    });
  });

  describe('DELETE /:id/assign/:userId', () => {
    it('unassigns a user from a task and returns 204', async () => {
      vi.mocked(prisma.taskAssignment.deleteMany).mockResolvedValue({ count: 1 });

      const res = await request(app)
        .delete('/api/v1/tasks/task-1/assign/user-2')
        .set(authHeader());

      expect(res.status).toBe(204);
    });
  });
});
