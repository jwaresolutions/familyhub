'use client';

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Avatar } from '@/components/ui/Avatar';
import { PRIORITY_LABELS, CATEGORY_LABELS, CATEGORY_COLORS } from '@organize/shared';
import type { Task } from '@organize/shared';

interface TaskCardProps {
  task: Task;
  onClick: () => void;
}

export function TaskCard({ task, onClick }: TaskCardProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: task.id,
    data: { task },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <Card
        className="cursor-grab active:cursor-grabbing hover:shadow-md transition-shadow mb-2"
        onClick={onClick}
      >
        <div className="space-y-2">
          <p className="font-medium text-sm leading-snug">{task.title}</p>
          <div className="flex flex-wrap gap-1">
            <Badge label={CATEGORY_LABELS[task.category] || task.category} color={CATEGORY_COLORS[task.category]} />
            {task.priority !== 'MEDIUM' && (
              <Badge
                label={PRIORITY_LABELS[task.priority] || task.priority}
                color={task.priority === 'URGENT' ? '#EF4444' : task.priority === 'HIGH' ? '#F59E0B' : '#6B7280'}
              />
            )}
          </div>
          {task.dueDate && (
            <p className="text-xs text-gray-500">
              Due {new Date(task.dueDate).toLocaleDateString()}
            </p>
          )}
          {task.assignees && task.assignees.length > 0 && (
            <div className="flex -space-x-1">
              {task.assignees.map(a => (
                <Avatar key={a.id} name={a.name} color={a.color} size="sm" />
              ))}
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
