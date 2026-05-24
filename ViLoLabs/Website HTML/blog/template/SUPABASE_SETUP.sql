-- ViLo Pulse — Blog Posts Registry
-- Run this ONCE in Supabase SQL Editor (Dashboard → SQL Editor → New Query)
-- This table registers every published blog post for sitemap + SEO tracking.

CREATE TABLE IF NOT EXISTS blog_posts (
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  slug         text        UNIQUE NOT NULL,          -- URL slug e.g. petrol-prices-india-2026
  title        text        NOT NULL,                  -- Full post title
  description  text,                                  -- Meta description (150-160 chars)
  category     text,                                  -- e.g. 'india', 'money', 'tech'
  published_at timestamptz DEFAULT now(),             -- When post went live
  created_at   timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE blog_posts ENABLE ROW LEVEL SECURITY;

-- Anyone can read (for sitemap + public listing)
CREATE POLICY "public_read_blog_posts"
  ON blog_posts FOR SELECT USING (true);

-- Anyone can insert (fire-and-forget on page load — deduped by UNIQUE slug)
CREATE POLICY "public_insert_blog_posts"
  ON blog_posts FOR INSERT WITH CHECK (true);

-- NO DELETE for anon (same pattern as worksheets — append-only log)

-- Verify:
SELECT * FROM blog_posts LIMIT 5;
