import { NextRequest, NextResponse } from 'next/server';
import { collection, addDoc, doc, getDoc, updateDoc, setDoc, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';

// Create a new attendance session
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { date, subjectCode, subject, secretCode, totalStudents } = body;

    if (!date || !subjectCode || !subject || !secretCode) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Generate session ID
    const sessionId = Math.random().toString(36).substring(2) + Date.now().toString(36);
    
    // Create session data
    const sessionData = {
      sessionId,
      date,
      subject,
      subjectCode,
      secretCode: secretCode.toUpperCase(),
      createdAt: Timestamp.now(),
      expiryTime: Date.now() + (2 * 60 * 60 * 1000), // 2 hours from now
      active: true,
      totalStudents: totalStudents || 0,
    };

    // Save to Firestore with custom document ID
    const docRef = doc(db, 'attendanceSessions', sessionId);
    await setDoc(docRef, sessionData);

    return NextResponse.json({
      success: true,
      sessionId,
      sessionData
    });

  } catch (error) {
    console.error('Error creating session:', error);
    return NextResponse.json(
      { error: 'Failed to create session' },
      { status: 500 }
    );
  }
}

// Get session details
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

    const docRef = doc(db, 'attendanceSessions', sessionId);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 }
      );
    }

    const sessionData = docSnap.data();
    
    // Check if session is expired
    const isExpired = Date.now() > sessionData.expiryTime || !sessionData.active;

    return NextResponse.json({
      success: true,
      sessionData: {
        ...sessionData,
        isExpired
      }
    });

  } catch (error) {
    console.error('Error fetching session:', error);
    return NextResponse.json(
      { error: 'Failed to fetch session' },
      { status: 500 }
    );
  }
}

// Update session (e.g., expire session)
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { sessionId, updates } = body;

    if (!sessionId) {
      return NextResponse.json(
        { error: 'Session ID is required' },
        { status: 400 }
      );
    }

    const docRef = doc(db, 'attendanceSessions', sessionId);
    
    // Add timestamp for updates
    const updateData = {
      ...updates,
      updatedAt: Timestamp.now()
    };

    await updateDoc(docRef, updateData);

    return NextResponse.json({
      success: true,
      message: 'Session updated successfully'
    });

  } catch (error) {
    console.error('Error updating session:', error);
    return NextResponse.json(
      { error: 'Failed to update session' },
      { status: 500 }
    );
  }
}