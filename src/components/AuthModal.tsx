import React, { useState } from 'react';
import { X, Lock, User, AlertCircle, CheckCircle, Mail } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useNotifications } from './NotificationSystem';
import { useAuth } from '../hooks/useAuth';

interface AuthModalProps {
  onClose: () => void;
}

const AuthModal: React.FC<AuthModalProps> = ({ onClose }) => {
  const { createSession } = useAuth();
  const [isSignUp, setIsSignUp] = useState(false);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [emailOrUsername, setEmailOrUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(null);
  const [emailAvailable, setEmailAvailable] = useState<boolean | null>(null);
  const [checkingUsername, setCheckingUsername] = useState(false);
  const [checkingEmail, setCheckingEmail] = useState(false);
  
  const { addNotification } = useNotifications();

  /**
   * Validates email format using standard regex
   */
  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  /**
   * Validates password strength - minimum 6 characters
   */
  const validatePassword = (password: string) => {
    return password.length >= 6;
  };

  /**
   * Detects if input is email or username
   */
  const isEmailFormat = (input: string) => {
    return input.includes('@') && validateEmail(input);
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
   * Checks if email is available in the database
   */
  const checkEmailAvailability = async (email: string) => {
    if (!email.trim() || !validateEmail(email)) {
      setEmailAvailable(null);
      return;
    }

    setCheckingEmail(true);
    try {
      const { data, error } = await supabase
        .from('simple_users')
        .select('email')
        .eq('email', email.toLowerCase());

      if (error) throw error;
      setEmailAvailable(data.length === 0);
    } catch (error) {
      setEmailAvailable(null);
    } finally {
      setCheckingEmail(false);
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
   * Handles email input changes with debounced availability checking
   */
  const handleEmailChange = (value: string) => {
    setEmail(value);
    const timeoutId = setTimeout(() => checkEmailAvailability(value), 500);
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

    if (!email.trim() && isSignUp) {
      setError('Email address is required');
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

    if (!emailOrUsername.trim() && !isSignUp) {
      setError('Email or username is required');
      setLoading(false);
      return;
    }

    if (isSignUp) {
      // Additional signup validation
      if (!validateEmail(email)) {
        setError('Please enter a valid email address');
        setLoading(false);
        return;
      }

      if (emailAvailable === false) {
        setError('Email address is already registered');
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
            email: email.toLowerCase().trim(),
            full_name: fullName.trim(),
            username: username.toLowerCase().trim(),
            password_hash: passwordHash
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
        setEmail('');
        setUsername('');
        setPassword('');
        
      } else {
        // User Sign-in Process
        const passwordHash = await hashPassword(password);
        const isEmail = isEmailFormat(emailOrUsername);
        
        let query = supabase
          .from('simple_users')
          .select('*')
          .eq('password_hash', passwordHash);
        
        if (isEmail) {
          query = query.eq('email', emailOrUsername.toLowerCase().trim());
        } else {
          query = query.eq('username', emailOrUsername.toLowerCase().trim());
        }
        
        const { data, error } = await query.single();

        if (error || !data) {
          if (isEmail) {
            setError('Invalid email or password');
          } else {
            setError('Invalid username or password');
          }
          return;
        }

        // Create user session
        const sessionData = createSession(data);
        
        if (!sessionData) {
          setError('Failed to create user session. Please try again.');
          return;
        }

        addNotification({
          type: 'success',
          title: 'Welcome back!',
          message: `Successfully signed in as ${sessionData.fullName}`,
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
              <div>
                <span className="font-medium">Error: </span>
                <span>{error}</span>
                {error.includes('network') && (
                  <div className="mt-2 text-xs">
                    <strong>Troubleshooting tips:</strong>
                    <ul className="list-disc list-inside mt-1 space-y-1">
                      <li>Check your internet connection</li>
                      <li>Try refreshing the page</li>
                      <li>Disable VPN if you're using one</li>
                    </ul>
                  </div>
                )}
                {error.includes('Username is already taken') && (
                  <div className="mt-2 text-xs">
                    <strong>Try these alternatives:</strong>
                    <ul className="list-disc list-inside mt-1 space-y-1">
                      <li>Add numbers to your username (e.g., username123)</li>
                      <li>Use underscores (e.g., user_name)</li>
                      <li>Try a variation of your preferred name</li>
                    </ul>
                  </div>
                )}
              </div>
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

            {/* Email Field - Signup Only */}
            {isSignUp && (
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Email Address *
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => handleEmailChange(e.target.value)}
                    placeholder="Enter your email address"
                    className="w-full pl-10 pr-10 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 transition-all duration-200"
                    required
                  />
                  {/* Email Availability Indicator */}
                  {checkingEmail && (
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                    </div>
                  )}
                  {!checkingEmail && emailAvailable !== null && validateEmail(email) && (
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                      {emailAvailable ? (
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      ) : (
                        <AlertCircle className="h-4 w-4 text-red-500" />
                      )}
                    </div>
                  )}
                </div>
                {/* Email Availability Message */}
                {validateEmail(email) && emailAvailable !== null && (
                  <p className={`text-xs mt-1 transition-colors duration-200 ${emailAvailable ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                    {emailAvailable ? '✓ Email is available' : '✗ Email is already registered'}
                  </p>
                )}
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

            {/* Email or Username Field - Signin Only */}
            {!isSignUp && (
              <div>
                <label htmlFor="emailOrUsername" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Email or Username *
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                  <input
                    id="emailOrUsername"
                    type="text"
                    value={emailOrUsername}
                    onChange={(e) => setEmailOrUsername(e.target.value)}
                    placeholder="Enter your email or username"
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 transition-all duration-200"
                    required
                  />
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 flex items-center space-x-4">
                  <span>✓ Email: user@example.com</span>
                  <span>✓ Username: myusername</span>
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
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 transition-colors duration-200"
                  required
                  minLength={8}
                />
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Must be at least 6 characters long
              </p>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading || (isSignUp && (usernameAvailable === false || emailAvailable === false))}
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
                setEmailAvailable(null);
                setEmailOrUsername('');
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