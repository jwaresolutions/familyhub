import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import jwt from 'jsonwebtoken';

// Mock prisma before importing app so the module substitution takes effect
vi.mock('../db/client', () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
  },
}));

// Mock bcrypt so tests don't pay the hash cost
vi.mock('bcrypt', () => ({
  default: {
    compare: vi.fn(),
    hash: vi.fn(),
  },
  compare: vi.fn(),
  hash: vi.fn(),
}));

import app from '../app';
import { prisma } from '../db/client';
import bcrypt from 'bcrypt';

const JWT_SECRET = 'test-secret';

function makeToken(userId: string) {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: '1h' });
}

const mockUser = {
  id: 'user-1',
  username: 'priya',
  password: '$2b$10$hashedpassword',
  name: 'Priya Sharma',
  color: '#4F46E5',
  avatarUrl: null,
  role: 'member',
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
};

describe('Auth — /api/v1/auth', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('POST /login', () => {
    it('returns token + user on valid credentials', async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser as any);
      vi.mocked(bcrypt.compare).mockResolvedValue(true as never);

      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({ username: 'priya', password: 'correct-password' });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('token');
      expect(res.body).toHaveProperty('refreshToken');
      expect(res.body.user.username).toBe('priya');
      // password must not leak
      expect(res.body.user).not.toHaveProperty('password');
    });

    it('returns 401 when user not found', async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValue(null);
      vi.mocked(bcrypt.compare).mockResolvedValue(false as never);

      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({ username: 'ghost', password: 'whatever' });

      expect(res.status).toBe(401);
      expect(res.body.error).toBe('Invalid credentials');
    });

    it('returns 401 when password is wrong', async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser as any);
      vi.mocked(bcrypt.compare).mockResolvedValue(false as never);

      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({ username: 'priya', password: 'wrong-password' });

      expect(res.status).toBe(401);
      expect(res.body.error).toBe('Invalid credentials');
    });

    it('returns 400 when body is missing required fields', async () => {
      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({ username: 'priya' }); // no password

      expect(res.status).toBe(400);
    });
  });

  describe('GET /me', () => {
    it('returns current user for valid token', async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser as any);

      const res = await request(app)
        .get('/api/v1/auth/me')
        .set('Authorization', `Bearer ${makeToken('user-1')}`);

      expect(res.status).toBe(200);
      expect(res.body.id).toBe('user-1');
    });

    it('returns 401 with no Authorization header', async () => {
      const res = await request(app).get('/api/v1/auth/me');
      expect(res.status).toBe(401);
      expect(res.body.error).toBe('Missing token');
    });

    it('returns 401 with a tampered token', async () => {
      const res = await request(app)
        .get('/api/v1/auth/me')
        .set('Authorization', 'Bearer not.a.real.token');

      expect(res.status).toBe(401);
      expect(res.body.error).toBe('Invalid token');
    });

    it('returns 401 with a token signed by the wrong secret', async () => {
      const badToken = jwt.sign({ userId: 'user-1' }, 'wrong-secret');

      const res = await request(app)
        .get('/api/v1/auth/me')
        .set('Authorization', `Bearer ${badToken}`);

      expect(res.status).toBe(401);
      expect(res.body.error).toBe('Invalid token');
    });

    it('returns 404 when token is valid but user no longer exists', async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValue(null);

      const res = await request(app)
        .get('/api/v1/auth/me')
        .set('Authorization', `Bearer ${makeToken('deleted-user')}`);

      expect(res.status).toBe(404);
    });
  });
});
