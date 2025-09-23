/*
  # Fix RLS policy for user account creation

  1. Security Updates
    - Add policy for anonymous users to create accounts during signup
    - Ensure authenticated users can read their own data
    - Allow users to update their own account information

  2. Changes
    - Add INSERT policy for anonymous (public) role to allow signup
    - Update existing policies to ensure proper access control
*/

-- Drop existing policies to recreate them properly
DROP POLICY IF EXISTS "Users can read own data" ON user_accounts;
DROP POLICY IF EXISTS "Users can update own data" ON user_accounts;
DROP POLICY IF EXISTS "Anyone can insert user data" ON user_accounts;

-- Allow anonymous users to create accounts during signup
CREATE POLICY "Anyone can insert user data"
  ON user_accounts
  FOR INSERT
  TO public
  WITH CHECK (true);

-- Allow authenticated users to read their own data
CREATE POLICY "Users can read own data"
  ON user_accounts
  FOR SELECT
  TO authenticated
  USING (auth.uid()::text = id::text);

-- Allow authenticated users to update their own data
CREATE POLICY "Users can update own data"
  ON user_accounts
  FOR UPDATE
  TO authenticated
  USING (auth.uid()::text = id::text)
  WITH CHECK (auth.uid()::text = id::text);