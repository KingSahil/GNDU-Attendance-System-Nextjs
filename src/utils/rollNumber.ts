import { Student } from '@/data/students';

/**
 * Generate consistent roll numbers for students
 * Roll numbers are based on alphabetical order of names and are consistent
 */
export function generateRollNumber(student: Student, allStudents: Student[]): number {
  // Sort all students by name to ensure consistent roll number assignment
  const sortedStudents = [...allStudents].sort((a, b) => a.name.localeCompare(b.name));
  
  // Find the index of this student in the sorted list
  const index = sortedStudents.findIndex(s => s.id === student.id);
  
  // Roll numbers start from 1
  return index + 1;
}

/**
 * Get roll number for a specific student by ID
 */
export function getRollNumberById(studentId: string, allStudents: Student[]): number {
  const student = allStudents.find(s => s.id === studentId);
  if (!student) return 0;
  
  return generateRollNumber(student, allStudents);
}

/**
 * Find student by roll number
 */
export function getStudentByRollNumber(rollNumber: number, allStudents: Student[]): Student | null {
  const sortedStudents = [...allStudents].sort((a, b) => a.name.localeCompare(b.name));
  
  if (rollNumber < 1 || rollNumber > sortedStudents.length) {
    return null;
  }
  
  return sortedStudents[rollNumber - 1];
}

/**
 * Create a mapping of roll numbers to student data
 */
export function createRollNumberMapping(allStudents: Student[]): { [rollNumber: number]: Student } {
  const sortedStudents = [...allStudents].sort((a, b) => a.name.localeCompare(b.name));
  const mapping: { [rollNumber: number]: Student } = {};
  
  sortedStudents.forEach((student, index) => {
    mapping[index + 1] = student;
  });
  
  return mapping;
}

/**
 * Validate roll number format and range
 */
export function isValidRollNumber(rollNumber: string, maxStudents: number): boolean {
  const num = parseInt(rollNumber, 10);
  return !isNaN(num) && num >= 1 && num <= maxStudents;
}