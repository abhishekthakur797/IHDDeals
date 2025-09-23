/*
  # Add email column to simple_users table

  1. Changes
    - Add `email` column to `simple_users` table
    - Make email unique and required
    - Add index for better performance
    - Update RLS policies to include email access

  2. Security
    - Maintain existing RLS policies
    - Add email to readable fields
*/

-- Add email column to simple_users table
ALTER TABLE simple_users 
ADD COLUMN email text NOT NULL DEFAULT '';

-- Add unique constraint for email
ALTER TABLE simple_users 
ADD CONSTRAINT simple_users_email_key UNIQUE (email);

-- Add index for email lookups
CREATE INDEX IF NOT EXISTS idx_simple_users_email ON simple_users (email);

-- Update RLS policies to allow email access
DROP POLICY IF EXISTS "Users can read own data" ON simple_users;
CREATE POLICY "Users can read own data"
  ON simple_users
  FOR SELECT
  TO public
  USING (true);

DROP POLICY IF EXISTS "Users can update own data" ON simple_users;
CREATE POLICY "Users can update own data"
  ON simple_users
  FOR UPDATE
  TO public
  USING (id = uid())
  WITH CHECK (id = uid());