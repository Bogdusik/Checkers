-- SQL скрипт для включения Row Level Security (RLS) в Supabase
-- ВАЖНО: Этот скрипт нужно запустить вручную через Supabase SQL Editor

-- 1. Включаем RLS для всех таблиц
ALTER TABLE "User" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "UserStatistics" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Game" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "GameMove" ENABLE ROW LEVEL SECURITY;

-- 2. Создаем политики для таблицы User
-- Пользователи могут видеть только свои данные
CREATE POLICY "Users can view own profile"
  ON "User" FOR SELECT
  USING (auth.uid()::text = id);

-- Пользователи могут обновлять только свои данные
CREATE POLICY "Users can update own profile"
  ON "User" FOR UPDATE
  USING (auth.uid()::text = id);

-- 3. Создаем политики для UserStatistics
-- Пользователи могут видеть только свою статистику
CREATE POLICY "Users can view own statistics"
  ON "UserStatistics" FOR SELECT
  USING (auth.uid()::text = "userId");

-- Пользователи могут обновлять только свою статистику
CREATE POLICY "Users can update own statistics"
  ON "UserStatistics" FOR UPDATE
  USING (auth.uid()::text = "userId");

-- 4. Создаем политики для Game
-- Пользователи могут видеть игры, в которых они участвуют
CREATE POLICY "Users can view own games"
  ON "Game" FOR SELECT
  USING (
    auth.uid()::text = "whitePlayerId" OR 
    auth.uid()::text = "blackPlayerId"
  );

-- Пользователи могут создавать игры
CREATE POLICY "Users can create games"
  ON "Game" FOR INSERT
  WITH CHECK (auth.uid()::text = "whitePlayerId" OR auth.uid()::text = "blackPlayerId");

-- Пользователи могут обновлять игры, в которых участвуют
CREATE POLICY "Users can update own games"
  ON "Game" FOR UPDATE
  USING (
    auth.uid()::text = "whitePlayerId" OR 
    auth.uid()::text = "blackPlayerId"
  );

-- 5. Создаем политики для GameMove
-- Пользователи могут видеть ходы в своих играх
CREATE POLICY "Users can view moves in own games"
  ON "GameMove" FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM "Game"
      WHERE "Game".id = "GameMove"."gameId"
      AND (
        "Game"."whitePlayerId" = auth.uid()::text OR
        "Game"."blackPlayerId" = auth.uid()::text
      )
    )
  );

-- Пользователи могут создавать ходы в своих играх
CREATE POLICY "Users can create moves in own games"
  ON "GameMove" FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM "Game"
      WHERE "Game".id = "GameMove"."gameId"
      AND (
        "Game"."whitePlayerId" = auth.uid()::text OR
        "Game"."blackPlayerId" = auth.uid()::text
      )
    )
  );

-- ВАЖНОЕ ПРИМЕЧАНИЕ:
-- Этот скрипт использует Supabase Auth (auth.uid()), но ваше приложение
-- использует JWT через Prisma. Для работы RLS с Prisma нужно:
-- 
-- 1. Либо использовать Supabase Auth вместо JWT
-- 2. Либо создать функцию, которая проверяет JWT токен и устанавливает
--    роль пользователя в PostgreSQL сессии
-- 3. Либо отключить RLS для таблиц, которые используются через Prisma
--
-- ТЕКУЩАЯ РЕКОМЕНДАЦИЯ: Оставить RLS отключенным, так как:
-- - Приложение уже защищено на уровне API
-- - Prisma не поддерживает RLS напрямую без дополнительной настройки
-- - Connection string защищен в переменных окружения

