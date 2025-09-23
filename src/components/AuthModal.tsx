import React, { useState } from 'react';
import { X, Lock, User, AlertCircle, CheckCircle, Mail, Eye, EyeOff } from 'lucide-react';
import { AuthService } from '../services/authService';
import { UserRegistration, UserLogin } from '../types/auth';
import { useNotifications } from './NotificationSystem';

interface AuthModalProps {
  onClose: () => void;
  onSuccess?: () => void;
}

const AuthModal: React.FC<AuthModalProps> = ({ onClose, onSuccess }) => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { addNotification } = useNotifications();

  // Form state
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    username: '',
    password: '',
    emailOrUsername: ''
  });

  // Validation state
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [fieldStatus, setFieldStatus] = useState<Record<string, 'checking' | 'available' | 'taken'>>({});

  /**
   * Validates form fields in real-time
   */
  const validateField = async (field: string, value: string) => {
    const newErrors = { ...errors };
    delete newErrors[field];

    switch (field) {
      case 'full_name':
        if (value.trim().length < 2) {
          newErrors[field] = 'Full name must be at least 2 characters long';
        }
        break;

      case 'email':
        const emailRegex = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;
        if (!emailRegex.test(value)) {
          newErrors[field] = 'Please enter a valid email address';
        } else if (isSignUp) {
          // Check email availability
          setFieldStatus(prev => ({ ...prev, [field]: 'checking' }));
          const isAvailable = await AuthService.isEmailAvailable(value);
          setFieldStatus(prev => ({ ...prev, [field]: isAvailable ? 'available' : 'taken' }));
          if (!isAvailable) {
            newErrors[field] = 'This email is already registered';
          }
        }
        break;

      case 'username':
        if (value.length < 3) {
          newErrors[field] = 'Username must be at least 3 characters long';
        } else if (value.length > 30) {
          newErrors[field] = 'Username must be no more than 30 characters long';
        } else if (!/^[a-zA-Z0-9_]+$/.test(value)) {
          newErrors[field] = 'Username can only contain letters, numbers, and underscores';
        } else if (isSignUp) {
          // Check username availability
          setFieldStatus(prev => ({ ...prev, [field]: 'checking' }));
          const isAvailable = await AuthService.isUsernameAvailable(value);
          setFieldStatus(prev => ({ ...prev, [field]: isAvailable ? 'available' : 'taken' }));
          if (!isAvailable) {
            newErrors[field] = 'This username is already taken';
          }
        }
        break;

      case 'password':
        if (value.length < 8) {
          newErrors[field] = 'Password must be at least 8 characters long';
        }
        break;

      case 'emailOrUsername':
        if (!value.trim()) {
          newErrors[field] = 'Email or username is required';
        }
        break;
    }

    setErrors(newErrors);
  };

  /**
   * Handles form input changes
   */
  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Debounce validation for email and username
    if (field === 'email' || field === 'username') {
      const timeoutId = setTimeout(() => validateField(field, value), 500);
      return () => clearTimeout(timeoutId);
    } else {
      validateField(field, value);
    }
  };

  /**
   * Handles form submission
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isSignUp) {
        // Registration
        const registrationData: UserRegistration = {
          full_name: formData.full_name.trim(),
          email: formData.email.toLowerCase().trim(),
          username: formData.username.toLowerCase().trim(),
          password: formData.password
        };

        const result = await AuthService.register(registrationData);
        
        if (result.success) {
          addNotification({
            type: 'success',
            title: 'Registration Successful!',
            message: `Welcome ${result.user?.full_name}! Your account has been created successfully.`,
            duration: 5000
          });
          onSuccess?.();
          onClose();
        } else {
          console.error('Registration failed:', result.error);
          setErrors({ general: result.error || 'Registration failed' });
        }
      } else {
        // Login
        const loginData: UserLogin = {
          emailOrUsername: formData.emailOrUsername.trim(),
          password: formData.password
        };

        const result = await AuthService.login(loginData);
        
        if (result.success) {
          addNotification({
            type: 'success',
            title: 'Welcome Back!',
            message: `Hello ${result.user?.full_name}! You're now signed in.`,
            duration: 4000
          });
          onSuccess?.();
          onClose();
        } else {
          setErrors({ general: result.error || 'Login failed' });
        }
      }
    } catch (error: any) {
      console.error('Auth error:', error);
      setErrors({ general: 'An unexpected error occurred. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  /**
   * Toggles between sign up and sign in modes
   */
  const toggleMode = () => {
    setIsSignUp(!isSignUp);
    setFormData({
      full_name: '',
      email: '',
      username: '',
      password: '',
      emailOrUsername: ''
    });
    setErrors({});
    setFieldStatus({});
  };

  /**
   * Gets field status icon
   */
  const getFieldStatusIcon = (field: string) => {
    const status = fieldStatus[field];
    if (status === 'checking') {
      return <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>;
    }
    if (status === 'available') {
      return <CheckCircle className="h-4 w-4 text-green-500" />;
    }
    if (status === 'taken') {
      return <AlertCircle className="h-4 w-4 text-red-500" />;
    }
    return null;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            {isSignUp ? 'Create Your Account' : 'Sign In to Your Account'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
            aria-label="Close modal"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* General Error */}
          {errors.general && (
            <div className="mb-4 p-3 bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300 rounded-lg text-sm flex items-start">
              <AlertCircle className="h-4 w-4 mr-2 flex-shrink-0 mt-0.5" />
              <span>{errors.general}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Full Name - Sign Up Only */}
            {isSignUp && (
              <div>
                <label htmlFor="full_name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Full Name *
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                  <input
                    id="full_name"
                    type="text"
                    value={formData.full_name}
                    onChange={(e) => handleInputChange('full_name', e.target.value)}
                    placeholder="Enter your full name"
                    className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 ${
                      errors.full_name ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                    }`}
                    required
                  />
                </div>
                {errors.full_name && (
                  <p className="text-red-600 dark:text-red-400 text-sm mt-1">{errors.full_name}</p>
                )}
              </div>
            )}

            {/* Email - Sign Up Only */}
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
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    placeholder="Enter your email address"
                    className={`w-full pl-10 pr-10 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 ${
                      errors.email ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                    }`}
                    required
                  />
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                    {getFieldStatusIcon('email')}
                  </div>
                </div>
                {errors.email && (
                  <p className="text-red-600 dark:text-red-400 text-sm mt-1">{errors.email}</p>
                )}
              </div>
            )}

            {/* Username - Sign Up Only */}
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
                    value={formData.username}
                    onChange={(e) => handleInputChange('username', e.target.value)}
                    placeholder="Choose a username"
                    className={`w-full pl-10 pr-10 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 ${
                      errors.username ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                    }`}
                    required
                    minLength={3}
                    maxLength={30}
                  />
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                    {getFieldStatusIcon('username')}
                  </div>
                </div>
                {errors.username && (
                  <p className="text-red-600 dark:text-red-400 text-sm mt-1">{errors.username}</p>
                )}
              </div>
            )}

            {/* Email or Username - Sign In Only */}
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
                    value={formData.emailOrUsername}
                    onChange={(e) => handleInputChange('emailOrUsername', e.target.value)}
                    placeholder="Enter your email or username"
                    className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 ${
                      errors.emailOrUsername ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                    }`}
                    required
                  />
                </div>
                {errors.emailOrUsername && (
                  <p className="text-red-600 dark:text-red-400 text-sm mt-1">{errors.emailOrUsername}</p>
                )}
              </div>
            )}

            {/* Password */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Password *
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={formData.password}
                  onChange={(e) => handleInputChange('password', e.target.value)}
                  placeholder={isSignUp ? "Create a secure password" : "Enter your password"}
                  className={`w-full pl-10 pr-12 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 ${
                    errors.password ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                  }`}
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
              {errors.password && (
                <p className="text-red-600 dark:text-red-400 text-sm mt-1">{errors.password}</p>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading || Object.keys(errors).length > 0}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed text-white font-medium py-3 px-4 rounded-lg transition-colors flex items-center justify-center"
            >
              {loading ? (
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              ) : (
                isSignUp ? 'Create Account' : 'Sign In'
              )}
            </button>
          </form>

          {/* Toggle Mode */}
          <div className="mt-6 text-center">
            <button
              onClick={toggleMode}
              className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 text-sm font-medium transition-colors hover:underline"
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