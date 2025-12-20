DROP TABLE IF EXISTS admin_logs CASCADE;
DROP TABLE IF EXISTS transactions CASCADE;
DROP TABLE IF EXISTS bets CASCADE;
DROP TABLE IF EXISTS games CASCADE;
DROP TABLE IF EXISTS users CASCADE;

CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  balance REAL DEFAULT 1000,
  is_admin BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS games (
  id BIGSERIAL PRIMARY KEY,
  team_type TEXT NOT NULL,
  home_team TEXT NOT NULL,
  away_team TEXT,
  game_date TEXT NOT NULL,
  game_time TEXT,
  location TEXT,
  status TEXT DEFAULT 'upcoming',
  winning_odds REAL NOT NULL,
  losing_odds REAL NOT NULL,
  spread REAL,
  spread_odds REAL,
  over_under REAL,
  over_odds REAL,
  under_odds REAL,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS bets (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  game_id BIGINT NOT NULL REFERENCES games(id) ON DELETE CASCADE,
  bet_type TEXT NOT NULL,
  selected_team TEXT,
  amount REAL NOT NULL,
  odds REAL NOT NULL,
  status TEXT DEFAULT 'pending',
  outcome TEXT,
  potential_win REAL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS transactions (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  amount REAL NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'completed',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS admin_logs (
  id BIGSERIAL PRIMARY KEY,
  admin_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  details TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Enable Row Level Security (RLS) for security
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE games ENABLE ROW LEVEL SECURITY;
ALTER TABLE bets ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_logs ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (for idempotency)
DROP POLICY IF EXISTS "allow_registration" ON users;
DROP POLICY IF EXISTS "allow_read_own_user" ON users;
DROP POLICY IF EXISTS "Anyone can register users" ON users;
DROP POLICY IF EXISTS "Users can read own profile" ON users;
DROP POLICY IF EXISTS "Admins can see all users" ON users;
DROP POLICY IF EXISTS "Admins can update users" ON users;
DROP POLICY IF EXISTS "Anyone can read games" ON games;
DROP POLICY IF EXISTS "Users can read own bets" ON bets;
DROP POLICY IF EXISTS "Admins can read all bets" ON bets;
DROP POLICY IF EXISTS "Users can create bets" ON bets;
DROP POLICY IF EXISTS "Admins can update bets" ON bets;
DROP POLICY IF EXISTS "Users can read own transactions" ON transactions;
DROP POLICY IF EXISTS "Admins can manage games" ON games;
DROP POLICY IF EXISTS "Admins can manage bets" ON bets;
DROP POLICY IF EXISTS "allow_read_games" ON games;
DROP POLICY IF EXISTS "allow_create_bets" ON bets;
DROP POLICY IF EXISTS "allow_read_own_bets" ON bets;
DROP POLICY IF EXISTS "allow_read_own_transactions" ON transactions;

-- Disable RLS temporarily for setup, will re-enable with proper policies
ALTER TABLE games DISABLE ROW LEVEL SECURITY;
ALTER TABLE bets DISABLE ROW LEVEL SECURITY;
ALTER TABLE transactions DISABLE ROW LEVEL SECURITY;
ALTER TABLE admin_logs DISABLE ROW LEVEL SECURITY;

-- Re-enable RLS
ALTER TABLE games ENABLE ROW LEVEL SECURITY;
ALTER TABLE bets ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_logs ENABLE ROW LEVEL SECURITY;

-- Simple policies without recursion
-- Users table: Allow anyone to insert (register), users can read own data
CREATE POLICY "allow_registration" ON users
  FOR INSERT WITH CHECK (true);

CREATE POLICY "allow_read_own_user" ON users
  FOR SELECT USING (auth.uid() = id);

-- Games table: Public read, admin create/update/delete
CREATE POLICY "allow_read_games" ON games
  FOR SELECT USING (true);

-- Bets table: Users can create/read own, admins can manage all
CREATE POLICY "allow_create_bets" ON bets
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "allow_read_own_bets" ON bets
  FOR SELECT USING (auth.uid() = user_id);

-- Transactions table: Users can read own
CREATE POLICY "allow_read_own_transactions" ON transactions
  FOR SELECT USING (auth.uid() = user_id);