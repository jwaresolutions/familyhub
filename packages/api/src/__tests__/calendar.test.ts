import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import jwt from 'jsonwebtoken';

vi.mock('../db/client', () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
    },
    calendarEvent: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      updateMany: vi.fn(),
      delete: vi.fn(),
      deleteMany: vi.fn(),
    },
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

const baseEvent = {
  id: 'evt-1',
  title: 'Soccer practice',
  description: null,
  startTime: new Date('2024-06-15T14:00:00.000Z'),
  endTime: new Date('2024-06-15T15:30:00.000Z'),
  allDay: false,
  userId: 'user-1',
  taskId: null,
  recurrenceRule: null,
  recurrenceEnd: null,
  parentEventId: null,
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
  user: { id: 'user-1', name: 'Priya', color: '#4F46E5' },
};

describe('Calendar — /api/v1/calendar', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('GET /events', () => {
    it('returns events in range', async () => {
      vi.mocked(prisma.calendarEvent.findMany).mockResolvedValue([baseEvent] as any);

      const res = await request(app)
        .get('/api/v1/calendar/events')
        .query({ start: '2024-06-01T00:00:00.000Z', end: '2024-06-30T23:59:59.000Z' })
        .set(authHeader());

      expect(res.status).toBe(200);
      expect(res.body).toHaveLength(1);
      expect(res.body[0].title).toBe('Soccer practice');
      // Dates are serialized as ISO strings
      expect(res.body[0].startTime).toBe('2024-06-15T14:00:00.000Z');
    });

    it('returns 400 when start/end params are missing', async () => {
      const res = await request(app)
        .get('/api/v1/calendar/events')
        .set(authHeader());

      expect(res.status).toBe(400);
      expect(res.body.error).toMatch(/start and end/);
    });

    it('expands a recurring weekly event into occurrences', async () => {
      // Weekly event starting 2024-06-03, querying a month out
      const recurringEvent = {
        ...baseEvent,
        id: 'evt-recur-1',
        startTime: new Date('2024-06-03T14:00:00.000Z'),
        endTime: new Date('2024-06-03T15:00:00.000Z'),
        recurrenceRule: 'FREQ=WEEKLY;COUNT=4',
      };
      vi.mocked(prisma.calendarEvent.findMany).mockResolvedValue([recurringEvent] as any);

      const res = await request(app)
        .get('/api/v1/calendar/events')
        .query({ start: '2024-06-01T00:00:00.000Z', end: '2024-06-30T23:59:59.000Z' })
        .set(authHeader());

      expect(res.status).toBe(200);
      // 4 weekly occurrences fit in June starting June 3
      expect(res.body.length).toBeGreaterThan(1);
      // Each occurrence carries the originalEventId back-reference
      expect(res.body[0].originalEventId).toBe('evt-recur-1');
      expect(res.body[0].isRecurrenceInstance).toBe(true);
    });

    it('stores times as UTC and returns ISO strings (timezone contract)', async () => {
      vi.mocked(prisma.calendarEvent.findMany).mockResolvedValue([baseEvent] as any);

      const res = await request(app)
        .get('/api/v1/calendar/events')
        .query({ start: '2024-06-01T00:00:00.000Z', end: '2024-06-30T23:59:59.000Z' })
        .set(authHeader());

      expect(res.status).toBe(200);
      // Both times must be ISO 8601 with Z suffix (UTC)
      expect(res.body[0].startTime).toMatch(/Z$/);
      expect(res.body[0].endTime).toMatch(/Z$/);
    });
  });

  describe('GET /events/:id', () => {
    it('returns a single event by id', async () => {
      vi.mocked(prisma.calendarEvent.findUnique).mockResolvedValue(baseEvent as any);

      const res = await request(app)
        .get('/api/v1/calendar/events/evt-1')
        .set(authHeader());

      expect(res.status).toBe(200);
      expect(res.body.id).toBe('evt-1');
    });

    it('returns 404 when event does not exist', async () => {
      vi.mocked(prisma.calendarEvent.findUnique).mockResolvedValue(null);

      const res = await request(app)
        .get('/api/v1/calendar/events/nonexistent')
        .set(authHeader());

      expect(res.status).toBe(404);
      expect(res.body.error).toBe('Event not found');
    });
  });

  describe('POST /events', () => {
    it('creates a one-time event and returns 201', async () => {
      vi.mocked(prisma.calendarEvent.create).mockResolvedValue(baseEvent as any);

      const res = await request(app)
        .post('/api/v1/calendar/events')
        .set(authHeader())
        .send({
          title: 'Soccer practice',
          startTime: '2024-06-15T14:00:00.000Z',
          endTime: '2024-06-15T15:30:00.000Z',
          userId: 'user-1',
        });

      expect(res.status).toBe(201);
      expect(res.body.title).toBe('Soccer practice');
    });

    it('creates a recurring event with an RRULE and returns 201', async () => {
      const recurringEvent = {
        ...baseEvent,
        recurrenceRule: 'FREQ=WEEKLY;BYDAY=MO,WE,FR',
      };
      vi.mocked(prisma.calendarEvent.create).mockResolvedValue(recurringEvent as any);

      const res = await request(app)
        .post('/api/v1/calendar/events')
        .set(authHeader())
        .send({
          title: 'Soccer practice',
          startTime: '2024-06-15T14:00:00.000Z',
          endTime: '2024-06-15T15:30:00.000Z',
          userId: 'user-1',
          recurrenceRule: 'FREQ=WEEKLY;BYDAY=MO,WE,FR',
        });

      expect(res.status).toBe(201);
      expect(res.body.recurrenceRule).toBe('FREQ=WEEKLY;BYDAY=MO,WE,FR');
    });

    it('returns 400 when required fields are missing', async () => {
      const res = await request(app)
        .post('/api/v1/calendar/events')
        .set(authHeader())
        .send({ title: 'No times provided', userId: 'user-1' });

      expect(res.status).toBe(400);
    });
  });

  describe('PATCH /events/:id', () => {
    it('updates an event and returns the updated document', async () => {
      const updated = { ...baseEvent, title: 'Updated practice' };
      vi.mocked(prisma.calendarEvent.update).mockResolvedValue(updated as any);

      const res = await request(app)
        .patch('/api/v1/calendar/events/evt-1')
        .set(authHeader())
        .send({ title: 'Updated practice' });

      expect(res.status).toBe(200);
      expect(res.body.title).toBe('Updated practice');
    });
  });

  describe('DELETE /events/:id', () => {
    it('deletes an event and returns 204 for admin', async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValue(adminUser as any);
      vi.mocked(prisma.calendarEvent.findUnique).mockResolvedValue(baseEvent as any);
      vi.mocked(prisma.calendarEvent.deleteMany).mockResolvedValue({ count: 0 });
      vi.mocked(prisma.calendarEvent.delete).mockResolvedValue(baseEvent as any);

      const res = await request(app)
        .delete('/api/v1/calendar/events/evt-1')
        .set(authHeader('admin-1'));

      expect(res.status).toBe(204);
    });

    it('returns 403 for non-admin user', async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValue(memberUser as any);

      const res = await request(app)
        .delete('/api/v1/calendar/events/evt-1')
        .set(authHeader('user-1'));

      expect(res.status).toBe(403);
    });
  });
});
