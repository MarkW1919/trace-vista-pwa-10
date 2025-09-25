import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { User, Session } from '@supabase/supabase-js';
import { useToast } from '@/hooks/use-toast';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  isAuthenticated: boolean;
  sessionValid: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<{ error: Error | null }>;
  refreshSession: () => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [sessionValid, setSessionValid] = useState(false);
  const { toast } = useToast();

  // Session validation helper
  const validateSession = async (currentSession: Session | null): Promise<boolean> => {
    if (!currentSession?.access_token) {
      console.log('AuthContext: No session to validate');
      return false;
    }

    try {
      console.log('AuthContext: Validating session with backend...');
      const { data: { user }, error } = await supabase.auth.getUser(currentSession.access_token);
      
      if (error || !user) {
        console.warn('AuthContext: Session validation failed:', error?.message);
        return false;
      }
      
      console.log('AuthContext: Session validation successful for:', user.email);
      return true;
    } catch (error) {
      console.error('AuthContext: Session validation error:', error);
      return false;
    }
  };

  // Session refresh helper
  const refreshSession = async (): Promise<boolean> => {
    try {
      console.log('AuthContext: Refreshing session...');
      const { data: { session: newSession }, error } = await supabase.auth.refreshSession();
      
      if (error || !newSession) {
        console.error('AuthContext: Session refresh failed:', error?.message);
        // Clear invalid session
        setSession(null);
        setUser(null);
        setSessionValid(false);
        return false;
      }
      
      console.log('AuthContext: Session refreshed successfully');
      setSession(newSession);
      setUser(newSession.user);
      setSessionValid(true);
      return true;
    } catch (error) {
      console.error('AuthContext: Session refresh error:', error);
      setSession(null);
      setUser(null);
      setSessionValid(false);
      return false;
    }
  };

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('AuthContext: Auth state change:', event, session?.user?.email);
        
        if (event === 'SIGNED_OUT' || event === 'TOKEN_REFRESHED' || !session) {
          setSession(session);
          setUser(session?.user ?? null);
          setSessionValid(!!session);
          setLoading(false);
        } else {
          // For SIGNED_IN and initial load, validate session with backend
          const isValid = await validateSession(session);
          setSession(session);
          setUser(session?.user ?? null);
          setSessionValid(isValid);
          setLoading(false);
          
          if (!isValid && session) {
            // Try to refresh if validation failed
            console.log('AuthContext: Attempting session refresh after validation failure...');
            await refreshSession();
          }
        }
        
        if (event === 'SIGNED_IN') {
          toast({
            title: "Welcome!",
            description: "Successfully signed in. Enhanced features are now available.",
            variant: "default",
          });
        } else if (event === 'SIGNED_OUT') {
          toast({
            title: "Signed Out",
            description: "You have been signed out. Some features may be limited.",
            variant: "default",
          });
        }
      }
    );

    // THEN check for existing session and validate it
    supabase.auth.getSession().then(async ({ data: { session }, error }) => {
      if (error) {
        console.error('AuthContext: Session check error:', error);
        setLoading(false);
        return;
      }
      
      console.log('AuthContext: Initial session check:', session?.user?.email);
      
      if (session) {
        const isValid = await validateSession(session);
        setSession(session);
        setUser(session.user);
        setSessionValid(isValid);
        
        if (!isValid) {
          // Try to refresh expired session
          console.log('AuthContext: Initial session invalid, attempting refresh...');
          await refreshSession();
        }
      } else {
        setSession(null);
        setUser(null);
        setSessionValid(false);
      }
      
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [toast]);

  const signIn = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      return { error };
    } catch (error) {
      return { error: error as Error };
    }
  };

  const signUp = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/`
        }
      });
      return { error };
    } catch (error) {
      return { error: error as Error };
    }
  };

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      return { error };
    } catch (error) {
      return { error: error as Error };
    }
  };

  const value = {
    user,
    session,
    loading,
    isAuthenticated: !!user && sessionValid,
    sessionValid,
    signIn,
    signUp,
    signOut,
    refreshSession,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};