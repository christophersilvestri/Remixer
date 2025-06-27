-- Users table: stores LinkedIn OAuth info
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  linkedin_id TEXT UNIQUE NOT NULL,
  access_token TEXT NOT NULL,
  refresh_token TEXT,
  expires_at INTEGER,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Scheduled posts table: stores post content, scheduled time, status, and references the user
CREATE TABLE IF NOT EXISTS scheduled_posts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  content TEXT NOT NULL,
  scheduled_time DATETIME NOT NULL,
  status TEXT DEFAULT 'pending', -- pending, posted, failed
  posted_at DATETIME,
  error TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);
