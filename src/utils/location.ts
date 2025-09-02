// Location verification utilities
export interface LocationResult {
  success: boolean;
  distance?: number;
  error?: string;
}

// GNDU coordinates from environment variables
const UNIVERSITY_LAT = parseFloat(process.env.NEXT_PUBLIC_UNIVERSITY_LAT || '31.634801');
const UNIVERSITY_LNG = parseFloat(process.env.NEXT_PUBLIC_UNIVERSITY_LNG || '74.824416');
const ALLOWED_RADIUS_METERS = parseInt(process.env.NEXT_PUBLIC_ALLOWED_RADIUS_METERS || '200');

/**
 * Convert degrees to radians
 */
function toRadians(degrees: number): number {
  return degrees * (Math.PI / 180);
}

/**
 * Calculate distance between two coordinates using Haversine formula
 */
export function calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371000; // Earth's radius in meters
  const dLat = toRadians(lat2 - lat1);
  const dLng = toRadians(lng2 - lng1);
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Check if user is within allowed radius of GNDU
 */
export async function checkUserLocation(retryCount = 0): Promise<LocationResult> {
  const maxRetries = 3;
  
  if (!navigator.geolocation) {
    return {
      success: false,
      error: 'Geolocation is not supported by your browser'
    };
  }
  
  return new Promise((resolve) => {
    const options: PositionOptions = {
      enableHighAccuracy: true,
      timeout: 15000,
      maximumAge: 0
    };
    
    const handleSuccess = (position: GeolocationPosition) => {
      try {
        const { latitude, longitude } = position.coords;
        
        // Calculate distance in meters
        const distance = calculateDistance(latitude, longitude, UNIVERSITY_LAT, UNIVERSITY_LNG);
        const distanceRounded = Math.round(distance);
        
        if (isNaN(distance) || !isFinite(distance)) {
          throw new Error('Invalid distance calculation');
        }
        
        if (distance <= ALLOWED_RADIUS_METERS) {
          resolve({ 
            success: true, 
            distance: distanceRounded 
          });
        } else {
          resolve({ 
            success: false, 
            distance: distanceRounded,
            error: `You're ${distanceRounded}m from GNDU (must be within ${ALLOWED_RADIUS_METERS}m)`
          });
        }
      } catch (error: any) {
        resolve({ 
          success: false, 
          error: error.message || 'Error processing your location' 
        });
      }
    };
    
    const handleError = (error: GeolocationPositionError) => {
      let message = 'Error: ';
      
      switch(error.code) {
        case error.PERMISSION_DENIED:
          message += 'Location permission denied. Please enable location access in your browser settings.';
          break;
        case error.POSITION_UNAVAILABLE:
          message += 'Location information is unavailable. Please check your internet connection.';
          break;
        case error.TIMEOUT:
          message += 'The request to get your location timed out.';
          break;
        default:
          message += 'Could not get your location.';
      }
      
      if (retryCount < maxRetries) {
        setTimeout(() => {
          checkUserLocation(retryCount + 1).then(resolve);
        }, 2000);
        return;
      }
      
      resolve({ success: false, error: message });
    };
    
    navigator.geolocation.getCurrentPosition(handleSuccess, handleError, options);
  });
}

/**
 * Request location permission explicitly
 */
export function requestLocationPermission(): Promise<boolean> {
  return new Promise((resolve) => {
    if (!navigator.geolocation) {
      resolve(false);
      return;
    }
    
    navigator.geolocation.getCurrentPosition(
      () => resolve(true),
      () => resolve(false),
      { enableHighAccuracy: true, timeout: 5000 }
    );
  });
}