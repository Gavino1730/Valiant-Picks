-- Create a secure function to delete users with CASCADE
-- This bypasses RLS while maintaining security through the application layer

CREATE OR REPLACE FUNCTION delete_user_cascade(p_user_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER  -- Run with privileges of the function owner
AS $$
DECLARE
  v_deleted_bets INT := 0;
  v_deleted_transactions INT := 0;
  v_deleted_notifications INT := 0;
BEGIN
  -- Count related records before deletion
  SELECT COUNT(*) INTO v_deleted_bets FROM bets WHERE user_id = p_user_id;
  SELECT COUNT(*) INTO v_deleted_transactions FROM transactions WHERE user_id = p_user_id;
  SELECT COUNT(*) INTO v_deleted_notifications FROM notifications WHERE user_id = p_user_id;

  -- Delete related records (if CASCADE isn't working)
  DELETE FROM bets WHERE user_id = p_user_id;
  DELETE FROM transactions WHERE user_id = p_user_id;
  DELETE FROM notifications WHERE user_id = p_user_id;
  
  -- Delete the user
  DELETE FROM users WHERE id = p_user_id;
  
  -- Return summary
  RETURN json_build_object(
    'success', true,
    'deleted_bets', v_deleted_bets,
    'deleted_transactions', v_deleted_transactions,
    'deleted_notifications', v_deleted_notifications
  );
END;
$$;

-- Grant execute permission to authenticated users (admin check happens in app)
GRANT EXECUTE ON FUNCTION delete_user_cascade(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION delete_user_cascade(UUID) TO anon;
