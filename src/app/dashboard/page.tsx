'use client';

import { useState } from 'react';
import { ProtectedRoute } from '@/contexts/AuthContext';
import Layout from '@/components/layout/Layout';
import SessionSetup from '@/components/dashboard/SessionSetup';
import AttendanceSession from '@/components/dashboard/AttendanceSession';
import { Student } from '@/data/students';

export default function DashboardPage() {
  const [currentSession, setCurrentSession] = useState<any>(null);
  const [students, setStudents] = useState<Student[]>([]);

  const handleSessionStart = (sessionData: any, studentsData: Student[]) => {
    setCurrentSession(sessionData);
    setStudents(studentsData);
  };

  const handleBackToSetup = () => {
    setCurrentSession(null);
  };

  return (
    <ProtectedRoute>
      <Layout>
        {!currentSession ? (
          <SessionSetup onSessionStart={handleSessionStart} />
        ) : (
          <AttendanceSession 
            sessionData={currentSession} 
            onBack={handleBackToSetup}
            students={students}
          />
        )}
      </Layout>
    </ProtectedRoute>
  );
}