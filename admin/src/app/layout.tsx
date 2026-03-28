import type { Metadata } from 'next';
import './globals.css';
import Sidebar from '@/components/sidebar';
import { createClient } from '@/lib/supabase-server';

export const metadata: Metadata = {
  title: 'TheCook Admin',
  description: 'Tarif yönetim paneli',
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const isLoggedIn = !!user;

  return (
    <html lang="tr">
      <body className="bg-gray-50 text-gray-900">
        {isLoggedIn ? (
          <div className="flex min-h-screen">
            <Sidebar />
            <main className="flex-1 p-6 overflow-auto">{children}</main>
          </div>
        ) : (
          children
        )}
      </body>
    </html>
  );
}
