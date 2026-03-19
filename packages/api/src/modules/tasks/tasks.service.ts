import { prisma } from '../../db/client';

export const tasksService = {
  async findAll(filters: { status?: string; category?: string; assigneeId?: string }) {
    const where: any = {};
    if (filters.status) where.status = filters.status;
    if (filters.category) where.category = filters.category;
    if (filters.assigneeId) {
      where.assignments = { some: { userId: filters.assigneeId } };
    }

    return prisma.task.findMany({
      where,
      include: {
        assignments: {
          include: { user: { select: { id: true, name: true, color: true } } },
        },
      },
      orderBy: [{ status: 'asc' }, { position: 'asc' }],
    });
  },

  async findById(id: string) {
    return prisma.task.findUnique({
      where: { id },
      include: {
        assignments: {
          include: { user: { select: { id: true, name: true, color: true } } },
        },
      },
    });
  },

  async create(data: {
    title: string;
    description?: string;
    status?: string;
    priority?: string;
    category: string;
    dueDate?: string;
    assigneeIds?: string[];
  }) {
    // Get the next position for the status column
    const maxPos = await prisma.task.aggregate({
      where: { status: data.status || 'BACKLOG' },
      _max: { position: true },
    });
    const position = (maxPos._max.position ?? -1) + 1;

    return prisma.task.create({
      data: {
        title: data.title,
        description: data.description,
        status: data.status || 'BACKLOG',
        priority: data.priority || 'MEDIUM',
        category: data.category,
        position,
        dueDate: data.dueDate ? new Date(data.dueDate) : undefined,
        assignments: data.assigneeIds?.length
          ? { create: data.assigneeIds.map(userId => ({ userId })) }
          : undefined,
      },
      include: {
        assignments: {
          include: { user: { select: { id: true, name: true, color: true } } },
        },
      },
    });
  },

  async update(id: string, data: {
    title?: string;
    description?: string;
    priority?: string;
    category?: string;
    dueDate?: string | null;
  }) {
    return prisma.task.update({
      where: { id },
      data: {
        ...data,
        dueDate: data.dueDate === null ? null : data.dueDate ? new Date(data.dueDate) : undefined,
      },
      include: {
        assignments: {
          include: { user: { select: { id: true, name: true, color: true } } },
        },
      },
    });
  },

  async delete(id: string) {
    return prisma.task.delete({ where: { id } });
  },

  async move(id: string, status: string, position: number) {
    // Shift other tasks in the target column to make room
    await prisma.task.updateMany({
      where: { status, position: { gte: position } },
      data: { position: { increment: 1 } },
    });

    return prisma.task.update({
      where: { id },
      data: { status, position },
      include: {
        assignments: {
          include: { user: { select: { id: true, name: true, color: true } } },
        },
      },
    });
  },

  async reorder(items: { id: string; position: number }[]) {
    await prisma.$transaction(
      items.map(item =>
        prisma.task.update({ where: { id: item.id }, data: { position: item.position } })
      )
    );
  },

  async addAssignee(taskId: string, userId: string) {
    return prisma.taskAssignment.create({
      data: { taskId, userId },
      include: { user: { select: { id: true, name: true, color: true } } },
    });
  },

  async removeAssignee(taskId: string, userId: string) {
    return prisma.taskAssignment.deleteMany({
      where: { taskId, userId },
    });
  },
};
