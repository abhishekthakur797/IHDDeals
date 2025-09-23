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

      // Check if email and username are available first
      const emailAvailable = await this.isEmailAvailable(userData.email);
      const usernameAvailable = await this.isUsernameAvailable(userData.username);

      if (!emailAvailable) {
        return { success: false, error: 'This email is already registered' };
      }

      if (!usernameAvailable) {
        return { success: false, error: 'This username is already taken' };
      }

      console.log('Starting registration for:', userData.email);

      // Step 1: Create auth user with email confirmation disabled
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: userData.email,
        password: userData.password,
        options: {
          emailRedirectTo: undefined, // Disable email confirmation
          data: {
            full_name: userData.full_name.trim(),
            username: userData.username.toLowerCase().trim()
          }
        }
      });

      if (authError) {
        console.error('Auth registration error:', authError.message, authError);
        return { success: false, error: this.getAuthErrorMessage(authError) };
      }

      if (!authData.user) {
        console.error('No user returned from auth signup');
        return { success: false, error: 'Registration failed. Please try again.' };
      }

      console.log('Auth user created successfully:', authData.user.id);

      // Step 2: Create user profile in our custom table
      const profileData = {
        id: authData.user.id,
        full_name: userData.full_name.trim(),
        email: userData.email.toLowerCase().trim(),
        username: userData.username.toLowerCase().trim(),
        password_hash: 'supabase_managed' // Placeholder since Supabase handles password hashing
      };

      console.log('Attempting to create profile with data:', profileData);

      const { data: profileInsertData, error: profileError } = await supabase
        .from('user_accounts')
        .insert(profileData)
        .select()
        .single();

      if (profileError) {
        console.error('Profile creation error:', profileError.message, profileError);
        console.error('Profile data that failed:', profileData);
        
        // If profile creation fails, clean up the auth user
        try {
          console.log('Cleaning up auth user due to profile creation failure');
          await supabase.auth.admin.deleteUser(authData.user.id);
        } catch (cleanupError) {
          console.error('Failed to cleanup auth user:', cleanupError);
        }
        
        return { 
          success: false, 
          error: `Failed to create user profile: ${profileError.message}. Please try again.`
        };
      }

      console.log('Profile created successfully:', profileInsertData);

      // Step 3: Sign in the user automatically
      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email: userData.email,
        password: userData.password
      });

      if (signInError) {
        console.error('Auto sign-in error:', signInError.message, signInError);
        // Profile was created successfully, but auto sign-in failed
        return { 
          success: true, 
          user: {
            id: profileInsertData.id,
            full_name: profileInsertData.full_name,
            email: profileInsertData.email,
            username: profileInsertData.username,
            created_at: profileInsertData.created_at,
            updated_at: profileInsertData.updated_at
          }
        };
      }

      console.log('Registration completed successfully for:', userData.email);

      return { 
        success: true, 
        user: {
          id: profileInsertData.id,
          full_name: profileInsertData.full_name,
          email: profileInsertData.email,
          username: profileInsertData.username,
          created_at: profileInsertData.created_at,
          updated_at: profileInsertData.updated_at
        }
      };

    } catch (error: any) {
      console.error('Unexpected registration error:', error.message, error);
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
          console.error('User profile not found:', profileError);
          return { success: false, error: 'User profile not found. Please contact support.' };
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
      if (!username || username.trim().length < 3) {
        return false;
      }

      const { data, error } = await supabase
        .from('user_accounts')
        .select('username')
        .eq('username', username.toLowerCase())
        .single();

      // PGRST116 means no rows found, which means username is available
      if (error?.code === 'PGRST116') {
        return true;
      }
      
      // If we got data, username is taken
      if (data) {
        return false;
      }
      
      // For other errors, assume not available for safety
      console.error('Username availability check error:', error);
      return false;
    } catch (error) {
      console.error('Username availability check exception:', error);
      return false;
    }
  }

  /**
   * Checks if email is available
   */
  static async isEmailAvailable(email: string): Promise<boolean> {
    try {
      if (!email || !email.includes('@')) {
        return false;
      }

      const { data, error } = await supabase
        .from('user_accounts')
        .select('email')
        .eq('email', email.toLowerCase())
        .single();

      // PGRST116 means no rows found, which means email is available
      if (error?.code === 'PGRST116') {
        return true;
      }
      
      // If we got data, email is taken
      if (data) {
        return false;
      }
      
      // For other errors, assume not available for safety
      console.error('Email availability check error:', error);
      return false;
    } catch (error) {
      console.error('Email availability check exception:', error);
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