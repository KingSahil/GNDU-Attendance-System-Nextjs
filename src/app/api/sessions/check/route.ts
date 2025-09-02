import { NextRequest, NextResponse } from 'next/server';

// Check for existing sessions by date and subject
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date');
    const subjectCode = searchParams.get('subjectCode');

    if (!date || !subjectCode) {
      return NextResponse.json(
        { error: 'Date and subject code are required' },
        { status: 400 }
      );
    }

    // For now, return no existing session to avoid index requirements
    // This can be enhanced later when proper indexes are set up
    return NextResponse.json({
      success: true,
      existingSession: null,
      message: 'Session check temporarily disabled to avoid Firebase index requirements'
    });

  } catch (error) {
    console.error('Error checking existing sessions:', error);
    return NextResponse.json(
      { error: 'Failed to check existing sessions' },
      { status: 500 }
    );
  }
}