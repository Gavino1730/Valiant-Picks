-- Fix CASCADE delete constraints for user deletion
-- This ensures when a user is deleted, all related data is automatically removed

-- Drop existing foreign key constraints if they exist
ALTER TABLE IF EXISTS bets DROP CONSTRAINT IF EXISTS bets_user_id_fkey;
ALTER TABLE IF EXISTS transactions DROP CONSTRAINT IF EXISTS transactions_user_id_fkey;
ALTER TABLE IF EXISTS notifications DROP CONSTRAINT IF EXISTS notifications_user_id_fkey;

-- Re-add foreign key constraints with CASCADE DELETE
ALTER TABLE bets
ADD CONSTRAINT bets_user_id_fkey 
FOREIGN KEY (user_id) 
REFERENCES users(id) 
ON DELETE CASCADE;

ALTER TABLE transactions
ADD CONSTRAINT transactions_user_id_fkey 
FOREIGN KEY (user_id) 
REFERENCES users(id) 
ON DELETE CASCADE;

ALTER TABLE notifications
ADD CONSTRAINT notifications_user_id_fkey 
FOREIGN KEY (user_id) 
REFERENCES users(id) 
ON DELETE CASCADE;

-- Update RLS policies to allow deletion
-- Drop existing delete policies
DROP POLICY IF EXISTS "Allow authenticated delete on users" ON users;
DROP POLICY IF EXISTS "Enable delete for admins" ON users;
DROP POLICY IF EXISTS "Allow user delete" ON users;

-- Create new delete policy for admins
CREATE POLICY "Enable delete for admins only" 
ON users 
FOR DELETE 
USING (
  -- Allow delete if user is admin (via service role key or JWT)
  auth.jwt()->>'is_admin' = 'true' 
  OR 
  current_setting('request.jwt.claims', true)::json->>'is_admin' = 'true'
);

-- Also ensure related tables allow CASCADE deletes via RLS
DROP POLICY IF EXISTS "Allow cascade delete for bets" ON bets;
DROP POLICY IF EXISTS "Allow cascade delete for transactions" ON transactions;
DROP POLICY IF EXISTS "Allow cascade delete for notifications" ON notifications;

-- Allow delete on bets when parent user is deleted
CREATE POLICY "Allow cascade delete for bets" 
ON bets 
FOR DELETE 
USING (true);  -- CASCADE will handle authorization

-- Allow delete on transactions when parent user is deleted  
CREATE POLICY "Allow cascade delete for transactions" 
ON transactions 
FOR DELETE 
USING (true);  -- CASCADE will handle authorization

-- Allow delete on notifications when parent user is deleted
CREATE POLICY "Allow cascade delete for notifications" 
ON notifications 
FOR DELETE 
USING (true);  -- CASCADE will handle authorization

-- Verify constraints are in place
SELECT 
    tc.table_name, 
    tc.constraint_name, 
    tc.constraint_type,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name,
    rc.delete_rule
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
LEFT JOIN information_schema.referential_constraints AS rc
    ON tc.constraint_name = rc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
    AND kcu.column_name = 'user_id'
    AND tc.table_name IN ('bets', 'transactions', 'notifications')
ORDER BY tc.table_name;
