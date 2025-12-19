// Supabase setup - Run these SQL commands in Supabase SQL editor

CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT auth.uid(),
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
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE games ENABLE ROW LEVEL SECURITY;
ALTER TABLE bets ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_logs ENABLE ROW LEVEL SECURITY;

-- Create policies for games (public read)
CREATE POLICY "Anyone can read games" ON games
  FOR SELECT USING (true);

-- Create policies for bets (users can read own, admins can read all)
CREATE POLICY "Users can read own bets" ON bets
  FOR SELECT USING (auth.uid() = user_id OR auth.uid() IN (SELECT id FROM users WHERE is_admin = true));

CREATE POLICY "Users can create bets" ON bets
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Create policies for transactions
CREATE POLICY "Users can read own transactions" ON transactions
  FOR SELECT USING (auth.uid() = user_id);

-- Admin policies for all tables (requires is_admin = true)
CREATE POLICY "Admins can manage games" ON games
  FOR ALL USING (auth.uid() IN (SELECT id FROM users WHERE is_admin = true));

CREATE POLICY "Admins can manage bets" ON bets
  FOR ALL USING (auth.uid() IN (SELECT id FROM users WHERE is_admin = true));
