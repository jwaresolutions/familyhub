import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import jwt from 'jsonwebtoken';

vi.mock('../db/client', () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
    },
    shoppingList: {
      findFirst: vi.fn(),
      findMany: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    shoppingItem: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      aggregate: vi.fn(),
    },
    shoppingCheck: {
      create: vi.fn(),
    },
    product: {
      upsert: vi.fn(),
      findUnique: vi.fn(),
      findMany: vi.fn(),
    },
    priceRecord: {
      create: vi.fn(),
      findMany: vi.fn(),
    },
    store: {
      findMany: vi.fn(),
      create: vi.fn(),
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

const baseList = {
  id: 'list-1',
  name: 'Groceries',
  archived: false,
  isMain: true,
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
  _count: { items: 3 },
  items: [],
};

const baseProduct = {
  id: 'prod-1',
  name: 'Milk',
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
};

const baseItem = {
  id: 'item-1',
  shoppingListId: 'list-1',
  productId: 'prod-1',
  product: baseProduct,
  quantity: 2,
  unit: 'liters',
  notes: null,
  checked: false,
  position: 0,
  requestedById: 'user-1',
  requestedBy: { id: 'user-1', name: 'Priya' },
  itemStores: [],
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
};

describe('Shopping — /api/v1/shopping', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('GET /lists', () => {
    it('returns all shopping lists with item counts', async () => {
      vi.mocked(prisma.shoppingList.findFirst).mockResolvedValue(baseList as any);
      vi.mocked(prisma.shoppingList.findMany).mockResolvedValue([baseList] as any);

      const res = await request(app)
        .get('/api/v1/shopping/lists')
        .set(authHeader());

      expect(res.status).toBe(200);
      expect(res.body).toHaveLength(1);
      expect(res.body[0].name).toBe('Groceries');
      expect(res.body[0]).toHaveProperty('itemCount');
      expect(res.body[0]).toHaveProperty('checkedCount');
    });
  });

  describe('POST /lists', () => {
    it('creates a new shopping list and returns 201', async () => {
      const newList = { ...baseList, id: 'list-2', name: 'Hardware Store', isMain: false };
      vi.mocked(prisma.shoppingList.create).mockResolvedValue(newList as any);

      const res = await request(app)
        .post('/api/v1/shopping/lists')
        .set(authHeader())
        .send({ name: 'Hardware Store' });

      expect(res.status).toBe(201);
      expect(res.body.name).toBe('Hardware Store');
    });

    it('returns 400 when name is missing', async () => {
      const res = await request(app)
        .post('/api/v1/shopping/lists')
        .set(authHeader())
        .send({});

      expect(res.status).toBe(400);
    });
  });

  describe('GET /lists/:id', () => {
    it('returns items for a specific list', async () => {
      vi.mocked(prisma.shoppingItem.findMany).mockResolvedValue([baseItem] as any);

      const res = await request(app)
        .get('/api/v1/shopping/lists/list-1')
        .set(authHeader());

      expect(res.status).toBe(200);
      expect(res.body).toHaveLength(1);
      expect(res.body[0].product.name).toBe('Milk');
    });
  });

  describe('DELETE /lists/:id', () => {
    it('deletes a non-main list and returns 204 for admin', async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValue(adminUser as any);
      const nonMainList = { ...baseList, id: 'list-2', isMain: false };
      vi.mocked(prisma.shoppingList.findUnique).mockResolvedValue(nonMainList as any);
      vi.mocked(prisma.shoppingList.delete).mockResolvedValue(nonMainList as any);

      const res = await request(app)
        .delete('/api/v1/shopping/lists/list-2')
        .set(authHeader('admin-1'));

      expect(res.status).toBe(204);
    });

    it('returns 400 when trying to delete the main list', async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValue(adminUser as any);
      vi.mocked(prisma.shoppingList.findUnique).mockResolvedValue(baseList as any); // isMain: true

      const res = await request(app)
        .delete('/api/v1/shopping/lists/list-1')
        .set(authHeader('admin-1'));

      expect(res.status).toBe(400);
      expect(res.body.error).toMatch(/Cannot delete the main/);
    });

    it('returns 403 for non-admin user', async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValue(memberUser as any);

      const res = await request(app)
        .delete('/api/v1/shopping/lists/list-1')
        .set(authHeader('user-1'));

      expect(res.status).toBe(403);
    });
  });

  describe('POST /lists/:id/items', () => {
    it('adds an item to a list and returns 201', async () => {
      vi.mocked(prisma.product.upsert).mockResolvedValue(baseProduct as any);
      vi.mocked(prisma.shoppingItem.aggregate).mockResolvedValue({ _max: { position: null } } as any);
      vi.mocked(prisma.shoppingItem.create).mockResolvedValue(baseItem as any);

      const res = await request(app)
        .post('/api/v1/shopping/lists/list-1/items')
        .set(authHeader())
        .send({ productName: 'Milk', quantity: 2, unit: 'liters' });

      expect(res.status).toBe(201);
      expect(res.body.product.name).toBe('Milk');
    });

    it('returns 400 when productName is missing', async () => {
      const res = await request(app)
        .post('/api/v1/shopping/lists/list-1/items')
        .set(authHeader())
        .send({ quantity: 1 });

      expect(res.status).toBe(400);
    });
  });

  describe('POST /items/:id/check', () => {
    it('checks an item off the list', async () => {
      const checkRecord = {
        id: 'check-1',
        shoppingItemId: 'item-1',
        userId: 'user-1',
        price: null,
        storeId: null,
        createdAt: new Date('2024-01-01'),
      };
      vi.mocked(prisma.shoppingItem.update).mockResolvedValue({ ...baseItem, checked: true } as any);
      vi.mocked(prisma.shoppingCheck.create).mockResolvedValue(checkRecord as any);

      const res = await request(app)
        .post('/api/v1/shopping/items/item-1/check')
        .set(authHeader())
        .send({});

      expect(res.status).toBe(200);
      expect(res.body.id).toBe('check-1');
    });

    it('records a price when checking off an item with store', async () => {
      const checkRecord = {
        id: 'check-2',
        shoppingItemId: 'item-1',
        userId: 'user-1',
        price: 3.99,
        storeId: 'store-1',
        createdAt: new Date('2024-01-01'),
      };
      vi.mocked(prisma.shoppingItem.update).mockResolvedValue({ ...baseItem, checked: true } as any);
      vi.mocked(prisma.shoppingCheck.create).mockResolvedValue(checkRecord as any);
      vi.mocked(prisma.shoppingItem.findUnique).mockResolvedValue({ productId: 'prod-1' } as any);
      vi.mocked(prisma.priceRecord.create).mockResolvedValue({} as any);

      const res = await request(app)
        .post('/api/v1/shopping/items/item-1/check')
        .set(authHeader())
        .send({ price: 3.99, storeId: 'store-1' });

      expect(res.status).toBe(200);
      expect(res.body.price).toBe(3.99);
      // Price record should have been created
      expect(prisma.priceRecord.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ price: 3.99, storeId: 'store-1' }),
        })
      );
    });

    it('returns 400 for invalid price (negative)', async () => {
      const res = await request(app)
        .post('/api/v1/shopping/items/item-1/check')
        .set(authHeader())
        .send({ price: -1 });

      expect(res.status).toBe(400);
    });
  });

  describe('PATCH /items/:id', () => {
    it('updates item quantity', async () => {
      const updated = { ...baseItem, quantity: 5 };
      vi.mocked(prisma.shoppingItem.update).mockResolvedValue(updated as any);

      const res = await request(app)
        .patch('/api/v1/shopping/items/item-1')
        .set(authHeader())
        .send({ quantity: 5 });

      expect(res.status).toBe(200);
    });
  });

  describe('DELETE /items/:id', () => {
    it('deletes an item and returns 204 for admin', async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValue(adminUser as any);
      vi.mocked(prisma.shoppingItem.delete).mockResolvedValue(baseItem as any);

      const res = await request(app)
        .delete('/api/v1/shopping/items/item-1')
        .set(authHeader('admin-1'));

      expect(res.status).toBe(204);
    });
  });
});
