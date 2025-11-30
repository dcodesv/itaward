# Configuración de Supabase

Esta aplicación utiliza Supabase como backend para almacenar toda la información.

## Paso 1: Crear proyecto en Supabase

1. Ve a [https://supabase.com](https://supabase.com)
2. Crea una cuenta o inicia sesión
3. Crea un nuevo proyecto
4. Anota la URL del proyecto y las API keys

## Paso 2: Configurar variables de entorno

Crea un archivo `.env.local` en la raíz del proyecto con el siguiente contenido:

```env
VITE_SUPABASE_URL=tu-url-de-supabase
VITE_SUPABASE_ANON_KEY=tu-anon-key-de-supabase
```

### Cómo obtener las credenciales:

1. Ve a tu proyecto en Supabase Dashboard
2. Ve a **Settings** → **API**
3. Copia:
   - **Project URL** → `VITE_SUPABASE_URL`
   - **anon/public key** → `VITE_SUPABASE_ANON_KEY`

## Paso 3: Configurar Storage para imágenes de avatares

1. Ve a tu proyecto en Supabase Dashboard
2. Ve a **Storage** en el menú lateral
3. Haz clic en **New bucket**
4. Crea un bucket con el nombre: `avatars`
5. Configura el bucket como **Public** (para que las imágenes sean accesibles públicamente)
6. En **Policies**, asegúrate de tener políticas que permitan:
   - **INSERT**: Para que los usuarios puedan subir imágenes
   - **SELECT**: Para que todos puedan ver las imágenes (público)
   - **UPDATE**: Para que los usuarios puedan actualizar imágenes
   - **DELETE**: Para que los usuarios puedan eliminar imágenes

### Políticas recomendadas para el bucket `avatars`:

```sql
-- Permitir lectura pública
CREATE POLICY "Public Access" ON storage.objects
FOR SELECT USING (bucket_id = 'avatars');

-- Permitir inserción (ajusta según tus necesidades de autenticación)
CREATE POLICY "Authenticated users can upload" ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'avatars' AND auth.role() = 'authenticated');

-- Permitir actualización
CREATE POLICY "Authenticated users can update" ON storage.objects
FOR UPDATE USING (bucket_id = 'avatars' AND auth.role() = 'authenticated');

-- Permitir eliminación
CREATE POLICY "Authenticated users can delete" ON storage.objects
FOR DELETE USING (bucket_id = 'avatars' AND auth.role() = 'authenticated');
```

## Paso 4: Estructura de la base de datos

Las tablas que necesitarás crear en Supabase (se crearán en siguientes pasos):

- `categories` - Categorías de votación
- `collaborators` - Colaboradores participantes
- `voters` - Votantes/empleados
- `nominations` - Nominaciones de votantes
- `admin_users` - Usuarios administradores

## Archivos de configuración

- `src/lib/supabase.ts` - Cliente de Supabase configurado
- `.env.local` - Variables de entorno (NO commitear)

## Notas

- El archivo `.env.local` está en `.gitignore` y no se subirá al repositorio
- Nunca expongas el `service_role_key` en el cliente
- La configuración está lista para usar, solo falta crear las tablas y migrar los datos
