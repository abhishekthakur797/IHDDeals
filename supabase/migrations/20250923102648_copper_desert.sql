/*
  # Fix User Accounts RLS and Permissions

  1. Drop and recreate user_accounts table with proper structure
  2. Fix RLS policies to allow profile creation during registration
  3. Add proper constraints and indexes
  4. Enable service role access for registration process
*/

-- Drop existing table and policies
DROP TABLE IF EXISTS user_accounts CASCADE;

-- Create user_accounts table with proper structure
CREATE TABLE user_accounts (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text NOT NULL CHECK (length(trim(full_name)) >= 2),
  email text UNIQUE NOT NULL CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'),
  username text UNIQUE NOT NULL CHECK (
    length(username) >= 3 AND 
    length(username) <= 30 AND 
    username ~* '^[a-zA-Z0-9_]+$'
  ),
  password_hash text NOT NULL CHECK (length(password_hash) >= 8),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE user_accounts ENABLE ROW LEVEL SECURITY;

-- Create indexes for performance
CREATE INDEX idx_user_accounts_email ON user_accounts(email);
CREATE INDEX idx_user_accounts_username ON user_accounts(username);
CREATE INDEX idx_user_accounts_created_at ON user_accounts(created_at DESC);

-- RLS Policies

-- Allow service role to insert during registration (bypasses RLS)
-- This is handled by Supabase service role automatically

-- Allow users to read their own account
CREATE POLICY "Users can read their own account"
  ON user_accounts
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

-- Allow users to update their own account
CREATE POLICY "Users can update their own account"
  ON user_accounts
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

-- Allow anyone to check if email/username exists (for availability checking)
CREATE POLICY "Anyone can check email/username availability"
  ON user_accounts
  FOR SELECT
  TO anon, authenticated
  USING (true);

-- Allow authenticated users to insert their own profile
CREATE POLICY "Users can insert their own profile"
  ON user_accounts
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Allow service role full access (for registration process)
CREATE POLICY "Service role full access"
  ON user_accounts
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER user_accounts_updated_at
  BEFORE UPDATE ON user_accounts
  FOR EACH ROW
  EXECUTE FUNCTION handle_updated_at();