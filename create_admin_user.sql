-- Admin kullanıcı hesabı oluşturma scripti
-- Email: isahamid095@gmail.com
-- Şifre: vadalov95
-- Rol: YONETICI (Admin)

-- 1. Auth kullanıcısını oluştur
INSERT INTO auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  recovery_sent_at,
  last_sign_in_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at,
  confirmation_token,
  email_change,
  email_change_token_new,
  recovery_token
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  gen_random_uuid(),
  'authenticated',
  'authenticated',
  'isahamid095@gmail.com',
  crypt('vadalov95', gen_salt('bf')),
  NOW(),
  NOW(),
  NOW(),
  '{"provider":"email","providers":["email"]}',
  '{}',
  NOW(),
  NOW(),
  '',
  '',
  '',
  ''
);

-- 2. User profile oluştur
INSERT INTO public.user_profiles (
  id,
  full_name,
  role,
  phone,
  avatar_url,
  is_active,
  created_at,
  updated_at
) VALUES (
  (SELECT id FROM auth.users WHERE email = 'isahamid095@gmail.com'),
  'İsa Hamid',
  'YONETICI',
  NULL,
  NULL,
  true,
  NOW(),
  NOW()
);

-- 3. Kullanıcının oluşturulduğunu doğrula
SELECT 
  u.id,
  u.email,
  u.email_confirmed_at,
  p.full_name,
  p.role,
  p.is_active,
  p.created_at
FROM auth.users u
JOIN public.user_profiles p ON u.id = p.id
WHERE u.email = 'isahamid095@gmail.com';