import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '@/contexts/AuthContext';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'GNDU Attendance System',
  description: 'Attendance management system for Guru Nanak Dev University - Department of Computer Engineering & Technology',
  keywords: 'attendance, GNDU, university, computer engineering, student management',
  authors: [{ name: 'GNDU Computer Engineering Department' }],
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        {process.env.NODE_ENV === 'production' && (
          <meta httpEquiv="Content-Security-Policy" 
                content="default-src 'self'; 
                         script-src 'self' 'unsafe-inline' https://www.gstatic.com https://cdn.jsdelivr.net; 
                         connect-src 'self' https://firestore.googleapis.com https://www.googleapis.com https://securetoken.googleapis.com https://www.gstatic.com https://identitytoolkit.googleapis.com; 
                         style-src 'self' 'unsafe-inline'; 
                         img-src 'self' data:; 
                         font-src 'self' data:; 
                         object-src 'none'; 
                         base-uri 'self';" />
        )}
      </head>
      <body className={inter.className}>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}