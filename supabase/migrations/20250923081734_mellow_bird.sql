/*
  # Comprehensive User Interactions Database Schema
  
  This schema is designed for high-performance social media platforms with:
  - Efficient like/unlike operations
  - Threaded reply system with unlimited nesting
  - Scalable design for millions of interactions
  - Future extensibility for additional features
  
  ## Design Principles:
  1. Normalized structure to prevent data duplication
  2. Strategic indexing for fast queries
  3. Denormalized counters for performance
  4. Flexible schema for future enhancements
  5. Data integrity through constraints and triggers
*/

-- =====================================================
-- CORE CONTENT TABLES
-- =====================================================

-- Main discussions/posts table
CREATE TABLE IF NOT EXISTS discussions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL CHECK (length(title) >= 3 AND length(title) <= 200),
  content text NOT NULL CHECK (length(content) >= 10 AND length(content) <= 10000),
  author_id uuid NOT NULL,
  author_name text NOT NULL,
  
  -- Denormalized counters for performance (updated via triggers)
  likes_count integer DEFAULT 0 CHECK (likes_count >= 0),
  replies_count integer DEFAULT 0 CHECK (replies_count >= 0),
  views_count integer DEFAULT 0 CHECK (views_count >= 0),
  
  -- Content moderation and status
  status text DEFAULT 'active' CHECK (status IN ('active', 'hidden', 'deleted', 'flagged')),
  is_pinned boolean DEFAULT false,
  
  -- Timestamps with timezone support
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,
  last_activity_at timestamptz DEFAULT now() NOT NULL
);

-- =====================================================
-- REPLIES/COMMENTS SYSTEM
-- =====================================================

-- Hierarchical replies table supporting unlimited nesting
CREATE TABLE IF NOT EXISTS discussion_replies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  discussion_id uuid NOT NULL REFERENCES discussions(id) ON DELETE CASCADE,
  parent_reply_id uuid REFERENCES discussion_replies(id) ON DELETE CASCADE,
  
  -- Content and author information
  content text NOT NULL CHECK (length(content) >= 1 AND length(content) <= 5000),
  author_id uuid NOT NULL,
  author_name text NOT NULL,
  
  -- Hierarchy and threading support
  reply_level integer DEFAULT 0 CHECK (reply_level >= 0 AND reply_level <= 10), -- Limit nesting depth
  reply_path text, -- Materialized path for efficient tree queries (e.g., "1.5.12")
  
  -- Denormalized counters
  likes_count integer DEFAULT 0 CHECK (likes_count >= 0),
  child_replies_count integer DEFAULT 0 CHECK (child_replies_count >= 0),
  
  -- Content moderation
  status text DEFAULT 'active' CHECK (status IN ('active', 'hidden', 'deleted', 'flagged')),
  is_edited boolean DEFAULT false,
  
  -- Timestamps
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- =====================================================
-- LIKES SYSTEM
-- =====================================================

-- Discussion likes with duplicate prevention
CREATE TABLE IF NOT EXISTS discussion_likes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  discussion_id uuid NOT NULL REFERENCES discussions(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  
  -- Future extensibility for different reaction types
  reaction_type text DEFAULT 'like' CHECK (reaction_type IN ('like', 'love', 'laugh', 'angry', 'sad')),
  
  -- Timestamps for analytics
  created_at timestamptz DEFAULT now() NOT NULL,
  
  -- Prevent duplicate likes from same user
  UNIQUE(discussion_id, user_id, reaction_type)
);

-- Reply likes with duplicate prevention
CREATE TABLE IF NOT EXISTS reply_likes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reply_id uuid NOT NULL REFERENCES discussion_replies(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  
  -- Future extensibility for different reaction types
  reaction_type text DEFAULT 'like' CHECK (reaction_type IN ('like', 'love', 'laugh', 'angry', 'sad')),
  
  -- Timestamps for analytics
  created_at timestamptz DEFAULT now() NOT NULL,
  
  -- Prevent duplicate likes from same user
  UNIQUE(reply_id, user_id, reaction_type)
);

-- =====================================================
-- USER ACTIVITY TRACKING (Optional - for analytics)
-- =====================================================

