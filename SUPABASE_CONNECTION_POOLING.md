# Supabase Connection Pooling Setup

## Проблема
Ошибка `MaxClientsInSessionMode: max clients reached` возникает когда приложение использует слишком много подключений к базе данных Supabase.

## Решение

### Для продакшена (Vercel):
Используйте **Connection Pooling URL** от Supabase вместо прямого подключения.

1. В Supabase Dashboard перейдите в **Settings → Database**
2. Найдите **Connection Pooling** секцию
3. Скопируйте **Connection string** (обычно заканчивается на `:6543`)
4. В Vercel добавьте эту строку в переменную окружения `DATABASE_URL`

### Формат Connection Pooling URL:
```
postgresql://postgres:[PASSWORD]@[HOST]:6543/postgres?pgbouncer=true
```

### Важно:
- Используйте порт **6543** (pooling) вместо **5432** (direct)
- Добавьте параметр `?pgbouncer=true` в connection string
- Это позволяет использовать до 200 одновременных подключений вместо 15

### Проверка:
После настройки ошибка `MaxClientsInSessionMode` должна исчезнуть.

