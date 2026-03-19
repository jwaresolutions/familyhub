'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const navItems = [
  { href: '/', label: 'Home', icon: '◻' },
  { href: '/tasks', label: 'Tasks', icon: '☐' },
  { href: '/calendar', label: 'Cal', icon: '◇' },
  { href: '/shopping', label: 'Shop', icon: '⊡' },
  { href: '/transit', label: 'Bus', icon: '◈' },
];

export function MobileNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 flex items-center justify-around border-t border-gray-200 bg-white py-2 dark:border-gray-700 dark:bg-gray-800 md:hidden">
      {navItems.map(item => {
        const active = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex flex-col items-center gap-0.5 text-xs ${
              active ? 'text-primary-600 dark:text-primary-400' : 'text-gray-500 dark:text-gray-400'
            }`}
          >
            <span className="text-lg">{item.icon}</span>
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
