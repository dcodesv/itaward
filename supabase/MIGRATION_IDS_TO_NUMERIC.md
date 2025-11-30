# Migración de IDs a Numéricos Autoincrementales

Este documento describe los cambios realizados para convertir todos los IDs de texto a numéricos autoincrementales (BIGSERIAL).

## Cambios en el Schema SQL

### Tablas actualizadas:

1. **categories**
   - `id`: `TEXT` → `BIGSERIAL PRIMARY KEY`
   - El ID ahora se genera automáticamente

2. **collaborators**
   - `id`: `TEXT` → `BIGSERIAL PRIMARY KEY`
   - El ID ahora se genera automáticamente

3. **voters**
   - `id`: `TEXT` → `BIGSERIAL PRIMARY KEY`
   - El ID ahora se genera automáticamente

4. **nominations**
   - `id`: `UUID` → `BIGSERIAL PRIMARY KEY`
   - `voter_id`: `TEXT` → `BIGINT`
   - `category_id`: `TEXT` → `BIGINT`
   - `collaborator_id`: `TEXT` → `BIGINT`

5. **category_collaborators**
   - `category_id`: `TEXT` → `BIGINT`
   - `collaborator_id`: `TEXT` → `BIGINT`

### Políticas RLS actualizadas

Se agregaron políticas de INSERT, UPDATE y DELETE para todas las tablas principales:
- categories
- collaborators
- category_collaborators
- voters
- nominations

Todas permiten operaciones completas para todos los usuarios (ajustar según necesidades de seguridad).

## Cambios en TypeScript

### Tipos actualizados:

```typescript
// Antes
export type Category = {
  id: string;
  ...
};

// Ahora
export type Category = {
  id: number;
  ...
};
```

Lo mismo aplica para `Collaborator` y `CategoryIdToCollaborators`.

### Componentes actualizados:

1. **CreateCategoryModal**
   - Removido campo `id` del formulario
   - El ID se genera automáticamente en la base de datos
   - Solo se requiere `name` (obligatorio), `description` y `emoji` (opcionales)

2. **CategoriesManagement**
   - Actualizado para manejar IDs numéricos desde Supabase

## Instrucciones de migración

### Si ya tienes datos en la base de datos:

⚠️ **ADVERTENCIA**: Si ya ejecutaste el schema anterior con datos, necesitarás:

1. **Hacer backup de tus datos**
2. **Eliminar las tablas existentes** o hacer una migración de datos
3. **Ejecutar el nuevo schema.sql**

### Para una instalación nueva:

1. Ejecuta el nuevo `schema.sql` completo en Supabase SQL Editor
2. Las tablas se crearán con IDs numéricos autoincrementales
3. Ya no necesitas especificar IDs al crear registros

## Notas importantes

- Los IDs ahora son numéricos, no strings
- No necesitas especificar el ID al crear categorías, colaboradores o votantes
- Las rutas que usan `categoryId` como parámetro seguirán funcionando, pero ahora esperarán números
- Asegúrate de actualizar todas las referencias de IDs de string a number en el código

## Próximos pasos

1. Actualizar rutas que usan categoryId (convertir de string a number)
2. Actualizar stores que usan IDs como strings
3. Migrar datos mock a la nueva estructura si es necesario