-- Track user engagement for analytics and recommendations
CREATE TABLE IF NOT EXISTS user_activity_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  activity_type text NOT NULL CHECK (activity_type IN ('view', 'like', 'unlike', 'reply', 'create_discussion')),
  
  -- Polymorphic references to different content types
  target_type text NOT NULL CHECK (target_type IN ('discussion', 'reply')),
  target_id uuid NOT NULL,
  
  -- Additional context (JSON for flexibility)
  metadata jsonb DEFAULT '{}',
  
  -- Timestamps for time-series analysis
  created_at timestamptz DEFAULT now() NOT NULL
);

-- =====================================================
-- PERFORMANCE INDEXES
-- =====================================================

-- Discussion indexes for fast queries
CREATE INDEX IF NOT EXISTS idx_discussions_author_id ON discussions(author_id);
CREATE INDEX IF NOT EXISTS idx_discussions_created_at ON discussions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_discussions_last_activity ON discussions(last_activity_at DESC);
CREATE INDEX IF NOT EXISTS idx_discussions_status ON discussions(status) WHERE status = 'active';
CREATE INDEX IF NOT EXISTS idx_discussions_pinned ON discussions(is_pinned, created_at DESC) WHERE is_pinned = true;

-- Reply indexes for hierarchical queries
CREATE INDEX IF NOT EXISTS idx_replies_discussion_id ON discussion_replies(discussion_id, created_at);
CREATE INDEX IF NOT EXISTS idx_replies_parent_id ON discussion_replies(parent_reply_id, created_at) WHERE parent_reply_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_replies_author_id ON discussion_replies(author_id);
CREATE INDEX IF NOT EXISTS idx_replies_path ON discussion_replies USING gin(reply_path gin_trgm_ops); -- For path-based queries
CREATE INDEX IF NOT EXISTS idx_replies_level ON discussion_replies(reply_level, created_at);

-- Like indexes for fast counting and duplicate checking
CREATE INDEX IF NOT EXISTS idx_discussion_likes_discussion_id ON discussion_likes(discussion_id);
CREATE INDEX IF NOT EXISTS idx_discussion_likes_user_id ON discussion_likes(user_id);
CREATE INDEX IF NOT EXISTS idx_discussion_likes_created_at ON discussion_likes(created_at);

CREATE INDEX IF NOT EXISTS idx_reply_likes_reply_id ON reply_likes(reply_id);
CREATE INDEX IF NOT EXISTS idx_reply_likes_user_id ON reply_likes(user_id);
CREATE INDEX IF NOT EXISTS idx_reply_likes_created_at ON reply_likes(created_at);

