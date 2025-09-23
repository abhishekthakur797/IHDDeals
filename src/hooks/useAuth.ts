import { useState, useEffect } from 'react';

interface User {
  id: string;
  username: string;
  fullName: string;
  loginTime: string;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  loading: boolean;
}

/**
 * Custom hook for managing user authentication state
 * Handles session persistence and provides authentication utilities
 */
export const useAuth = () => {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    isAuthenticated: false,
    loading: true
  });

  /**
   * Initialize authentication state from localStorage
   */
  useEffect(() => {
    const initializeAuth = () => {
      try {
        const sessionData = localStorage.getItem('userSession');
        if (sessionData) {
          const user = JSON.parse(sessionData);
          setAuthState({
            user,
            isAuthenticated: true,
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
        console.error('Error initializing auth:', error);
        setAuthState({
          user: null,
          isAuthenticated: false,
          loading: false
        });
      }
    };

    initializeAuth();

    // Listen for login events from other components
    const handleUserLogin = (event: CustomEvent) => {
      setAuthState({
        user: event.detail,
        isAuthenticated: true,
        loading: false
      });
    };

    // Listen for logout events
    const handleUserLogout = () => {
      setAuthState({
        user: null,
        isAuthenticated: false,
        loading: false
      });
    };

    window.addEventListener('userLogin', handleUserLogin as EventListener);
    window.addEventListener('userLogout', handleUserLogout);

    return () => {
      window.removeEventListener('userLogin', handleUserLogin as EventListener);
      window.removeEventListener('userLogout', handleUserLogout);
    };
  }, []);

  /**
   * Sign out the current user
   */
  const signOut = () => {
    localStorage.removeItem('userSession');
    setAuthState({
      user: null,
      isAuthenticated: false,
      loading: false
    });
    
    // Dispatch logout event
    window.dispatchEvent(new CustomEvent('userLogout'));
  };

  /**
   * Check if user session is still valid (optional: add expiration logic)
   */
  const isSessionValid = (): boolean => {
    const sessionData = localStorage.getItem('userSession');
    if (!sessionData) return false;

    try {
      const user = JSON.parse(sessionData);
      const loginTime = new Date(user.loginTime);
      const now = new Date();
      const hoursSinceLogin = (now.getTime() - loginTime.getTime()) / (1000 * 60 * 60);
      
      // Session expires after 24 hours
      return hoursSinceLogin < 24;
    } catch {
      return false;
    }
  };

  /**
   * Refresh user session if needed
   */
  const refreshSession = () => {
    if (!isSessionValid()) {
      signOut();
    }
  };

  return {
    user: authState.user,
    isAuthenticated: authState.isAuthenticated,
    loading: authState.loading,
    signOut,
    isSessionValid,
    refreshSession
  };
};