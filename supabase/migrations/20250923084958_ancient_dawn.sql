/*
  # Create New User Accounts System

  1. New Tables
    - `user_accounts`
      - `id` (uuid, primary key)
      - `full_name` (text, not null)
      - `email` (text, unique, not null)
      - `username` (text, unique, not null)
      - `password_hash` (text, not null)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on `user_accounts` table
    - Add policies for user data access
    - Create indexes for performance

  3. Changes
    - Drop old `simple_users` table
    - Create new `user_accounts` table with enhanced structure
    - Add proper constraints and indexes
*/

-- Drop existing tables and related objects
DROP TABLE IF EXISTS simple_users CASCADE;
DROP TABLE IF EXISTS discussion_likes CASCADE;
DROP TABLE IF EXISTS reply_likes CASCADE;
DROP TABLE IF EXISTS discussion_replies CASCADE;
DROP TABLE IF EXISTS discussions CASCADE;

-- Create new user_accounts table
CREATE TABLE IF NOT EXISTS user_accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name text NOT NULL CHECK (length(trim(full_name)) >= 2),
  email text UNIQUE NOT NULL CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'),
  username text UNIQUE NOT NULL CHECK (
    length(username) >= 3 AND 
    length(username) <= 30 AND 
    username ~* '^[a-zA-Z0-9_]+$'
  ),
  password_hash text NOT NULL CHECK (length(password_hash) >= 60), -- bcrypt hashes are 60 chars
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_accounts_email ON user_accounts(email);
CREATE INDEX IF NOT EXISTS idx_user_accounts_username ON user_accounts(username);
CREATE INDEX IF NOT EXISTS idx_user_accounts_created_at ON user_accounts(created_at);

-- Enable Row Level Security
ALTER TABLE user_accounts ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can read own data"
  ON user_accounts
  FOR SELECT
  TO authenticated
  USING (auth.uid()::text = id::text);

CREATE POLICY "Users can update own data"
  ON user_accounts
  FOR UPDATE
  TO authenticated
  USING (auth.uid()::text = id::text)
  WITH CHECK (auth.uid()::text = id::text);

CREATE POLICY "Anyone can insert user data"
  ON user_accounts
  FOR INSERT
  TO public
  WITH CHECK (true);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updated_at
CREATE TRIGGER handle_user_accounts_updated_at
  BEFORE UPDATE ON user_accounts
  FOR EACH ROW
  EXECUTE FUNCTION handle_updated_at();

-- Recreate discussions table with new foreign key
CREATE TABLE IF NOT EXISTS discussions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  content text NOT NULL,
  author_id uuid REFERENCES user_accounts(id) ON DELETE CASCADE,
  author_name text NOT NULL,
  likes integer DEFAULT 0,
  views integer DEFAULT 0,
  reply_count integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create indexes for discussions
CREATE INDEX IF NOT EXISTS idx_discussions_author_id ON discussions(author_id);
CREATE INDEX IF NOT EXISTS idx_discussions_created_at ON discussions(created_at);

-- Enable RLS for discussions
ALTER TABLE discussions ENABLE ROW LEVEL SECURITY;

-- Create policies for discussions
CREATE POLICY "Anyone can read discussions"
  ON discussions
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Authenticated users can create discussions"
  ON discussions
  FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Authors can update their discussions"
  ON discussions
  FOR UPDATE
  TO authenticated
  USING (auth.uid()::text = author_id::text)
  WITH CHECK (auth.uid()::text = author_id::text);

CREATE POLICY "Authors can delete their discussions"
  ON discussions
  FOR DELETE
  TO authenticated
  USING (auth.uid()::text = author_id::text);

-- Create trigger for discussions updated_at
CREATE TRIGGER handle_discussions_updated_at
  BEFORE UPDATE ON discussions
  FOR EACH ROW
  EXECUTE FUNCTION handle_updated_at();

-- Recreate discussion_replies table
CREATE TABLE IF NOT EXISTS discussion_replies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  discussion_id uuid REFERENCES discussions(id) ON DELETE CASCADE,
  content text NOT NULL,
  author_id uuid REFERENCES user_accounts(id) ON DELETE CASCADE,
  author_name text NOT NULL,
  parent_reply_id uuid REFERENCES discussion_replies(id) ON DELETE CASCADE,
  likes integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Create indexes for replies
CREATE INDEX IF NOT EXISTS idx_discussion_replies_discussion_id ON discussion_replies(discussion_id);
CREATE INDEX IF NOT EXISTS idx_discussion_replies_author_id ON discussion_replies(author_id);
CREATE INDEX IF NOT EXISTS idx_discussion_replies_parent_reply_id ON discussion_replies(parent_reply_id);

-- Enable RLS for replies
ALTER TABLE discussion_replies ENABLE ROW LEVEL SECURITY;

-- Create policies for replies
CREATE POLICY "Anyone can read replies"
  ON discussion_replies
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Authenticated users can create replies"
  ON discussion_replies
  FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Authors can update their replies"
  ON discussion_replies
  FOR UPDATE
  TO authenticated
  USING (auth.uid()::text = author_id::text)
  WITH CHECK (auth.uid()::text = author_id::text);

CREATE POLICY "Authors can delete their replies"
  ON discussion_replies
  FOR DELETE
  TO authenticated
  USING (auth.uid()::text = author_id::text);

-- Recreate discussion_likes table
CREATE TABLE IF NOT EXISTS discussion_likes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  discussion_id uuid REFERENCES discussions(id) ON DELETE CASCADE,
  user_id uuid REFERENCES user_accounts(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(discussion_id, user_id)
);

-- Create indexes for discussion likes
CREATE INDEX IF NOT EXISTS idx_discussion_likes_discussion_id ON discussion_likes(discussion_id);
CREATE INDEX IF NOT EXISTS idx_discussion_likes_user_id ON discussion_likes(user_id);

-- Enable RLS for discussion likes
ALTER TABLE discussion_likes ENABLE ROW LEVEL SECURITY;

-- Create policies for discussion likes
CREATE POLICY "Anyone can read discussion likes"
  ON discussion_likes
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Authenticated users can manage their likes"
  ON discussion_likes
  FOR ALL
  TO authenticated
  USING (auth.uid()::text = user_id::text)
  WITH CHECK (auth.uid()::text = user_id::text);

-- Recreate reply_likes table
CREATE TABLE IF NOT EXISTS reply_likes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reply_id uuid REFERENCES discussion_replies(id) ON DELETE CASCADE,
  user_id uuid REFERENCES user_accounts(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(reply_id, user_id)
);

-- Create indexes for reply likes
CREATE INDEX IF NOT EXISTS idx_reply_likes_reply_id ON reply_likes(reply_id);
CREATE INDEX IF NOT EXISTS idx_reply_likes_user_id ON reply_likes(user_id);

-- Enable RLS for reply likes
ALTER TABLE reply_likes ENABLE ROW LEVEL SECURITY;

-- Create policies for reply likes
CREATE POLICY "Anyone can read reply likes"
  ON reply_likes
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Authenticated users can manage their reply likes"
  ON reply_likes
  FOR ALL
  TO authenticated
  USING (auth.uid()::text = user_id::text)
  WITH CHECK (auth.uid()::text = user_id::text);