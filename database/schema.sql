-- Create database bois
CREATE DATABASE bois;

-- Connect to bois database
\c bois;

-- Create users
CREATE USER bois_public WITH PASSWORD 'public_password';
GRANT SELECT ON ALL TABLES IN SCHEMA public TO bois_public;

CREATE USER bois_admin WITH PASSWORD 'admin_password';
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO bois_admin;

-- Create tables
CREATE TABLE positions (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name          VARCHAR(255) NOT NULL,
  code          VARCHAR(50) UNIQUE,
  parent_id     UUID REFERENCES positions(id),
  level         INTEGER NOT NULL DEFAULT 0,
  description   TEXT,
  is_active     BOOLEAN DEFAULT TRUE,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE officers (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nrp           VARCHAR(20) UNIQUE NOT NULL,
  full_name     VARCHAR(255) NOT NULL,
  rank          VARCHAR(100) NOT NULL,
  photo_url     VARCHAR(500),
  status        VARCHAR(20) DEFAULT 'active'
                CHECK (status IN ('active', 'transferred', 'retired')),
  joined_at     DATE,
  notes         TEXT,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE assignments (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  officer_id    UUID NOT NULL REFERENCES officers(id),
  position_id   UUID NOT NULL REFERENCES positions(id),
  start_date    DATE NOT NULL,
  end_date      DATE,
  notes         TEXT,
  created_by    UUID REFERENCES users(id),
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE UNIQUE INDEX idx_one_active_per_position
  ON assignments(position_id)
  WHERE end_date IS NULL;

CREATE INDEX idx_assignments_position ON assignments(position_id);
CREATE INDEX idx_assignments_officer  ON assignments(officer_id);
CREATE INDEX idx_assignments_active   ON assignments(position_id)
  WHERE end_date IS NULL;

CREATE TABLE posts (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title         VARCHAR(500) NOT NULL,
  slug          VARCHAR(500) UNIQUE NOT NULL,
  content       TEXT NOT NULL,
  excerpt       TEXT,
  category      VARCHAR(100)
                CHECK (category IN ('latihan', 'operasi', 'upacara', 'umum')),
  cover_image   VARCHAR(500),
  status        VARCHAR(20) DEFAULT 'draft'
                CHECK (status IN ('draft', 'published', 'archived')),
  published_at  TIMESTAMPTZ,
  author_id     UUID REFERENCES users(id),
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_posts_status    ON posts(status);
CREATE INDEX idx_posts_category  ON posts(category);
CREATE INDEX idx_posts_published ON posts(published_at DESC);

CREATE TABLE media (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  filename      VARCHAR(255) NOT NULL,
  original_name VARCHAR(255),
  file_type     VARCHAR(20)
                CHECK (file_type IN ('image', 'video', 'document')),
  mime_type     VARCHAR(100),
  file_size     BIGINT,
  storage_path  VARCHAR(500) NOT NULL,
  public_url    VARCHAR(500),
  post_id       UUID REFERENCES posts(id),
  uploaded_by   UUID REFERENCES users(id),
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE users (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username      VARCHAR(100) UNIQUE NOT NULL,
  email         VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role          VARCHAR(50) DEFAULT 'editor'
                CHECK (role IN ('superadmin', 'admin', 'editor', 'viewer')),
  is_active     BOOLEAN DEFAULT TRUE,
  last_login_at TIMESTAMPTZ,
  failed_login_attempts INTEGER DEFAULT 0,
  locked_until  TIMESTAMPTZ,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE audit_logs (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id      UUID REFERENCES users(id),
  action        VARCHAR(50) NOT NULL,
  entity        VARCHAR(100) NOT NULL,
  entity_id     UUID,
  old_value     JSONB,
  new_value     JSONB,
  ip_address    INET,
  user_agent    TEXT,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_audit_actor    ON audit_logs(actor_id);
CREATE INDEX idx_audit_entity   ON audit_logs(entity, entity_id);
CREATE INDEX idx_audit_created  ON audit_logs(created_at DESC);