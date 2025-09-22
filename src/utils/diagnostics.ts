// Database Connection Diagnostic Utilities
import { supabase } from '../lib/supabase';

export class DatabaseDiagnostics {
  /**
   * Test basic database connectivity
   */
  static async testConnection(): Promise<{ success: boolean; error?: string; latency?: number }> {
    const startTime = Date.now();
    
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('count')
        .limit(1);
      
      const latency = Date.now() - startTime;
      
      if (error) {
        return { success: false, error: error.message, latency };
      }
      
      return { success: true, latency };
    } catch (error: any) {
      return { 
        success: false, 
        error: error.message || 'Unknown connection error',
        latency: Date.now() - startTime
      };
    }
  }

  /**
   * Check Supabase service status
   */
  static async checkSupabaseStatus(): Promise<{ status: string; details: any }> {
    try {
      const { data, error } = await supabase.auth.getSession();
      
      if (error) {
        return {
          status: 'error',
          details: {
            auth_error: error.message,
            timestamp: new Date().toISOString()
          }
        };
      }
      
      return {
        status: 'healthy',
        details: {
          auth_working: true,
          session_exists: !!data.session,
          timestamp: new Date().toISOString()
        }
      };
    } catch (error: any) {
      return {
        status: 'critical',
        details: {
          error: error.message,
          timestamp: new Date().toISOString()
        }
      };
    }
  }

  /**
   * Test user creation flow step by step
   */
  static async testUserCreationFlow(testEmail: string): Promise<{
    steps: Array<{ step: string; success: boolean; error?: string; duration: number }>;
    overallSuccess: boolean;
  }> {
    const results: Array<{ step: string; success: boolean; error?: string; duration: number }> = [];
    let overallSuccess = true;

    // Step 1: Test auth signup
    const step1Start = Date.now();
    try {
      const { data, error } = await supabase.auth.signUp({
        email: testEmail,
        password: 'TestPassword123!',
        options: {
          data: {
            name: 'Test User',
            username: 'testuser_' + Date.now()
          }
        }
      });

      results.push({
        step: 'Auth Signup',
        success: !error,
        error: error?.message,
        duration: Date.now() - step1Start
      });

      if (error) overallSuccess = false;

      // Step 2: Check if profile was created (if signup succeeded)
      if (!error && data.user) {
        const step2Start = Date.now();
        
        // Wait a moment for triggers to execute
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', data.user.id)
          .single();

        results.push({
          step: 'Profile Creation Check',
          success: !profileError && !!profileData,
          error: profileError?.message,
          duration: Date.now() - step2Start
        });

        if (profileError) overallSuccess = false;

        // Cleanup: Delete test user if created
        if (data.user) {
          await supabase.auth.admin.deleteUser(data.user.id);
        }
      }
    } catch (error: any) {
      results.push({
        step: 'Auth Signup',
        success: false,
        error: error.message,
        duration: Date.now() - step1Start
      });
      overallSuccess = false;
    }

    return { steps: results, overallSuccess };
  }

  /**
   * Check database table structure
   */
  static async validateTableStructure(): Promise<{
    tables: Array<{ name: string; exists: boolean; columns?: string[] }>;
    issues: string[];
  }> {
    const issues: string[] = [];
    const tables = [
      { name: 'profiles', required: true },
      { name: 'discussions', required: false },
      { name: 'affiliate_products', required: false }
    ];

    const results = [];

    for (const table of tables) {
      try {
        const { data, error } = await supabase
          .from(table.name)
          .select('*')
          .limit(0);

        if (error) {
          results.push({ name: table.name, exists: false });
          if (table.required) {
            issues.push(`Required table '${table.name}' is missing or inaccessible`);
          }
        } else {
          results.push({ name: table.name, exists: true });
        }
      } catch (error: any) {
        results.push({ name: table.name, exists: false });
        if (table.required) {
          issues.push(`Error accessing table '${table.name}': ${error.message}`);
        }
      }
    }

    return { tables: results, issues };
  }
}

// Error code mappings for common Supabase/PostgreSQL errors
export const ERROR_CODES = {
  // Connection errors
  'PGRST301': 'Database connection failed',
  'PGRST302': 'Database timeout',
  
  // Authentication errors
  'PGRST100': 'Authentication required',
  'PGRST101': 'Invalid JWT token',
  'PGRST102': 'JWT token expired',
  
  // Permission errors
  'PGRST103': 'Insufficient permissions',
  'PGRST104': 'Row Level Security violation',
  
  // Data errors
  '23505': 'Unique constraint violation (duplicate data)',
  '23502': 'Not null constraint violation',
  '23503': 'Foreign key constraint violation',
  '23514': 'Check constraint violation',
  
  // Schema errors
  '42P01': 'Table does not exist',
  '42703': 'Column does not exist',
  '42883': 'Function does not exist',
  
  // Resource errors
  '53300': 'Too many connections',
  '53400': 'Configuration limit exceeded',
  '54000': 'Program limit exceeded'
};

export const getErrorDescription = (code: string): string => {
  return ERROR_CODES[code as keyof typeof ERROR_CODES] || `Unknown error code: ${code}`;
};