ALTER TABLE users
  ADD COLUMN IF NOT EXISTS tier VARCHAR(10) NOT NULL DEFAULT 'free'
    CHECK (tier IN ('free', 'pro'));
