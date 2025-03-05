// app/layout.tsx
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import '@/styles/globals.css';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { cookies } from 'next/headers';
import { supabase } from '@/lib/supabase';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: {
    template: '%s | The Magic Resource',
    default: 'The Magic Resource - Magical Marketplace',
  },
  description: 'A peer-to-peer marketplace for magical items and resources',
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Get current user for the header
  let user = null;
  const cookieStore = await cookies();
  const token = cookieStore.get('sb-auth-token')?.value;

  if (token) {
    const { data } = await supabase.auth.getUser(token);
    user = data.user;
  }

  return (
    <html lang="en">
      <body className={inter.className}>
        <div className="flex flex-col min-h-screen">
          <Header user={user} />
          <main className="flex-grow">
            {children}
          </main>
          <Footer />
        </div>
      </body>
    </html>
  );
}