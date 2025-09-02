'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import LoginForm from '@/components/auth/LoginForm';

export default function HomePage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // Check URL parameters for student check-in
    const urlParams = new URLSearchParams(window.location.search);
    const sessionId = urlParams.get('session');
    
    if (sessionId) {
      // Redirect to student check-in page
      router.push(`/checkin?session=${sessionId}`);
      return;
    }

    // If user is authenticated, redirect to dashboard
    if (user && !loading) {
      router.push('/dashboard');
    }
  }, [user, loading, router]);

  // Show loading spinner while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-600 to-purple-700">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
      </div>
    );
  }

  // If user is already authenticated, show loading while redirecting
  if (user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-600 to-purple-700">
        <div className="text-white text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p>Redirecting to dashboard...</p>
        </div>
      </div>
    );
  }

  // Show login form for unauthenticated users
  return (
    <LoginForm 
      onSuccess={() => router.push('/dashboard')} 
    />
  );
}