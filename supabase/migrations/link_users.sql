-- Link allowed_users to auth.users by email
UPDATE public.allowed_users
SET user_id = au.id
FROM auth.users au
WHERE public.allowed_users.email = au.email;
