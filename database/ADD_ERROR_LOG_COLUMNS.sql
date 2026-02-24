-- Migration: Add status_code, component_stack, response_data columns to error_logs
-- Run this in the Supabase SQL Editor

ALTER TABLE error_logs
  ADD COLUMN IF NOT EXISTS status_code INTEGER,
  ADD COLUMN IF NOT EXISTS component_stack TEXT,
  ADD COLUMN IF NOT EXISTS response_data TEXT;
