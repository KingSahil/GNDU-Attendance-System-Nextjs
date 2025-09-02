'use client';

import { useAuth } from '@/contexts/AuthContext';

interface HeaderProps {
  title?: string;
  subtitle?: string;
}

export default function Header({ 
  title = "GNDU Attendance System", 
  subtitle = "Department of Computer Engineering & Technology" 
}: HeaderProps) {
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    if (confirm('Are you sure you want to logout?')) {
      try {
        await logout();
      } catch (error) {
        console.error('Error signing out:', error);
        alert('Error signing out. Please try again.');
      }
    }
  };

  return (
    <header className="bg-gradient-to-r from-blue-600 to-blue-800 text-white p-6 relative">
      <div className="text-center">
        <h1 className="text-3xl md:text-4xl font-light mb-2">{title}</h1>
        <p className="text-lg opacity-90">{subtitle}</p>
      </div>
      
      {user && (
        <button
          onClick={handleLogout}
          className="absolute top-4 right-4 bg-white bg-opacity-20 hover:bg-opacity-30 
                     text-white px-4 py-2 rounded-md transition-all duration-200 
                     text-sm font-medium"
        >
          Logout
        </button>
      )}
    </header>
  );
}