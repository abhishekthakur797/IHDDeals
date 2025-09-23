# PostgreSQL Row-Level Security (RLS) Policy Violation Troubleshooting Guide

## 🔍 Understanding RLS Policy Violations

**Row-Level Security (RLS)** is a PostgreSQL feature that restricts which rows a user can access or modify based on policies. When you see the error "new row violates row-level security policy," it means:

1. **RLS is enabled** on the table
2. **No policy allows** the current user context to perform the operation
3. **The operation is blocked** at the database level for security

This is a **security feature**, not a bug - it prevents unauthorized data access.

---

## 🔧 Step-by-Step Diagnostic Process

### **Step 1: Check Current RLS Status**

```sql
-- Check if RLS is enabled on the table
SELECT schemaname, tablename, rowsecurity, forcerowsecurity 
FROM pg_tables 
WHERE tablename = 'user_accounts';

-- Check table structure and constraints
\d+ user_accounts
```

### **Step 2: Examine Existing Policies**

```sql
-- List all policies for the user_accounts table
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'user_accounts'
ORDER BY policyname;

-- Check policy details with readable format
SELECT 
    policyname as "Policy Name",
    cmd as "Command",
    roles as "Roles",
    qual as "USING Condition",
    with_check as "WITH CHECK Condition"
FROM pg_policies 
WHERE tablename = 'user_accounts';
```

### **Step 3: Identify Current User Context**

```sql
-- Check current role and authentication status
SELECT 
    current_user as "Current User",
    current_role as "Current Role",
    session_user as "Session User";

-- For Supabase, check auth context
SELECT auth.uid() as "Auth User ID", auth.role() as "Auth Role";

-- Check if user is authenticated
SELECT 
    CASE 
        WHEN auth.uid() IS NULL THEN 'Anonymous'
        ELSE 'Authenticated'
    END as "User Status";
```

### **Step 4: Test Policy Conditions**

```sql
-- Test if current user can insert (dry run)
EXPLAIN (ANALYZE, BUFFERS) 
INSERT INTO user_accounts (id, full_name, email, username, password_hash) 
VALUES ('test-id', 'Test User', 'test@example.com', 'testuser', 'hashed_password');

-- Check what policies would apply to current user
SELECT 
    policyname,
    CASE 
        WHEN 'authenticated' = ANY(roles) AND auth.uid() IS NOT NULL THEN 'APPLIES'
        WHEN 'anon' = ANY(roles) AND auth.uid() IS NULL THEN 'APPLIES'
        WHEN 'service_role' = ANY(roles) THEN 'SERVICE_ROLE_ONLY'
        ELSE 'DOES_NOT_APPLY'
    END as policy_status
FROM pg_policies 
WHERE tablename = 'user_accounts' AND cmd IN ('ALL', 'INSERT');
```

---

## 🛠️ Root Cause Analysis

### **Common Causes of RLS Violations:**

#### **1. Missing INSERT Policy**
```sql
-- Problem: No policy allows INSERT for current user role
-- Solution: Create appropriate INSERT policy
CREATE POLICY "allow_user_insert" ON user_accounts
    FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = id);
```

#### **2. Incorrect User Context**
```sql
-- Problem: Operation performed as wrong role (anon vs authenticated)
-- Check current context:
SELECT auth.uid(), auth.role();

-- Solution: Ensure proper authentication before INSERT
```

#### **3. Policy Condition Failure**
```sql
-- Problem: Policy exists but WITH CHECK condition fails
-- Example failing condition: WITH CHECK (auth.uid() = id)
-- Solution: Ensure the data being inserted matches policy conditions
```

#### **4. Service Role Access Issues**
```sql
-- Problem: Registration process needs service role access
-- Solution: Create service role policy
CREATE POLICY "service_role_access" ON user_accounts
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);
```

---

## ✅ Step-by-Step Solution

### **Solution 1: Fix Missing Policies**

```sql
-- Enable RLS (if not already enabled)
ALTER TABLE user_accounts ENABLE ROW LEVEL SECURITY;

-- Create comprehensive policy set
-- 1. Service role full access (for registration)
CREATE POLICY "service_role_full_access" ON user_accounts
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

-- 2. Users can insert their own profile
CREATE POLICY "users_can_insert_own_profile" ON user_accounts
    FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = id);

-- 3. Users can read their own account
CREATE POLICY "users_can_read_own_account" ON user_accounts
    FOR SELECT
    TO authenticated
    USING (auth.uid() = id);

-- 4. Users can update their own account
CREATE POLICY "users_can_update_own_account" ON user_accounts
    FOR UPDATE
    TO authenticated
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

-- 5. Anonymous users can check availability
CREATE POLICY "anonymous_can_check_availability" ON user_accounts
    FOR SELECT
    TO anon
    USING (true);
```

### **Solution 2: Grant Proper Permissions**

```sql
-- Grant table permissions to roles
GRANT ALL ON user_accounts TO service_role;
GRANT SELECT, INSERT, UPDATE ON user_accounts TO authenticated;
GRANT SELECT ON user_accounts TO anon;

-- Grant sequence permissions (for auto-increment IDs)
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO service_role;
```

### **Solution 3: Verify Policy Application**

```sql
-- Test policies work correctly
-- As service role:
SET ROLE service_role;
INSERT INTO user_accounts (id, full_name, email, username, password_hash) 
VALUES ('test-service', 'Service Test', 'service@test.com', 'servicetest', 'hash');

-- As authenticated user:
SET ROLE authenticated;
-- This should work if auth.uid() matches the id
INSERT INTO user_accounts (id, full_name, email, username, password_hash) 
VALUES (auth.uid(), 'Auth Test', 'auth@test.com', 'authtest', 'hash');

-- Reset role
RESET ROLE;
```