-- Activity log indexes for analytics
CREATE INDEX IF NOT EXISTS idx_activity_user_id ON user_activity_log(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activity_target ON user_activity_log(target_type, target_id);
CREATE INDEX IF NOT EXISTS idx_activity_type ON user_activity_log(activity_type, created_at DESC);

-- =====================================================
-- TRIGGERS FOR MAINTAINING COUNTERS
-- =====================================================

-- Function to update discussion counters
CREATE OR REPLACE FUNCTION update_discussion_counters()
RETURNS TRIGGER AS $$
BEGIN
  -- Update likes count
  IF TG_TABLE_NAME = 'discussion_likes' THEN
    IF TG_OP = 'INSERT' THEN
      UPDATE discussions 
      SET likes_count = likes_count + 1,
          last_activity_at = now()
      WHERE id = NEW.discussion_id;
    ELSIF TG_OP = 'DELETE' THEN
      UPDATE discussions 
      SET likes_count = GREATEST(0, likes_count - 1)
      WHERE id = OLD.discussion_id;
    END IF;
  END IF;
  
  -- Update replies count
  IF TG_TABLE_NAME = 'discussion_replies' THEN
    IF TG_OP = 'INSERT' THEN
      UPDATE discussions 
      SET replies_count = replies_count + 1,
          last_activity_at = now()
      WHERE id = NEW.discussion_id;
    ELSIF TG_OP = 'DELETE' THEN
      UPDATE discussions 
      SET replies_count = GREATEST(0, replies_count - 1)
      WHERE id = OLD.discussion_id;
    END IF;
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Function to update reply counters
CREATE OR REPLACE FUNCTION update_reply_counters()
RETURNS TRIGGER AS $$
BEGIN
  -- Update reply likes count
  IF TG_TABLE_NAME = 'reply_likes' THEN
    IF TG_OP = 'INSERT' THEN
      UPDATE discussion_replies 
      SET likes_count = likes_count + 1
      WHERE id = NEW.reply_id;
    ELSIF TG_OP = 'DELETE' THEN
      UPDATE discussion_replies 
      SET likes_count = GREATEST(0, likes_count - 1)
      WHERE id = OLD.reply_id;
    END IF;
  END IF;
  
  -- Update child replies count
  IF TG_TABLE_NAME = 'discussion_replies' THEN
    IF TG_OP = 'INSERT' AND NEW.parent_reply_id IS NOT NULL THEN
      UPDATE discussion_replies 
      SET child_replies_count = child_replies_count + 1
      WHERE id = NEW.parent_reply_id;
    ELSIF TG_OP = 'DELETE' AND OLD.parent_reply_id IS NOT NULL THEN
      UPDATE discussion_replies 
      SET child_replies_count = GREATEST(0, child_replies_count - 1)
      WHERE id = OLD.parent_reply_id;
    END IF;
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Function to maintain reply hierarchy
CREATE OR REPLACE FUNCTION maintain_reply_hierarchy()
RETURNS TRIGGER AS $$
BEGIN
  -- Set reply level and path for new replies
  IF TG_OP = 'INSERT' THEN
    IF NEW.parent_reply_id IS NULL THEN
      -- Top-level reply
      NEW.reply_level = 0;
      NEW.reply_path = NEW.id::text;
    ELSE
      -- Nested reply
      SELECT reply_level + 1, reply_path || '.' || NEW.id::text
      INTO NEW.reply_level, NEW.reply_path
      FROM discussion_replies
      WHERE id = NEW.parent_reply_id;
      
      -- Enforce maximum nesting depth
      IF NEW.reply_level > 10 THEN
        RAISE EXCEPTION 'Maximum reply nesting depth exceeded';
      END IF;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to update timestamps
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- TRIGGER DEFINITIONS
-- =====================================================

-- Discussion counter triggers
CREATE TRIGGER trigger_discussion_likes_counter
  AFTER INSERT OR DELETE ON discussion_likes
  FOR EACH ROW EXECUTE FUNCTION update_discussion_counters();

CREATE TRIGGER trigger_discussion_replies_counter
  AFTER INSERT OR DELETE ON discussion_replies
  FOR EACH ROW EXECUTE FUNCTION update_discussion_counters();

-- Reply counter triggers
CREATE TRIGGER trigger_reply_likes_counter
  AFTER INSERT OR DELETE ON reply_likes
  FOR EACH ROW EXECUTE FUNCTION update_reply_counters();

CREATE TRIGGER trigger_reply_hierarchy_counter
  AFTER INSERT OR DELETE ON discussion_replies
  FOR EACH ROW EXECUTE FUNCTION update_reply_counters();

-- Hierarchy maintenance trigger
CREATE TRIGGER trigger_maintain_reply_hierarchy
  BEFORE INSERT ON discussion_replies
  FOR EACH ROW EXECUTE FUNCTION maintain_reply_hierarchy();

-- Timestamp update triggers
CREATE TRIGGER trigger_discussions_updated_at
  BEFORE UPDATE ON discussions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trigger_replies_updated_at
  BEFORE UPDATE ON discussion_replies
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- =====================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE discussions ENABLE ROW LEVEL SECURITY;
ALTER TABLE discussion_replies ENABLE ROW LEVEL SECURITY;
ALTER TABLE discussion_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE reply_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_activity_log ENABLE ROW LEVEL SECURITY;

-- Discussion policies
CREATE POLICY "Anyone can read active discussions"
  ON discussions FOR SELECT
  USING (status = 'active');

CREATE POLICY "Authenticated users can create discussions"
  ON discussions FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authors can update their discussions"
  ON discussions FOR UPDATE
  TO authenticated
  USING (auth.uid()::text = author_id);

CREATE POLICY "Authors can delete their discussions"
  ON discussions FOR DELETE
  TO authenticated
  USING (auth.uid()::text = author_id);

-- Reply policies
CREATE POLICY "Anyone can read active replies"
  ON discussion_replies FOR SELECT
  USING (status = 'active');

CREATE POLICY "Authenticated users can create replies"
  ON discussion_replies FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authors can update their replies"
  ON discussion_replies FOR UPDATE
  TO authenticated
  USING (auth.uid()::text = author_id);

CREATE POLICY "Authors can delete their replies"
  ON discussion_replies FOR DELETE
  TO authenticated
  USING (auth.uid()::text = author_id);

-- Like policies
CREATE POLICY "Anyone can read likes"
  ON discussion_likes FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can manage their likes"
  ON discussion_likes FOR ALL
  TO authenticated
  USING (auth.uid()::text = user_id)
  WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "Anyone can read reply likes"
  ON reply_likes FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can manage their reply likes"
  ON reply_likes FOR ALL
  TO authenticated
  USING (auth.uid()::text = user_id)
  WITH CHECK (auth.uid()::text = user_id);

-- Activity log policies
CREATE POLICY "Users can read their own activity"
  ON user_activity_log FOR SELECT
  TO authenticated
  USING (auth.uid()::text = user_id);

CREATE POLICY "Users can insert their own activity"
  ON user_activity_log FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid()::text = user_id);

