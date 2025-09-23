/*
  # Complete User Authentication and Community Discussion System

  1. New Tables
    - `user_accounts`
      - `id` (uuid, primary key)
      - `full_name` (text, required)
      - `email` (text, unique, required)
      - `username` (text, unique, required)
      - `password_hash` (text, required)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
    
    - `posts` (renamed from discussions for clarity)
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to user_accounts)
      - `title` (text, required)
      - `content` (text, required)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on all tables
    - Add policies for proper access control
    - Add unique constraints and indexes
    - Add password validation constraints

  3. Performance
    - Add indexes for frequently queried columns
    - Optimize foreign key relationships
*/

-- Create user_accounts table
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

-- Create posts table
CREATE TABLE IF NOT EXISTS posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES user_accounts(id) ON DELETE CASCADE,
  title text NOT NULL CHECK (length(trim(title)) >= 1 AND length(trim(title)) <= 200),
  content text NOT NULL CHECK (length(trim(content)) >= 1 AND length(trim(content)) <= 10000),
  created_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE user_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_accounts
CREATE POLICY "Users can read their own account"
  ON user_accounts
  FOR SELECT
  TO authenticated
  USING (auth.uid()::text = id::text);

CREATE POLICY "Users can update their own account"
  ON user_accounts
  FOR UPDATE
  TO authenticated
  USING (auth.uid()::text = id::text);

-- RLS Policies for posts
CREATE POLICY "Anyone can read posts"
  ON posts
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can create posts"
  ON posts
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid()::text = user_id::text);

CREATE POLICY "Users can update their own posts"
  ON posts
  FOR UPDATE
  TO authenticated
  USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can delete their own posts"
  ON posts
  FOR DELETE
  TO authenticated
  USING (auth.uid()::text = user_id::text);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_accounts_email ON user_accounts(email);
CREATE INDEX IF NOT EXISTS idx_user_accounts_username ON user_accounts(username);
CREATE INDEX IF NOT EXISTS idx_user_accounts_created_at ON user_accounts(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_posts_user_id ON posts(user_id);
CREATE INDEX IF NOT EXISTS idx_posts_created_at ON posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_posts_title ON posts USING gin(to_tsvector('english', title));

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for user_accounts
DROP TRIGGER IF EXISTS user_accounts_updated_at ON user_accounts;
CREATE TRIGGER user_accounts_updated_at
  BEFORE UPDATE ON user_accounts
  FOR EACH ROW
  EXECUTE FUNCTION handle_updated_at();

-- Insert sample data for testing
INSERT INTO user_accounts (full_name, email, username, password_hash) VALUES
  ('John Doe', 'john.doe@example.com', 'johndoe', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj6ukx.LrUpm'), -- password: 'password123'
  ('Jane Smith', 'jane.smith@example.com', 'janesmith', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj6ukx.LrUpm'), -- password: 'password123'
  ('Mike Johnson', 'mike.johnson@example.com', 'mikej', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj6ukx.LrUpm') -- password: 'password123'
ON CONFLICT (email) DO NOTHING;

-- Insert sample posts
INSERT INTO posts (user_id, title, content) 
SELECT 
  u.id,
  'Welcome to the Community!',
  'This is my first post in the community. Looking forward to connecting with everyone and sharing great deals!'
FROM user_accounts u 
WHERE u.username = 'johndoe'
ON CONFLICT DO NOTHING;

INSERT INTO posts (user_id, title, content)
SELECT 
  u.id,
  'Best Smartphone Deals This Month',
  'I''ve been tracking smartphone prices and found some amazing deals. The Samsung Galaxy series is at an all-time low this week!'
FROM user_accounts u 
WHERE u.username = 'janesmith'
ON CONFLICT DO NOTHING;

INSERT INTO posts (user_id, title, content)
SELECT 
  u.id,
  'Laptop Buying Guide 2024',
  'For anyone looking to buy a new laptop, here are the key things to consider: processor, RAM, storage type, and battery life. Happy to answer any questions!'
FROM user_accounts u 
WHERE u.username = 'mikej'
ON CONFLICT DO NOTHING;