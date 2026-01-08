-- Create error_logs table to track all user errors
CREATE TABLE IF NOT EXISTS error_logs (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  username TEXT,
  error_type TEXT NOT NULL, -- 'frontend', 'backend', 'api'
  error_message TEXT NOT NULL,
  error_stack TEXT,
  endpoint TEXT, -- API endpoint where error occurred
  method TEXT, -- HTTP method (GET, POST, etc.)
  request_body JSONB, -- Request data (sensitive data removed)
  user_agent TEXT,
  ip_address TEXT,
  page_url TEXT, -- Frontend page where error occurred
  severity TEXT DEFAULT 'error', -- 'critical', 'error', 'warning'
  resolved BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_error_logs_user_id ON error_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_error_logs_created_at ON error_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_error_logs_resolved ON error_logs(resolved);
CREATE INDEX IF NOT EXISTS idx_error_logs_severity ON error_logs(severity);

-- Enable RLS
ALTER TABLE error_logs ENABLE ROW LEVEL SECURITY;

-- Allow all access (backend validates with JWT)
CREATE POLICY "allow_all_error_logs" ON error_logs
  FOR ALL USING (true) WITH CHECK (true);

-- Create view for error summary
CREATE OR REPLACE VIEW error_summary AS
SELECT 
  error_type,
  error_message,
  COUNT(*) as occurrence_count,
  MAX(created_at) as last_occurred,
  COUNT(DISTINCT user_id) as affected_users,
  BOOL_OR(resolved) as any_resolved
FROM error_logs
WHERE created_at > NOW() - INTERVAL '7 days'
GROUP BY error_type, error_message
ORDER BY occurrence_count DESC;

SELECT 'Error logging table created successfully! ✅' AS status;