---

## 🔒 Security Considerations

### **1. Principle of Least Privilege**
```sql
-- ✅ GOOD: Specific permissions for specific roles
CREATE POLICY "users_own_data_only" ON user_accounts
    FOR ALL TO authenticated
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

-- ❌ BAD: Overly permissive policy
CREATE POLICY "allow_all" ON user_accounts
    FOR ALL TO public
    USING (true)
    WITH CHECK (true);
```

### **2. Service Role Usage**
```sql
-- ✅ GOOD: Service role for system operations only
CREATE POLICY "service_role_system_ops" ON user_accounts
    FOR ALL TO service_role
    USING (true)
    WITH CHECK (true);

-- ⚠️ CAUTION: Never expose service role to client-side code
-- Service role should only be used in secure server environments
```

### **3. Data Validation in Policies**
```sql
-- ✅ GOOD: Validate data in WITH CHECK
CREATE POLICY "validate_user_data" ON user_accounts
    FOR INSERT TO authenticated
    WITH CHECK (
        auth.uid() = id AND
        length(full_name) >= 2 AND
        email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'
    );
```

---

## 🚀 Preventive Measures

### **1. Policy Testing Framework**
```sql
-- Create test function to validate policies
CREATE OR REPLACE FUNCTION test_user_policies()
RETURNS TABLE(test_name text, result text) AS $$
BEGIN
    -- Test 1: Service role can insert
    BEGIN
        SET ROLE service_role;
        INSERT INTO user_accounts (id, full_name, email, username, password_hash) 
        VALUES ('test-1', 'Test 1', 'test1@example.com', 'test1', 'hash');
        DELETE FROM user_accounts WHERE id = 'test-1';
        RETURN QUERY SELECT 'Service role INSERT'::text, 'PASS'::text;
    EXCEPTION WHEN OTHERS THEN
        RETURN QUERY SELECT 'Service role INSERT'::text, 'FAIL: ' || SQLERRM;
    END;
    
    -- Test 2: Authenticated user can insert own data
    -- (Would need actual auth context to test properly)
    
    RESET ROLE;
END;
$$ LANGUAGE plpgsql;

-- Run tests
SELECT * FROM test_user_policies();
```

### **2. Policy Documentation**
```sql
-- Document policies with comments
COMMENT ON POLICY "users_can_insert_own_profile" ON user_accounts IS 
'Allows authenticated users to create their own profile during registration. 
Ensures users can only create accounts with their own auth.uid().';

COMMENT ON POLICY "service_role_full_access" ON user_accounts IS 
'Allows service role full access for system operations like user registration. 
SECURITY: Only use in secure server environments, never expose to clients.';
```

### **3. Monitoring and Alerting**
```sql
-- Create view to monitor policy violations
CREATE VIEW rls_violations AS
SELECT 
    schemaname,
    tablename,
    'RLS_VIOLATION' as event_type,
    current_timestamp as occurred_at
FROM pg_stat_user_tables
WHERE schemaname = 'public';

-- Log policy changes
CREATE TABLE policy_audit_log (
    id SERIAL PRIMARY KEY,
    table_name TEXT,
    policy_name TEXT,
    action TEXT, -- 'CREATE', 'DROP', 'ALTER'
    performed_by TEXT DEFAULT current_user,
    performed_at TIMESTAMP DEFAULT current_timestamp
);
```

### **4. Development Best Practices**

#### **Environment-Specific Policies:**
```sql
-- Development: More permissive for testing
-- Production: Strict security policies
-- Use environment variables to control policy strictness

-- Example: Conditional policy based on environment
DO $$
BEGIN
    IF current_setting('app.environment', true) = 'development' THEN
        -- More permissive development policies
        CREATE POLICY "dev_full_access" ON user_accounts
            FOR ALL TO authenticated
            USING (true) WITH CHECK (true);
    ELSE
        -- Strict production policies
        CREATE POLICY "prod_own_data_only" ON user_accounts
            FOR ALL TO authenticated
            USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
    END IF;
END $$;
```

#### **Policy Version Control:**
```sql
-- Track policy versions
CREATE TABLE policy_versions (
    id SERIAL PRIMARY KEY,
    table_name TEXT,
    policy_name TEXT,
    version INTEGER,
    policy_definition TEXT,
    created_at TIMESTAMP DEFAULT current_timestamp
);

-- Before dropping/modifying policies, save current version
INSERT INTO policy_versions (table_name, policy_name, version, policy_definition)
SELECT 'user_accounts', policyname, 1, pg_get_expr(polqual, polrelid)
FROM pg_policy p
JOIN pg_class c ON p.polrelid = c.oid
WHERE c.relname = 'user_accounts';
```

---

## 📋 Quick Reference Checklist

### **When RLS Violation Occurs:**
- [ ] Check if RLS is enabled: `SELECT rowsecurity FROM pg_tables WHERE tablename = 'user_accounts'`
- [ ] List current policies: `SELECT * FROM pg_policies WHERE tablename = 'user_accounts'`
- [ ] Verify user context: `SELECT current_user, auth.uid(), auth.role()`
- [ ] Check policy conditions match your data
- [ ] Ensure proper role permissions are granted
- [ ] Test with service role if needed for system operations

### **For Production Deployment:**
- [ ] Document all policies with comments
- [ ] Test policies in staging environment
- [ ] Set up monitoring for policy violations
- [ ] Create rollback procedures for policy changes
- [ ] Review policies regularly for security compliance

This comprehensive approach ensures both security and functionality while preventing future RLS violations.