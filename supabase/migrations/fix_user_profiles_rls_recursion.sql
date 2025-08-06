-- Fix infinite recursion in user_profiles RLS policies
-- This migration removes circular references that cause infinite recursion

-- Drop existing problematic policies
DROP POLICY IF EXISTS "Admins can view all profiles" ON user_profiles;
DROP POLICY IF EXISTS "Admins can manage all profiles" ON user_profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON user_profiles;

-- Create new policies without circular references
-- Users can view their own profile
CREATE POLICY "Users can view own profile" ON user_profiles
    FOR SELECT USING (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "Users can update own profile" ON user_profiles
    FOR UPDATE USING (auth.uid() = id);

-- Admins can view all profiles (using kullanicilar table instead of user_profiles)
CREATE POLICY "Admins can view all profiles" ON user_profiles
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM kullanicilar k
            WHERE k.user_id = auth.uid() 
            AND k.rol IN ('ADMIN', 'SUPER_ADMIN', 'YONETICI')
        )
    );

-- Admins can manage all profiles (using kullanicilar table instead of user_profiles)
CREATE POLICY "Admins can manage all profiles" ON user_profiles
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM kullanicilar k
            WHERE k.user_id = auth.uid() 
            AND k.rol IN ('ADMIN', 'SUPER_ADMIN', 'YONETICI')
        )
    );

-- Allow authenticated users to insert their own profile
CREATE POLICY "Users can insert own profile" ON user_profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

-- Success message
DO $$
BEGIN
    RAISE NOTICE 'user_profiles RLS policies fixed - infinite recursion removed';
END $$;