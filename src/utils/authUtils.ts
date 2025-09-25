import { supabase } from '@/integrations/supabase/client';

/**
 * Utility functions for handling authentication errors and session management
 */

export interface AuthErrorResult {
  isAuthError: boolean;
  needsRefresh: boolean;
  shouldSignOut: boolean;
  message: string;
}

/**
 * Analyze an error to determine if it's authentication-related
 */
export function analyzeAuthError(error: any): AuthErrorResult {
  const errorMessage = error?.message?.toLowerCase() || '';
  
  // Common authentication error patterns
  const authErrorPatterns = [
    'session_not_found',
    'authentication failed',
    'jwt expired',
    'invalid token',
    'unauthorized',
    'token has expired',
    'session expired'
  ];
  
  const isAuthError = authErrorPatterns.some(pattern => 
    errorMessage.includes(pattern)
  );
  
  // Determine appropriate action
  let needsRefresh = false;
  let shouldSignOut = false;
  
  if (isAuthError) {
    if (errorMessage.includes('expired') || errorMessage.includes('session_not_found')) {
      needsRefresh = true;
    } else if (errorMessage.includes('invalid') || errorMessage.includes('unauthorized')) {
      shouldSignOut = true;
    } else {
      needsRefresh = true; // Default to refresh attempt
    }
  }
  
  return {
    isAuthError,
    needsRefresh,
    shouldSignOut,
    message: error?.message || 'Unknown authentication error'
  };
}

/**
 * Handle authentication errors consistently across the app
 */
export async function handleAuthError(error: any): Promise<void> {
  const analysis = analyzeAuthError(error);
  
  if (!analysis.isAuthError) {
    return; // Not an auth error, let caller handle it
  }
  
  console.warn('Authentication error detected:', analysis);
  
  if (analysis.shouldSignOut) {
    console.log('Forcing sign out due to invalid session');
    await supabase.auth.signOut();
    return;
  }
  
  if (analysis.needsRefresh) {
    console.log('Attempting to refresh session...');
    try {
      const { error: refreshError } = await supabase.auth.refreshSession();
      if (refreshError) {
        console.error('Session refresh failed:', refreshError);
        await supabase.auth.signOut();
      } else {
        console.log('Session refreshed successfully');
        // Reload page to use new session
        window.location.reload();
      }
    } catch (refreshError) {
      console.error('Session refresh error:', refreshError);
      await supabase.auth.signOut();
    }
  }
}

/**
 * Validate current session health
 */
export async function validateSessionHealth(): Promise<{
  isValid: boolean;
  user: any | null;
  error?: string;
}> {
  try {
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError || !session) {
      return {
        isValid: false,
        user: null,
        error: sessionError?.message || 'No active session'
      };
    }
    
    // Validate with backend
    const { data: { user }, error: userError } = await supabase.auth.getUser(session.access_token);
    
    if (userError || !user) {
      return {
        isValid: false,
        user: null,
        error: userError?.message || 'Session validation failed'
      };
    }
    
    return {
      isValid: true,
      user
    };
  } catch (error) {
    return {
      isValid: false,
      user: null,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}