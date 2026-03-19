'use client';

import { useAuth } from '@/lib/auth';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { useDarkMode } from '@/hooks/useDarkMode';

export function TopBar() {
  const { user, logout } = useAuth();
  const { isDark, toggle } = useDarkMode();

  return (
    <header className="sticky top-0 z-40 flex h-14 items-center justify-between border-b border-gray-200 bg-white px-4 dark:border-gray-700 dark:bg-gray-800 md:px-6">
      <div className="md:hidden">
        <h1 className="text-lg font-bold text-primary-600">Organize</h1>
      </div>
      <div className="flex-1" />
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" onClick={toggle} aria-label="Toggle dark mode">
          {isDark ? '☀️' : '🌙'}
        </Button>
        {user && (
          <div className="flex items-center gap-3">
            <Avatar name={user.name} color={user.color} size="sm" />
            <span className="text-sm font-medium hidden sm:block">{user.name}</span>
            <Button variant="ghost" size="sm" onClick={logout}>Logout</Button>
          </div>
        )}
      </div>
    </header>
  );
}
