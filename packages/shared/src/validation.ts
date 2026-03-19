import { z } from 'zod';
import { TaskStatus, Priority, TaskCategory } from './types/task';

// Auth
export const loginSchema = z.object({
  username: z.string().min(1).max(50),
  password: z.string().min(1).max(100),
});

// Tasks
export const createTaskSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(2000).optional(),
  status: z.enum([TaskStatus.BACKLOG, TaskStatus.TODO, TaskStatus.IN_PROGRESS, TaskStatus.DONE]).optional(),
  priority: z.enum([Priority.LOW, Priority.MEDIUM, Priority.HIGH, Priority.URGENT]).optional(),
  category: z.enum([TaskCategory.FAMILY, TaskCategory.WORK, TaskCategory.APARTMENT, TaskCategory.HOUSE, TaskCategory.BOAT]),
  dueDate: z.string().datetime().optional(),
  assigneeIds: z.array(z.string()).optional(),
});

export const moveTaskSchema = z.object({
  status: z.enum([TaskStatus.BACKLOG, TaskStatus.TODO, TaskStatus.IN_PROGRESS, TaskStatus.DONE]),
  position: z.number().int().min(0),
});

export const reorderSchema = z.object({
  items: z.array(z.object({
    id: z.string(),
    position: z.number().int().min(0),
  })),
});

// Calendar
export const createEventSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(2000).optional(),
  startTime: z.string().datetime(),
  endTime: z.string().datetime(),
  allDay: z.boolean().optional(),
  userId: z.string(),
  taskId: z.string().optional(),
  recurrenceRule: z.string().max(500).optional(),
  recurrenceEnd: z.string().datetime().optional(),
});

// Shopping
export const createShoppingListSchema = z.object({
  name: z.string().min(1).max(100),
});

export const createShoppingItemSchema = z.object({
  productName: z.string().min(1).max(200),
  quantity: z.number().int().min(1).optional(),
  unit: z.string().max(20).optional(),
  notes: z.string().max(500).optional(),
  storeIds: z.array(z.string()).optional(),
});

export const checkItemSchema = z.object({
  price: z.number().positive().optional(),
  storeId: z.string().optional(),
});

export const createStoreSchema = z.object({
  name: z.string().min(1).max(100),
});

// Transit
export const createSavedStopSchema = z.object({
  stopId: z.string().min(1),
  stopName: z.string().min(1).max(200),
  routeIds: z.array(z.string()),
  nickname: z.string().max(50).optional(),
});
