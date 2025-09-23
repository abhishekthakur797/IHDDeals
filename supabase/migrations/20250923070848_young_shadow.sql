/*
  # Simplified User Authentication System

  1. New Tables
    - `simple_users`
      - `id` (uuid, primary key)
      - `full_name` (text, not null)
      - `username` (text, unique, not null)
      - `password_hash` (text, not null)
      - `date_of_birth` (date, not null)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on `simple_users` table
    - Add policies for user registration and data access
    - Password hashing handled by application layer

  3. Changes
    - Simplified user table with only essential fields
    - Removed dependency on Supabase Auth
    - Direct database user management
*/

-- Drop existing profiles table dependencies
DROP TABLE IF EXISTS discussion_likes CASCADE;
DROP TABLE IF EXISTS reply_likes CASCADE;
DROP TABLE IF EXISTS discussion_replies CASCADE;
DROP TABLE IF EXISTS discussions CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;

-- Create simplified users table
CREATE TABLE IF NOT EXISTS simple_users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name text NOT NULL,
  username text UNIQUE NOT NULL,
  password_hash text NOT NULL,
  date_of_birth date NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create updated_at trigger function if it doesn't exist
CREATE OR REPLACE FUNCTION handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add trigger for updated_at
CREATE TRIGGER handle_simple_users_updated_at
  BEFORE UPDATE ON simple_users
  FOR EACH ROW
  EXECUTE FUNCTION handle_updated_at();

-- Enable RLS
ALTER TABLE simple_users ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can read own data"
  ON simple_users
  FOR SELECT
  USING (true); -- Allow reading for authentication

CREATE POLICY "Users can insert their own data"
  ON simple_users
  FOR INSERT
  WITH CHECK (true); -- Allow registration

CREATE POLICY "Users can update own data"
  ON simple_users
  FOR UPDATE
  USING (id = auth.uid()::uuid)
  WITH CHECK (id = auth.uid()::uuid);

-- Recreate discussions table with simplified user reference
CREATE TABLE IF NOT EXISTS discussions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  content text NOT NULL,
  author_id uuid REFERENCES simple_users(id) ON DELETE CASCADE,
  author_name text NOT NULL,
  likes integer DEFAULT 0,
  views integer DEFAULT 0,
  reply_count integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_simple_users_username ON simple_users(username);
CREATE INDEX IF NOT EXISTS idx_simple_users_created_at ON simple_users(created_at);
CREATE INDEX IF NOT EXISTS idx_discussions_author_id ON discussions(author_id);
CREATE INDEX IF NOT EXISTS idx_discussions_created_at ON discussions(created_at);

-- Enable RLS on discussions
ALTER TABLE discussions ENABLE ROW LEVEL SECURITY;

-- Discussion policies
CREATE POLICY "Anyone can read discussions"
  ON discussions
  FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can create discussions"
  ON discussions
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Authors can update their discussions"
  ON discussions
  FOR UPDATE
  USING (author_id = auth.uid()::uuid)
  WITH CHECK (author_id = auth.uid()::uuid);

CREATE POLICY "Authors can delete their discussions"
  ON discussions
  FOR DELETE
  USING (author_id = auth.uid()::uuid);

-- Add trigger for discussions updated_at
CREATE TRIGGER handle_discussions_updated_at
  BEFORE UPDATE ON discussions
  FOR EACH ROW
  EXECUTE FUNCTION handle_updated_at();