/*
  # Create affiliate products and discussions schema

  1. New Tables
    - `affiliate_products`
      - `id` (uuid, primary key)
      - `name` (text, product name)
      - `price` (numeric, product price)
      - `image_url` (text, product image URL)
      - `affiliate_link` (text, affiliate link URL)
      - `category` (text, product category)
      - `description` (text, product description)
      - `rating` (numeric, product rating)
      - `created_at` (timestamp)
    
    - `discussions`
      - `id` (uuid, primary key)
      - `title` (text, discussion title)
      - `content` (text, discussion content)
      - `author_id` (uuid, references auth.users)
      - `author_name` (text, author display name)
      - `likes` (integer, like count)
      - `views` (integer, view count)
      - `reply_count` (integer, reply count)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
    
    - `discussion_replies`
      - `id` (uuid, primary key)
      - `discussion_id` (uuid, references discussions)
      - `content` (text, reply content)
      - `author_id` (uuid, references auth.users)
      - `author_name` (text, author display name)
      - `parent_reply_id` (uuid, optional parent reply)
      - `likes` (integer, like count)
      - `created_at` (timestamp)
    
    - `discussion_likes`
      - `id` (uuid, primary key)
      - `discussion_id` (uuid, references discussions)
      - `user_id` (uuid, references auth.users)
      - `created_at` (timestamp)
    
    - `reply_likes`
      - `id` (uuid, primary key)
      - `reply_id` (uuid, references discussion_replies)
      - `user_id` (uuid, references auth.users)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on all tables
    - Add policies for public read access on affiliate_products
    - Add policies for authenticated users on discussions and replies
    - Add policies for managing likes
*/

-- Create affiliate_products table
CREATE TABLE IF NOT EXISTS affiliate_products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  price numeric NOT NULL DEFAULT 0,
  image_url text NOT NULL DEFAULT '',
  affiliate_link text NOT NULL DEFAULT '',
  category text NOT NULL DEFAULT 'general',
  description text DEFAULT '',
  rating numeric DEFAULT 0 CHECK (rating >= 0 AND rating <= 5),
  created_at timestamptz DEFAULT now()
);

-- Create discussions table
CREATE TABLE IF NOT EXISTS discussions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  content text NOT NULL,
  author_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
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
  discussion_id uuid REFERENCES discussions(id) ON DELETE CASCADE,
  content text NOT NULL,
  author_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  author_name text NOT NULL,
  parent_reply_id uuid REFERENCES discussion_replies(id) ON DELETE CASCADE,
  likes integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Create discussion_likes table
CREATE TABLE IF NOT EXISTS discussion_likes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  discussion_id uuid REFERENCES discussions(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(discussion_id, user_id)
);

-- Create reply_likes table
CREATE TABLE IF NOT EXISTS reply_likes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reply_id uuid REFERENCES discussion_replies(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(reply_id, user_id)
);

-- Enable Row Level Security
ALTER TABLE affiliate_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE discussions ENABLE ROW LEVEL SECURITY;
ALTER TABLE discussion_replies ENABLE ROW LEVEL SECURITY;
ALTER TABLE discussion_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE reply_likes ENABLE ROW LEVEL SECURITY;

-- Policies for affiliate_products (public read access)
CREATE POLICY "Anyone can read affiliate products"
  ON affiliate_products
  FOR SELECT
  TO public
  USING (true);

-- Policies for discussions
CREATE POLICY "Anyone can read discussions"
  ON discussions
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Authenticated users can create discussions"
  ON discussions
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = author_id);

CREATE POLICY "Authors can update their discussions"
  ON discussions
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = author_id)
  WITH CHECK (auth.uid() = author_id);

CREATE POLICY "Authors can delete their discussions"
  ON discussions
  FOR DELETE
  TO authenticated
  USING (auth.uid() = author_id);

-- Policies for discussion_replies
CREATE POLICY "Anyone can read replies"
  ON discussion_replies
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Authenticated users can create replies"
  ON discussion_replies
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = author_id);

CREATE POLICY "Authors can update their replies"
  ON discussion_replies
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = author_id)
  WITH CHECK (auth.uid() = author_id);

