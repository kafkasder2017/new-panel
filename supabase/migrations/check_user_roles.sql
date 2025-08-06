-- Check current user roles in kullanicilar table
SELECT id, kullanici_adi, email, rol, durum 
FROM kullanicilar 
WHERE email = 'isahamid095@gmail.com';

-- Check all user roles to see the pattern
SELECT DISTINCT rol FROM kullanicilar ORDER BY rol;