export const TASK_STATUS_LABELS: Record<string, string> = {
  BACKLOG: 'Backlog',
  TODO: 'To Do',
  IN_PROGRESS: 'In Progress',
  DONE: 'Done',
};

export const TASK_STATUS_ORDER = ['BACKLOG', 'TODO', 'IN_PROGRESS', 'DONE'] as const;

export const PRIORITY_LABELS: Record<string, string> = {
  LOW: 'Low',
  MEDIUM: 'Medium',
  HIGH: 'High',
  URGENT: 'Urgent',
};

export const CATEGORY_LABELS: Record<string, string> = {
  FAMILY: 'Family',
  WORK: 'Work',
  APARTMENT: 'Apartment',
  HOUSE: 'House',
  BOAT: 'Boat',
};

export const CATEGORY_COLORS: Record<string, string> = {
  FAMILY: '#8B5CF6',
  WORK: '#3B82F6',
  APARTMENT: '#10B981',
  HOUSE: '#F59E0B',
  BOAT: '#06B6D4',
};
