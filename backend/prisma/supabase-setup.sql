-- Enable the pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Users table (already managed by Supabase Auth, but we'll create a view for our app)
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  password TEXT NOT NULL,
  name TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Links table with vector column
CREATE TABLE IF NOT EXISTS public.links (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  url TEXT NOT NULL,
  title TEXT,
  image TEXT,
  domain TEXT,
  summary TEXT,
  embedding vector(1536),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE
);

-- Tags table
CREATE TABLE IF NOT EXISTS public.tags (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Link to Tag many-to-many relationship table
CREATE TABLE IF NOT EXISTS public.link_to_tag (
  link_id UUID NOT NULL REFERENCES public.links(id) ON DELETE CASCADE,
  tag_id UUID NOT NULL REFERENCES public.tags(id) ON DELETE CASCADE,
  PRIMARY KEY (link_id, tag_id)
);

-- Create an index for faster vector similarity searches
CREATE INDEX IF NOT EXISTS links_embedding_idx ON public.links USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

-- Insert default tags
INSERT INTO public.tags (name) VALUES 
  ('Image'),
  ('Video'),
  ('News'),
  ('Blog'),
  ('Music'),
  ('Social Media Post')
ON CONFLICT (name) DO NOTHING;

-- Set up RLS (Row Level Security)
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.links ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.link_to_tag ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own data" ON public.users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own data" ON public.users
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can view their own links" ON public.links
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own links" ON public.links
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own links" ON public.links
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own links" ON public.links
  FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Tags are viewable by all users" ON public.tags
  FOR SELECT USING (true);

CREATE POLICY "Link to tag relations are viewable by link owners" ON public.link_to_tag
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.links 
      WHERE links.id = link_to_tag.link_id AND links.user_id = auth.uid()
    )
  );

CREATE POLICY "Link to tag relations can be inserted by link owners" ON public.link_to_tag
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.links 
      WHERE links.id = link_to_tag.link_id AND links.user_id = auth.uid()
    )
  );

CREATE POLICY "Link to tag relations can be deleted by link owners" ON public.link_to_tag
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.links 
      WHERE links.id = link_to_tag.link_id AND links.user_id = auth.uid()
    )
  );

-- Function to search for similar links based on vector similarity
CREATE OR REPLACE FUNCTION match_links(
  query_embedding vector(1536),
  match_threshold float,
  match_count int,
  user_id uuid
)
RETURNS TABLE (
  id uuid,
  url text,
  title text,
  image text,
  domain text,
  summary text,
  similarity float
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    links.id,
    links.url,
    links.title,
    links.image,
    links.domain,
    links.summary,
    1 - (links.embedding <=> query_embedding) as similarity
  FROM links
  WHERE links.user_id = match_links.user_id
    AND links.embedding IS NOT NULL
    AND 1 - (links.embedding <=> query_embedding) > match_threshold
  ORDER BY similarity DESC
  LIMIT match_count;
END;
$$; 