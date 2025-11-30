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

## Paso 3: Estructura de la base de datos

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
