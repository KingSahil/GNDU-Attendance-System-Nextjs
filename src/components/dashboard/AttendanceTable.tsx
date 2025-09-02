'use client';

import { useState } from 'react';
import { Student } from '@/data/students';
import { getRollNumberById } from '@/utils/rollNumber';
import StudentDetailsModal from './StudentDetailsModal';

interface AttendanceRecord {
  id: string;
  name: string;
  father: string;
  status: 'Present' | 'Absent';
  checkInTime?: string;
}

interface AttendanceTableProps {
  records: AttendanceRecord[];
  searchTerm: string;
  students: Student[];
}

type SortColumn = 'id' | 'name' | 'father' | 'status';
type SortDirection = 'asc' | 'desc';

export default function AttendanceTable({ records, searchTerm, students }: AttendanceTableProps) {
  const [sortColumn, setSortColumn] = useState<SortColumn>('name');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [showModal, setShowModal] = useState(false);

  const handleSort = (column: SortColumn) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
  };

  const sortedRecords = [...records].sort((a, b) => {
    let aValue = a[sortColumn];
    let bValue = b[sortColumn];

    if (sortColumn === 'status') {
      // Sort Present first, then Absent
      aValue = a.status === 'Present' ? '0' : '1';
      bValue = b.status === 'Present' ? '0' : '1';
    }

    const result = aValue.localeCompare(bValue);
    return sortDirection === 'asc' ? result : -result;
  });

  const getSortIcon = (column: SortColumn) => {
    if (sortColumn !== column) return '⇅';
    return sortDirection === 'asc' ? '↑' : '↓';
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      <div className="overflow-x-auto custom-scrollbar">
        <table className="attendance-table">
          <thead>
            <tr>
              <th className="w-16">Roll No.</th>
              <th 
                className="cursor-pointer hover:bg-blue-700 transition-colors"
                onClick={() => handleSort('id')}
              >
                Student ID {getSortIcon('id')}
              </th>
              <th 
                className="cursor-pointer hover:bg-blue-700 transition-colors"
                onClick={() => handleSort('name')}
              >
                Name {getSortIcon('name')}
              </th>
              <th 
                className="cursor-pointer hover:bg-blue-700 transition-colors"
                onClick={() => handleSort('father')}
              >
                Father's Name {getSortIcon('father')}
              </th>
              <th 
                className="cursor-pointer hover:bg-blue-700 transition-colors"
                onClick={() => handleSort('status')}
              >
                Status {getSortIcon('status')}
              </th>
              <th>Check-in Time</th>
            </tr>
          </thead>
          <tbody>
            {sortedRecords.map((record, index) => (
              <tr 
                key={record.id} 
                className={`transition-colors hover:bg-gray-50 ${
                  record.status === 'Present' ? 'present' : ''
                }`}
              >
                <td className="text-center font-medium">{getRollNumberById(record.id, students)}</td>
                <td className="font-mono">{record.id}</td>
                <td className="font-medium">
                  <button
                    className="text-left hover:text-blue-600 hover:underline transition-colors"
                    onClick={() => {
                      const student = students.find(s => s.id === record.id);
                      if (student) {
                        setSelectedStudent(student);
                        setShowModal(true);
                      }
                    }}
                  >
                    {record.name}
                  </button>
                </td>
                <td>{record.father}</td>
                <td>
                  <span className={`status-badge ${
                    record.status === 'Present' ? 'status-present' : 'status-absent'
                  }`}>
                    {record.status}
                  </span>
                </td>
                <td>{record.checkInTime || '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      {records.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          <p>No students found matching "{searchTerm}"</p>
        </div>
      )}

      <div className="p-4 text-center text-sm text-gray-500 border-t">
        💡 Scroll horizontally to view all columns • Click column headers to sort
      </div>
      
      <StudentDetailsModal
        isOpen={showModal}
        onClose={() => {
          setShowModal(false);
          setSelectedStudent(null);
        }}
        student={selectedStudent}
      />
    </div>
  );
}