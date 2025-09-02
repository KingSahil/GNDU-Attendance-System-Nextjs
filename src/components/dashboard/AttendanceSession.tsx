'use client';

import { useState, useEffect } from 'react';
import { 
  collection, 
  addDoc, 
  onSnapshot, 
  query, 
  where, 
  orderBy, 
  updateDoc,
  doc,
  Timestamp 
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Student } from '@/data/students';
import { copyToClipboard, showNotification, formatTime, isSessionExpired } from '@/utils/helpers';
import { exportToExcel, exportToPDF, printAttendance } from '@/utils/export';
import AttendanceTable from './AttendanceTable';

interface AttendanceSessionProps {
  sessionData: any;
  onBack: () => void;
  students: Student[];
}

interface AttendanceRecord {
  id: string;
  name: string;
  father: string;
  status: 'Present' | 'Absent';
  checkInTime?: string;
}

export default function AttendanceSession({ sessionData, onBack, students }: AttendanceSessionProps) {
  const [attendance, setAttendance] = useState<{ [key: string]: any }>({});
  const [searchTerm, setSearchTerm] = useState('');
  const [expired, setExpired] = useState(false);
  const [stats, setStats] = useState({
    total: students.length,
    present: 0,
    absent: students.length,
    percentage: 0
  });

  const checkinUrl = `${window.location.origin}/checkin?session=${sessionData.sessionId}`;

  useEffect(() => {
    // Check if session is expired
    if (isSessionExpired(sessionData)) {
      setExpired(true);
      return;
    }

    // Listen to attendance updates
    const attendanceQuery = query(
      collection(db, 'attendanceSessions', sessionData.sessionId, 'attendance'),
      orderBy('timestamp', 'desc')
    );

    const unsubscribe = onSnapshot(attendanceQuery, (snapshot) => {
      const attendanceData: { [key: string]: any } = {};
      
      snapshot.docs.forEach((doc) => {
        const data = doc.data();
        attendanceData[data.studentId] = {
          ...data,
          id: doc.id
        };
      });

      setAttendance(attendanceData);
      
      // Update stats
      const presentCount = Object.keys(attendanceData).length;
      const absentCount = students.length - presentCount;
      const percentage = Math.round((presentCount / students.length) * 100);

      setStats({
        total: students.length,
        present: presentCount,
        absent: absentCount,
        percentage
      });
    });

    // Set up expiry timer
    const expiryTimer = setTimeout(() => {
      setExpired(true);
      showNotification('Session has expired', 'info');
    }, sessionData.expiryTime - Date.now());

    return () => {
      unsubscribe();
      clearTimeout(expiryTimer);
    };
  }, [sessionData]);

  const handleCopyLink = async () => {
    const success = await copyToClipboard(checkinUrl);
    if (success) {
      showNotification('Link copied to clipboard!', 'success');
    } else {
      showNotification('Failed to copy link', 'error');
    }
  };

  const handleShareWhatsApp = () => {
    const message = encodeURIComponent(`Join attendance session for ${sessionData.subject}:\n${checkinUrl}`);
    window.open(`https://wa.me/?text=${message}`, '_blank');
  };

  const handleExpireSession = async () => {
    if (confirm('Are you sure you want to expire this session? Students will no longer be able to mark attendance.')) {
      try {
        // Update session in Firestore to mark as expired
        await updateDoc(doc(db, 'attendanceSessions', sessionData.sessionId), {
          active: false,
          expiredAt: Timestamp.now()
        });
        
        setExpired(true);
        showNotification('Session expired successfully', 'success');
      } catch (error) {
        console.error('Error expiring session:', error);
        showNotification('Error expiring session', 'error');
      }
    }
  };

  const getAttendanceRecords = (): AttendanceRecord[] => {
    const filteredStudents = students.filter(student =>
      student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.father.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.id.includes(searchTerm)
    );

    return filteredStudents.map(student => ({
      id: student.id,
      name: student.name,
      father: student.father,
      status: attendance[student.id] ? 'Present' : 'Absent',
      checkInTime: attendance[student.id]?.timestamp ? 
        formatTime(new Date(attendance[student.id].timestamp.seconds * 1000)) : 
        undefined
    }));
  };

  const handleExportExcel = async () => {
    try {
      await exportToExcel(getAttendanceRecords(), {
        date: sessionData.date,
        subject: sessionData.subject,
        secretCode: sessionData.secretCode
      });
      showNotification('Excel file downloaded successfully!', 'success');
    } catch (error) {
      showNotification('Error exporting to Excel', 'error');
    }
  };

  const handleExportPDF = async () => {
    try {
      await exportToPDF(getAttendanceRecords(), {
        date: sessionData.date,
        subject: sessionData.subject,
        secretCode: sessionData.secretCode
      });
      showNotification('PDF file downloaded successfully!', 'success');
    } catch (error) {
      showNotification('Error exporting to PDF', 'error');
    }
  };

  const handlePrint = () => {
    printAttendance(getAttendanceRecords(), {
      date: sessionData.date,
      subject: sessionData.subject,
      secretCode: sessionData.secretCode
    });
  };

  return (
    <div className="space-y-6">
      {/* Session Info */}
      <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl p-6">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h2 className="text-2xl font-bold mb-2">📚 Current Session</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div>
                <strong>Subject:</strong> {sessionData.subject}
              </div>
              <div>
                <strong>Date:</strong> {sessionData.date}
              </div>
              <div>
                <strong>Code:</strong> {sessionData.secretCode}
              </div>
            </div>
          </div>
          <button
            onClick={onBack}
            className="bg-white bg-opacity-20 hover:bg-opacity-30 px-4 py-2 rounded-lg transition-colors"
          >
            ← Back to Setup
          </button>
        </div>

        {/* Secret Code Display */}
        <div className="bg-white bg-opacity-20 rounded-lg p-4 text-center">
          <p className="text-sm opacity-90 mb-2">Secret Code for Students:</p>
          <div className="bg-white bg-opacity-30 rounded-lg p-3 text-2xl font-bold tracking-wider border-2 border-dashed border-white border-opacity-50">
            {sessionData.secretCode}
          </div>
        </div>
      </div>

      {/* Link Sharing Section */}
      <div className="bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-xl p-6">
        <h3 className="text-lg font-bold mb-4">🔗 Student Check-in Link</h3>
        <p className="mb-4 opacity-90">Share this link with students to mark their attendance</p>
        
        <div className="bg-white bg-opacity-20 rounded-lg p-4 mb-4">
          <div 
            className="bg-white text-gray-800 p-3 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors font-mono text-sm break-all"
            onClick={handleCopyLink}
            title="Click to copy link"
          >
            {checkinUrl}
          </div>
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            onClick={handleCopyLink}
            className="bg-white text-orange-600 px-4 py-2 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
          >
            📋 Copy Link
          </button>
          <button
            onClick={handleShareWhatsApp}
            className="bg-white text-orange-600 px-4 py-2 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
          >
            📱 Share on WhatsApp
          </button>
          {!expired && (
            <button
              onClick={handleExpireSession}
              className="bg-red-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-red-700 transition-colors"
            >
              ⏰ Expire Session
            </button>
          )}
        </div>

        {expired && (
          <div className="mt-4 bg-red-100 border border-red-300 text-red-800 p-3 rounded-lg">
            ⚠️ This attendance session has expired. Students can no longer mark attendance.
          </div>
        )}
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="stat-card">
          <div className="stat-number">{stats.total}</div>
          <div className="stat-label">Total Students</div>
        </div>
        <div className="stat-card">
          <div className="stat-number text-green-600">{stats.present}</div>
          <div className="stat-label">Present</div>
        </div>
        <div className="stat-card">
          <div className="stat-number text-red-600">{stats.absent}</div>
          <div className="stat-label">Absent</div>
        </div>
        <div className="stat-card">
          <div className="stat-number text-blue-600">{stats.percentage}%</div>
          <div className="stat-label">Attendance</div>
        </div>
      </div>

      {/* Controls */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search students by name, father's name, or ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 
                       focus:ring-0 transition-colors duration-200"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={handlePrint}
              className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
            >
              🖨️ Print
            </button>
            <button
              onClick={handleExportExcel}
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
            >
              📥 Export Excel
            </button>
            <button
              onClick={handleExportPDF}
              className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
            >
              📄 Export PDF
            </button>
          </div>
        </div>
      </div>

      {/* Attendance Table */}
      <AttendanceTable 
        records={getAttendanceRecords()}
        searchTerm={searchTerm}
        students={students}
      />
    </div>
  );
}