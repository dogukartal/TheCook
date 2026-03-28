'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase-browser';

const NAV_ITEMS = [
  { href: '/recipes', label: 'Tarifler', icon: '📋' },
  { href: '/raw-recipes', label: 'Ham Tarifler', icon: '📦' },
  { href: '/generate', label: 'Tarif Oluştur', icon: '✨' },
  { href: '/settings', label: 'Ayarlar', icon: '⚙️' },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  }

  return (
    <aside className="w-56 bg-gray-900 text-white flex flex-col min-h-screen">
      <div className="p-4 border-b border-gray-800">
        <h1 className="text-lg font-bold">TheCook</h1>
        <p className="text-xs text-gray-400">Admin Panel</p>
      </div>

      <nav className="flex-1 p-3 space-y-1">
        {NAV_ITEMS.map((item) => {
          const active = pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors ${
                active
                  ? 'bg-orange-600 text-white'
                  : 'text-gray-300 hover:bg-gray-800 hover:text-white'
              }`}
            >
              <span>{item.icon}</span>
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="p-3 border-t border-gray-800">
        <button
          onClick={handleLogout}
          className="w-full text-left px-3 py-2 rounded-lg text-sm text-gray-400 hover:bg-gray-800 hover:text-white transition-colors"
        >
          Çıkış Yap
        </button>
      </div>
    </aside>
  );
}