CREATE POLICY "Authors can delete their replies"
  ON discussion_replies
  FOR DELETE
  TO authenticated
  USING (auth.uid() = author_id);

-- Policies for discussion_likes
CREATE POLICY "Anyone can read discussion likes"
  ON discussion_likes
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Authenticated users can manage their discussion likes"
  ON discussion_likes
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Policies for reply_likes
CREATE POLICY "Anyone can read reply likes"
  ON reply_likes
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Authenticated users can manage their reply likes"
  ON reply_likes
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Insert sample affiliate products
INSERT INTO affiliate_products (name, price, image_url, affiliate_link, category, description, rating) VALUES
  ('Premium Wireless Headphones', 199.99, 'https://images.pexels.com/photos/3394650/pexels-photo-3394650.jpeg?auto=compress&cs=tinysrgb&w=300', '#', 'electronics', 'High-quality wireless headphones with noise cancellation', 4.8),
  ('Smart Fitness Watch', 299.99, 'https://images.pexels.com/photos/437037/pexels-photo-437037.jpeg?auto=compress&cs=tinysrgb&w=300', '#', 'electronics', 'Advanced fitness tracking with heart rate monitor', 4.6),
  ('Stylish Leather Jacket', 149.99, 'https://images.pexels.com/photos/1040945/pexels-photo-1040945.jpeg?auto=compress&cs=tinysrgb&w=300', '#', 'fashion', 'Premium leather jacket for modern style', 4.7),
  ('Smart Home Speaker', 99.99, 'https://images.pexels.com/photos/6686448/pexels-photo-6686448.jpeg?auto=compress&cs=tinysrgb&w=300', '#', 'electronics', 'Voice-controlled smart speaker with AI assistant', 4.5),
  ('Yoga Mat Set', 49.99, 'https://images.pexels.com/photos/4056723/pexels-photo-4056723.jpeg?auto=compress&cs=tinysrgb&w=300', '#', 'sports', 'Complete yoga mat set with accessories', 4.4),
  ('Gaming Mechanical Keyboard', 129.99, 'https://images.pexels.com/photos/2115257/pexels-photo-2115257.jpeg?auto=compress&cs=tinysrgb&w=300', '#', 'electronics', 'RGB mechanical keyboard for gaming', 4.9),
  ('Portable Bluetooth Speaker', 79.99, 'https://images.pexels.com/photos/1649771/pexels-photo-1649771.jpeg?auto=compress&cs=tinysrgb&w=300', '#', 'electronics', 'Waterproof portable speaker with excellent sound', 4.3),
  ('Designer Sunglasses', 89.99, 'https://images.pexels.com/photos/701877/pexels-photo-701877.jpeg?auto=compress&cs=tinysrgb&w=300', '#', 'fashion', 'UV protection designer sunglasses', 4.2),
  ('Coffee Maker Machine', 159.99, 'https://images.pexels.com/photos/324028/pexels-photo-324028.jpeg?auto=compress&cs=tinysrgb&w=300', '#', 'home', 'Automatic coffee maker with programmable features', 4.6),
  ('Running Shoes', 119.99, 'https://images.pexels.com/photos/2529148/pexels-photo-2529148.jpeg?auto=compress&cs=tinysrgb&w=300', '#', 'sports', 'Comfortable running shoes with advanced cushioning', 4.5)
ON CONFLICT (id) DO NOTHING;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_affiliate_products_category ON affiliate_products(category);
CREATE INDEX IF NOT EXISTS idx_affiliate_products_created_at ON affiliate_products(created_at);
CREATE INDEX IF NOT EXISTS idx_discussions_author_id ON discussions(author_id);
CREATE INDEX IF NOT EXISTS idx_discussions_created_at ON discussions(created_at);
CREATE INDEX IF NOT EXISTS idx_discussion_replies_discussion_id ON discussion_replies(discussion_id);
CREATE INDEX IF NOT EXISTS idx_discussion_likes_discussion_id ON discussion_likes(discussion_id);
CREATE INDEX IF NOT EXISTS idx_reply_likes_reply_id ON reply_likes(reply_id);