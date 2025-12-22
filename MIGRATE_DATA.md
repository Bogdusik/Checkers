# Миграция данных из локальной БД в Supabase

## Вариант 1: Автоматический скрипт (рекомендуется)

Я создал скрипт `migrate-database.sh`, который автоматически экспортирует данные из локальной БД и импортирует их в Supabase.

### Шаг 1: Убедитесь, что локальная БД запущена

```bash
# Проверьте, что PostgreSQL запущен
psql -U bogdusikk -d chess_db -c "SELECT COUNT(*) FROM \"User\";"
```

### Шаг 2: Запустите скрипт миграции

```bash
./migrate-database.sh
```

Скрипт:
1. Экспортирует все данные из локальной БД
2. Импортирует их в Supabase
3. Удалит временный файл после успешного импорта

---

## Вариант 2: Ручная миграция

### Шаг 1: Экспорт данных из локальной БД

```bash
# Экспорт только данных (без схемы)
pg_dump -U bogdusikk -d chess_db --data-only --column-inserts > backup.sql
```

### Шаг 2: Импорт в Supabase

```bash
# Импорт данных (замените P9sn161616 на ваш пароль)
psql "postgresql://postgres.vcxbtbhfeiyzbylsyvpu:P9sn161616@aws-1-eu-central-1.pooler.supabase.com:5432/postgres" -f backup.sql
```

---

## Вариант 3: Через Prisma (если нужно перенести только схему)

Если вы хотите перенести только структуру БД (схему), используйте Prisma:

```bash
# 1. Обновите DATABASE_URL в .env на Supabase
# DATABASE_URL="postgresql://postgres.vcxbtbhfeiyzbylsyvpu:P9sn161616@aws-1-eu-central-1.pooler.supabase.com:5432/postgres"

# 2. Примените миграции
npx prisma db push
```

**Внимание:** `db push` создаст только структуру, но не перенесет данные!

---

## Что будет перенесено:

- ✅ Все пользователи (User)
- ✅ Статистика пользователей (UserStatistics)
- ✅ Игры (Game)
- ✅ Ходы (GameMove)

---

## Важно:

1. **Пароль**: В скрипте уже указан пароль `P9sn161616`. Если вы его меняли, обновите скрипт.

2. **Схема БД**: Убедитесь, что схема в Supabase уже создана (через `prisma db push` или `prisma migrate deploy`).

3. **Ошибки**: Если возникнут ошибки типа "table does not exist", сначала создайте схему:
   ```bash
   # Временно измените DATABASE_URL в .env на Supabase
   npx prisma db push
   ```

4. **Проверка**: После миграции проверьте данные:
   ```bash
   psql "postgresql://postgres.vcxbtbhfeiyzbylsyvpu:P9sn161616@aws-1-eu-central-1.pooler.supabase.com:5432/postgres" -c "SELECT COUNT(*) FROM \"User\";"
   ```

---

## Если что-то пошло не так:

1. Проверьте подключение к Supabase:
   ```bash
   psql "postgresql://postgres.vcxbtbhfeiyzbylsyvpu:P9sn161616@aws-1-eu-central-1.pooler.supabase.com:5432/postgres" -c "SELECT version();"
   ```

2. Убедитесь, что схема создана в Supabase (таблицы существуют).

3. Проверьте, что локальная БД доступна:
   ```bash
   psql -U bogdusikk -d chess_db -c "SELECT COUNT(*) FROM \"User\";"
   ```

