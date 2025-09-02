import { NextRequest, NextResponse } from 'next/server';
import { collection, addDoc, doc, getDoc, query, where, getDocs, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { getStudentByRollNumber, isValidRollNumber } from '@/utils/rollNumber';
import { students } from '@/data/students';

// Submit attendance
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { sessionId, rollNumber, studentName, secretCode, location } = body;

    if (!sessionId || !rollNumber || !studentName || !secretCode) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Verify session exists and is active
    const sessionRef = doc(db, 'attendanceSessions', sessionId);
    const sessionSnap = await getDoc(sessionRef);

    if (!sessionSnap.exists()) {
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 }
      );
    }

    const sessionData = sessionSnap.data();

    // Check if session is expired
    if (Date.now() > sessionData.expiryTime || !sessionData.active) {
      return NextResponse.json(
        { error: 'Session has expired' },
        { status: 400 }
      );
    }

    // Verify secret code
    if (secretCode.toUpperCase() !== sessionData.secretCode) {
      return NextResponse.json(
        { error: 'Invalid secret code' },
        { status: 400 }
      );
    }

    // Validate roll number
    if (!isValidRollNumber(rollNumber.toString(), students.length)) {
      return NextResponse.json(
        { error: 'Invalid roll number' },
        { status: 400 }
      );
    }

    // Get student by roll number
    const student = getStudentByRollNumber(parseInt(rollNumber), students);
    if (!student) {
      return NextResponse.json(
        { error: 'Student not found for this roll number' },
        { status: 400 }
      );
    }

    // Validate name matches
    if (student.name.toLowerCase().trim() !== studentName.toLowerCase().trim()) {
      return NextResponse.json(
        { error: 'Name does not match the roll number' },
        { status: 400 }
      );
    }

    // Check if student has already marked attendance
    const attendanceQuery = query(
      collection(db, 'attendanceSessions', sessionId, 'attendance'),
      where('studentId', '==', student.id)
    );
    
    const existingAttendance = await getDocs(attendanceQuery);
    
    if (!existingAttendance.empty) {
      return NextResponse.json(
        { error: 'Attendance already marked for this session' },
        { status: 400 }
      );
    }

    // Mark attendance
    const attendanceData = {
      studentId: student.id,
      rollNumber: parseInt(rollNumber),
      name: student.name,
      father: student.father,
      timestamp: Timestamp.now(),
      sessionId,
      subjectCode: sessionData.subjectCode,
      subjectName: sessionData.subject,
      date: sessionData.date,
      location: location || null
    };

    await addDoc(collection(db, 'attendanceSessions', sessionId, 'attendance'), attendanceData);

    return NextResponse.json({
      success: true,
      message: 'Attendance marked successfully'
    });

  } catch (error) {
    console.error('Error marking attendance:', error);
    return NextResponse.json(
      { error: 'Failed to mark attendance' },
      { status: 500 }
    );
  }
}

// Get attendance for a session
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('sessionId');

    if (!sessionId) {
      return NextResponse.json(
        { error: 'Session ID is required' },
        { status: 400 }
      );
    }

    const attendanceQuery = collection(db, 'attendanceSessions', sessionId, 'attendance');
    const attendanceSnap = await getDocs(attendanceQuery);

    const attendance = attendanceSnap.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    return NextResponse.json({
      success: true,
      attendance
    });

  } catch (error) {
    console.error('Error fetching attendance:', error);
    return NextResponse.json(
      { error: 'Failed to fetch attendance' },
      { status: 500 }
    );
  }
}