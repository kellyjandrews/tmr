// app/layout.tsx
import React, { type ReactNode } from 'react';
import { Inter } from 'next/font/google';
import '@/styles/globals.css';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { createSession } from '@/utils/supabase/serverSide';
import type { Metadata } from 'next';

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
  children: ReactNode
}) {
  // Get current user for the header
  // Get the session server-side
  const supabase = await createSession();
  const { data } = await supabase.auth.getUser(); 
  const user = data.user;

  return (
    <html lang="en">
      <body className={inter.className}>
        <div className="flex flex-col w-full">
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