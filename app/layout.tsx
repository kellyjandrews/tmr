// app/layout.tsx
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import '@/styles/globals.css';
import Navbar from '@/components/Navbar';
import { cookies } from 'next/headers';
import { supabase } from '@/lib/supabase';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: {
    template: '%s | MyApp',
    default: 'MyApp - User Registration System',
  },
  description: 'A simple user registration system built with NextJS and Supabase',
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Get current user for the navbar
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
        <Navbar user={user} />
        <main>
          {children}
        </main>
      </body>
    </html>
  );
}