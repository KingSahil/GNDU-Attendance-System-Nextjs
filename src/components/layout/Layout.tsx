'use client';

import { ReactNode } from 'react';
import Header from './Header';

interface LayoutProps {
  children: ReactNode;
  title?: string;
  subtitle?: string;
  className?: string;
}

export default function Layout({ 
  children, 
  title, 
  subtitle, 
  className = '' 
}: LayoutProps) {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header title={title} subtitle={subtitle} />
      <main className={`container mx-auto px-4 py-8 text-gray-800 ${className}`}>
        {children}
      </main>
    </div>
  );
}