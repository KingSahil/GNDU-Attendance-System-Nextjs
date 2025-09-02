'use client';

import { useState, useEffect } from 'react';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Student } from '@/data/students';
import { formatDateTime, normalizeSubjectName } from '@/utils/helpers';

interface StudentDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  student: Student | null;
}

interface AttendanceRecord {
  id: string;
  date: string;
  subject: string;
  subjectCode: string;
  status: 'Present' | 'Absent';
  timestamp: any;
}

interface SubjectStats {
  present: number;
  total: number;
  percentage: number;
}

export default function StudentDetailsModal({ isOpen, onClose, student }: StudentDetailsModalProps) {
  const [attendanceHistory, setAttendanceHistory] = useState<AttendanceRecord[]>([]);
  const [subjectStats, setSubjectStats] = useState<{ [key: string]: SubjectStats }>({});
  const [loading, setLoading] = useState(false);
  const [overallStats, setOverallStats] = useState({ present: 0, total: 0, percentage: 0 });

  useEffect(() => {
    if (isOpen && student) {
      loadStudentAttendance();
    }
  }, [isOpen, student]);

  const loadStudentAttendance = async () => {
    if (!student) return;

    setLoading(true);
    try {
      // Query all attendance sessions to find this student's records
      const attendanceQuery = query(
        collection(db, 'attendanceSessions'),
        orderBy('date', 'desc')
      );

      const sessionsSnapshot = await getDocs(attendanceQuery);
      const allRecords: AttendanceRecord[] = [];
      const stats: { [key: string]: SubjectStats } = {};

      // Process each session
      for (const sessionDoc of sessionsSnapshot.docs) {
        const sessionData = sessionDoc.data();
        
        // Check if student attended this session
        const studentAttendanceQuery = query(
          collection(db, 'attendanceSessions', sessionDoc.id, 'attendance'),
          where('studentId', '==', student.id)
        );

        const studentAttendanceSnapshot = await getDocs(studentAttendanceQuery);
        const attended = !studentAttendanceSnapshot.empty;

        // Create record
        const record: AttendanceRecord = {
          id: sessionDoc.id,
          date: sessionData.date,
          subject: sessionData.subject || sessionData.subjectCode,
          subjectCode: sessionData.subjectCode,
          status: attended ? 'Present' : 'Absent',
          timestamp: attended ? studentAttendanceSnapshot.docs[0].data().timestamp : null
        };

        allRecords.push(record);

        // Update subject stats
        const subjectName = normalizeSubjectName(record.subject);
        if (!stats[subjectName]) {
          stats[subjectName] = { present: 0, total: 0, percentage: 0 };
        }
        
        stats[subjectName].total++;
        if (attended) {
          stats[subjectName].present++;
        }
      }

      // Calculate percentages
      Object.keys(stats).forEach(subject => {
        const stat = stats[subject];
        stat.percentage = stat.total > 0 ? Math.round((stat.present / stat.total) * 100) : 0;
      });

      // Calculate overall stats
      const totalSessions = allRecords.length;
      const totalPresent = allRecords.filter(r => r.status === 'Present').length;
      const overallPercentage = totalSessions > 0 ? Math.round((totalPresent / totalSessions) * 100) : 0;

      setAttendanceHistory(allRecords);
      setSubjectStats(stats);
      setOverallStats({
        present: totalPresent,
        total: totalSessions,
        percentage: overallPercentage
      });

    } catch (error) {
      console.error('Error loading student attendance:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !student) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white p-6">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-2xl font-bold mb-2">👤 Student Attendance Details</h2>
              <h3 className="text-xl font-semibold">{student.name}</h3>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:text-gray-200 text-2xl font-bold w-8 h-8 flex items-center justify-center rounded-full hover:bg-white hover:bg-opacity-20 transition-colors"
            >
              ×
            </button>
          </div>

          {/* Student Info */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4 text-sm">
            <div>
              <strong>Student ID:</strong> {student.id}
            </div>
            <div>
              <strong>Father's Name:</strong> {student.father}
            </div>
            <div>
              <strong>Class Group:</strong> {student.class_group_no}
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
              <span className="ml-3 text-gray-600">Loading attendance data...</span>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Overall Stats */}
              <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-lg p-6">
                <h4 className="text-lg font-semibold text-gray-800 mb-4">📊 Overall Statistics</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">{overallStats.present}</div>
                    <div className="text-sm text-gray-600">Sessions Present</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-gray-600">{overallStats.total}</div>
                    <div className="text-sm text-gray-600">Total Sessions</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">{overallStats.percentage}%</div>
                    <div className="text-sm text-gray-600">Overall Attendance</div>
                  </div>
                </div>
              </div>

              {/* Subject-wise Stats */}
              {Object.keys(subjectStats).length > 0 && (
                <div>
                  <h4 className="text-lg font-semibold text-gray-800 mb-4">📚 Per-Subject Attendance</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {Object.entries(subjectStats).map(([subject, stats]) => (
                      <div key={subject} className="bg-gray-50 rounded-lg p-4">
                        <div className="flex justify-between items-center mb-2">
                          <h5 className="font-medium text-gray-800">{subject}</h5>
                          <span className={`px-2 py-1 rounded text-sm font-semibold ${
                            stats.percentage >= 75 ? 'bg-green-100 text-green-800' :
                            stats.percentage >= 50 ? 'bg-yellow-100 text-yellow-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            {stats.percentage}%
                          </span>
                        </div>
                        <div className="text-sm text-gray-600">
                          {stats.present}/{stats.total} sessions attended
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                          <div 
                            className={`h-2 rounded-full ${
                              stats.percentage >= 75 ? 'bg-green-500' :
                              stats.percentage >= 50 ? 'bg-yellow-500' :
                              'bg-red-500'
                            }`}
                            style={{ width: `${stats.percentage}%` }}
                          ></div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Attendance History */}
              <div>
                <h4 className="text-lg font-semibold text-gray-800 mb-4">📅 Attendance History</h4>
                
                {attendanceHistory.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <p>No attendance records found for this student.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse bg-white rounded-lg shadow-sm">
                      <thead>
                        <tr className="bg-gray-50">
                          <th className="border border-gray-200 px-4 py-3 text-left text-sm font-semibold text-gray-700">Date</th>
                          <th className="border border-gray-200 px-4 py-3 text-left text-sm font-semibold text-gray-700">Subject</th>
                          <th className="border border-gray-200 px-4 py-3 text-left text-sm font-semibold text-gray-700">Status</th>
                          <th className="border border-gray-200 px-4 py-3 text-left text-sm font-semibold text-gray-700">Check-in Time</th>
                        </tr>
                      </thead>
                      <tbody>
                        {attendanceHistory.map((record, index) => (
                          <tr key={record.id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                            <td className="border border-gray-200 px-4 py-3 text-sm">{record.date}</td>
                            <td className="border border-gray-200 px-4 py-3 text-sm">{normalizeSubjectName(record.subject)}</td>
                            <td className="border border-gray-200 px-4 py-3 text-sm">
                              <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                                record.status === 'Present' 
                                  ? 'bg-green-100 text-green-800' 
                                  : 'bg-red-100 text-red-800'
                              }`}>
                                {record.status}
                              </span>
                            </td>
                            <td className="border border-gray-200 px-4 py-3 text-sm">
                              {record.timestamp ? 
                                formatDateTime(new Date(record.timestamp.seconds * 1000)) : 
                                '-'
                              }
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-gray-50 px-6 py-4 flex justify-end">
          <button
            onClick={onClose}
            className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-2 rounded-lg font-medium transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}