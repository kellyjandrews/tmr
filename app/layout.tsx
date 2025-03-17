// app/layout.tsx
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import '@/styles/globals.css';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { createSession } from '@/lib/supabase/serverSide';

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
  const supabase = await createSession();

  const { data: userData, error: userError } = await supabase.auth.getUser();
  console.log(userData)
  if (userError || !userData.user) {
      return {
          success: false,
          error: userError?.message || 'Failed to authenticate user'
      };
  }
 

  return (
    <html lang="en">
      <body className={inter.className}>
        <div className="flex flex-col w-full">
          <Header user={userData.user} />
          <main className="flex-grow">
            {children}
          </main>
          <Footer />
        </div>
      </body>
    </html>
  );
}