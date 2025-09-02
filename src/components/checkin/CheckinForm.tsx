'use client';

import { useState, useEffect } from 'react';
import { 
  collection, 
  doc, 
  getDoc, 
  addDoc, 
  query, 
  where, 
  getDocs,
  Timestamp 
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { students } from '@/data/students';
import { isSessionExpired, formatTime, showNotification } from '@/utils/helpers';
import { getStudentByRollNumber, isValidRollNumber } from '@/utils/rollNumber';
import LocationStatus from './LocationStatus';

interface CheckinFormProps {
  sessionId: string;
  onSuccess?: () => void;
}

export default function CheckinForm({ sessionId, onSuccess }: CheckinFormProps) {
  const [sessionData, setSessionData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [expired, setExpired] = useState(false);
  const [locationVerified, setLocationVerified] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });

  // Form fields
  const [secretCode, setSecretCode] = useState('');
  const [rollNumber, setRollNumber] = useState('');
  const [studentName, setStudentName] = useState('');

  useEffect(() => {
    loadSession();
  }, [sessionId]);

  const loadSession = async () => {
    try {
      // Get session data from Firestore
      const sessionQuery = query(
        collection(db, 'attendanceSessions'),
        where('sessionId', '==', sessionId)
      );
      
      const sessionSnapshot = await getDocs(sessionQuery);
      
      if (!sessionSnapshot.empty) {
        const session = sessionSnapshot.docs[0].data();
        setSessionData(session);
        
        // Check if session is expired
        if (isSessionExpired(session)) {
          setExpired(true);
        }
      } else {
        setMessage({ text: 'Session not found or invalid.', type: 'error' });
      }
    } catch (error) {
      console.error('Error loading session:', error);
      setMessage({ text: 'Error loading session data.', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleLocationVerified = (verified: boolean, distance?: number) => {
    setLocationVerified(verified);
  };

  const validateForm = () => {
    if (!secretCode.trim()) {
      setMessage({ text: 'Please enter the secret code', type: 'error' });
      return false;
    }
    
    if (!rollNumber.trim()) {
      setMessage({ text: 'Please enter your Roll Number', type: 'error' });
      return false;
    }
    
    if (!studentName.trim()) {
      setMessage({ text: 'Please enter your Full Name', type: 'error' });
      return false;
    }

    if (!locationVerified) {
      setMessage({ text: 'Location verification required', type: 'error' });
      return false;
    }

    // Validate secret code
    if (secretCode.toUpperCase() !== sessionData?.secretCode) {
      setMessage({ text: 'Invalid secret code. Please check with your teacher.', type: 'error' });
      return false;
    }

    // Validate roll number format
    if (!isValidRollNumber(rollNumber, students.length)) {
      setMessage({ text: 'Invalid roll number. Please check your roll number.', type: 'error' });
      return false;
    }

    // Validate student exists
    const student = getStudentByRollNumber(parseInt(rollNumber), students);
    if (!student) {
      setMessage({ text: 'Roll number not found in the system.', type: 'error' });
      return false;
    }

    // Validate name matches
    if (student.name.toLowerCase().trim() !== studentName.toLowerCase().trim()) {
      setMessage({ 
        text: `Name mismatch. Expected: ${student.name}. Please enter the exact name.`, 
        type: 'error' 
      });
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setSubmitting(true);
    setMessage({ text: '', type: '' });

    try {
      // Get student data from roll number
      const student = getStudentByRollNumber(parseInt(rollNumber), students);
      
      if (!student) {
        setMessage({ text: 'Invalid roll number.', type: 'error' });
        setSubmitting(false);
        return;
      }

      // Check if already marked present using student ID
      const attendanceQuery = query(
        collection(db, 'attendanceSessions', sessionId, 'attendance'),
        where('studentId', '==', student.id)
      );
      
      const existingAttendance = await getDocs(attendanceQuery);
      
      if (!existingAttendance.empty) {
        setMessage({ text: 'You have already marked your attendance for this session.', type: 'error' });
        setSubmitting(false);
        return;
      }

      // Get student data
      // Student data is already retrieved above
      
      // Mark attendance
      await addDoc(collection(db, 'attendanceSessions', sessionId, 'attendance'), {
        studentId: student.id,
        rollNumber: parseInt(rollNumber),
        name: student.name,
        father: student.father || '',
        timestamp: Timestamp.now(),
        sessionId,
        subjectCode: sessionData.subjectCode,
        subjectName: sessionData.subject,
        date: sessionData.date
      });

      setMessage({ 
        text: '✅ Attendance marked successfully! You can now close this page.', 
        type: 'success' 
      });
      
      showNotification('Attendance marked successfully!', 'success');
      onSuccess?.();
      
      // Clear form
      setSecretCode('');
      setRollNumber('');
      setStudentName('');
      
    } catch (error) {
      console.error('Error marking attendance:', error);
      setMessage({ text: 'Error marking attendance. Please try again.', type: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-100 to-blue-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading session...</p>
        </div>
      </div>
    );
  }

  if (expired || !sessionData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-100 to-orange-100 px-4">
        <div className="max-w-md w-full">
          <div className="bg-white rounded-2xl shadow-2xl p-8 text-center">
            <div className="text-6xl mb-4">⚠️</div>
            <h1 className="text-2xl font-bold text-red-600 mb-4">Session Expired</h1>
            <p className="text-gray-600 mb-6">
              This attendance session has expired or is no longer available. 
              Please contact your teacher for assistance.
            </p>
            <button
              onClick={() => window.close()}
              className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg transition-colors"
            >
              Close Window
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-100 to-blue-100 px-4 py-8">
      <div className="max-w-lg mx-auto">
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-green-500 to-green-600 text-white p-6 text-center">
            <h1 className="text-2xl font-bold mb-2">✓ Mark Attendance</h1>
            <p className="text-green-100 mb-2">GNDU Attendance System</p>
            <div className="bg-white bg-opacity-20 rounded-lg p-3 mt-4">
              <p className="text-sm font-medium">{sessionData.subject}</p>
              <p className="text-xs opacity-90">{sessionData.date}</p>
            </div>
          </div>

          {/* Form */}
          <div className="p-6">
            <LocationStatus onLocationVerified={handleLocationVerified} />

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="secretCode" className="block text-sm font-semibold text-gray-700 mb-2">
                  🔑 Secret Code
                </label>
                <input
                  type="text"
                  id="secretCode"
                  value={secretCode}
                  onChange={(e) => setSecretCode(e.target.value.toUpperCase())}
                  placeholder="Enter the secret code"
                  required
                  maxLength={20}
                  className="w-full px-4 py-3 border-2 border-orange-300 rounded-lg focus:border-red-500 
                           focus:ring-0 transition-colors duration-200 secret-code-input"
                />
                <small className="text-gray-600 text-xs mt-1 block">
                  Ask your teacher for the secret code
                </small>
              </div>

              <div>
                <label htmlFor="rollNumber" className="block text-sm font-semibold text-gray-700 mb-2">
                  Roll Number
                </label>
                <input
                  type="number"
                  id="rollNumber"
                  value={rollNumber}
                  onChange={(e) => setRollNumber(e.target.value)}
                  placeholder="Enter your Roll Number (1-110)"
                  required
                  min="1"
                  max={students.length}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-green-500 
                           focus:ring-0 transition-colors duration-200 bg-gray-50 focus:bg-white"
                />
                <small className="text-gray-600 text-xs mt-1 block">
                  Your roll number is based on alphabetical order (1-{students.length})
                </small>
              </div>

              <div>
                <label htmlFor="studentName" className="block text-sm font-semibold text-gray-700 mb-2">
                  Full Name
                </label>
                <input
                  type="text"
                  id="studentName"
                  value={studentName}
                  onChange={(e) => setStudentName(e.target.value)}
                  placeholder="Enter your Full Name"
                  required
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-green-500 
                           focus:ring-0 transition-colors duration-200 bg-gray-50 focus:bg-white"
                />
              </div>

              <button
                type="submit"
                disabled={!locationVerified || submitting}
                className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 
                         text-white font-semibold py-4 px-6 rounded-lg transition-all duration-300 
                         transform hover:scale-105 hover:shadow-lg disabled:opacity-60 disabled:cursor-not-allowed 
                         disabled:transform-none"
              >
                {submitting ? (
                  <div className="flex items-center justify-center">
                    <div className="loading-spinner mr-2"></div>
                    Marking Attendance...
                  </div>
                ) : (
                  'Mark Me Present'
                )}
              </button>

              {/* Message */}
              {message.text && (
                <div className={`p-4 rounded-lg border-l-4 animate-fade-in ${
                  message.type === 'success' 
                    ? 'bg-green-50 border-green-400 text-green-800' 
                    : 'bg-red-50 border-red-400 text-red-800'
                }`}>
                  {message.text}
                </div>
              )}
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}