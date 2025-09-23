/*
  # Recreate Community Discussions Tables

  1. New Tables
    - `discussions`
      - `id` (uuid, primary key)
      - `title` (text, required)
      - `content` (text, required)
      - `author_id` (uuid, nullable for anonymous posts)
      - `author_name` (text, required)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
      - `likes` (integer, default 0)
      - `views` (integer, default 0)
      - `reply_count` (integer, default 0)

    - `discussion_replies`
      - `id` (uuid, primary key)
      - `discussion_id` (uuid, foreign key)
      - `content` (text, required)
      - `author_id` (uuid, nullable)
      - `author_name` (text, required)
      - `parent_reply_id` (uuid, nullable for nested replies)
      - `created_at` (timestamp)
      - `likes` (integer, default 0)

    - `discussion_likes`
      - `id` (uuid, primary key)
      - `discussion_id` (uuid, foreign key)
      - `user_id` (uuid, required)
      - `created_at` (timestamp)

    - `reply_likes`
      - `id` (uuid, primary key)
      - `reply_id` (uuid, foreign key)
      - `user_id` (uuid, required)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on all tables
    - Add policies for public read access
    - Add policies for authenticated write access
*/

-- Create discussions table
CREATE TABLE IF NOT EXISTS discussions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  content text NOT NULL,
  author_id uuid,
  author_name text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  likes integer DEFAULT 0,
  views integer DEFAULT 0,
  reply_count integer DEFAULT 0
);

-- Create discussion_replies table
CREATE TABLE IF NOT EXISTS discussion_replies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  discussion_id uuid NOT NULL REFERENCES discussions(id) ON DELETE CASCADE,
  content text NOT NULL,
  author_id uuid,
  author_name text NOT NULL,
  parent_reply_id uuid REFERENCES discussion_replies(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  likes integer DEFAULT 0
);

-- Create discussion_likes table
CREATE TABLE IF NOT EXISTS discussion_likes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  discussion_id uuid NOT NULL REFERENCES discussions(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(discussion_id, user_id)
);

-- Create reply_likes table
CREATE TABLE IF NOT EXISTS reply_likes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reply_id uuid NOT NULL REFERENCES discussion_replies(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(reply_id, user_id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_discussions_created_at ON discussions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_discussions_updated_at ON discussions(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_discussion_replies_discussion_id ON discussion_replies(discussion_id);
CREATE INDEX IF NOT EXISTS idx_discussion_replies_parent_id ON discussion_replies(parent_reply_id);
CREATE INDEX IF NOT EXISTS idx_discussion_likes_discussion_id ON discussion_likes(discussion_id);
CREATE INDEX IF NOT EXISTS idx_reply_likes_reply_id ON reply_likes(reply_id);

-- Enable Row Level Security
ALTER TABLE discussions ENABLE ROW LEVEL SECURITY;
ALTER TABLE discussion_replies ENABLE ROW LEVEL SECURITY;
ALTER TABLE discussion_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE reply_likes ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for discussions
CREATE POLICY "Anyone can read discussions"
  ON discussions
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Anyone can create discussions"
  ON discussions
  FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Authors can update their discussions"
  ON discussions
  FOR UPDATE
  TO public
  USING (author_name = current_setting('request.jwt.claims', true)::json->>'name' OR author_id::text = current_setting('request.jwt.claims', true)::json->>'sub');

-- Create RLS policies for discussion_replies
CREATE POLICY "Anyone can read replies"
  ON discussion_replies
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Anyone can create replies"
  ON discussion_replies
  FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Authors can update their replies"
  ON discussion_replies
  FOR UPDATE
  TO public
  USING (author_name = current_setting('request.jwt.claims', true)::json->>'name' OR author_id::text = current_setting('request.jwt.claims', true)::json->>'sub');

-- Create RLS policies for discussion_likes
CREATE POLICY "Anyone can read discussion likes"
  ON discussion_likes
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Authenticated users can manage their discussion likes"
  ON discussion_likes
  FOR ALL
  TO authenticated
  USING (user_id::text = current_setting('request.jwt.claims', true)::json->>'sub')
  WITH CHECK (user_id::text = current_setting('request.jwt.claims', true)::json->>'sub');

-- Create RLS policies for reply_likes
CREATE POLICY "Anyone can read reply likes"
  ON reply_likes
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Authenticated users can manage their reply likes"
  ON reply_likes
  FOR ALL
  TO authenticated
  USING (user_id::text = current_setting('request.jwt.claims', true)::json->>'sub')
  WITH CHECK (user_id::text = current_setting('request.jwt.claims', true)::json->>'sub');

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for discussions updated_at
DROP TRIGGER IF EXISTS discussions_updated_at ON discussions;
CREATE TRIGGER discussions_updated_at
  BEFORE UPDATE ON discussions
  FOR EACH ROW
  EXECUTE FUNCTION handle_updated_at();

-- Insert sample discussions for testing
INSERT INTO discussions (title, content, author_name, likes, views, reply_count) VALUES
('Welcome to IHD Deals Community!', 'This is our community space where you can share deals, ask questions, and connect with fellow deal hunters. Feel free to introduce yourself!', 'IHD Team', 5, 120, 3),
('Best Smartphone Deals This Month', 'What are the best smartphone deals you''ve found this month? Share your findings and help others save money!', 'DealHunter', 8, 95, 7),
('Tips for Finding Hidden Deals', 'Here are some pro tips for finding deals that others might miss: 1. Check clearance sections, 2. Use price tracking tools, 3. Follow brand social media accounts...', 'SaveMaster', 12, 78, 5),
('Question: Warranty on Discounted Items?', 'Do discounted items usually come with the same warranty as full-price items? I''m looking at buying a laptop on sale but want to make sure about warranty coverage.', 'NewBuyer', 3, 45, 4),
('Flash Sale Alert: Electronics Store', 'Just spotted a flash sale at a major electronics store - up to 70% off on selected items! Sale ends tonight at midnight. Check it out!', 'QuickDeals', 15, 156, 8);