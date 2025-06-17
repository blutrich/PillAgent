-- Supabase Index Migration for training_programs table
-- This migration adds performance indexes to prevent query timeouts
-- Run this in your Supabase SQL editor or via migration

-- 1. Add composite index for user_id + created_at (most common query pattern)
CREATE INDEX IF NOT EXISTS idx_training_programs_user_created 
ON training_programs (user_id, created_at DESC);

-- 2. Add individual index on user_id for faster user lookups
CREATE INDEX IF NOT EXISTS idx_training_programs_user_id 
ON training_programs (user_id);

-- 3. Add index on status for filtering active programs
CREATE INDEX IF NOT EXISTS idx_training_programs_status 
ON training_programs (status);

-- 4. Add composite index for user + status queries
CREATE INDEX IF NOT EXISTS idx_training_programs_user_status 
ON training_programs (user_id, status);

-- 5. Add index on assessment_id for linking programs to assessments
CREATE INDEX IF NOT EXISTS idx_training_programs_assessment 
ON training_programs (assessment_id);

-- Analysis and verification queries
-- Run these to check index usage:

-- Check if indexes were created successfully
SELECT 
    indexname, 
    indexdef 
FROM pg_indexes 
WHERE tablename = 'training_programs';

-- Analyze query performance (run EXPLAIN ANALYZE on your queries)
-- Example:
-- EXPLAIN ANALYZE 
-- SELECT * FROM training_programs 
-- WHERE user_id = 'your-user-id' 
-- ORDER BY created_at DESC 
-- LIMIT 1;

-- Performance notes:
-- - The composite index on (user_id, created_at DESC) will be used for your getLatestProgram query
-- - This should eliminate the timeout issues by making the query much faster
-- - The DESC order matches your ORDER BY clause for optimal performance 