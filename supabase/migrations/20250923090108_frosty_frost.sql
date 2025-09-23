/*
  # Drop all existing tables

  This migration removes all existing database tables and related objects.
*/

-- Drop all tables in the correct order (respecting foreign key dependencies)
DROP TABLE IF EXISTS reply_likes CASCADE;
DROP TABLE IF EXISTS discussion_likes CASCADE;
DROP TABLE IF EXISTS discussion_replies CASCADE;
DROP TABLE IF EXISTS discussions CASCADE;
DROP TABLE IF EXISTS affiliate_products CASCADE;
DROP TABLE IF EXISTS user_accounts CASCADE;
DROP TABLE IF EXISTS simple_users CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;

-- Drop any remaining functions
DROP FUNCTION IF EXISTS handle_updated_at() CASCADE;
DROP FUNCTION IF EXISTS handle_new_user() CASCADE;
DROP FUNCTION IF EXISTS get_threaded_replies(uuid) CASCADE;

-- Drop any remaining triggers
-- (These should be dropped automatically with CASCADE, but just to be safe)

-- Note: This will remove all data permanently
-- Make sure to backup any important data before running this migration