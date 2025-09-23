import React, { useState } from 'react';
import { X, Lock, User, AlertCircle, CheckCircle, Calendar, Eye, EyeOff } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useNotifications } from './NotificationSystem';

interface AuthModalProps {
  onClose: () => void;
}

const AuthModal: React.FC<AuthModalProps> = ({ onClose }) => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(null);
  const [checkingUsername, setCheckingUsername] = useState(false);
  
  // Password visibility states
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  const { addNotification } = useNotifications();

  /**
   * Validates password strength - minimum 8 characters
   */
  const validatePassword = (password: string) => {
    return password.length >= 8;
  };

  /**
   * Validates user age - must be at least 13 years old
   */
  const validateAge = (dateOfBirth: string) => {
    const birthDate = new Date(dateOfBirth);
    const today = new Date();
    const age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      return age - 1 >= 13;
    }
    return age >= 13;
  };

  /**
   * Checks if username is available in the database
   */
  const checkUsernameAvailability = async (username: string) => {
    if (!username.trim() || username.length < 3) {
      setUsernameAvailable(null);
      return;
    }

    setCheckingUsername(true);
    try {
      const { data, error } = await supabase
        .from('simple_users')
        .select('username')
        .eq('username', username.toLowerCase());

      if (error) throw error;
      setUsernameAvailable(data.length === 0);
    } catch (error) {
      setUsernameAvailable(null);
    } finally {
      setCheckingUsername(false);
    }
  };

  /**
   * Handles username input changes with debounced availability checking
   */
  const handleUsernameChange = (value: string) => {
    setUsername(value);
    // Debounce username check
    const timeoutId = setTimeout(() => {
      checkUsernameAvailability(value);
    }, 500);
    return () => clearTimeout(timeoutId);
  };

  /**
   * Secure password hashing using SHA-256
   * Note: In production, use bcrypt on the server side
   */
  const hashPassword = async (password: string): Promise<string> => {
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  };

  /**
   * Creates a new user session after successful authentication
   */
  const createUserSession = (userData: any) => {
    // Store user session data in localStorage for persistence
    const sessionData = {
      id: userData.id,
      username: userData.username,
      fullName: userData.full_name,
      loginTime: new Date().toISOString()
    };
    
    localStorage.setItem('userSession', JSON.stringify(sessionData));
    
    // Trigger a custom event to notify other components of login
    window.dispatchEvent(new CustomEvent('userLogin', { detail: sessionData }));
  };

  /**
   * Main authentication handler for both signup and signin
   */
  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    // Form validation
    if (!fullName.trim() && isSignUp) {
      setError('Full name is required');
      setLoading(false);
      return;
    }

    if (!username.trim() || username.length < 3) {
      setError('Username must be at least 3 characters long');
      setLoading(false);
      return;
    }

    if (!validatePassword(password)) {
      setError('Password must be at least 8 characters long');
      setLoading(false);
      return;
    }

    if (isSignUp) {
      // Additional signup validation
      if (password !== confirmPassword) {
        setError('Passwords do not match');
        setLoading(false);
        return;
      }

      if (!dateOfBirth) {
        setError('Date of birth is required');
        setLoading(false);
        return;
      }

      if (!validateAge(dateOfBirth)) {
        setError('You must be at least 13 years old to create an account');
        setLoading(false);
        return;
      }

      if (usernameAvailable === false) {
        setError('Username is already taken');
        setLoading(false);
        return;
      }
    }

    try {
      if (isSignUp) {
        // User Registration Process
        const passwordHash = await hashPassword(password);
        
        const { data, error } = await supabase
          .from('simple_users')
          .insert({
            full_name: fullName.trim(),
            username: username.toLowerCase().trim(),
            password_hash: passwordHash,
            date_of_birth: dateOfBirth
          })
          .select()
          .single();

        if (error) {
          setError('Failed to create account. Please try again.');
          return;
        }

        addNotification({
          type: 'success',
          title: 'Account Created Successfully!',
          message: 'You can now sign in with your credentials.',
          duration: 5000
        });
        
        setSuccess('Account created successfully! You can now sign in.');
        setIsSignUp(false);
        
        // Clear form fields
        setFullName('');
        setUsername('');
        setPassword('');
        setConfirmPassword('');
        setDateOfBirth('');
        
      } else {
        // User Sign-in Process
        const passwordHash = await hashPassword(password);
        
        const { data, error } = await supabase
          .from('simple_users')
          .select('*')
          .eq('username', username.toLowerCase().trim())
          .eq('password_hash', passwordHash)
          .single();

        if (error || !data) {
          setError('Invalid username or password');
          return;
        }

        // Create user session
        createUserSession(data);

        addNotification({
          type: 'success',
          title: 'Welcome back!',
          message: `Successfully signed in as ${data.full_name}`,
          duration: 3000
        });
        
        onClose();
      }
    } catch (error: any) {
      console.error('Authentication error:', error);
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Toggle password visibility for better UX
   */
  const togglePasswordVisibility = (field: 'password' | 'confirmPassword') => {
    if (field === 'password') {
      setShowPassword(!showPassword);
    } else {
      setShowConfirmPassword(!showConfirmPassword);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4 transition-opacity duration-300">
      <div className="bg-white dark:bg-gray-800 rounded-lg max-w-md w-full transition-all duration-400 transform max-h-[90vh] overflow-y-auto">
        {/* Modal Header */}
        <div className="flex justify-between items-center p-6 border-b border-gray-200 dark:border-gray-700 transition-colors duration-350">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            {isSignUp ? 'Create Your Account' : 'Sign In to Your Account'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors duration-200 hover:scale-110"
            aria-label="Close modal"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6">
          {/* Error Display */}
          {error && (
            <div className="mb-4 p-3 bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300 rounded-lg text-sm flex items-center animate-fade-in">
              <AlertCircle className="h-4 w-4 mr-2 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Success Display */}
          {success && (
            <div className="mb-4 p-3 bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 rounded-lg text-sm flex items-center animate-fade-in">
              <CheckCircle className="h-4 w-4 mr-2 flex-shrink-0" />
              <span>{success}</span>
            </div>
          )}

          {/* Authentication Form */}
          <form onSubmit={handleAuth} className="space-y-4">
            {/* Full Name Field - Signup Only */}
            {isSignUp && (
              <div>
                <label htmlFor="fullName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Full Name *
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                  <input
                    id="fullName"
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Enter your full name"
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 transition-all duration-200"
                    required
                  />
                </div>
              </div>
            )}

            {/* Username Field */}
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Username *
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                <input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e) => handleUsernameChange(e.target.value)}
                  placeholder="Choose a username"
                  className="w-full pl-10 pr-10 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 transition-all duration-200"
                  required
                  minLength={3}
                />
                {/* Username Availability Indicator */}
                {isSignUp && checkingUsername && (
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                  </div>
                )}
                {isSignUp && !checkingUsername && usernameAvailable !== null && (
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                    {usernameAvailable ? (
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    ) : (
                      <AlertCircle className="h-4 w-4 text-red-500" />
                    )}
                  </div>
                )}
              </div>
              {/* Username Availability Message */}
              {isSignUp && username.length >= 3 && usernameAvailable !== null && (
                <p className={`text-xs mt-1 transition-colors duration-200 ${usernameAvailable ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                  {usernameAvailable ? '✓ Username is available' : '✗ Username is already taken'}
                </p>
              )}
            </div>

            {/* Date of Birth Field - Signup Only */}
            {isSignUp && (
              <div>
                <label htmlFor="dateOfBirth" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Date of Birth *
                </label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                  <input
                    id="dateOfBirth"
                    type="date"
                    value={dateOfBirth}
                    onChange={(e) => setDateOfBirth(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-all duration-200"
                    required
                    max={new Date().toISOString().split('T')[0]}
                  />
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  You must be at least 13 years old
                </p>
              </div>
            )}

            {/* Password Field */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Password *
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="w-full pl-10 pr-12 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 transition-all duration-200"
                  required
                  minLength={8}
                />
                {/* Password Visibility Toggle */}
                <button
                  type="button"
                  onClick={() => togglePasswordVisibility('password')}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors duration-200"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Must be at least 8 characters long
              </p>
            </div>

            {/* Confirm Password Field - Signup Only */}
            {isSignUp && (
              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Confirm Password *
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                  <input
                    id="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm your password"
                    className="w-full pl-10 pr-12 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 transition-colors duration-200"
                    required
                    minLength={8}
                  />
                  {/* Confirm Password Visibility Toggle */}
                  <button
                    type="button"
                    onClick={() => togglePasswordVisibility('confirmPassword')}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors duration-200 flex items-center justify-center w-5 h-5"
                    aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-5 w-5" />
                    ) : (
                      <Eye className="h-5 w-5" />
                    )}
                  </button>
                </div>
                {/* Password Match Indicator */}
                {confirmPassword && (
                  <p className={`text-xs mt-1 transition-colors duration-200 ${
                    password === confirmPassword 
                      ? 'text-green-600 dark:text-green-400' 
                      : 'text-red-600 dark:text-red-400'
                  }`}>
                    {password === confirmPassword ? '✓ Passwords match' : '✗ Passwords do not match'}
                  </p>
                )}
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading || (isSignUp && usernameAvailable === false)}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed text-white font-medium py-3 px-4 rounded-lg transition-colors duration-200 flex items-center justify-center"
            >
              {loading ? (
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              ) : (
                isSignUp ? 'Create Account' : 'Sign In'
              )}
            </button>
          </form>

          {/* Toggle Between Signup/Signin */}
          <div className="mt-6 text-center">
            <button
              onClick={() => {
                setIsSignUp(!isSignUp);
                setError('');
                setSuccess('');
                setUsernameAvailable(null);
              }}
              className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 text-sm font-medium transition-colors duration-200 hover:underline inline-block"
            >
              {isSignUp 
                ? 'Already have an account? Sign in here' 
                : "Don't have an account? Create one here"
              }
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthModal;