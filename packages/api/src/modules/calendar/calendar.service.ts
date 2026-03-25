import { prisma } from '../../db/client';
import { RRule } from 'rrule';

export const calendarService = {
  async findInRange(start: string, end: string, userId?: string) {
    const startDate = new Date(start);
    const endDate = new Date(end);

    const where: any = {
      OR: [
        // Non-recurring events in range
        {
          recurrenceRule: null,
          startTime: { lte: endDate },
          endTime: { gte: startDate },
        },
        // Recurring events that started before range end
        {
          recurrenceRule: { not: null },
          startTime: { lte: endDate },
        },
      ],
    };
    if (userId) where.userId = userId;

    const events = await prisma.calendarEvent.findMany({
      where,
      include: {
        user: { select: { id: true, name: true, color: true } },
      },
      orderBy: { startTime: 'asc' },
    });

    // Expand recurring events
    const expanded: any[] = [];
    for (const event of events) {
      if (!event.recurrenceRule) {
        expanded.push(formatEvent(event));
        continue;
      }

      try {
        // Set dtstart from the event's stored UTC startTime so occurrences
        // fire at the correct time-of-day. Without this, RRule.fromString
        // defaults dtstart to "now", producing wrong occurrence times.
        const parsedRule = RRule.fromString(event.recurrenceRule);
        const rule = new RRule({
          ...parsedRule.options,
          dtstart: event.startTime,
        });
        const duration = event.endTime.getTime() - event.startTime.getTime();
        const occurrences = rule.between(startDate, endDate, true);

        for (const occurrence of occurrences) {
          expanded.push({
            ...formatEvent(event),
            id: `${event.id}_${occurrence.getTime()}`,
            originalEventId: event.id,
            startTime: occurrence.toISOString(),
            endTime: new Date(occurrence.getTime() + duration).toISOString(),
            isRecurrenceInstance: true,
          });
        }
      } catch {
        // If RRULE parsing fails, include the base event
        expanded.push(formatEvent(event));
      }
    }

    return expanded;
  },

  async findById(id: string) {
    const event = await prisma.calendarEvent.findUnique({
      where: { id },
      include: {
        user: { select: { id: true, name: true, color: true } },
      },
    });
    return event ? formatEvent(event) : null;
  },

  async create(data: {
    title: string;
    description?: string;
    startTime: string;
    endTime: string;
    allDay?: boolean;
    userId: string;
    taskId?: string;
    recurrenceRule?: string;
    recurrenceEnd?: string;
  }) {
    const event = await prisma.calendarEvent.create({
      data: {
        title: data.title,
        description: data.description,
        startTime: new Date(data.startTime),
        endTime: new Date(data.endTime),
        allDay: data.allDay || false,
        userId: data.userId,
        taskId: data.taskId,
        recurrenceRule: data.recurrenceRule,
        recurrenceEnd: data.recurrenceEnd ? new Date(data.recurrenceEnd) : undefined,
      },
      include: {
        user: { select: { id: true, name: true, color: true } },
      },
    });
    return formatEvent(event);
  },

  async update(id: string, data: {
    title?: string;
    description?: string;
    startTime?: string;
    endTime?: string;
    allDay?: boolean;
    recurrenceRule?: string | null;
    recurrenceEnd?: string | null;
  }) {
    const updateData: any = { ...data };
    if (data.startTime) updateData.startTime = new Date(data.startTime);
    if (data.endTime) updateData.endTime = new Date(data.endTime);
    if (data.recurrenceEnd === null) updateData.recurrenceEnd = null;
    else if (data.recurrenceEnd) updateData.recurrenceEnd = new Date(data.recurrenceEnd);

    const event = await prisma.calendarEvent.update({
      where: { id },
      data: updateData,
      include: {
        user: { select: { id: true, name: true, color: true } },
      },
    });
    return formatEvent(event);
  },

  async delete(id: string, scope: 'single' | 'future' | 'all' = 'all') {
    if (scope === 'all') {
      // Delete the event and all exceptions
      await prisma.calendarEvent.deleteMany({ where: { parentEventId: id } });
      await prisma.calendarEvent.delete({ where: { id } });
    } else if (scope === 'single') {
      // For a single instance of a recurring event, create an exception
      // For now, just delete the event itself if it's not recurring
      const event = await prisma.calendarEvent.findUnique({ where: { id } });
      if (event && !event.recurrenceRule) {
        await prisma.calendarEvent.delete({ where: { id } });
      }
      // TODO: For recurring events, add exception date to parent
    } else if (scope === 'future') {
      // Update recurrence end date on parent
      const event = await prisma.calendarEvent.findUnique({ where: { id } });
      if (event && event.recurrenceRule) {
        await prisma.calendarEvent.update({
          where: { id },
          data: { recurrenceEnd: new Date() },
        });
      }
    }
  },
};

function formatEvent(event: any) {
  return {
    id: event.id,
    title: event.title,
    description: event.description,
    startTime: event.startTime.toISOString(),
    endTime: event.endTime.toISOString(),
    allDay: event.allDay,
    userId: event.userId,
    userName: event.user?.name,
    userColor: event.user?.color,
    taskId: event.taskId,
    recurrenceRule: event.recurrenceRule,
    recurrenceEnd: event.recurrenceEnd?.toISOString(),
    parentEventId: event.parentEventId,
    createdAt: event.createdAt.toISOString(),
    updatedAt: event.updatedAt.toISOString(),
  };
}
