'use client';

import { useState, useMemo } from 'react';
import {
  DndContext,
  DragEndEvent,
  DragStartEvent,
  DragOverlay,
  closestCorners,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import { KanbanColumn } from './KanbanColumn';
import { TaskCard } from './TaskCard';
import { TaskForm } from './TaskForm';
import { useTasks, useMoveTask } from '@/hooks/useTasks';
import { TASK_STATUS_ORDER, TASK_STATUS_LABELS, CATEGORY_LABELS, CATEGORY_COLORS } from '@organize/shared';
import { useUsers } from '@/hooks/useUsers';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Select';
import { Badge } from '@/components/ui/Badge';
import type { Task } from '@organize/shared';

const BOARD_STATUSES = ['TODO', 'IN_PROGRESS'] as const;

export function KanbanBoard() {
  const [categoryFilter, setCategoryFilter] = useState('');
  const [assigneeFilter, setAssigneeFilter] = useState('');
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [createStatus, setCreateStatus] = useState('TODO');
  const [activeTask, setActiveTask] = useState<Task | null>(null);

  const { data: tasks = [], isLoading } = useTasks({
    category: categoryFilter || undefined,
    assigneeId: assigneeFilter || undefined,
  });
  const { data: users = [] } = useUsers();
  const moveTask = useMoveTask();

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 5 } })
  );

  const columns = useMemo(() => {
    const grouped: Record<string, Task[]> = {};
    for (const status of BOARD_STATUSES) {
      grouped[status] = [];
    }
    for (const task of tasks) {
      if (grouped[task.status]) {
        grouped[task.status].push(task);
      }
    }
    for (const status of BOARD_STATUSES) {
      grouped[status].sort((a, b) => a.position - b.position);
    }
    return grouped;
  }, [tasks]);

  const doneTasks = useMemo(() =>
    tasks.filter(t => t.status === 'DONE').sort((a, b) => a.position - b.position),
    [tasks]
  );

  function handleDragStart(event: DragStartEvent) {
    const task = tasks.find(t => t.id === event.active.id);
    setActiveTask(task || null);
  }

  function handleDragEnd(event: DragEndEvent) {
    setActiveTask(null);
    const { active, over } = event;
    if (!over) return;

    const taskId = active.id as string;
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    let targetStatus: string;
    let targetPosition: number;

    if ((BOARD_STATUSES as readonly string[]).includes(over.id as string)) {
      targetStatus = over.id as string;
      targetPosition = columns[targetStatus].length;
    } else {
      const overTask = tasks.find(t => t.id === over.id);
      if (!overTask) return;
      targetStatus = overTask.status;
      targetPosition = overTask.position;
    }

    if (task.status === targetStatus && task.position === targetPosition) return;

    moveTask.mutate({ id: taskId, status: targetStatus, position: targetPosition });
  }

  function openCreate(status: string) {
    setCreateStatus(status);
    setShowCreate(true);
  }

  function handleComplete(taskId: string) {
    moveTask.mutate({ id: taskId, status: 'DONE', position: 0 });
  }

  function handleRestore(taskId: string) {
    const todoTasks = columns['TODO'] || [];
    moveTask.mutate({ id: taskId, status: 'TODO', position: todoTasks.length });
  }

  if (isLoading) {
    return <div className="flex items-center justify-center min-h-[60vh]">Loading tasks...</div>;
  }

  return (
    <div className="space-y-4">
      {/* Filter bar */}
      <div className="flex flex-wrap items-center gap-3">
        <Select
          value={categoryFilter}
          onChange={e => setCategoryFilter(e.target.value)}
          options={[
            { value: '', label: 'All Categories' },
            ...Object.entries(CATEGORY_LABELS).map(([v, l]) => ({ value: v, label: l })),
          ]}
        />
        <Select
          value={assigneeFilter}
          onChange={e => setAssigneeFilter(e.target.value)}
          options={[
            { value: '', label: 'All Members' },
            ...users.map(u => ({ value: u.id, label: u.name })),
          ]}
        />
      </div>

      {/* Kanban columns */}
      <div className="flex gap-4 overflow-x-auto overflow-y-auto pb-4 max-h-[calc(100vh-12rem)] md:max-h-[calc(100vh-8rem)]">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          {BOARD_STATUSES.map(status => (
            <div key={status} className="flex flex-col">
              <KanbanColumn
                status={status}
                label={TASK_STATUS_LABELS[status]}
                tasks={columns[status]}
                onTaskClick={setSelectedTask}
                onCompleteTask={handleComplete}
              />
              <Button
                variant="ghost"
                size="sm"
                className="mt-2 w-full text-gray-400"
                onClick={() => openCreate(status)}
              >
                + Add Task
              </Button>
            </div>
          ))}
          <DragOverlay>
            {activeTask && <TaskCard task={activeTask} onClick={() => {}} />}
          </DragOverlay>
        </DndContext>
      </div>

      {/* Completed tasks */}
      {doneTasks.length > 0 && (
        <div className="space-y-2">
          <h3 className="font-semibold text-sm text-gray-700 dark:text-gray-300">
            Completed ({doneTasks.length})
          </h3>
          <div className="space-y-1">
            {doneTasks.map(task => (
              <div
                key={task.id}
                className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-800/50 rounded-lg"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-sm text-gray-500 line-through truncate">{task.title}</span>
                  <Badge label={CATEGORY_LABELS[task.category] || task.category} color={CATEGORY_COLORS[task.category]} />
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => handleRestore(task.id)}
                    className="text-xs text-gray-400 hover:text-primary-600 transition-colors"
                    title="Move back to To Do"
                  >
                    Restore
                  </button>
                  <button
                    onClick={() => setSelectedTask(task)}
                    className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
                    title="Edit task"
                  >
                    Edit
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Task detail / create slide-over */}
      {(selectedTask || showCreate) && (
        <>
          <div
            className="fixed inset-0 bg-black/20 z-40"
            onClick={() => { setSelectedTask(null); setShowCreate(false); }}
          />
          <TaskForm
            task={selectedTask}
            defaultStatus={createStatus}
            onClose={() => { setSelectedTask(null); setShowCreate(false); }}
          />
        </>
      )}
    </div>
  );
}
