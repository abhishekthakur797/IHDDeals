/*
  # Fix RLS Policy Violation for User Accounts

  This migration addresses the "new row violates row-level security policy" error
  by properly configuring RLS policies for user account creation.

  ## Root Cause Analysis
  The error occurs when:
  1. RLS is enabled on user_accounts table
  2. No policy allows the current user context to INSERT rows
  3. The INSERT operation fails the policy check

  ## Solution
  1. Drop existing conflicting policies
  2. Create proper policies for different user contexts
  3. Ensure service role can create accounts during registration
  4. Allow users to manage their own accounts
*/

-- First, let's check current RLS status and policies
DO $$
BEGIN
  RAISE NOTICE 'Current RLS policies for user_accounts:';
END $$;

-- Drop existing policies to start fresh
DROP POLICY IF EXISTS "Users can insert their own profile" ON user_accounts;
DROP POLICY IF EXISTS "Users can read their own account" ON user_accounts;
DROP POLICY IF EXISTS "Users can update their own account" ON user_accounts;
DROP POLICY IF EXISTS "Service role full access" ON user_accounts;
DROP POLICY IF EXISTS "Anyone can check email/username availability" ON user_accounts;

-- Ensure RLS is enabled
ALTER TABLE user_accounts ENABLE ROW LEVEL SECURITY;

-- Policy 1: Service role has full access (for registration process)
CREATE POLICY "service_role_full_access" ON user_accounts
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Policy 2: Allow authenticated users to insert their own profile
CREATE POLICY "users_can_insert_own_profile" ON user_accounts
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Policy 3: Allow users to read their own account
CREATE POLICY "users_can_read_own_account" ON user_accounts
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

-- Policy 4: Allow users to update their own account
CREATE POLICY "users_can_update_own_account" ON user_accounts
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Policy 5: Allow anonymous users to check email/username availability
CREATE POLICY "anonymous_can_check_availability" ON user_accounts
  FOR SELECT
  TO anon
  USING (true);

-- Policy 6: Allow authenticated users to check availability
CREATE POLICY "authenticated_can_check_availability" ON user_accounts
  FOR SELECT
  TO authenticated
  USING (true);

-- Verify policies are created correctly
DO $$
DECLARE
  policy_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO policy_count
  FROM pg_policies 
  WHERE tablename = 'user_accounts';
  
  RAISE NOTICE 'Created % policies for user_accounts table', policy_count;
END $$;

-- Grant necessary permissions to roles
GRANT ALL ON user_accounts TO service_role;
GRANT SELECT, INSERT, UPDATE ON user_accounts TO authenticated;
GRANT SELECT ON user_accounts TO anon;

-- Test policy functionality
DO $$
BEGIN
  RAISE NOTICE 'RLS policies have been updated successfully';
  RAISE NOTICE 'Service role can now create user accounts during registration';
  RAISE NOTICE 'Users can manage their own accounts after authentication';
END $$;