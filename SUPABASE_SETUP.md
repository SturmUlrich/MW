# Настройка Supabase для хранения статистики

## Почему Supabase?

Netlify Functions не могут записывать файлы в файловую систему в production окружении. Для хранения статистики на сервере нужно использовать внешний сервис базы данных.

Supabase - это бесплатный open-source аналог Firebase с PostgreSQL базой данных. Бесплатный tier включает:
- 500 MB базы данных
- 2 GB bandwidth
- Достаточно для хранения статистики игры

## Шаги настройки

### 1. Создайте аккаунт Supabase

1. Перейдите на https://supabase.com
2. Зарегистрируйтесь (можно через GitHub)
3. Создайте новый проект

### 2. Создайте таблицу для статистики

В SQL Editor Supabase выполните следующий SQL:

```sql
-- Создаем таблицу для статистики игроков
CREATE TABLE stats (
  id BIGSERIAL PRIMARY KEY,
  player_name TEXT NOT NULL UNIQUE,
  total_correct INTEGER DEFAULT 0,
  total_incorrect INTEGER DEFAULT 0,
  total_games INTEGER DEFAULT 0,
  games JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Создаем индекс для быстрого поиска по имени
CREATE INDEX idx_player_name ON stats(player_name);

-- Включаем Row Level Security (RLS)
ALTER TABLE stats ENABLE ROW LEVEL SECURITY;

-- Создаем политику для чтения (все могут читать)
CREATE POLICY "Anyone can read stats" ON stats
  FOR SELECT USING (true);

-- Создаем политику для записи (все могут писать)
CREATE POLICY "Anyone can insert stats" ON stats
  FOR INSERT WITH CHECK (true);

-- Создаем политику для обновления (все могут обновлять)
CREATE POLICY "Anyone can update stats" ON stats
  FOR UPDATE USING (true);
```

### 3. Получите ключи API

1. В проекте Supabase перейдите в Settings → API
2. Скопируйте:
   - **Project URL** (SUPABASE_URL)
   - **anon public** key (SUPABASE_ANON_KEY)

### 4. Настройте переменные окружения в Netlify

1. В Netlify Dashboard перейдите в ваш сайт
2. Settings → Environment variables
3. Добавьте:
   - `SUPABASE_URL` = ваш Project URL
   - `SUPABASE_ANON_KEY` = ваш anon public key

### 5. Установите зависимость Supabase

Создайте файл `package.json` в корне проекта:

```json
{
  "name": "football-quiz",
  "version": "1.0.0",
  "dependencies": {
    "@supabase/supabase-js": "^2.38.0"
  }
}
```

Netlify автоматически установит зависимости при деплое.

### 6. Обновите функции

Раскомментируйте код в файлах:
- `netlify/functions/save-stats.js`
- `netlify/functions/get-stats.js`

Удалите временные решения и используйте код с Supabase.

## Альтернативные варианты

### Вариант 1: Airtable
- Простой в использовании
- Бесплатный tier: 1200 записей/база
- Требует API ключ

### Вариант 2: MongoDB Atlas
- Бесплатный tier: 512 MB
- Требует настройку подключения

### Вариант 3: Firebase Firestore
- Бесплатный tier: 1 GB storage
- Требует проект Firebase

## Рекомендация

Используйте **Supabase** - это самый простой и надежный вариант для данного проекта.

