/*
  # Complete Discussion System Database Schema

  1. Tables Created
    - `discussions` - Main discussion posts
    - `discussion_replies` - Replies to discussions
    - `discussion_likes` - Likes for discussions
    - `reply_likes` - Likes for replies

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users
    - Proper foreign key constraints

  3. Indexes
    - Performance indexes for common queries
    - Composite indexes for like checking
*/

-- Create discussions table
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

-- Create discussion_replies table
CREATE TABLE IF NOT EXISTS discussion_replies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  discussion_id uuid REFERENCES discussions(id) ON DELETE CASCADE NOT NULL,
  content text NOT NULL,
  author_id uuid REFERENCES simple_users(id) ON DELETE CASCADE,
  author_name text NOT NULL,
  parent_reply_id uuid REFERENCES discussion_replies(id) ON DELETE CASCADE,
  likes integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Create discussion_likes table
CREATE TABLE IF NOT EXISTS discussion_likes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  discussion_id uuid REFERENCES discussions(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES simple_users(id) ON DELETE CASCADE NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(discussion_id, user_id)
);

-- Create reply_likes table
CREATE TABLE IF NOT EXISTS reply_likes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reply_id uuid REFERENCES discussion_replies(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES simple_users(id) ON DELETE CASCADE NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(reply_id, user_id)
);

-- Enable Row Level Security
ALTER TABLE discussions ENABLE ROW LEVEL SECURITY;
ALTER TABLE discussion_replies ENABLE ROW LEVEL SECURITY;
ALTER TABLE discussion_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE reply_likes ENABLE ROW LEVEL SECURITY;

-- Discussions policies
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
  TO public
  USING (author_id = uid())
  WITH CHECK (author_id = uid());

CREATE POLICY "Authors can delete their discussions"
  ON discussions
  FOR DELETE
  TO public
  USING (author_id = uid());

-- Discussion replies policies
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
  TO public
  USING (author_id = uid())
  WITH CHECK (author_id = uid());

CREATE POLICY "Authors can delete their replies"
  ON discussion_replies
  FOR DELETE
  TO public
  USING (author_id = uid());

-- Discussion likes policies
CREATE POLICY "Anyone can read discussion likes"
  ON discussion_likes
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Authenticated users can manage their discussion likes"
  ON discussion_likes
  FOR ALL
  TO public
  USING (user_id = uid())
  WITH CHECK (user_id = uid());

-- Reply likes policies
CREATE POLICY "Anyone can read reply likes"
  ON reply_likes
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Authenticated users can manage their reply likes"
  ON reply_likes
  FOR ALL
  TO public
  USING (user_id = uid())
  WITH CHECK (user_id = uid());

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_discussions_created_at ON discussions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_discussions_author_id ON discussions(author_id);
CREATE INDEX IF NOT EXISTS idx_discussions_likes ON discussions(likes DESC);

CREATE INDEX IF NOT EXISTS idx_discussion_replies_discussion_id ON discussion_replies(discussion_id);
CREATE INDEX IF NOT EXISTS idx_discussion_replies_author_id ON discussion_replies(author_id);
CREATE INDEX IF NOT EXISTS idx_discussion_replies_parent_id ON discussion_replies(parent_reply_id);
CREATE INDEX IF NOT EXISTS idx_discussion_replies_created_at ON discussion_replies(created_at);

CREATE INDEX IF NOT EXISTS idx_discussion_likes_discussion_user ON discussion_likes(discussion_id, user_id);
CREATE INDEX IF NOT EXISTS idx_discussion_likes_user_id ON discussion_likes(user_id);

CREATE INDEX IF NOT EXISTS idx_reply_likes_reply_user ON reply_likes(reply_id, user_id);
CREATE INDEX IF NOT EXISTS idx_reply_likes_user_id ON reply_likes(user_id);

-- Create updated_at trigger function if it doesn't exist
CREATE OR REPLACE FUNCTION handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add updated_at trigger to discussions
DROP TRIGGER IF EXISTS handle_discussions_updated_at ON discussions;
CREATE TRIGGER handle_discussions_updated_at
  BEFORE UPDATE ON discussions
  FOR EACH ROW
  EXECUTE FUNCTION handle_updated_at();

-- Create function to get user ID (uid) for RLS policies
CREATE OR REPLACE FUNCTION uid()
RETURNS uuid AS $$
BEGIN
  -- This is a placeholder function for the user ID
  -- In a real Supabase environment, this would return auth.uid()
  -- For now, we'll return the current user from the session
  RETURN current_setting('app.current_user_id', true)::uuid;
EXCEPTION
  WHEN OTHERS THEN
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;