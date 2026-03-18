ALTER TABLE public.profiles 
  ADD COLUMN IF NOT EXISTS blocked boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS last_seen timestamp with time zone DEFAULT NULL;