-- =====================================================
-- UTILITY FUNCTIONS FOR COMMON QUERIES
-- =====================================================

-- Function to get discussion with engagement stats
CREATE OR REPLACE FUNCTION get_discussion_with_stats(discussion_uuid uuid)
RETURNS TABLE (
  id uuid,
  title text,
  content text,
  author_name text,
  likes_count integer,
  replies_count integer,
  views_count integer,
  created_at timestamptz,
  user_has_liked boolean
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    d.id,
    d.title,
    d.content,
    d.author_name,
    d.likes_count,
    d.replies_count,
    d.views_count,
    d.created_at,
    EXISTS(
      SELECT 1 FROM discussion_likes dl 
      WHERE dl.discussion_id = d.id 
      AND dl.user_id = auth.uid()::text
    ) as user_has_liked
  FROM discussions d
  WHERE d.id = discussion_uuid AND d.status = 'active';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get threaded replies
CREATE OR REPLACE FUNCTION get_threaded_replies(discussion_uuid uuid)
RETURNS TABLE (
  id uuid,
  content text,
  author_name text,
  parent_reply_id uuid,
  reply_level integer,
  likes_count integer,
  created_at timestamptz,
  user_has_liked boolean
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    r.id,
    r.content,
    r.author_name,
    r.parent_reply_id,
    r.reply_level,
    r.likes_count,
    r.created_at,
    EXISTS(
      SELECT 1 FROM reply_likes rl 
      WHERE rl.reply_id = r.id 
      AND rl.user_id = auth.uid()::text
    ) as user_has_liked
  FROM discussion_replies r
  WHERE r.discussion_id = discussion_uuid 
  AND r.status = 'active'
  ORDER BY r.reply_path;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- SAMPLE QUERIES FOR COMMON OPERATIONS
-- =====================================================

/*
-- Get trending discussions (most activity in last 24 hours)
SELECT d.*, 
       (d.likes_count + d.replies_count * 2) as engagement_score
FROM discussions d
WHERE d.status = 'active' 
  AND d.last_activity_at > now() - interval '24 hours'
ORDER BY engagement_score DESC, d.created_at DESC
LIMIT 20;

-- Get user's liked discussions
SELECT d.*
FROM discussions d
JOIN discussion_likes dl ON d.id = dl.discussion_id
WHERE dl.user_id = 'user-uuid'
  AND d.status = 'active'
ORDER BY dl.created_at DESC;

-- Get reply thread with all ancestors
WITH RECURSIVE reply_thread AS (
  -- Base case: start with specific reply
  SELECT * FROM discussion_replies WHERE id = 'reply-uuid'
  
  UNION ALL
  
  -- Recursive case: get parent replies
  SELECT dr.*
  FROM discussion_replies dr
  JOIN reply_thread rt ON dr.id = rt.parent_reply_id
)
SELECT * FROM reply_thread ORDER BY reply_level;

-- Get most active users
SELECT author_id, author_name,
       COUNT(*) as total_posts,
       SUM(likes_count) as total_likes_received
FROM (
  SELECT author_id, author_name, likes_count FROM discussions
  UNION ALL
  SELECT author_id, author_name, likes_count FROM discussion_replies
) combined
GROUP BY author_id, author_name
ORDER BY total_likes_received DESC, total_posts DESC
LIMIT 50;
*/