'use client';

import { useState, useEffect } from 'react';
import { checkUserLocation, LocationResult } from '@/utils/location';

interface LocationStatusProps {
  onLocationVerified: (verified: boolean, distance?: number) => void;
}

export default function LocationStatus({ onLocationVerified }: LocationStatusProps) {
  const [status, setStatus] = useState<'checking' | 'allowed' | 'denied'>('checking');
  const [message, setMessage] = useState('📍 Checking your location...');
  const [loading, setLoading] = useState(true);
  const [distance, setDistance] = useState<number>();

  useEffect(() => {
    checkLocation();
  }, []);

  const checkLocation = async () => {
    setLoading(true);
    setStatus('checking');
    setMessage('📍 Getting your location...');

    try {
      const result: LocationResult = await checkUserLocation();
      
      if (result.success) {
        setStatus('allowed');
        setMessage(`✅ Location verified! You're ${result.distance}m from GNDU`);
        setDistance(result.distance);
        onLocationVerified(true, result.distance);
      } else {
        setStatus('denied');
        setMessage(`❌ ${result.error || 'Location verification failed'}`);
        onLocationVerified(false);
      }
    } catch (error: any) {
      setStatus('denied');
      setMessage(`❌ Error: ${error.message || 'Failed to get location'}`);
      onLocationVerified(false);
    } finally {
      setLoading(false);
    }
  };

  const handleRetry = () => {
    checkLocation();
  };

  return (
    <div className={`
      relative p-4 mb-6 rounded-xl flex items-center gap-3 transition-all duration-300
      ${status === 'checking' ? 'bg-blue-50 border border-blue-200 text-blue-800' : ''}
      ${status === 'allowed' ? 'bg-green-50 border border-green-200 text-green-800' : ''}
      ${status === 'denied' ? 'bg-red-50 border border-red-200 text-red-800' : ''}
      ${loading ? 'animate-pulse-location' : ''}
    `}>
      {/* Status indicator */}
      <div className="flex-shrink-0">
        {loading ? (
          <div className="loading-spinner"></div>
        ) : status === 'allowed' ? (
          <span className="text-green-600 text-xl">✅</span>
        ) : (
          <span className="text-red-600 text-xl">❌</span>
        )}
      </div>

      {/* Message */}
      <div className="flex-1">
        <p className="font-medium">{message}</p>
        {distance && (
          <p className="text-sm opacity-80 mt-1">
            Distance from campus: {distance}m (within 200m allowed radius)
          </p>
        )}
      </div>

      {/* Retry button for failed attempts */}
      {status === 'denied' && !loading && (
        <button
          onClick={handleRetry}
          className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded-md text-sm font-medium transition-colors"
        >
          Retry
        </button>
      )}

      {/* Location permission help */}
      {status === 'denied' && message.includes('permission') && (
        <div className="absolute top-full left-0 right-0 mt-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-yellow-800 text-sm">
          <p className="font-medium mb-1">📱 Enable Location Access:</p>
          <ul className="text-xs space-y-1">
            <li>• Allow location access when prompted by your browser</li>
            <li>• Check browser settings if already denied</li>
            <li>• Ensure GPS is enabled on your device</li>
          </ul>
        </div>
      )}
    </div>
  );
}