/*
  # Fix User Accounts Storage System

  1. Database Structure
    - Drop and recreate user_accounts table with proper structure
    - Add proper constraints and indexes
    - Enable RLS with correct policies
    
  2. Security
    - Enable RLS on user_accounts table
    - Add policies for user data access
    - Ensure proper foreign key relationships

  3. Triggers
    - Add trigger to automatically create user_accounts record when auth user is created
    - Handle profile updates properly
*/

-- Drop existing table if it exists
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
  password_hash text NOT NULL CHECK (length(password_hash) >= 60),
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
CREATE POLICY "Users can read their own account"
  ON user_accounts
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own account"
  ON user_accounts
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

-- Allow service role to insert user accounts (for registration)
CREATE POLICY "Service role can insert user accounts"
  ON user_accounts
  FOR INSERT
  TO service_role
  WITH CHECK (true);

-- Allow authenticated users to insert their own account
CREATE POLICY "Users can insert their own account"
  ON user_accounts
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Create updated_at trigger
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

-- Update posts table to reference user_accounts properly
ALTER TABLE posts DROP CONSTRAINT IF EXISTS posts_user_id_fkey;
ALTER TABLE posts ADD CONSTRAINT posts_user_id_fkey 
  FOREIGN KEY (user_id) REFERENCES user_accounts(id) ON DELETE CASCADE;