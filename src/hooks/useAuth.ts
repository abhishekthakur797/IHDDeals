import { useState, useEffect } from 'react';
import { User } from '../types/auth';
import { AuthService } from '../services/authService';
import { supabase } from '../lib/supabase';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  loading: boolean;
}

/**
 * Custom hook for managing user authentication state
 * Integrates with Supabase Auth and custom user profiles
 */
export const useAuth = () => {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    isAuthenticated: false,
    loading: true
  });

  /**
   * Initialize authentication state and listen for auth changes
   */
  useEffect(() => {
    // Get initial session
    const getInitialSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session?.user) {
          const user = await AuthService.getCurrentUser();
          setAuthState({
            user,
            isAuthenticated: !!user,
            loading: false
          });
        } else {
          setAuthState({
            user: null,
            isAuthenticated: false,
            loading: false
          });
        }
      } catch (error) {
        console.error('Error getting initial session:', error);
        setAuthState({
          user: null,
          isAuthenticated: false,
          loading: false
        });
      }
    };

    getInitialSession();

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event, session?.user?.id);
        
        if (session?.user) {
          const user = await AuthService.getCurrentUser();
          setAuthState({
            user,
            isAuthenticated: !!user,
            loading: false
          });
        } else {
          setAuthState({
            user: null,
            isAuthenticated: false,
            loading: false
          });
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  /**
   * Sign out the current user
   */
  const signOut = async () => {
    try {
      const result = await AuthService.signOut();
      if (result.success) {
        setAuthState({
          user: null,
          isAuthenticated: false,
          loading: false
        });
      }
      return result;
    } catch (error) {
      console.error('Sign out error:', error);
      return { success: false, error: 'Failed to sign out' };
    }
  };

  /**
   * Refresh user data
   */
  const refreshUser = async () => {
    try {
      const user = await AuthService.getCurrentUser();
      setAuthState(prev => ({
        ...prev,
        user,
        isAuthenticated: !!user
      }));
      return user;
    } catch (error) {
      console.error('Refresh user error:', error);
      return null;
    }
  };

  /**
   * Check if user has permission to perform an action
   */
  const hasPermission = (action: 'read' | 'write' | 'admin'): boolean => {
    if (action === 'read') return true; // Anyone can read
    if (action === 'write') return authState.isAuthenticated; // Only authenticated users can write
    if (action === 'admin') return false; // Admin permissions would require role checking
    return false;
  };

  return {
    // Auth state
    user: authState.user,
    isAuthenticated: authState.isAuthenticated,
    loading: authState.loading,
    
    // Auth methods
    signOut,
    refreshUser,
    hasPermission,
    
    // Utility methods
    getUserDisplayName: () => authState.user?.full_name || authState.user?.username || 'User',
    getUserId: () => authState.user?.id || null,
    isSessionValid: () => authState.isAuthenticated && !!authState.user
  };
};