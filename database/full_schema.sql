-- ============================================================
-- Joineazy – Complete Schema (safe to run on existing or new DB)
-- Run this in Supabase SQL Editor
-- ============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ── 1. users ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name       TEXT NOT NULL,
  email      TEXT UNIQUE NOT NULL,
  password   TEXT NOT NULL,
  role       TEXT NOT NULL DEFAULT 'student' CHECK (role IN ('student', 'admin')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── 2. groups ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS groups (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL,
  description TEXT,
  created_by  UUID REFERENCES users(id) ON DELETE CASCADE,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ── 3. group_members ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS group_members (
  id        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id  UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  user_id   UUID NOT NULL REFERENCES users(id)  ON DELETE CASCADE,
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(group_id, user_id)
);

-- ── 4. assignments ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS assignments (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title         TEXT NOT NULL,
  description   TEXT,
  due_date      TIMESTAMPTZ NOT NULL,
  onedrive_link TEXT,
  assigned_to   TEXT NOT NULL DEFAULT 'all' CHECK (assigned_to IN ('all', 'specific')),
  created_by    UUID REFERENCES users(id) ON DELETE CASCADE,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

-- If table already existed without new columns, add them safely
ALTER TABLE assignments ADD COLUMN IF NOT EXISTS onedrive_link TEXT;
ALTER TABLE assignments ADD COLUMN IF NOT EXISTS assigned_to   TEXT NOT NULL DEFAULT 'all';
ALTER TABLE assignments ADD COLUMN IF NOT EXISTS updated_at    TIMESTAMPTZ DEFAULT NOW();

-- ── 5. assignment_groups ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS assignment_groups (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assignment_id UUID NOT NULL REFERENCES assignments(id) ON DELETE CASCADE,
  group_id      UUID NOT NULL REFERENCES groups(id)      ON DELETE CASCADE,
  UNIQUE(assignment_id, group_id)
);

-- ── 6. submissions ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS submissions (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assignment_id UUID NOT NULL REFERENCES assignments(id) ON DELETE CASCADE,
  group_id      UUID REFERENCES groups(id) ON DELETE CASCADE,
  user_id       UUID REFERENCES users(id)  ON DELETE CASCADE,
  status        TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed')),
  confirmed_by  UUID REFERENCES users(id),
  confirmed_at  TIMESTAMPTZ,
  content       TEXT,
  submitted_at  TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(assignment_id, group_id)
);

-- If table already existed without new columns, add them safely
ALTER TABLE submissions ADD COLUMN IF NOT EXISTS group_id     UUID REFERENCES groups(id) ON DELETE CASCADE;
ALTER TABLE submissions ADD COLUMN IF NOT EXISTS status       TEXT NOT NULL DEFAULT 'pending';
ALTER TABLE submissions ADD COLUMN IF NOT EXISTS confirmed_by UUID REFERENCES users(id);
ALTER TABLE submissions ADD COLUMN IF NOT EXISTS confirmed_at TIMESTAMPTZ;

-- ── 7. Indexes ───────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_group_members_user    ON group_members(user_id);
CREATE INDEX IF NOT EXISTS idx_group_members_group   ON group_members(group_id);
CREATE INDEX IF NOT EXISTS idx_submissions_assign    ON submissions(assignment_id);
CREATE INDEX IF NOT EXISTS idx_submissions_group     ON submissions(group_id);
CREATE INDEX IF NOT EXISTS idx_assignment_groups_aid ON assignment_groups(assignment_id);
CREATE INDEX IF NOT EXISTS idx_assignments_created   ON assignments(created_by);
