// app/dashboard/layout.tsx
import React, { type ReactNode } from 'react';
import '@/styles/globals.css';


export default async function DashboardLayout({
  children,
}: {
  children: ReactNode;
}) {

  return (
    // You could add a context provider here if you want to share user data,
    // but for now we'll just pass it through as props where needed
    <>
      {children}
    </>
  );
}