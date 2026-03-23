'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/lib/auth';

const navItems = [
  { href: '/', label: 'Dashboard', icon: '◻' },
  { href: '/tasks', label: 'Tasks', icon: '☐' },
  { href: '/calendar', label: 'Calendar', icon: '◇' },
  { href: '/shopping', label: 'Shopping', icon: '⊡' },
  { href: '/transit', label: 'Transit', icon: '◈' },
];

const adminItem = { href: '/admin', label: 'Admin', icon: '⚙' };
const settingsItem = { href: '/settings', label: 'Settings', icon: '◎' };

export function Sidebar() {
  const pathname = usePathname();
  const { user } = useAuth();

  const items = user?.role === 'admin' ? [...navItems, adminItem, settingsItem] : [...navItems, settingsItem];

  return (
    <aside className="hidden md:flex md:w-64 md:flex-col md:border-r border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 h-screen sticky top-0">
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <h1 className="text-xl font-bold text-primary-600">Organize</h1>
      </div>
      <nav className="flex-1 p-3 space-y-1">
        {items.map(item => {
          const active = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                active
                  ? 'bg-primary-50 text-primary-700 dark:bg-primary-900/20 dark:text-primary-400'
                  : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700'
              }`}
            >
              <span className="text-lg">{item.icon}</span>
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
