-- Таблица админов
CREATE TABLE IF NOT EXISTS admins (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Таблица с базой номеров телефонов
CREATE TABLE IF NOT EXISTS phone_database (
    id SERIAL PRIMARY KEY,
    phone VARCHAR(50) NOT NULL,
    data JSONB NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Индекс для быстрого поиска по номеру
CREATE INDEX IF NOT EXISTS idx_phone_database_phone ON phone_database(phone);

-- Таблица логов поиска
CREATE TABLE IF NOT EXISTS search_logs (
    id SERIAL PRIMARY KEY,
    telegram_user_id BIGINT NOT NULL,
    telegram_username VARCHAR(255),
    phone_searched VARCHAR(50) NOT NULL,
    found BOOLEAN NOT NULL,
    searched_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Индекс для аналитики
CREATE INDEX IF NOT EXISTS idx_search_logs_user ON search_logs(telegram_user_id);
CREATE INDEX IF NOT EXISTS idx_search_logs_date ON search_logs(searched_at);