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
 * Handles session persistence, validation, and provides authentication utilities
 */
export const useAuth = () => {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    isAuthenticated: false,
    loading: true
  });

  /**
   * Initialize authentication state from localStorage on component mount
   * Validates existing sessions and handles expired sessions
   */
  useEffect(() => {
    const initializeAuth = () => {
      try {
        const sessionData = localStorage.getItem('userSession');
        if (sessionData) {
          const user = JSON.parse(sessionData);
          
          // Validate session expiration (24 hours)
          if (isSessionValid(user)) {
            setAuthState({
              user,
              isAuthenticated: true,
              loading: false
            });
          } else {
            // Session expired, clean up
            localStorage.removeItem('userSession');
            setAuthState({
              user: null,
              isAuthenticated: false,
              loading: false
            });
          }
        } else {
          setAuthState({
            user: null,
            isAuthenticated: false,
            loading: false
          });
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
        // Clear corrupted session data
        localStorage.removeItem('userSession');
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
      const userData = event.detail;
      setAuthState({
        user: userData,
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

    // Set up event listeners for cross-component communication
    window.addEventListener('userLogin', handleUserLogin as EventListener);
    window.addEventListener('userLogout', handleUserLogout);

    // Cleanup event listeners
    return () => {
      window.removeEventListener('userLogin', handleUserLogin as EventListener);
      window.removeEventListener('userLogout', handleUserLogout);
    };
  }, []);

  /**
   * Validates if the current user session is still valid
   * Sessions expire after 24 hours for security
   */
  const isSessionValid = (user?: User): boolean => {
    try {
      const sessionUser = user || authState.user;
      if (!sessionUser?.loginTime) return false;

      const loginTime = new Date(sessionUser.loginTime);
      const now = new Date();
      const hoursSinceLogin = (now.getTime() - loginTime.getTime()) / (1000 * 60 * 60);
      
      // Session expires after 24 hours
      return hoursSinceLogin < 24;
    } catch {
      return false;
    }
  };

  /**
   * Signs out the current user and cleans up session data
   * Dispatches logout event for other components to react
   */
  const signOut = () => {
    try {
      // Clear session data
      localStorage.removeItem('userSession');
      
      // Update auth state
      setAuthState({
        user: null,
        isAuthenticated: false,
        loading: false
      });
      
      // Dispatch logout event for other components
      window.dispatchEvent(new CustomEvent('userLogout'));
      
      console.log('User signed out successfully');
    } catch (error) {
      console.error('Error during sign out:', error);
    }
  };

  /**
   * Creates a new user session after successful authentication
   * Stores session data securely and dispatches login event
   */
  const createSession = (userData: any) => {
    try {
      const sessionData = {
        id: userData.id,
        username: userData.username,
        fullName: userData.full_name || userData.fullName,
        loginTime: new Date().toISOString()
      };
      
      // Store session data
      localStorage.setItem('userSession', JSON.stringify(sessionData));
      
      // Update auth state
      setAuthState({
        user: sessionData,
        isAuthenticated: true,
        loading: false
      });
      
      // Dispatch login event for other components
      window.dispatchEvent(new CustomEvent('userLogin', { detail: sessionData }));
      
      console.log('User session created successfully');
      return sessionData;
    } catch (error) {
      console.error('Error creating session:', error);
      return null;
    }
  };

  /**
   * Refreshes the current session if it's still valid
   * Automatically signs out if session has expired
   */
  const refreshSession = () => {
    if (!isSessionValid()) {
      console.log('Session expired, signing out user');
      signOut();
      return false;
    }
    return true;
  };

  /**
   * Checks if user has permission to perform authenticated actions
   */
  const hasPermission = (action: 'read' | 'write' | 'admin'): boolean => {
    if (!authState.isAuthenticated || !authState.user) {
      return action === 'read'; // Allow read access for non-authenticated users
    }
    
    // Authenticated users have read and write permissions
    if (action === 'read' || action === 'write') {
      return refreshSession(); // Validate session before granting permission
    }
    
    // Admin permissions would require additional role checking
    return false;
  };

  return {
    // Auth state
    user: authState.user,
    isAuthenticated: authState.isAuthenticated,
    loading: authState.loading,
    
    // Auth methods
    signOut,
    createSession,
    refreshSession,
    isSessionValid: () => isSessionValid(),
    hasPermission,
    
    // Utility methods
    getUserDisplayName: () => authState.user?.fullName || authState.user?.username || 'User',
    getUserId: () => authState.user?.id || null
  };
};