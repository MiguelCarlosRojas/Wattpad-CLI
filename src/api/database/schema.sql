-- ==============================================================================
-- WATTPAD CLOUD - POSTGRESQL SCHEMA
-- ==============================================================================

CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(64) PRIMARY KEY,
    username VARCHAR(100) UNIQUE NOT NULL,
    name VARCHAR(150) NOT NULL,
    email VARCHAR(150) UNIQUE,
    avatar_url TEXT,
    description TEXT DEFAULT '',
    num_stories INT DEFAULT 0,
    num_following INT DEFAULT 0,
    num_followers INT DEFAULT 0,
    num_lists INT DEFAULT 0,
    votes_received INT DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS stories (
    id VARCHAR(32) PRIMARY KEY, -- e.g. "NOV-0001"
    user_id VARCHAR(64) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    wattpad_id VARCHAR(64),
    title VARCHAR(255) NOT NULL,
    description TEXT DEFAULT '',
    cover_url TEXT,
    genre VARCHAR(64) DEFAULT 'General',
    category VARCHAR(64) DEFAULT 'Novela',
    tags JSONB DEFAULT '[]'::jsonb,
    language VARCHAR(10) DEFAULT 'es',
    mature BOOLEAN DEFAULT FALSE,
    editor_preference VARCHAR(32) DEFAULT 'word',
    status VARCHAR(32) DEFAULT 'draft',
    cloud_storage_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS chapters (
    id VARCHAR(32) PRIMARY KEY, -- e.g. "CAP-0001"
    story_id VARCHAR(32) NOT NULL REFERENCES stories(id) ON DELETE CASCADE,
    user_id VARCHAR(64) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    wattpad_id VARCHAR(64),
    title VARCHAR(255) NOT NULL,
    chapter_number INT NOT NULL,
    content TEXT DEFAULT '',
    content_hash VARCHAR(64) NOT NULL,
    word_count INT DEFAULT 0,
    status VARCHAR(32) DEFAULT 'draft',
    external_doc_id VARCHAR(128),
    cloud_doc_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS chapter_versions (
    id SERIAL PRIMARY KEY,
    chapter_id VARCHAR(32) NOT NULL REFERENCES chapters(id) ON DELETE CASCADE,
    version_num INT NOT NULL,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    content_hash VARCHAR(64) NOT NULL,
    source VARCHAR(32) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS documents (
    id SERIAL PRIMARY KEY,
    story_id VARCHAR(32) NOT NULL REFERENCES stories(id) ON DELETE CASCADE,
    chapter_id VARCHAR(32) REFERENCES chapters(id) ON DELETE CASCADE,
    user_id VARCHAR(64) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    doc_type VARCHAR(32) NOT NULL, -- 'word', 'notepad', 'google'
    file_path TEXT NOT NULL,
    cloud_url TEXT,
    external_id VARCHAR(128),
    last_synced_hash VARCHAR(64) NOT NULL,
    last_synced_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS connections (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(64) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type VARCHAR(32) NOT NULL,
    name VARCHAR(128) NOT NULL,
    is_connected BOOLEAN DEFAULT FALSE,
    account_identifier VARCHAR(128),
    token_data TEXT,
    last_sync_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_user_conn UNIQUE (user_id, type)
);

CREATE TABLE IF NOT EXISTS sync_history (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(64) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    entity_type VARCHAR(32) NOT NULL,
    entity_id VARCHAR(32) NOT NULL,
    action VARCHAR(64) NOT NULL,
    status VARCHAR(32) NOT NULL,
    details TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS sessions (
    id VARCHAR(128) PRIMARY KEY,
    user_id VARCHAR(64) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token TEXT NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_stories_user ON stories(user_id);
CREATE INDEX IF NOT EXISTS idx_chapters_story ON chapters(story_id);
CREATE INDEX IF NOT EXISTS idx_chapter_versions_chap ON chapter_versions(chapter_id);
CREATE INDEX IF NOT EXISTS idx_sync_history_user ON sync_history(user_id);
