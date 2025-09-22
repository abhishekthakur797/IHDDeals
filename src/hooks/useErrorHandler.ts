import { useState, useCallback } from 'react';
import { useNotifications } from '../components/NotificationSystem';

interface ErrorDetails {
  code?: string;
  message: string;
  context?: string;
  timestamp: string;
  userId?: string;
}

export const useErrorHandler = () => {
  const { addNotification } = useNotifications();
  const [errors, setErrors] = useState<ErrorDetails[]>([]);

  const logError = useCallback((error: any, context?: string) => {
    const errorDetails: ErrorDetails = {
      code: error.code || error.status,
      message: error.message || 'Unknown error occurred',
      context,
      timestamp: new Date().toISOString(),
      userId: error.userId
    };

    setErrors(prev => [...prev.slice(-9), errorDetails]); // Keep last 10 errors

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('Error logged:', errorDetails);
    }

    return errorDetails;
  }, []);

  const handleAuthError = useCallback((error: any, context: string = 'Authentication') => {
    const errorDetails = logError(error, context);
    
    // Map common auth errors to user-friendly messages
    const userMessage = getAuthErrorMessage(error);
    
    addNotification({
      type: 'error',
      title: 'Authentication Error',
      message: userMessage,
      duration: 5000
    });

    return errorDetails;
  }, [logError, addNotification]);

  const handleDatabaseError = useCallback((error: any, context: string = 'Database') => => {
    const errorDetails = logError(error, context);
    
    // Map common database errors to user-friendly messages
    const userMessage = getDatabaseErrorMessage(error);
    
    addNotification({
      type: 'error',
      title: 'Database Error',
      message: userMessage,
      duration: 7000
    });

    return errorDetails;
  }, [logError, addNotification]);

  const handleValidationError = useCallback((error: any, context: string = 'Validation') => {
    const errorDetails = logError(error, context);
    
    addNotification({
      type: 'error',
      title: 'Validation Error',
      message: error.message || 'Please check your input and try again',
      duration: 4000
    });

    return errorDetails;
  }, [logError, addNotification]);

  const clearErrors = useCallback(() => {
    setErrors([]);
  }, []);

  return {
    errors,
    logError,
    handleAuthError,
    handleDatabaseError,
    handleValidationError,
    clearErrors
  };
};

// Helper functions for error message mapping
const getAuthErrorMessage = (error: any): string => {
  const errorCode = error.code || error.message;
  
  const authErrorMap: Record<string, string> = {
    'invalid_credentials': 'Invalid email or password. Please check your credentials and try again.',
    'email_not_confirmed': 'Please check your email and click the confirmation link before signing in.',
    'signup_disabled': 'New account registration is currently disabled.',
    'email_address_invalid': 'Please enter a valid email address.',
    'password_too_short': 'Password must be at least 6 characters long.',
    'weak_password': 'Please choose a stronger password with a mix of letters, numbers, and symbols.',
    'email_address_not_authorized': 'This email address is not authorized to create an account.',
    'too_many_requests': 'Too many attempts. Please wait a few minutes before trying again.',
    'user_already_registered': 'An account with this email already exists. Try signing in instead.'
  };

  return authErrorMap[errorCode] || 'An authentication error occurred. Please try again.';
};

const getDatabaseErrorMessage = (error: any): string => {
  const errorCode = error.code || error.message;
  
  const dbErrorMap: Record<string, string> = {
    '23505': 'This information is already in use. Please try different values.',
    '23502': 'Required information is missing. Please fill in all required fields.',
    '23503': 'Invalid reference data. Please check your input.',
    '42P01': 'Database table not found. Please contact support.',
    '42703': 'Database column not found. Please contact support.',
    'PGRST301': 'Unable to connect to database. Please try again later.',
    'PGRST302': 'Database request timed out. Please try again.',
    'PGRST103': 'You do not have permission to perform this action.',
    'PGRST104': 'Access denied. You can only modify your own data.'
  };

  return dbErrorMap[errorCode] || 'A database error occurred while saving your information. Please try again.';
};