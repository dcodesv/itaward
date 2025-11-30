# Scripts de Base de Datos para Supabase

Este directorio contiene los scripts SQL necesarios para configurar la base de datos en Supabase.

## Archivos

- `schema.sql` - Script principal con todas las tablas, relaciones, índices y políticas RLS

## Cómo ejecutar el script

### Opción 1: Desde Supabase Dashboard (Recomendado)

1. Ve a tu proyecto en [Supabase Dashboard](https://app.supabase.com)
2. Navega a **SQL Editor** en el menú lateral
3. Crea una nueva query
4. Copia y pega el contenido completo de `schema.sql`
5. Haz clic en **Run** o presiona `Ctrl+Enter` (Windows) / `Cmd+Enter` (Mac)
6. Verifica que todas las tablas se hayan creado correctamente

### Opción 2: Usando Supabase CLI

Si tienes Supabase CLI instalado:

```bash
supabase db push
```

## Estructura de la Base de Datos

### Tablas principales

1. **categories** - Categorías de votación
   - `id` (TEXT, PK)
   - `name`, `description`, `emoji`
   - Timestamps automáticos

2. **collaborators** - Colaboradores participantes
   - `id` (TEXT, PK)
   - `full_name`, `avatar_url`, `role`
   - Timestamps automáticos

3. **category_collaborators** - Relación muchos a muchos
   - `category_id` + `collaborator_id` (PK compuesta)
   - Permite que un colaborador esté en múltiples categorías

4. **voters** - Votantes/Empleados
   - `id` (TEXT, PK)
   - `employee_code` (UNIQUE) - Código de empleado
   - `full_name`
   - Timestamps automáticos

5. **nominations** - Nominaciones/Votos
   - `id` (UUID, PK)
   - `voter_id`, `category_id`, `collaborator_id`
   - **Restricción UNIQUE**: Un votante solo puede votar 1 vez por categoría
   - Timestamps automáticos

6. **admin_users** - Usuarios administradores
   - `id` (UUID, PK)
   - `email` (UNIQUE)
   - `employee_code`, `full_name`
   - Timestamps automáticos

### Características

- ✅ Triggers automáticos para `updated_at`
- ✅ Índices optimizados para consultas frecuentes
- ✅ Row Level Security (RLS) habilitado con políticas básicas
- ✅ Foreign keys con cascada para integridad referencial
- ✅ Vistas útiles para estadísticas y reportes
- ✅ Comentarios en todas las tablas y columnas

### Vistas creadas

- `nominations_details` - Nominaciones con información completa
- `collaborator_category_stats` - Estadísticas de nominaciones por colaborador

## Notas importantes

1. **RLS (Row Level Security)**: Las políticas básicas están configuradas, pero deberás ajustarlas según tus necesidades de seguridad reales.

2. **Autenticación**: Las políticas de autenticación están como placeholders (`USING (true)`). Necesitarás ajustarlas cuando implementes la autenticación de Supabase.

3. **Datos iniciales**: El script NO inserta datos iniciales. Deberás insertarlos manualmente o desde la aplicación.

4. **Generación de tipos**: Después de crear las tablas, puedes generar los tipos TypeScript ejecutando:
   ```bash
   npx supabase gen types typescript --project-id YOUR_PROJECT_ID > src/types/supabase.ts
   ```

## Verificación

Después de ejecutar el script, verifica que:

1. Todas las tablas aparecen en la sección **Table Editor**
2. Las relaciones (Foreign Keys) están correctamente configuradas
3. Los índices están creados (en **Database** → **Indexes**)

## Próximos pasos

1. ✅ Ejecutar este script en Supabase
2. Generar tipos TypeScript automáticamente
3. Migrar datos mock a la base de datos
4. Actualizar stores para usar Supabase
5. Ajustar políticas RLS según necesidades de seguridad

