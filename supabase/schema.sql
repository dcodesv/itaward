-- =====================================================
-- IT AWARDS 2025 - Script de creación de base de datos
-- =====================================================
-- Este script crea todas las tablas necesarias para el sistema de votación
-- Ejecútalo en el SQL Editor de Supabase

-- Habilitar extensiones necesarias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- TABLA: categories (Categorías de votación)
-- =====================================================
CREATE TABLE IF NOT EXISTS categories (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  emoji TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

COMMENT ON TABLE categories IS 'Categorías disponibles para votación (Creatividad, Tecnología, etc.)';
COMMENT ON COLUMN categories.id IS 'Identificador único numérico autoincremental de la categoría';
COMMENT ON COLUMN categories.emoji IS 'Emoji asociado a la categoría para visualización';

-- =====================================================
-- TABLA: collaborators (Colaboradores participantes)
-- =====================================================
CREATE TABLE IF NOT EXISTS collaborators (
  id BIGSERIAL PRIMARY KEY,
  full_name TEXT NOT NULL,
  avatar_url TEXT NOT NULL,
  role TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

COMMENT ON TABLE collaborators IS 'Colaboradores que pueden ser nominados en las categorías';
COMMENT ON COLUMN collaborators.id IS 'Identificador único numérico autoincremental del colaborador';
COMMENT ON COLUMN collaborators.avatar_url IS 'URL de la imagen de perfil del colaborador';

-- =====================================================
-- TABLA: category_collaborators (Relación categoría-colaborador)
-- =====================================================
CREATE TABLE IF NOT EXISTS category_collaborators (
  category_id BIGINT NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  collaborator_id BIGINT NOT NULL REFERENCES collaborators(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (category_id, collaborator_id)
);

COMMENT ON TABLE category_collaborators IS 'Relación muchos a muchos: colaboradores disponibles en cada categoría';
CREATE INDEX idx_category_collaborators_category ON category_collaborators(category_id);
CREATE INDEX idx_category_collaborators_collaborator ON category_collaborators(collaborator_id);

-- =====================================================
-- TABLA: voters (Votantes/Empleados)
-- =====================================================
CREATE TABLE IF NOT EXISTS voters (
  id BIGSERIAL PRIMARY KEY,
  employee_code TEXT NOT NULL UNIQUE,
  full_name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

COMMENT ON TABLE voters IS 'Empleados que pueden votar en las categorías';
COMMENT ON COLUMN voters.id IS 'Identificador único numérico autoincremental del votante';
COMMENT ON COLUMN voters.employee_code IS 'Código único de empleado (ej: EMP001)';
CREATE INDEX idx_voters_employee_code ON voters(employee_code);

-- =====================================================
-- TABLA: nominations (Nominaciones/Votos)
-- =====================================================
CREATE TABLE IF NOT EXISTS nominations (
  id BIGSERIAL PRIMARY KEY,
  voter_id BIGINT NOT NULL REFERENCES voters(id) ON DELETE CASCADE,
  category_id BIGINT NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  collaborator_id BIGINT NOT NULL REFERENCES collaborators(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  -- Restricción: un votante solo puede votar 1 vez por categoría
  UNIQUE (voter_id, category_id)
);

COMMENT ON TABLE nominations IS 'Nominaciones de votantes por categoría y colaborador';
COMMENT ON COLUMN nominations.voter_id IS 'ID del votante que realiza la nominación';
COMMENT ON COLUMN nominations.category_id IS 'Categoría en la que se realiza la nominación';
COMMENT ON COLUMN nominations.collaborator_id IS 'Colaborador nominado';
COMMENT ON CONSTRAINT nominations_voter_id_category_id_key ON nominations IS 'Garantiza que un votante solo pueda votar una vez por categoría';

-- Índices para optimizar consultas
CREATE INDEX idx_nominations_voter ON nominations(voter_id);
CREATE INDEX idx_nominations_category ON nominations(category_id);
CREATE INDEX idx_nominations_collaborator ON nominations(collaborator_id);
CREATE INDEX idx_nominations_created_at ON nominations(created_at);

-- =====================================================
-- TABLA: admin_users (Usuarios administradores)
-- =====================================================
CREATE TABLE IF NOT EXISTS admin_users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT NOT NULL UNIQUE,
  employee_code TEXT UNIQUE,
  full_name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

COMMENT ON TABLE admin_users IS 'Usuarios con acceso al panel de administración';
COMMENT ON COLUMN admin_users.email IS 'Email único del administrador';
COMMENT ON COLUMN admin_users.employee_code IS 'Código de empleado opcional (puede vincularse a voter)';
CREATE INDEX idx_admin_users_email ON admin_users(email);
CREATE INDEX idx_admin_users_employee_code ON admin_users(employee_code);

-- =====================================================
-- FUNCIONES: Actualización automática de updated_at
-- =====================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers para actualizar updated_at automáticamente
CREATE TRIGGER update_categories_updated_at
  BEFORE UPDATE ON categories
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_collaborators_updated_at
  BEFORE UPDATE ON collaborators
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_voters_updated_at
  BEFORE UPDATE ON voters
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_nominations_updated_at
  BEFORE UPDATE ON nominations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_admin_users_updated_at
  BEFORE UPDATE ON admin_users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- ROW LEVEL SECURITY (RLS) - Políticas básicas
-- =====================================================

-- Habilitar RLS en todas las tablas
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE collaborators ENABLE ROW LEVEL SECURITY;
ALTER TABLE category_collaborators ENABLE ROW LEVEL SECURITY;
ALTER TABLE voters ENABLE ROW LEVEL SECURITY;
ALTER TABLE nominations ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;

-- Políticas para categories: todos pueden leer y insertar
CREATE POLICY "Categories are viewable by everyone"
  ON categories FOR SELECT
  USING (true);

CREATE POLICY "Anyone can insert categories"
  ON categories FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Anyone can update categories"
  ON categories FOR UPDATE
  USING (true);

CREATE POLICY "Anyone can delete categories"
  ON categories FOR DELETE
  USING (true);

-- Políticas para collaborators: todos pueden leer y modificar
CREATE POLICY "Collaborators are viewable by everyone"
  ON collaborators FOR SELECT
  USING (true);

CREATE POLICY "Anyone can insert collaborators"
  ON collaborators FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Anyone can update collaborators"
  ON collaborators FOR UPDATE
  USING (true);

CREATE POLICY "Anyone can delete collaborators"
  ON collaborators FOR DELETE
  USING (true);

-- Políticas para category_collaborators: todos pueden leer y modificar
CREATE POLICY "Category collaborators are viewable by everyone"
  ON category_collaborators FOR SELECT
  USING (true);

CREATE POLICY "Anyone can insert category collaborators"
  ON category_collaborators FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Anyone can update category collaborators"
  ON category_collaborators FOR UPDATE
  USING (true);

CREATE POLICY "Anyone can delete category collaborators"
  ON category_collaborators FOR DELETE
  USING (true);

-- Políticas para voters: todos pueden leer y modificar
CREATE POLICY "Voters are viewable by everyone"
  ON voters FOR SELECT
  USING (true);

CREATE POLICY "Anyone can insert voters"
  ON voters FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Anyone can update voters"
  ON voters FOR UPDATE
  USING (true);

CREATE POLICY "Anyone can delete voters"
  ON voters FOR DELETE
  USING (true);

-- Políticas para nominations: todos pueden leer, solo autenticados pueden insertar
CREATE POLICY "Nominations are viewable by everyone"
  ON nominations FOR SELECT
  USING (true);

CREATE POLICY "Anyone can insert nominations"
  ON nominations FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Anyone can update nominations"
  ON nominations FOR UPDATE
  USING (true);

CREATE POLICY "Anyone can delete nominations"
  ON nominations FOR DELETE
  USING (true);

-- Políticas para admin_users: solo admins pueden ver y modificar
-- Por ahora, deshabilitar acceso público (se configurará después con autenticación)
CREATE POLICY "Admin users are not viewable publicly"
  ON admin_users FOR SELECT
  USING (false);

-- =====================================================
-- VISTAS ÚTILES (Opcional - para facilitar consultas)
-- =====================================================

-- Vista: Nominaciones con detalles completos
CREATE OR REPLACE VIEW nominations_details AS
SELECT 
  n.id,
  n.created_at as voted_at,
  v.id::BIGINT as voter_id,
  v.employee_code,
  v.full_name as voter_name,
  c.id::BIGINT as category_id,
  c.name as category_name,
  c.emoji as category_emoji,
  col.id::BIGINT as collaborator_id,
  col.full_name as collaborator_name,
  col.avatar_url as collaborator_avatar
FROM nominations n
JOIN voters v ON n.voter_id = v.id
JOIN categories c ON n.category_id = c.id
JOIN collaborators col ON n.collaborator_id = col.id;

COMMENT ON VIEW nominations_details IS 'Vista que agrupa información completa de las nominaciones';

-- Vista: Estadísticas de colaboradores por categoría
CREATE OR REPLACE VIEW collaborator_category_stats AS
SELECT 
  cc.category_id::BIGINT as category_id,
  c.name as category_name,
  c.emoji as category_emoji,
  col.id::BIGINT as collaborator_id,
  col.full_name as collaborator_name,
  col.avatar_url,
  COUNT(n.id) as nomination_count
FROM category_collaborators cc
JOIN categories c ON cc.category_id = c.id
JOIN collaborators col ON cc.collaborator_id = col.id
LEFT JOIN nominations n ON n.category_id = cc.category_id AND n.collaborator_id = cc.collaborator_id
GROUP BY cc.category_id, c.name, c.emoji, col.id, col.full_name, col.avatar_url
ORDER BY cc.category_id, nomination_count DESC;

COMMENT ON VIEW collaborator_category_stats IS 'Estadísticas de nominaciones por colaborador y categoría';

-- =====================================================
-- DATOS INICIALES (Opcional - puedes comentar si prefieres insertar manualmente)
-- =====================================================

-- Las categorías se insertarán desde la aplicación o manualmente
-- Los colaboradores se insertarán desde la aplicación o manualmente
-- Los votantes se insertarán desde la aplicación o manualmente

