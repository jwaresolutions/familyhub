'use client';

import { useAuth } from '@/lib/auth';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { KanbanBoard } from '@/components/tasks/KanbanBoard';

export default function TasksPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !user) router.push('/login');
  }, [isLoading, user, router]);

  if (isLoading) return <div className="flex items-center justify-center min-h-[60vh]">Loading...</div>;
  if (!user) return null;

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Tasks</h1>
      <KanbanBoard />
    </div>
  );
}
