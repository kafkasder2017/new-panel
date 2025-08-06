-- Admin kullanıcı hesabının doğrulanması
-- Email: isahamid095@gmail.com kontrolü

SELECT 
  u.id as user_id,
  u.email,
  u.email_confirmed_at,
  u.created_at as auth_created_at,
  p.full_name,
  p.role,
  p.phone,
  p.is_active,
  p.created_at as profile_created_at
FROM auth.users u
LEFT JOIN public.user_profiles p ON u.id = p.id
WHERE u.email = 'isahamid095@gmail.com';

-- Tüm YONETICI rolündeki kullanıcıları listele
SELECT 
  u.email,
  p.full_name,
  p.role,
  p.is_active
FROM auth.users u
JOIN public.user_profiles p ON u.id = p.id
WHERE p.role = 'YONETICI'
ORDER BY p.created_at DESC;