/*
  # Update users table to include email field

  1. Schema Changes
    - Add `email` column to `simple_users` table
    - Add unique constraint on email
    - Add index for email lookups
    - Update existing data if needed

  2. Security
    - Maintain existing RLS policies
    - Email field is required and unique
*/

-- Add email column to simple_users table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'simple_users' AND column_name = 'email'
  ) THEN
    ALTER TABLE simple_users ADD COLUMN email text NOT NULL DEFAULT '';
  END IF;
END $$;

-- Add unique constraint on email
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE table_name = 'simple_users' AND constraint_name = 'simple_users_email_key'
  ) THEN
    ALTER TABLE simple_users ADD CONSTRAINT simple_users_email_key UNIQUE (email);
  END IF;
END $$;

-- Add index for email lookups
CREATE INDEX IF NOT EXISTS idx_simple_users_email ON simple_users (email);

-- Update the table comment
COMMENT ON TABLE simple_users IS 'User accounts with email and username authentication support';
COMMENT ON COLUMN simple_users.email IS 'User email address for authentication and communication';
COMMENT ON COLUMN simple_users.username IS 'Unique username for authentication and display';
COMMENT ON COLUMN simple_users.password_hash IS 'Hashed password for secure authentication';
COMMENT ON COLUMN simple_users.full_name IS 'User full name for display purposes';
COMMENT ON COLUMN simple_users.date_of_birth IS 'User date of birth for age verification';

-- Remove the default empty string constraint after adding the column
ALTER TABLE simple_users ALTER COLUMN email DROP DEFAULT;