"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createSavedStopSchema = exports.createStoreSchema = exports.checkItemSchema = exports.createShoppingItemSchema = exports.createShoppingListSchema = exports.createEventSchema = exports.reorderSchema = exports.moveTaskSchema = exports.createTaskSchema = exports.loginSchema = void 0;
const zod_1 = require("zod");
const task_1 = require("./types/task");
// Auth
exports.loginSchema = zod_1.z.object({
    username: zod_1.z.string().min(1).max(50),
    password: zod_1.z.string().min(1).max(100),
});
// Tasks
exports.createTaskSchema = zod_1.z.object({
    title: zod_1.z.string().min(1).max(200),
    description: zod_1.z.string().max(2000).optional(),
    status: zod_1.z.enum([task_1.TaskStatus.BACKLOG, task_1.TaskStatus.TODO, task_1.TaskStatus.IN_PROGRESS, task_1.TaskStatus.DONE]).optional(),
    priority: zod_1.z.enum([task_1.Priority.LOW, task_1.Priority.MEDIUM, task_1.Priority.HIGH, task_1.Priority.URGENT]).optional(),
    category: zod_1.z.enum([task_1.TaskCategory.FAMILY, task_1.TaskCategory.WORK, task_1.TaskCategory.APARTMENT, task_1.TaskCategory.HOUSE, task_1.TaskCategory.BOAT]),
    dueDate: zod_1.z.string().datetime().optional(),
    assigneeIds: zod_1.z.array(zod_1.z.string()).optional(),
});
exports.moveTaskSchema = zod_1.z.object({
    status: zod_1.z.enum([task_1.TaskStatus.BACKLOG, task_1.TaskStatus.TODO, task_1.TaskStatus.IN_PROGRESS, task_1.TaskStatus.DONE]),
    position: zod_1.z.number().int().min(0),
});
exports.reorderSchema = zod_1.z.object({
    items: zod_1.z.array(zod_1.z.object({
        id: zod_1.z.string(),
        position: zod_1.z.number().int().min(0),
    })),
});
// Calendar
exports.createEventSchema = zod_1.z.object({
    title: zod_1.z.string().min(1).max(200),
    description: zod_1.z.string().max(2000).optional(),
    startTime: zod_1.z.string().datetime(),
    endTime: zod_1.z.string().datetime(),
    allDay: zod_1.z.boolean().optional(),
    userId: zod_1.z.string(),
    taskId: zod_1.z.string().optional(),
    recurrenceRule: zod_1.z.string().max(500).optional(),
    recurrenceEnd: zod_1.z.string().datetime().optional(),
});
// Shopping
exports.createShoppingListSchema = zod_1.z.object({
    name: zod_1.z.string().min(1).max(100),
});
exports.createShoppingItemSchema = zod_1.z.object({
    productName: zod_1.z.string().min(1).max(200),
    quantity: zod_1.z.number().int().min(1).optional(),
    unit: zod_1.z.string().max(20).optional(),
    notes: zod_1.z.string().max(500).optional(),
    storeIds: zod_1.z.array(zod_1.z.string()).optional(),
});
exports.checkItemSchema = zod_1.z.object({
    price: zod_1.z.number().positive().optional(),
    storeId: zod_1.z.string().optional(),
});
exports.createStoreSchema = zod_1.z.object({
    name: zod_1.z.string().min(1).max(100),
});
// Transit
exports.createSavedStopSchema = zod_1.z.object({
    stopId: zod_1.z.string().min(1),
    stopName: zod_1.z.string().min(1).max(200),
    routeIds: zod_1.z.array(zod_1.z.string()),
    nickname: zod_1.z.string().max(50).optional(),
});
//# sourceMappingURL=validation.js.map