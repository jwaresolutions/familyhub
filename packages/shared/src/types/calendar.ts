export interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  startTime: string;
  endTime: string;
  allDay: boolean;
  userId: string;
  userName: string;
  userColor: string;
  taskId?: string;
  recurrenceRule?: string;
  recurrenceEnd?: string;
  parentEventId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateEventRequest {
  title: string;
  description?: string;
  startTime: string;
  endTime: string;
  allDay?: boolean;
  userId: string;
  taskId?: string;
  recurrenceRule?: string;
  recurrenceEnd?: string;
}

export type DeleteEventScope = 'single' | 'future' | 'all';
