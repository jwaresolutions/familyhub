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
import { TASK_STATUS_ORDER, TASK_STATUS_LABELS, CATEGORY_LABELS } from '@organize/shared';
import { useUsers } from '@/hooks/useUsers';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Select';
import type { Task } from '@organize/shared';

export function KanbanBoard() {
  const [categoryFilter, setCategoryFilter] = useState('');
  const [assigneeFilter, setAssigneeFilter] = useState('');
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [createStatus, setCreateStatus] = useState('BACKLOG');
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
    for (const status of TASK_STATUS_ORDER) {
      grouped[status] = [];
    }
    for (const task of tasks) {
      if (grouped[task.status]) {
        grouped[task.status].push(task);
      }
    }
    for (const status of TASK_STATUS_ORDER) {
      grouped[status].sort((a, b) => a.position - b.position);
    }
    return grouped;
  }, [tasks]);

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

    if ((TASK_STATUS_ORDER as readonly string[]).includes(over.id as string)) {
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
          {TASK_STATUS_ORDER.map(status => (
            <div key={status} className="flex flex-col">
              <KanbanColumn
                status={status}
                label={TASK_STATUS_LABELS[status]}
                tasks={columns[status]}
                onTaskClick={setSelectedTask}
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
