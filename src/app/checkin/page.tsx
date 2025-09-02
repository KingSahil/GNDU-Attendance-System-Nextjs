'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import CheckinForm from '@/components/checkin/CheckinForm';

export default function CheckinPage() {
  const searchParams = useSearchParams();
  const [sessionId, setSessionId] = useState<string | null>(null);

  useEffect(() => {
    const session = searchParams.get('session');
    if (session) {
      setSessionId(session);
    }
  }, [searchParams]);

  if (!sessionId) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-100 to-orange-100 px-4">
        <div className="max-w-md w-full">
          <div className="bg-white rounded-2xl shadow-2xl p-8 text-center">
            <div className="text-6xl mb-4">❌</div>
            <h1 className="text-2xl font-bold text-red-600 mb-4">Invalid Link</h1>
            <p className="text-gray-600 mb-6">
              This attendance link is invalid or missing session information. 
              Please get the correct link from your teacher.
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

  return <CheckinForm sessionId={sessionId} />;
}