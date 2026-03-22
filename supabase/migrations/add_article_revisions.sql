-- Migration: add_article_revisions
-- Run this manually in the Supabase SQL Editor (Dashboard → SQL Editor → New query).

CREATE TABLE IF NOT EXISTS article_revisions (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  article_id uuid REFERENCES articles(id) ON DELETE CASCADE,
  title_zh text,
  title_en text,
  content_zh text,
  content_en text,
  edited_by text DEFAULT 'admin',
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_revisions_article
  ON article_revisions(article_id, created_at DESC);
