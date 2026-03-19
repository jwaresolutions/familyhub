'use client';

import { useAuth } from '@/lib/auth';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { SavedStops } from '@/components/transit/SavedStops';

export default function TransitPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !user) router.push('/login');
  }, [isLoading, user, router]);

  if (isLoading) return <div className="flex items-center justify-center min-h-[60vh]">Loading...</div>;
  if (!user) return null;

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Transit</h1>
      <p className="text-sm text-gray-500">Real-time bus arrivals for your saved stops. Data refreshes every 30 seconds.</p>
      <SavedStops />
    </div>
  );
}
