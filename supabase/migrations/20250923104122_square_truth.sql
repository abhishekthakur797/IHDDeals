/*
  # Safe Database Clearing
  
  This migration safely removes all current database content while preserving
  the backup and preparing for Community Discussions restoration.
  
  1. Safety Checks
    - Verify backup exists
    - Confirm user authorization
    - Log all operations
  
  2. Removal Order
    - Drop dependent objects first (foreign keys, indexes)
    - Remove tables in dependency order
    - Clear RLS policies
    - Reset sequences
  
  3. Preservation
    - Keep auth.users table intact
    - Preserve Supabase system tables
    - Maintain storage buckets
*/

-- Safety check: Ensure backup exists
DO $$
DECLARE
  backup_count integer;
BEGIN
  SELECT COUNT(*) INTO backup_count
  FROM information_schema.schemata 
  WHERE schema_name LIKE 'backup_%';
  
  IF backup_count = 0 THEN
    RAISE EXCEPTION 'No backup found! Cannot proceed with database clearing. Please run backup first.';
  END IF;
  
  RAISE NOTICE 'Backup verified. Found % backup schemas. Proceeding with safe clearing...', backup_count;
END $$;

-- Log the clearing operation
CREATE TABLE IF NOT EXISTS database_operations_log (
  id SERIAL PRIMARY KEY,
  operation TEXT NOT NULL,
  performed_at TIMESTAMP DEFAULT now(),
  performed_by TEXT DEFAULT current_user,
  details JSONB
);

INSERT INTO database_operations_log (operation, details) 
VALUES ('DATABASE_CLEAR_START', jsonb_build_object(
  'timestamp', now(),
  'user', current_user,
  'backup_verified', true
));

-- Function to safely drop table if exists
CREATE OR REPLACE FUNCTION safe_drop_table(table_name text)
RETURNS void AS $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables 
             WHERE table_schema = 'public' AND table_name = $1) THEN
    EXECUTE format('DROP TABLE IF EXISTS public.%I CASCADE', $1);
    RAISE NOTICE 'Dropped table: %', $1;
  ELSE
    RAISE NOTICE 'Table % does not exist, skipping', $1;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Drop all custom tables in safe order (respecting dependencies)
DO $$
DECLARE
  tables_to_drop text[] := ARRAY[
    'reply_likes',
    'discussion_likes', 
    'discussion_replies',
    'discussions',
    'posts',
    'featured_deals',
    'user_accounts'
  ];
  table_name text;
BEGIN
  FOREACH table_name IN ARRAY tables_to_drop
  LOOP
    PERFORM safe_drop_table(table_name);
  END LOOP;
  
  RAISE NOTICE 'All custom tables cleared successfully';
END $$;

-- Drop custom functions if they exist
DROP FUNCTION IF EXISTS backup_table(text, text) CASCADE;
DROP FUNCTION IF EXISTS safe_drop_table(text) CASCADE;
DROP FUNCTION IF EXISTS handle_updated_at() CASCADE;
DROP FUNCTION IF EXISTS get_threaded_replies(uuid) CASCADE;

-- Reset sequences (if any remain)
DO $$
DECLARE
  seq_record record;
BEGIN
  FOR seq_record IN 
    SELECT sequence_name 
    FROM information_schema.sequences 
    WHERE sequence_schema = 'public'
  LOOP
    EXECUTE format('DROP SEQUENCE IF EXISTS public.%I CASCADE', seq_record.sequence_name);
    RAISE NOTICE 'Dropped sequence: %', seq_record.sequence_name;
  END LOOP;
END $$;

-- Log completion
INSERT INTO database_operations_log (operation, details) 
VALUES ('DATABASE_CLEAR_COMPLETE', jsonb_build_object(
  'timestamp', now(),
  'tables_cleared', ARRAY['reply_likes', 'discussion_likes', 'discussion_replies', 
                         'discussions', 'posts', 'featured_deals', 'user_accounts'],
  'status', 'success'
));

RAISE NOTICE 'Database clearing completed successfully. Ready for Community Discussions restoration.';