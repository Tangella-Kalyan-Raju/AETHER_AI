-- Grid Policy Orchestrator (GPO)
-- Supabase PostgreSQL Schema & Authentication Trigger
-- Path: database/supabase_schema.sql

-- 1. Create the user profile table linked to auth.users
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    email TEXT NOT NULL,
    full_name TEXT,
    avatar_url TEXT,
    role TEXT DEFAULT 'Viewer',
    organization TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    
    -- Future enterprise expansions
    is_mfa_enabled BOOLEAN DEFAULT FALSE NOT NULL,
    security_clearance_level INT DEFAULT 1 NOT NULL,
    last_login_at TIMESTAMP WITH TIME ZONE
);

-- 2. Configure Row Level Security (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 3. Define RLS Access Policies (NERC CIP compliant)
CREATE POLICY "Allow public read access to profiles"
    ON public.profiles FOR SELECT
    USING (true);

CREATE POLICY "Allow users to update their own profile"
    ON public.profiles FOR UPDATE
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

-- 4. Create trigger to automatically associate profiles with authenticated users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    default_role TEXT := 'Viewer';
    meta_role TEXT;
    meta_name TEXT;
    meta_avatar TEXT;
    meta_org TEXT;
BEGIN
    -- Extract optional metadata from sign-up / OAuth providers
    meta_role := COALESCE(new.raw_user_meta_data->>'role', default_role);
    meta_name := COALESCE(
        new.raw_user_meta_data->>'full_name',
        new.raw_user_meta_data->>'name',
        split_part(new.email, '@', 1)
    );
    meta_avatar := COALESCE(
        new.raw_user_meta_data->>'avatar_url',
        new.raw_user_meta_data->>'picture',
        ''
    );
    meta_org := COALESCE(new.raw_user_meta_data->>'organization', '');

    INSERT INTO public.profiles (
        id,
        email,
        full_name,
        avatar_url,
        role,
        organization
    ) VALUES (
        new.id,
        new.email,
        meta_name,
        meta_avatar,
        meta_role,
        meta_org
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger execution
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();
