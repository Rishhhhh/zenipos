-- Delete admin@gmail.com account and all related records
-- Order: employee -> branch -> organization -> pos_displays -> auth user

-- 1. Delete employee record
DELETE FROM employees WHERE id = '0f7a0b34-b921-4da3-8b22-f327f88ad349';

-- 2. Delete branch
DELETE FROM branches WHERE id = 'f7c1193c-8989-4e6d-8142-ebfc4ddd10e5';

-- 3. Delete organization  
DELETE FROM organizations WHERE id = 'a147c6c8-b76d-4d8a-a9c4-b5ff24ba3876';

-- 4. Delete any pos_displays
DELETE FROM pos_displays WHERE linked_by_user_id = '8b871b4f-f56e-485a-aed8-247189c6329f';

-- 5. Delete auth user
DELETE FROM auth.users WHERE id = '8b871b4f-f56e-485a-aed8-247189c6329f';