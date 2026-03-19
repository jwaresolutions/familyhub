export const TaskStatus = {
  BACKLOG: 'BACKLOG',
  TODO: 'TODO',
  IN_PROGRESS: 'IN_PROGRESS',
  DONE: 'DONE',
} as const;
export type TaskStatus = (typeof TaskStatus)[keyof typeof TaskStatus];

export const Priority = {
  LOW: 'LOW',
  MEDIUM: 'MEDIUM',
  HIGH: 'HIGH',
  URGENT: 'URGENT',
} as const;
export type Priority = (typeof Priority)[keyof typeof Priority];

export const TaskCategory = {
  FAMILY: 'FAMILY',
  WORK: 'WORK',
  APARTMENT: 'APARTMENT',
  HOUSE: 'HOUSE',
  BOAT: 'BOAT',
} as const;
export type TaskCategory = (typeof TaskCategory)[keyof typeof TaskCategory];

export interface Task {
  id: string;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: Priority;
  category: TaskCategory;
  position: number;
  dueDate?: string;
  assignees: { id: string; name: string; color: string }[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateTaskRequest {
  title: string;
  description?: string;
  status?: TaskStatus;
  priority?: Priority;
  category: TaskCategory;
  dueDate?: string;
  assigneeIds?: string[];
}

export interface MoveTaskRequest {
  status: TaskStatus;
  position: number;
}

export interface ReorderRequest {
  items: { id: string; position: number }[];
}
