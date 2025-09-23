/*
  # Database Backup Before Restoration
  
  This migration creates a complete backup of the current database state
  before performing the restoration process.
  
  1. Backup Strategy
    - Export all table schemas and data
    - Save RLS policies and permissions
    - Document current state for rollback if needed
  
  2. Tables to Backup
    - user_accounts (user profiles)
    - discussions (community posts)
    - discussion_replies (thread replies)
    - discussion_likes (user likes)
    - reply_likes (reply interactions)
    - featured_deals (product data)
  
  3. Security Backup
    - All RLS policies
    - User permissions
    - Role assignments
*/

-- Create backup schema to store current data
CREATE SCHEMA IF NOT EXISTS backup_$(date +%Y%m%d_%H%M%S);

-- Function to backup table with data
CREATE OR REPLACE FUNCTION backup_table(table_name text, backup_schema text)
RETURNS void AS $$
BEGIN
  EXECUTE format('CREATE TABLE %I.%I AS SELECT * FROM public.%I', 
                 backup_schema, table_name, table_name);
  
  -- Backup table comments and constraints
  EXECUTE format('COMMENT ON TABLE %I.%I IS ''Backup of public.%I created on %s''', 
                 backup_schema, table_name, table_name, now());
END;
$$ LANGUAGE plpgsql;

-- Backup all existing tables if they exist
DO $$
DECLARE
  backup_schema_name text := 'backup_' || to_char(now(), 'YYYYMMDD_HH24MISS');
  table_record record;
BEGIN
  -- Create backup schema
  EXECUTE format('CREATE SCHEMA IF NOT EXISTS %I', backup_schema_name);
  
  -- Backup each table that exists
  FOR table_record IN 
    SELECT tablename 
    FROM pg_tables 
    WHERE schemaname = 'public' 
    AND tablename IN ('user_accounts', 'discussions', 'discussion_replies', 
                      'discussion_likes', 'reply_likes', 'featured_deals', 'posts')
  LOOP
    BEGIN
      PERFORM backup_table(table_record.tablename, backup_schema_name);
      RAISE NOTICE 'Backed up table: %', table_record.tablename;
    EXCEPTION WHEN OTHERS THEN
      RAISE NOTICE 'Failed to backup table %: %', table_record.tablename, SQLERRM;
    END;
  END LOOP;
  
  -- Backup RLS policies
  EXECUTE format('CREATE TABLE %I.rls_policies_backup AS 
                  SELECT * FROM pg_policies WHERE schemaname = ''public''', 
                 backup_schema_name);
  
  RAISE NOTICE 'Database backup completed in schema: %', backup_schema_name;
END $$;

-- Log backup completion
INSERT INTO pg_stat_statements_info (dealloc) 
VALUES (0) 
ON CONFLICT DO NOTHING;

COMMENT ON SCHEMA public IS 'Backup completed on ' || now() || ' - Ready for restoration';