import React, { useState } from 'react';
import { X, Lock, User, AlertCircle, CheckCircle, Mail, Eye, EyeOff } from 'lucide-react';
import { useNotifications } from './NotificationSystem';

interface AuthModalProps {
  onClose: () => void;
}

const AuthModal: React.FC<AuthModalProps> = ({ onClose }) => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [emailOrUsername, setEmailOrUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  const { addNotification } = useNotifications();

  /**
   * Validates email format using comprehensive regex
   */
  const validateEmail = (email: string) => {
    const emailRegex = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;
    return emailRegex.test(email);
  };

  /**
   * Validates password strength - enhanced requirements
   */
  const validatePassword = (password: string) => {
    if (password.length < 8) return { valid: false, message: 'Password must be at least 8 characters long' };
    if (!/[A-Z]/.test(password)) return { valid: false, message: 'Password must contain at least one uppercase letter' };
    if (!/[a-z]/.test(password)) return { valid: false, message: 'Password must contain at least one lowercase letter' };
    if (!/[0-9]/.test(password)) return { valid: false, message: 'Password must contain at least one number' };
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) return { valid: false, message: 'Password must contain at least one special character' };
    return { valid: true, message: 'Password meets all requirements' };
  };

  /**
   * Validates username format
   */
  const validateUsername = (username: string) => {
    if (username.length < 3) return { valid: false, message: 'Username must be at least 3 characters long' };
    if (username.length > 30) return { valid: false, message: 'Username must be no more than 30 characters long' };
    if (!/^[a-zA-Z0-9_]+$/.test(username)) return { valid: false, message: 'Username can only contain letters, numbers, and underscores' };
    return { valid: true, message: 'Username format is valid' };
  };

  /**
   * Validates full name
   */
  const validateFullName = (name: string) => {
    const trimmed = name.trim();
    if (trimmed.length < 2) return { valid: false, message: 'Full name must be at least 2 characters long' };
    if (!/^[a-zA-Z\s'-]+$/.test(trimmed)) return { valid: false, message: 'Full name can only contain letters, spaces, hyphens, and apostrophes' };
    return { valid: true, message: 'Full name is valid' };
  };

  /**
   * Detects if input is email or username
   */
  const isEmailFormat = (input: string) => {
    return input.includes('@') && validateEmail(input);
  };

  /**
   * Main authentication handler for both signup and signin
   */
  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      if (isSignUp) {
        // Signup functionality will be implemented after database setup
        setError('Database not configured yet. Please wait for setup.');
        
      } else {
        // Signin functionality will be implemented after database setup
        setError('Database not configured yet. Please wait for setup.');
      }
    } catch (error: any) {
      console.error('Authentication error:', error);
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getPasswordStrengthColor = () => {
    const validation = validatePassword(password);
    if (!password) return 'gray';
    return validation.valid ? 'green' : 'red';
  };

  const getPasswordStrengthText = () => {
    if (!password) return '';
    const validation = validatePassword(password);
    return validation.message;
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
            <div className="mb-4 p-3 bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300 rounded-lg text-sm flex items-start animate-fade-in">
              <AlertCircle className="h-4 w-4 mr-2 flex-shrink-0 mt-0.5" />
              <div>
                <span className="font-medium">Error: </span>
                <span>{error}</span>
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
                {fullName && (
                  <p className={`text-xs mt-1 ${validateFullName(fullName).valid ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                    {validateFullName(fullName).message}
                  </p>
                )}
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
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email address"
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 transition-all duration-200"
                    required
                  />
                </div>
              </div>
            )}

            {/* Username Field - Signup Only */}
            {isSignUp && (
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
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Choose a username"
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 transition-all duration-200"
                    required
                    minLength={3}
                    maxLength={30}
                  />
                </div>
              </div>
            )}

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
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={isSignUp ? "Create a secure password" : "Enter your password"}
                  className="w-full pl-10 pr-12 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 transition-colors duration-200"
                  required
                  minLength={8}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {isSignUp && password && (
                <p className={`text-xs mt-1 transition-colors duration-200 ${
                  getPasswordStrengthColor() === 'green' 
                    ? 'text-green-600 dark:text-green-400' 
                    : 'text-red-600 dark:text-red-400'
                }`}>
                  {getPasswordStrengthText()}
                </p>
              )}
              {!isSignUp && (
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Enter the password for your account
                </p>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
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
                setEmailOrUsername('');
                setFullName('');
                setEmail('');
                setUsername('');
                setPassword('');
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