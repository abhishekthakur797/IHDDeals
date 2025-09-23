/*
  # Remove All Database Tables

  This migration removes all custom tables and data from the database.
  
  ## What will be removed:
  - user_accounts table (with all user data)
  - posts table (with all post data)
  - discussions table (with all discussion data)
  - discussion_replies table (with all replies)
  - discussion_likes table (with all likes)
  - reply_likes table (with all reply likes)
  - featured_deals table (with all deals)
  - All associated policies, indexes, and constraints
  
  ## Security:
  - This will permanently delete all user data
  - This action cannot be undone
  - Make sure you have backups if needed
*/

-- Drop all policies first (to avoid dependency issues)
DROP POLICY IF EXISTS "service_role_full_access" ON user_accounts;
DROP POLICY IF EXISTS "users_can_insert_own_profile" ON user_accounts;
DROP POLICY IF EXISTS "users_can_read_own_account" ON user_accounts;
DROP POLICY IF EXISTS "users_can_update_own_account" ON user_accounts;
DROP POLICY IF EXISTS "anonymous_can_check_availability" ON user_accounts;
DROP POLICY IF EXISTS "Service role full access" ON user_accounts;
DROP POLICY IF EXISTS "Users can insert their own profile" ON user_accounts;
DROP POLICY IF EXISTS "Users can read their own account" ON user_accounts;
DROP POLICY IF EXISTS "Users can update their own account" ON user_accounts;

DROP POLICY IF EXISTS "Anyone can read posts" ON posts;
DROP POLICY IF EXISTS "Authenticated users can create posts" ON posts;
DROP POLICY IF EXISTS "Users can delete their own posts" ON posts;
DROP POLICY IF EXISTS "Users can update their own posts" ON posts;

DROP POLICY IF EXISTS "Anyone can read featured deals" ON featured_deals;
DROP POLICY IF EXISTS "Authenticated users can manage featured deals" ON featured_deals;

DROP POLICY IF EXISTS "Anyone can create discussions" ON discussions;
DROP POLICY IF EXISTS "Anyone can read discussions" ON discussions;
DROP POLICY IF EXISTS "Authors can update their discussions" ON discussions;

DROP POLICY IF EXISTS "Anyone can create replies" ON discussion_replies;
DROP POLICY IF EXISTS "Anyone can read replies" ON discussion_replies;
DROP POLICY IF EXISTS "Authors can update their replies" ON discussion_replies;

DROP POLICY IF EXISTS "Anyone can read discussion likes" ON discussion_likes;
DROP POLICY IF EXISTS "Authenticated users can manage their discussion likes" ON discussion_likes;

DROP POLICY IF EXISTS "Anyone can read reply likes" ON reply_likes;
DROP POLICY IF EXISTS "Authenticated users can manage their reply likes" ON reply_likes;

-- Drop all tables (in correct order to handle foreign key dependencies)
DROP TABLE IF EXISTS reply_likes CASCADE;
DROP TABLE IF EXISTS discussion_likes CASCADE;
DROP TABLE IF EXISTS discussion_replies CASCADE;
DROP TABLE IF EXISTS discussions CASCADE;
DROP TABLE IF EXISTS posts CASCADE;
DROP TABLE IF EXISTS featured_deals CASCADE;
DROP TABLE IF EXISTS user_accounts CASCADE;

-- Drop any custom functions that might exist
DROP FUNCTION IF EXISTS handle_updated_at() CASCADE;
DROP FUNCTION IF EXISTS get_threaded_replies(uuid) CASCADE;

-- Drop any custom types that might exist
DROP TYPE IF EXISTS user_role CASCADE;

-- Clean up any remaining sequences
DROP SEQUENCE IF EXISTS featured_deals_deal_id_seq CASCADE;

-- Note: This migration will remove all custom data but will not affect:
-- - Supabase Auth users (auth.users table)
-- - Supabase Storage buckets and files
-- - Supabase Edge Functions
-- - Supabase Realtime subscriptions