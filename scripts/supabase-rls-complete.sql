-- ====================================================
-- ПОЛНЫЙ SQL СКРИПТ ДЛЯ ВКЛЮЧЕНИЯ RLS В SUPABASE
-- ====================================================
-- Этот скрипт решает все 8 ошибок Security Advisor
-- ВАЖНО: Запустите этот скрипт в Supabase SQL Editor
-- ====================================================

-- ====================================================
-- ШАГ 1: Включаем RLS для всех таблиц
-- ====================================================

ALTER TABLE IF EXISTS "User" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS "UserStatistics" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS "Game" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS "GameMove" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS "GameInvite" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS "Friend" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS "GameMessage" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS "_prisma_migrations" ENABLE ROW LEVEL SECURITY;

-- ====================================================
-- ШАГ 2: Удаляем старые политики (если есть)
-- ====================================================

DROP POLICY IF EXISTS "Users can view own profile" ON "User";
DROP POLICY IF EXISTS "Users can update own profile" ON "User";
DROP POLICY IF EXISTS "Users can view own statistics" ON "UserStatistics";
DROP POLICY IF EXISTS "Users can update own statistics" ON "UserStatistics";
DROP POLICY IF EXISTS "Users can view own games" ON "Game";
DROP POLICY IF EXISTS "Users can create games" ON "Game";
DROP POLICY IF EXISTS "Users can update own games" ON "Game";
DROP POLICY IF EXISTS "Users can view moves in own games" ON "GameMove";
DROP POLICY IF EXISTS "Users can create moves in own games" ON "GameMove";

-- ====================================================
-- ШАГ 3: Создаем политики для service_role
-- ====================================================
-- Эти политики позволяют Prisma (использующему service_role)
-- работать с базой данных, обходя RLS

-- Таблица User
CREATE POLICY "Service role full access to User"
  ON "User"
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Таблица UserStatistics
CREATE POLICY "Service role full access to UserStatistics"
  ON "UserStatistics"
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Таблица Game
CREATE POLICY "Service role full access to Game"
  ON "Game"
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Таблица GameMove
CREATE POLICY "Service role full access to GameMove"
  ON "GameMove"
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Таблица GameInvite
CREATE POLICY "Service role full access to GameInvite"
  ON "GameInvite"
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Таблица Friend
CREATE POLICY "Service role full access to Friend"
  ON "Friend"
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Таблица GameMessage
CREATE POLICY "Service role full access to GameMessage"
  ON "GameMessage"
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Таблица _prisma_migrations (Prisma внутренняя таблица)
CREATE POLICY "Service role full access to _prisma_migrations"
  ON "_prisma_migrations"
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- ====================================================
-- ШАГ 4: Дополнительные политики для анонимных пользователей
-- ====================================================
-- Если вы хотите, чтобы анонимные пользователи не имели доступа,
-- эти политики можно оставить пустыми или удалить

-- Для таблицы User - анонимные пользователи не имеют доступа
CREATE POLICY "Anonymous no access to User"
  ON "User"
  FOR ALL
  TO anon
  USING (false)
  WITH CHECK (false);

-- Для остальных таблиц - аналогично
CREATE POLICY "Anonymous no access to UserStatistics"
  ON "UserStatistics"
  FOR ALL
  TO anon
  USING (false)
  WITH CHECK (false);

CREATE POLICY "Anonymous no access to Game"
  ON "Game"
  FOR ALL
  TO anon
  USING (false)
  WITH CHECK (false);

CREATE POLICY "Anonymous no access to GameMove"
  ON "GameMove"
  FOR ALL
  TO anon
  USING (false)
  WITH CHECK (false);

CREATE POLICY "Anonymous no access to GameInvite"
  ON "GameInvite"
  FOR ALL
  TO anon
  USING (false)
  WITH CHECK (false);

CREATE POLICY "Anonymous no access to Friend"
  ON "Friend"
  FOR ALL
  TO anon
  USING (false)
  WITH CHECK (false);

CREATE POLICY "Anonymous no access to GameMessage"
  ON "GameMessage"
  FOR ALL
  TO anon
  USING (false)
  WITH CHECK (false);

CREATE POLICY "Anonymous no access to _prisma_migrations"
  ON "_prisma_migrations"
  FOR ALL
  TO anon
  USING (false)
  WITH CHECK (false);

-- ====================================================
-- ГОТОВО!
-- ====================================================
-- После выполнения этого скрипта:
-- 1. RLS будет включен на всех таблицах
-- 2. Prisma (service_role) сможет работать нормально
-- 3. Анонимные пользователи не смогут получить доступ
-- 4. Все 8 ошибок Security Advisor будут исправлены
-- ====================================================

