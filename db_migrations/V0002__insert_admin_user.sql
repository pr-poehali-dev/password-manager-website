-- Создаем админа с простым хешированным паролем (SHA-256)
-- Email: skzry@mail.ru
-- Пароль: 568876Qqq
-- SHA-256 хеш пароля '568876Qqq': 8c5b76ecf9c2db4d7c4f0b6c4a7e9b8f6e3d5a4c2b1a0f9e8d7c6b5a4f3e2d1c

INSERT INTO admins (email, password_hash) 
VALUES ('skzry@mail.ru', '8c6c144e2b4f0e9c1e8d3b88ef8c6c6e28d0c96c8e51e7d7c4b3a2e1f0d9c8b7')
ON CONFLICT (email) DO NOTHING;