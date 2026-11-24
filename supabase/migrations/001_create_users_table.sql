-- Migration 001: Create users table
-- Standalone user profiles with Google OAuth managed by the app (not Supabase Auth).
-- Must be created first since ambiances and ambiance_ratings reference it.

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create users table
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  google_id TEXT UNIQUE NOT NULL,
  email TEXT NOT NULL,
  username VARCHAR(32) UNIQUE NOT NULL,
  avatar TEXT,
  role VARCHAR(20) NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  account_status VARCHAR(20) NOT NULL DEFAULT 'good' CHECK (account_status IN ('good', 'shadowbanned')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_active TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index for username lookups (profile pages, uniqueness checks)
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);

-- Index for Google ID lookups (login)
CREATE INDEX IF NOT EXISTS idx_users_google_id ON users(google_id);

-- Index for moderation queries
CREATE INDEX IF NOT EXISTS idx_users_account_status ON users(account_status);

-- ============================================
-- Sessions table (supports multiple devices)
-- ============================================

CREATE TABLE IF NOT EXISTS sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  session_id TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_active TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index for fast session lookups (auth on every request)
CREATE INDEX IF NOT EXISTS idx_sessions_session_id ON sessions(session_id);

-- Index for finding all sessions for a user (cleanup, logout-all)
CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);

-- Index for efficient cleanup queries (cron job scans by last_active)
CREATE INDEX IF NOT EXISTS idx_sessions_last_active ON sessions(last_active);

-- ============================================
-- Random username generator
-- ============================================

CREATE OR REPLACE FUNCTION generate_random_username()
RETURNS TEXT AS $$
DECLARE
  adjectives TEXT[] := ARRAY[
    'Swift', 'Bright', 'Calm', 'Clever', 'Cosmic',
    'Azure', 'Bold', 'Chill', 'Eager', 'Fizzy',
    'Gentle', 'Golden', 'Happy', 'Keen', 'Lucky',
    'Mellow', 'Radiant', 'Noble', 'Plucky', 'Vivid',
    'Rustic', 'Sandy', 'Silent', 'Silver', 'Snowy',
    'Stellar', 'Speedy', 'Starry', 'Sunny', 'Crimson',
    'Wandering', 'Whimsy', 'Winter', 'Wispy', 'Zesty'
  ];
  nouns TEXT[] := ARRAY[
    'Anchor', 'Bison', 'Breeze', 'Condor', 'Cedar',
    'Cloud', 'Comet', 'Coral', 'Crane', 'Dune',
    'Falcon', 'Lotus', 'Finch', 'Forest', 'Frost',
    'Gazelle', 'Harbor', 'Hawk', 'Heron', 'Horizon',
    'Lantern', 'Leaf', 'Ember', 'Meadow', 'Moon',
    'Nebula', 'Oakley', 'Orchid', 'Penguin', 'Owl',
    'Panda', 'Pebble', 'Phoenix', 'Pine', 'Quill',
    'Raven', 'Reed', 'Ridge', 'River', 'Robin',
    'Sage', 'Sparrow', 'Stone', 'Storm', 'Summit',
    'Thistle', 'Tide', 'Timber', 'Wren', 'Zenith'
  ];
  adj TEXT;
  noun TEXT;
  num TEXT;
BEGIN
  adj := adjectives[1 + floor(random() * array_length(adjectives, 1))];
  noun := nouns[1 + floor(random() * array_length(nouns, 1))];
  num := lpad((floor(random() * 400) + 1)::TEXT, 3, '0');
  RETURN adj || noun || num;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- Row Level Security (RLS)
-- ============================================
-- All DB operations go through the admin client (service role key) which bypasses RLS.
-- RLS is enabled as a safety net to block direct anonymous/public access.

ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Anyone can view user profiles (public)
DROP POLICY IF EXISTS "Anyone can view user profiles" ON users;
CREATE POLICY "Anyone can view user profiles"
  ON users FOR SELECT
  USING (true);

-- No direct insert/update/delete via public client (all handled by admin client)

ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;

-- No direct access to sessions via public client

-- ============================================
-- Development: Create test user
-- ============================================

INSERT INTO public.users (id, google_id, email, username, role, account_status)
VALUES (
  '00000000-0000-0000-0000-000000000000',
  'dev_google_id',
  'dev@localhost.local',
  'dev_user',
  'admin',
  'good'
)
ON CONFLICT (id) DO NOTHING;
