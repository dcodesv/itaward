-- =====================================================
-- Migración: Agregar campos de lotería a collaborators
-- =====================================================
-- Este script agrega los campos lottery_name y lottery_shout para el juego de lotería
-- Ejecútalo en el SQL Editor de Supabase

-- Agregar campos de lotería a la tabla collaborators
ALTER TABLE collaborators 
ADD COLUMN IF NOT EXISTS lottery_name TEXT,
ADD COLUMN IF NOT EXISTS lottery_shout TEXT;

-- Comentarios para documentación
COMMENT ON COLUMN collaborators.lottery_name IS 'Nombre descriptivo para el juego de lotería (ej: "The big boss", "El rapero del codigo")';
COMMENT ON COLUMN collaborators.lottery_shout IS 'Grito característico de la lotería con rima para este colaborador';

