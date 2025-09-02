import { NextRequest, NextResponse } from 'next/server';
import { collection, addDoc, getDocs, query, orderBy, doc, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { students as localStudents } from '@/data/students';

// Get all students
export async function GET() {
  try {
    const studentsQuery = query(collection(db, 'students'), orderBy('name'));
    const snapshot = await getDocs(studentsQuery);
    
    const students = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    return NextResponse.json({
      success: true,
      students,
      count: students.length
    });

  } catch (error) {
    console.error('Error fetching students:', error);
    return NextResponse.json(
      { error: 'Failed to fetch students' },
      { status: 500 }
    );
  }
}

// Add students to Firestore (bulk operation)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { students, source = 'manual' } = body;

    let studentsToAdd = students;

    // If no students provided, use local data
    if (!studentsToAdd || studentsToAdd.length === 0) {
      studentsToAdd = localStudents;
    }

    // Validate student data
    for (const student of studentsToAdd) {
      if (!student.id || !student.name) {
        return NextResponse.json(
          { error: 'Invalid student data: missing id or name' },
          { status: 400 }
        );
      }
    }

    // Add students to Firestore using their ID as document ID
    const addPromises = studentsToAdd.map(student => 
      setDoc(doc(db, 'students', student.id), {
        id: student.id,
        name: student.name,
        father: student.father || '',
        class_group_no: student.class_group_no || 'G1',
        lab_group_no: student.lab_group_no || 'G1',
        createdAt: new Date().toISOString(),
        source
      })
    );

    await Promise.all(addPromises);

    return NextResponse.json({
      success: true,
      message: `Successfully added ${studentsToAdd.length} students`,
      count: studentsToAdd.length
    });

  } catch (error) {
    console.error('Error adding students:', error);
    return NextResponse.json(
      { error: 'Failed to add students' },
      { status: 500 }
    );
  }
}