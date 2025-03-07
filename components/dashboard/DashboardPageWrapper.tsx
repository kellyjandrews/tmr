// components/dashboard/DashboardPageWrapper.tsx
import type { ReactNode } from 'react';
import DashboardLayout from '@/components/dashboard/DashboardLayout';

type DashboardPageWrapperProps = {
  children: ReactNode;
  pageName: string;
};

export default function DashboardPageWrapper({
  children,
  pageName,
}: DashboardPageWrapperProps) {
  return (
    <DashboardLayout pageName={pageName}>
      {children}
    </DashboardLayout>
  );
}