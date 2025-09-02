import { NextRequest, NextResponse } from 'next/server';
import { collection, getDocs, doc, getDoc, query, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';

// Export attendance data
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('sessionId');
    const format = searchParams.get('format') || 'json';

    if (!sessionId) {
      return NextResponse.json(
        { error: 'Session ID is required' },
        { status: 400 }
      );
    }

    // Get session data
    const sessionRef = doc(db, 'attendanceSessions', sessionId);
    const sessionSnap = await getDoc(sessionRef);

    if (!sessionSnap.exists()) {
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 }
      );
    }

    const sessionData = sessionSnap.data();

    // Get attendance records
    const attendanceQuery = query(
      collection(db, 'attendanceSessions', sessionId, 'attendance'),
      orderBy('name')
    );
    const attendanceSnap = await getDocs(attendanceQuery);

    const attendanceRecords = attendanceSnap.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      timestamp: doc.data().timestamp?.toDate?.() || doc.data().timestamp
    }));

    // Get all students for complete attendance list
    const studentsQuery = query(collection(db, 'students'), orderBy('name'));
    const studentsSnap = await getDocs(studentsQuery);
    const allStudents = studentsSnap.docs.map(doc => doc.data());

    // Create complete attendance list
    const completeAttendance = allStudents.map(student => {
      const attendanceRecord = attendanceRecords.find(a => a.studentId === student.id);
      return {
        studentId: student.id,
        name: student.name,
        father: student.father,
        status: attendanceRecord ? 'Present' : 'Absent',
        checkInTime: attendanceRecord?.timestamp || null,
        classGroup: student.class_group_no,
        labGroup: student.lab_group_no
      };
    });

    const exportData = {
      session: {
        id: sessionId,
        date: sessionData.date,
        subject: sessionData.subject,
        subjectCode: sessionData.subjectCode,
        secretCode: sessionData.secretCode,
        totalStudents: allStudents.length,
        presentCount: attendanceRecords.length,
        absentCount: allStudents.length - attendanceRecords.length,
        attendancePercentage: Math.round((attendanceRecords.length / allStudents.length) * 100)
      },
      attendance: completeAttendance,
      exportedAt: new Date().toISOString()
    };

    if (format === 'csv') {
      // Generate CSV format
      const csvHeaders = ['Roll No', 'Student ID', 'Name', 'Father Name', 'Status', 'Check-in Time'];
      const csvRows = completeAttendance.map((record, index) => [
        index + 1,
        record.studentId,
        record.name,
        record.father,
        record.status,
        record.checkInTime ? new Date(record.checkInTime).toLocaleString() : '-'
      ]);

      const csvContent = [
        `# Attendance Report - ${sessionData.subject}`,
        `# Date: ${sessionData.date}`,
        `# Total Students: ${allStudents.length}, Present: ${attendanceRecords.length}, Absent: ${allStudents.length - attendanceRecords.length}`,
        `# Attendance Percentage: ${exportData.session.attendancePercentage}%`,
        '',
        csvHeaders.join(','),
        ...csvRows.map(row => row.join(','))
      ].join('\n');

      return new NextResponse(csvContent, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename=\"attendance_${sessionData.subjectCode}_${sessionData.date}.csv\"`
        }
      });
    }

    // Return JSON format by default
    return NextResponse.json({
      success: true,
      data: exportData
    });

  } catch (error) {
    console.error('Error exporting attendance:', error);
    return NextResponse.json(
      { error: 'Failed to export attendance data' },
      { status: 500 }
    );
  }
}

// Generate attendance summary for multiple sessions
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { startDate, endDate, subjectCode } = body;

    if (!startDate || !endDate) {
      return NextResponse.json(
        { error: 'Start date and end date are required' },
        { status: 400 }
      );
    }

    // Get all sessions within date range
    const sessionsQuery = query(
      collection(db, 'attendanceSessions'),
      orderBy('date')
    );
    const sessionsSnap = await getDocs(sessionsQuery);

    let sessions = sessionsSnap.docs
      .map(doc => ({ id: doc.id, ...doc.data() }))
      .filter(session => {
        const sessionDate = session.date;
        return sessionDate >= startDate && sessionDate <= endDate;
      });

    // Filter by subject if specified
    if (subjectCode) {
      sessions = sessions.filter(session => session.subjectCode === subjectCode);
    }

    // Get attendance for each session
    const summaryData = [];
    for (const session of sessions) {
      const attendanceQuery = collection(db, 'attendanceSessions', session.id, 'attendance');
      const attendanceSnap = await getDocs(attendanceQuery);
      
      summaryData.push({
        sessionId: session.id,
        date: session.date,
        subject: session.subject,
        subjectCode: session.subjectCode,
        totalStudents: session.totalStudents || 0,
        presentCount: attendanceSnap.size,
        absentCount: (session.totalStudents || 0) - attendanceSnap.size,
        attendancePercentage: session.totalStudents ? 
          Math.round((attendanceSnap.size / session.totalStudents) * 100) : 0
      });
    }

    return NextResponse.json({
      success: true,
      summary: {
        dateRange: { startDate, endDate },
        subjectFilter: subjectCode || 'All',
        totalSessions: summaryData.length,
        sessions: summaryData
      }
    });

  } catch (error) {
    console.error('Error generating attendance summary:', error);
    return NextResponse.json(
      { error: 'Failed to generate attendance summary' },
      { status: 500 }
    );
  }
}