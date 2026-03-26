-- ============================================================
-- Joineazy – Migration: Adapt existing schema
-- Run this in Supabase SQL Editor
-- ============================================================

-- 1. Fix assignments: drop FK to profiles, re-link to users + add missing columns
ALTER TABLE assignments DROP CONSTRAINT IF EXISTS assignments_created_by_fkey;
ALTER TABLE assignments ADD CONSTRAINT assignments_created_by_fkey
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE;

ALTER TABLE assignments ADD COLUMN IF NOT EXISTS onedrive_link TEXT;
ALTER TABLE assignments ADD COLUMN IF NOT EXISTS assigned_to   TEXT NOT NULL DEFAULT 'all'
  CHECK (assigned_to IN ('all', 'specific'));
ALTER TABLE assignments ADD COLUMN IF NOT EXISTS updated_at    TIMESTAMPTZ DEFAULT NOW();

-- 2. Fix group_members: drop FK to profiles, re-link to users
ALTER TABLE group_members DROP CONSTRAINT IF EXISTS group_members_user_id_fkey;
ALTER TABLE group_members ADD CONSTRAINT group_members_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

-- 3. Fix submissions: drop FK to profiles, re-link to users + add group fields
ALTER TABLE submissions DROP CONSTRAINT IF EXISTS submissions_user_id_fkey;
ALTER TABLE submissions ADD CONSTRAINT submissions_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

ALTER TABLE submissions ADD COLUMN IF NOT EXISTS group_id     UUID REFERENCES groups(id) ON DELETE CASCADE;
ALTER TABLE submissions ADD COLUMN IF NOT EXISTS status       TEXT NOT NULL DEFAULT 'pending'
  CHECK (status IN ('pending', 'confirmed'));
ALTER TABLE submissions ADD COLUMN IF NOT EXISTS confirmed_by UUID REFERENCES users(id);
ALTER TABLE submissions ADD COLUMN IF NOT EXISTS confirmed_at TIMESTAMPTZ;

-- 4. Create assignment_groups table (specific-group assignments)
CREATE TABLE IF NOT EXISTS assignment_groups (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assignment_id UUID NOT NULL REFERENCES assignments(id) ON DELETE CASCADE,
  group_id      UUID NOT NULL REFERENCES groups(id)      ON DELETE CASCADE,
  UNIQUE(assignment_id, group_id)
);

-- 5. Indexes
CREATE INDEX IF NOT EXISTS idx_group_members_user   ON group_members(user_id);
CREATE INDEX IF NOT EXISTS idx_submissions_assign   ON submissions(assignment_id);
CREATE INDEX IF NOT EXISTS idx_submissions_group    ON submissions(group_id);
CREATE INDEX IF NOT EXISTS idx_assignment_groups_ag ON assignment_groups(assignment_id);
