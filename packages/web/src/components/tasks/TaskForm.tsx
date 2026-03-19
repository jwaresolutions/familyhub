'use client';

import { useState, FormEvent } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Avatar } from '@/components/ui/Avatar';
import { useCreateTask, useUpdateTask, useDeleteTask, useAssignTask, useUnassignTask } from '@/hooks/useTasks';
import { useUsers } from '@/hooks/useUsers';
import { TASK_STATUS_ORDER, TASK_STATUS_LABELS, PRIORITY_LABELS, CATEGORY_LABELS } from '@organize/shared';
import type { Task } from '@organize/shared';

interface TaskFormProps {
  task?: Task | null;
  defaultStatus?: string;
  onClose: () => void;
}

export function TaskForm({ task, defaultStatus, onClose }: TaskFormProps) {
  const [title, setTitle] = useState(task?.title || '');
  const [description, setDescription] = useState(task?.description || '');
  const [status, setStatus] = useState<string>(task?.status || defaultStatus || 'BACKLOG');
  const [priority, setPriority] = useState<string>(task?.priority || 'MEDIUM');
  const [category, setCategory] = useState<string>(task?.category || 'FAMILY');
  const [dueDate, setDueDate] = useState(task?.dueDate ? task.dueDate.split('T')[0] : '');

  const { data: users } = useUsers();
  const createTask = useCreateTask();
  const updateTask = useUpdateTask();
  const deleteTask = useDeleteTask();
  const assignTask = useAssignTask();
  const unassignTask = useUnassignTask();

  const isEditing = !!task;

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;

    if (isEditing) {
      await updateTask.mutateAsync({
        id: task.id,
        title,
        description: description || undefined,
        priority: priority as Task['priority'],
        category: category as Task['category'],
        dueDate: dueDate || undefined,
      });
    } else {
      await createTask.mutateAsync({
        title,
        description: description || undefined,
        status: status as Task['status'],
        priority: priority as Task['priority'],
        category: category as Task['category'],
        dueDate: dueDate ? new Date(dueDate).toISOString() : undefined,
      });
    }
    onClose();
  }

  async function handleDelete() {
    if (task && confirm('Delete this task?')) {
      await deleteTask.mutateAsync(task.id);
      onClose();
    }
  }

  function isAssigned(userId: string) {
    return task?.assignees?.some(a => a.id === userId) || false;
  }

  async function toggleAssignee(userId: string) {
    if (!task) return;
    if (isAssigned(userId)) {
      await unassignTask.mutateAsync({ taskId: task.id, userId });
    } else {
      await assignTask.mutateAsync({ taskId: task.id, userId });
    }
  }

  return (
    <div className="fixed inset-y-0 right-0 z-50 w-full max-w-md bg-white dark:bg-gray-800 shadow-xl border-l border-gray-200 dark:border-gray-700 overflow-y-auto">
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
        <h2 className="text-lg font-semibold">{isEditing ? 'Edit Task' : 'New Task'}</h2>
        <Button variant="ghost" size="sm" onClick={onClose}>✕</Button>
      </div>
      <form onSubmit={handleSubmit} className="p-4 space-y-4">
        <Input label="Title" value={title} onChange={e => setTitle(e.target.value)} autoFocus required />
        <div className="space-y-1">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Description</label>
          <textarea
            className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
            rows={3}
            value={description}
            onChange={e => setDescription(e.target.value)}
          />
        </div>
        {!isEditing && (
          <Select
            label="Status"
            value={status}
            onChange={e => setStatus(e.target.value)}
            options={TASK_STATUS_ORDER.map(s => ({ value: s, label: TASK_STATUS_LABELS[s] }))}
          />
        )}
        <Select
          label="Priority"
          value={priority}
          onChange={e => setPriority(e.target.value)}
          options={Object.entries(PRIORITY_LABELS).map(([v, l]) => ({ value: v, label: l }))}
        />
        <Select
          label="Category"
          value={category}
          onChange={e => setCategory(e.target.value)}
          options={Object.entries(CATEGORY_LABELS).map(([v, l]) => ({ value: v, label: l }))}
        />
        <Input label="Due Date" type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} />

        {isEditing && users && (
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Assignees</label>
            <div className="flex flex-wrap gap-2">
              {users.map(u => (
                <button
                  key={u.id}
                  type="button"
                  onClick={() => toggleAssignee(u.id)}
                  className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-sm border transition-colors ${
                    isAssigned(u.id)
                      ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                      : 'border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
                  }`}
                >
                  <Avatar name={u.name} color={u.color} size="sm" />
                  {u.name}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="flex gap-2 pt-2">
          <Button type="submit" disabled={!title.trim()}>
            {isEditing ? 'Save' : 'Create'}
          </Button>
          <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
          {isEditing && (
            <Button type="button" variant="danger" onClick={handleDelete} className="ml-auto">Delete</Button>
          )}
        </div>
      </form>
    </div>
  );
}
