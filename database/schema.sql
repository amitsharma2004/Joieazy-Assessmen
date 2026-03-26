-- ============================================================
-- Joineazy – Database Schema
-- Run this in Supabase SQL Editor
-- ============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ── Users ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name          TEXT NOT NULL,
  email         TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role          TEXT NOT NULL CHECK (role IN ('student', 'admin')),
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- ── Groups ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS groups (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name        TEXT NOT NULL,
  created_by  UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ── Group Members ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS group_members (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  group_id   UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  joined_at  TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(group_id, user_id)
);

-- ── Assignments ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS assignments (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title         TEXT NOT NULL,
  description   TEXT,
  due_date      DATE NOT NULL,
  onedrive_link TEXT,
  assigned_to   TEXT NOT NULL DEFAULT 'all' CHECK (assigned_to IN ('all', 'specific')),
  created_by    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

-- ── Assignment ↔ Group Links (for specific assignments) ──────
CREATE TABLE IF NOT EXISTS assignment_groups (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  assignment_id UUID NOT NULL REFERENCES assignments(id) ON DELETE CASCADE,
  group_id      UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  UNIQUE(assignment_id, group_id)
);

-- ── Submissions ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS submissions (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  assignment_id UUID NOT NULL REFERENCES assignments(id) ON DELETE CASCADE,
  group_id      UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  confirmed_by  UUID NOT NULL REFERENCES users(id),
  status        TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed')),
  confirmed_at  TIMESTAMPTZ,
  UNIQUE(assignment_id, group_id)
);

-- ── Indexes ──────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_group_members_user   ON group_members(user_id);
CREATE INDEX IF NOT EXISTS idx_group_members_group  ON group_members(group_id);
CREATE INDEX IF NOT EXISTS idx_submissions_assign   ON submissions(assignment_id);
CREATE INDEX IF NOT EXISTS idx_submissions_group    ON submissions(group_id);
CREATE INDEX IF NOT EXISTS idx_assignment_groups_ag ON assignment_groups(assignment_id);

-- ── Seed: Demo Admin ─────────────────────────────────────────
-- Password: Admin@123 (bcrypt hash)
INSERT INTO users (name, email, password_hash, role)
VALUES (
  'Prof. Demo',
  'admin@joineazy.com',
  '$2a$12$LQv3c1yqBwEHFg5Nj0TwweYFyBCFr5bnFi4YhQNl3HYZNrpJPBzQW',
  'admin'
) ON CONFLICT (email) DO NOTHING;
