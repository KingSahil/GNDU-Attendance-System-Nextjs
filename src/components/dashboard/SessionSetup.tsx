'use client';

import { useState, useEffect } from 'react';
import { collection, addDoc, onSnapshot, query, orderBy, Timestamp, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { generateSessionId, formatDate, getCurrentDate, showNotification } from '@/utils/helpers';
import { Student } from '@/data/students';

interface SessionSetupProps {
  onSessionStart: (sessionData: any, students: Student[]) => void;
}

const subjects = [
  { code: 'CEL1020', name: 'Engineering Mechanics' },
  { code: 'MEL1021', name: 'Engineering Graphics & Drafting' },
  { code: 'MTL1001', name: 'Mathematics I' },
  { code: 'PHL1083', name: 'Physics' },
  { code: 'PBL1021', name: 'Punjabi (Compulsory)' },
  { code: 'PBL1022', name: 'Basic Punjabi' },
  { code: 'HSL4000', name: 'Punjab History & Culture' },
];

export default function SessionSetup({ onSessionStart }: SessionSetupProps) {
  const [date, setDate] = useState(getCurrentDate());
  const [subjectCode, setSubjectCode] = useState('');
  const [secretCode, setSecretCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [studentsLoaded, setStudentsLoaded] = useState(false);
  const [students, setStudents] = useState<Student[]>([]);
  const [loadingStudents, setLoadingStudents] = useState(true);
  const [firebaseConnected, setFirebaseConnected] = useState(false);
  const [existingSession, setExistingSession] = useState<any>(null);
  const [checkingExistingSession, setCheckingExistingSession] = useState(false);

  useEffect(() => {
    loadStudentsFromFirestore();
  }, []);

  // Check for existing sessions when date or subject changes
  useEffect(() => {
    if (date && subjectCode) {
      checkForExistingSession();
    } else {
      setExistingSession(null);
    }
  }, [date, subjectCode]);

  const loadStudentsFromFirestore = async () => {
    try {
      setLoadingStudents(true);
      console.log('Loading students from Firestore...');
      
      // Test Firebase connection first
      const testQuery = query(collection(db, 'students'), orderBy('name'));
      const snapshot = await getDocs(testQuery);
      
      setFirebaseConnected(true);
      console.log('Firebase connected successfully');
      
      const firestoreStudents: Student[] = [];
      
      snapshot.docs.forEach((doc) => {
        try {
          const data = doc.data();
          if (data && data.id) {
            firestoreStudents.push({
              id: data.id,
              name: data.name || '',
              father: data.father || '',
              class_group_no: data.class_group_no || 'G1',
              lab_group_no: data.lab_group_no || 'G1'
            });
          }
        } catch (e) {
          console.error('Error processing student doc:', e);
        }
      });
      
      // Ensure Jatin (id: 17032400065) is always at the end if present
      const jatinIndex = firestoreStudents.findIndex(s => s.id === '17032400065');
      if (jatinIndex !== -1) {
        const jatin = firestoreStudents.splice(jatinIndex, 1)[0];
        firestoreStudents.push(jatin);
      }
      
      setStudents(firestoreStudents);
      setStudentsLoaded(firestoreStudents.length > 0);
      
      console.log(`Loaded ${firestoreStudents.length} students from Firestore`);
      
      if (firestoreStudents.length === 0) {
        showNotification('No students found in Firestore. Using local data as fallback.', 'info');
        // Fallback to local students data
        const { students: localStudents } = await import('@/data/students');
        setStudents(localStudents);
        setStudentsLoaded(true);
      }
      
    } catch (error) {
      console.error('Error loading students from Firestore:', error);
      setFirebaseConnected(false);
      showNotification('Failed to load students from Firebase. Using local data.', 'error');
      
      // Fallback to local students data
      try {
        const { students: localStudents } = await import('@/data/students');
        setStudents(localStudents);
        setStudentsLoaded(true);
        console.log(`Using local students data: ${localStudents.length} students`);
      } catch (e) {
        console.error('Error loading local students:', e);
        showNotification('Failed to load student data', 'error');
      }
    } finally {
      setLoadingStudents(false);
    }
  };

  const validateForm = () => {
    return date && subjectCode && secretCode && studentsLoaded && !loadingStudents;
  };

  const checkForExistingSession = async () => {
    try {
      setCheckingExistingSession(true);
      const response = await fetch(`/api/sessions/check?date=${date}&subjectCode=${subjectCode}`);
      
      if (response.ok) {
        const result = await response.json();
        
        if (result.success && result.existingSession) {
          setExistingSession(result.existingSession);
          setSecretCode(result.existingSession.secretCode);
        } else {
          setExistingSession(null);
          setSecretCode('');
        }
      } else {
        // If API fails (like index error), just skip existing session check
        console.log('Skipping existing session check due to API error');
        setExistingSession(null);
        setSecretCode('');
      }
    } catch (error) {
      console.error('Error checking existing session:', error);
      setExistingSession(null);
      setSecretCode('');
    } finally {
      setCheckingExistingSession(false);
    }
  };

  const populateStudentsInFirestore = async () => {
    try {
      console.log('Populating students in Firestore...');
      const { students: localStudents } = await import('@/data/students');
      
      const batch = [];
      for (const student of localStudents) {
        batch.push(addDoc(collection(db, 'students'), student));
      }
      
      await Promise.all(batch);
      console.log(`Added ${localStudents.length} students to Firestore`);
      showNotification(`Added ${localStudents.length} students to Firebase!`, 'success');
      
      // Reload students
      await loadStudentsFromFirestore();
    } catch (error) {
      console.error('Error populating students:', error);
      showNotification('Error adding students to Firebase', 'error');
    }
  };

  const handleStartSession = async () => {
    if (!validateForm()) {
      showNotification('Please fill in all fields', 'error');
      return;
    }

    setLoading(true);

    try {
      let sessionData;
      
      if (existingSession && !existingSession.isExpired) {
        // Use existing session
        const selectedSubject = subjects.find(s => s.code === subjectCode);
        sessionData = {
          sessionId: existingSession.sessionId,
          date,
          subject: selectedSubject?.name || subjectCode,
          subjectCode,
          secretCode: secretCode.toUpperCase(),
          createdAt: existingSession.createdAt,
          expiryTime: existingSession.expiryTime || Date.now() + (2 * 60 * 60 * 1000),
          active: existingSession.active,
          totalStudents: students.length,
          isExisting: true
        };
        
        showNotification('Viewing existing attendance session!', 'success');
        onSessionStart(sessionData, students);
      } else {
        // Create new session
        const sessionId = generateSessionId();
        const selectedSubject = subjects.find(s => s.code === subjectCode);
        
        sessionData = {
          sessionId,
          date,
          subject: selectedSubject?.name || subjectCode,
          subjectCode,
          secretCode: secretCode.toUpperCase(),
          createdAt: Timestamp.now(),
          expiryTime: Date.now() + (2 * 60 * 60 * 1000), // 2 hours from now
          active: true,
          totalStudents: students.length,
        };

        // Save session to Firestore
        await addDoc(collection(db, 'attendanceSessions'), sessionData);
        
        showNotification('New attendance session created successfully!', 'success');
        onSessionStart(sessionData, students);
      }
    } catch (error) {
      console.error('Error starting session:', error);
      showNotification('Error starting session. Please try again.', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <h2 className="text-xl font-semibold text-gray-800 mb-6">Setup Attendance Session</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div>
          <label htmlFor="date" className="block text-sm font-semibold text-gray-700 mb-2 uppercase tracking-wide">
            Select Date
          </label>
          <input
            type="date"
            id="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            required
            className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 
                     focus:ring-0 transition-colors duration-200 bg-gray-50 focus:bg-white"
          />
        </div>

        <div>
          <label htmlFor="subject" className="block text-sm font-semibold text-gray-700 mb-2 uppercase tracking-wide">
            Subject
          </label>
          <select
            id="subject"
            value={subjectCode}
            onChange={(e) => setSubjectCode(e.target.value)}
            required
            className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 
                     focus:ring-0 transition-colors duration-200 bg-gray-50 focus:bg-white"
          >
            <option value="">Select Subject</option>
            {subjects.map((subject) => (
              <option key={subject.code} value={subject.code}>
                {subject.code} - {subject.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="secretCode" className="block text-sm font-semibold text-gray-700 mb-2 uppercase tracking-wide">
            Secret Code
          </label>
          <input
            type="text"
            id="secretCode"
            value={secretCode}
            onChange={(e) => setSecretCode(e.target.value.toUpperCase())}
            placeholder="Set the Secret Code"
            required
            maxLength={20}
            className="w-full px-4 py-3 border-2 border-orange-300 rounded-lg focus:border-red-500 
                     focus:ring-0 transition-colors duration-200 secret-code-input"
          />
          <small className="text-gray-600 text-xs mt-1 block">
            Students must enter this exact code to mark attendance
          </small>
        </div>
      </div>

      {/* Status Messages */}
      <div className="mb-6 space-y-2">
        <div className="flex items-center text-sm">
          {loadingStudents ? (
            <span className="text-blue-600 font-medium">
              🔄 Loading student data from Firebase...
            </span>
          ) : firebaseConnected ? (
            studentsLoaded ? (
              <span className="text-green-600 font-medium">
                ✅ Students loaded from Firebase ({students.length} students)
              </span>
            ) : (
              <span className="text-red-600 font-medium">
                ❌ No students found in Firebase
              </span>
            )
          ) : (
            studentsLoaded ? (
              <span className="text-yellow-600 font-medium">
                ⚠️ Using local student data ({students.length} students) - Firebase connection failed
              </span>
            ) : (
              <span className="text-red-600 font-medium">
                ❌ Failed to load student data
              </span>
            )
          )}
        </div>
        {firebaseConnected && students.length === 0 && !loadingStudents && (
          <div className="flex items-center text-sm">
            <span className="text-blue-600 font-medium mr-4">
              💾 No students in Firebase. Would you like to populate it?
            </span>
            <button
              onClick={populateStudentsInFirestore}
              className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-xs font-medium transition-colors"
            >
              💾 Add Students to Firebase
            </button>
          </div>
        )}
        
        {/* Existing Session Status */}
        {checkingExistingSession && (
          <div className="flex items-center text-sm text-blue-600">
            🔍 Checking for existing session...
          </div>
        )}
        
        {existingSession && (
          <div className="flex items-center text-sm">
            {existingSession.isExpired ? (
              <span className="text-orange-600 font-medium">
                ⚠️ Found expired session for this date/subject. A new session will be created.
              </span>
            ) : (
              <span className="text-green-600 font-medium">
                ✅ Found existing session for this date/subject. Secret code loaded automatically.
              </span>
            )}
          </div>
        )}
        {firebaseConnected && (
          <div className="flex items-center text-xs text-green-600">
            🟢 Connected to Firebase
          </div>
        )}
      </div>

      <button
        onClick={handleStartSession}
        disabled={!validateForm() || loading}
        className="w-full bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600 
                 text-white font-semibold py-4 px-6 rounded-lg transition-all duration-300 
                 transform hover:scale-105 hover:shadow-lg disabled:opacity-60 disabled:cursor-not-allowed 
                 disabled:transform-none uppercase tracking-wide"
      >
        {loading ? (
          <div className="flex items-center justify-center">
            <div className="loading-spinner mr-2"></div>
            {existingSession && !existingSession.isExpired ? 'Loading Session...' : 'Starting Session...'}
          </div>
        ) : (
          existingSession && !existingSession.isExpired ? 'View Attendance Session' : 'Start Attendance Session'
        )}
      </button>
    </div>
  );
}