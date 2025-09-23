import { supabase } from '../lib/supabase';
import { User, UserRegistration, UserLogin, AuthResponse, ValidationError } from '../types/auth';

/**
 * Authentication Service
 * Handles user registration, login, and session management
 */
export class AuthService {
  
  /**
   * Validates user registration data
   */
  static validateRegistration(data: UserRegistration): ValidationError[] {
    const errors: ValidationError[] = [];

    // Full name validation
    if (!data.full_name || data.full_name.trim().length < 2) {
      errors.push({ field: 'full_name', message: 'Full name must be at least 2 characters long' });
    }

    // Email validation
    const emailRegex = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;
    if (!data.email || !emailRegex.test(data.email)) {
      errors.push({ field: 'email', message: 'Please enter a valid email address' });
    }

    // Username validation
    if (!data.username || data.username.length < 3) {
      errors.push({ field: 'username', message: 'Username must be at least 3 characters long' });
    } else if (data.username.length > 30) {
      errors.push({ field: 'username', message: 'Username must be no more than 30 characters long' });
    } else if (!/^[a-zA-Z0-9_]+$/.test(data.username)) {
      errors.push({ field: 'username', message: 'Username can only contain letters, numbers, and underscores' });
    }

    // Password validation
    if (!data.password || data.password.length < 8) {
      errors.push({ field: 'password', message: 'Password must be at least 8 characters long' });
    }

    return errors;
  }

  /**
   * Registers a new user
   */
  static async register(userData: UserRegistration): Promise<AuthResponse> {
    try {
      // Validate input data
      const validationErrors = this.validateRegistration(userData);
      if (validationErrors.length > 0) {
        return { 
          success: false, 
          error: validationErrors.map(e => e.message).join(', ') 
        };
      }

      // Use Supabase Auth for registration
      const { data, error } = await supabase.auth.signUp({
        email: userData.email,
        password: userData.password,
        options: {
          data: {
            full_name: userData.full_name.trim(),
            username: userData.username.toLowerCase().trim()
          }
        }
      });

      if (error) {
        return { success: false, error: this.getAuthErrorMessage(error) };
      }

      if (data.user) {
        // Create user profile in our custom table
        const { error: profileError } = await supabase
          .from('user_accounts')
          .insert({
            id: data.user.id,
            full_name: userData.full_name.trim(),
            email: userData.email.toLowerCase().trim(),
            username: userData.username.toLowerCase().trim(),
            password_hash: 'managed_by_supabase_auth' // Placeholder since Supabase handles password hashing
          });

        if (profileError) {
          console.error('Profile creation error:', profileError);
          // Don't fail registration if profile creation fails
        }

        return { 
          success: true, 
          user: {
            id: data.user.id,
            full_name: userData.full_name.trim(),
            email: userData.email.toLowerCase().trim(),
            username: userData.username.toLowerCase().trim(),
            created_at: data.user.created_at || new Date().toISOString(),
            updated_at: new Date().toISOString()
          }
        };
      }

      return { success: false, error: 'Registration failed. Please try again.' };
    } catch (error: any) {
      console.error('Registration error:', error);
      return { success: false, error: 'An unexpected error occurred during registration' };
    }
  }

  /**
   * Logs in a user
   */
  static async login(credentials: UserLogin): Promise<AuthResponse> {
    try {
      const { emailOrUsername, password } = credentials;

      if (!emailOrUsername || !password) {
        return { success: false, error: 'Email/username and password are required' };
      }

      // Determine if input is email or username
      const isEmail = emailOrUsername.includes('@');
      
      let email = emailOrUsername;
      
      // If username provided, get email from database
      if (!isEmail) {
        const { data: userProfile, error: profileError } = await supabase
          .from('user_accounts')
          .select('email')
          .eq('username', emailOrUsername.toLowerCase())
          .single();

        if (profileError || !userProfile) {
          return { success: false, error: 'Invalid username or password' };
        }
        
        email = userProfile.email;
      }

      // Authenticate with Supabase
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email,
        password: password
      });

      if (error) {
        return { success: false, error: this.getAuthErrorMessage(error) };
      }

      if (data.user) {
        // Get user profile data
        const { data: userProfile, error: profileError } = await supabase
          .from('user_accounts')
          .select('*')
          .eq('id', data.user.id)
          .single();

        if (profileError || !userProfile) {
          // Create profile if it doesn't exist
          const profileData = {
            id: data.user.id,
            full_name: data.user.user_metadata?.full_name || 'User',
            email: data.user.email || email,
            username: data.user.user_metadata?.username || `user_${Date.now()}`,
            password_hash: 'managed_by_supabase_auth'
          };

          await supabase.from('user_accounts').insert(profileData);
          
          return { 
            success: true, 
            user: {
              ...profileData,
              created_at: data.user.created_at || new Date().toISOString(),
              updated_at: new Date().toISOString()
            }
          };
        }

        return { 
          success: true, 
          user: {
            id: userProfile.id,
            full_name: userProfile.full_name,
            email: userProfile.email,
            username: userProfile.username,
            created_at: userProfile.created_at,
            updated_at: userProfile.updated_at
          }
        };
      }

      return { success: false, error: 'Login failed. Please try again.' };
    } catch (error: any) {
      console.error('Login error:', error);
      return { success: false, error: 'An unexpected error occurred during login' };
    }
  }

  /**
   * Signs out the current user
   */
  static async signOut(): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        return { success: false, error: error.message };
      }
      return { success: true };
    } catch (error: any) {
      console.error('Sign out error:', error);
      return { success: false, error: 'Failed to sign out' };
    }
  }

  /**
   * Gets the current user session
   */
  static async getCurrentUser(): Promise<User | null> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) return null;

      // Get user profile data
      const { data: userProfile, error } = await supabase
        .from('user_accounts')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error || !userProfile) {
        return null;
      }

      return {
        id: userProfile.id,
        full_name: userProfile.full_name,
        email: userProfile.email,
        username: userProfile.username,
        created_at: userProfile.created_at,
        updated_at: userProfile.updated_at
      };
    } catch (error) {
      console.error('Get current user error:', error);
      return null;
    }
  }

  /**
   * Checks if username is available
   */
  static async isUsernameAvailable(username: string): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from('user_accounts')
        .select('username')
        .eq('username', username.toLowerCase())
        .single();

      return error?.code === 'PGRST116'; // No rows returned means username is available
    } catch (error) {
      return false;
    }
  }

  /**
   * Checks if email is available
   */
  static async isEmailAvailable(email: string): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from('user_accounts')
        .select('email')
        .eq('email', email.toLowerCase())
        .single();

      return error?.code === 'PGRST116'; // No rows returned means email is available
    } catch (error) {
      return false;
    }
  }

  /**
   * Maps Supabase auth errors to user-friendly messages
   */
  private static getAuthErrorMessage(error: any): string {
    switch (error.message) {
      case 'Invalid login credentials':
        return 'Invalid email/username or password';
      case 'User already registered':
        return 'An account with this email already exists';
      case 'Password should be at least 6 characters':
        return 'Password must be at least 8 characters long';
      case 'Unable to validate email address: invalid format':
        return 'Please enter a valid email address';
      case 'signup_disabled':
        return 'New registrations are currently disabled';
      default:
        return error.message || 'An authentication error occurred';
    }
  }
}