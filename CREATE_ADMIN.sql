-- METHOD 1: Register through the website with username "admin" and password "Boyaca1730!"
-- Then run this SQL to make that user an admin:

UPDATE users 
SET is_admin = true, balance = 10000
WHERE username = 'admin';

-- METHOD 2: If you already have a user, make them admin:
-- UPDATE users SET is_admin = true, balance = 10000 WHERE username = 'yourusername';
