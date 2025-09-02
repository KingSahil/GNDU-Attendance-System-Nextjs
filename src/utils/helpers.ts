/**
 * Format date to YYYY-MM-DD
 */
export function formatDate(date: Date): string {
  return date.toISOString().split('T')[0];
}

/**
 * Format time to HH:MM AM/PM
 */
export function formatTime(date: Date): string {
  return date.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  });
}

/**
 * Format date and time for display
 */
export function formatDateTime(date: Date): string {
  return date.toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  });
}

/**
 * Get current date in YYYY-MM-DD format
 */
export function getCurrentDate(): string {
  return formatDate(new Date());
}

/**
 * Check if a session has expired
 */
export function isSessionExpired(session: { expiryTime?: number, expiry?: Date | string }): boolean {
  if (!session) return true;
  
  const now = new Date().getTime();
  
  // Check expiryTime (timestamp)
  if (session.expiryTime) {
    return now > session.expiryTime;
  }
  
  // Check expiry (Date object or string)
  if (session.expiry) {
    const expiryDate = typeof session.expiry === 'string' ? new Date(session.expiry) : session.expiry;
    return now > expiryDate.getTime();
  }
  
  return true;
}

/**
 * Generate a random session ID
 */
export function generateSessionId(): string {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
}

/**
 * Generate a random secret code
 */
export function generateSecretCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

/**
 * Calculate attendance percentage
 */
export function calculateAttendancePercentage(present: number, total: number): string {
  if (total === 0) return '0%';
  return Math.round((present / total) * 100) + '%';
}

/**
 * Copy text to clipboard
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return true;
    } else {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = text;
      textArea.style.position = 'fixed';
      textArea.style.left = '-999999px';
      textArea.style.top = '-999999px';
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      const result = document.execCommand('copy');
      textArea.remove();
      return result;
    }
  } catch (error) {
    console.error('Error copying to clipboard:', error);
    return false;
  }
}

/**
 * Show notification toast
 */
export function showNotification(message: string, type: 'success' | 'error' | 'info' = 'info') {
  // This would typically integrate with a toast library
  // For now, we'll use a simple implementation
  if (typeof window !== 'undefined') {
    const notification = document.createElement('div');
    notification.textContent = message;
    notification.className = `fixed top-4 right-4 px-6 py-3 rounded-lg text-white z-50 transition-all duration-300 ${
      type === 'success' ? 'bg-green-500' : 
      type === 'error' ? 'bg-red-500' : 
      'bg-blue-500'
    }`;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
      notification.style.opacity = '0';
      setTimeout(() => {
        document.body.removeChild(notification);
      }, 300);
    }, 3000);
  }
}

/**
 * Debounce function to limit rate of function calls
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

/**
 * Normalize subject name by removing course codes
 */
export function normalizeSubjectName(subjectString: string): string {
  if (!subjectString) return 'General';
  
  // Remove course codes like "CEL1020 - ", "MTL1001 - ", "PHL1083 - ", etc.
  const cleanName = subjectString.replace(/^[A-Z]{2,4}\d{4}\s*-\s*/i, '').trim();
  
  // Return the cleaned name or original if no course code was found
  return cleanName || subjectString;
}