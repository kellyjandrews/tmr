// app/dashboard/layout.tsx
// import { createSession } from '@/lib/supabase/serverSide';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    // You could add a context provider here if you want to share user data,
    // but for now we'll just pass it through as props where needed
    <>
      {children}
    </>
  );
}