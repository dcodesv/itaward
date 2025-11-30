import { supabase } from "./supabase";

const AVATARS_BUCKET = "avatars";

/**
 * Sube una imagen de avatar a Supabase Storage
 * @param file - Archivo de imagen a subir
 * @param collaboratorId - ID del colaborador (opcional, para edición)
 * @returns URL pública de la imagen subida
 */
export async function uploadAvatar(
  file: File,
  collaboratorId?: number
): Promise<string> {
  try {
    // Validar tipo de archivo
    if (!file.type.startsWith("image/")) {
      throw new Error("El archivo debe ser una imagen");
    }

    // Validar tamaño (máximo 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      throw new Error("La imagen no debe exceder 5MB");
    }

    // Generar nombre único para el archivo
    const fileExt = file.name.split(".").pop();
    const fileName = collaboratorId
      ? `${collaboratorId}-${Date.now()}.${fileExt}`
      : `temp-${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
    const filePath = `${fileName}`;

    // Subir archivo a Supabase Storage
    const { data, error } = await supabase.storage
      .from(AVATARS_BUCKET)
      .upload(filePath, file, {
        cacheControl: "3600",
        upsert: false,
      });

    if (error) {
      throw error;
    }

    if (!data) {
      throw new Error("Error al subir la imagen");
    }

    // Obtener URL pública
    const publicUrl = getPublicAvatarUrl(filePath);
    return publicUrl;
  } catch (error) {
    console.error("Error al subir avatar:", error);
    throw error;
  }
}

/**
 * Elimina una imagen de avatar de Supabase Storage
 * @param filePath - Ruta del archivo a eliminar
 */
export async function deleteAvatar(filePath: string): Promise<void> {
  try {
    // Extraer solo el nombre del archivo de la URL completa
    const fileName = filePath.split("/").pop() || filePath;

    const { error } = await supabase.storage
      .from(AVATARS_BUCKET)
      .remove([fileName]);

    if (error) {
      console.error("Error al eliminar avatar:", error);
      // No lanzar error, solo loguear
    }
  } catch (error) {
    console.error("Error inesperado al eliminar avatar:", error);
  }
}

/**
 * Obtiene la URL pública de una imagen de avatar
 * @param filePath - Ruta del archivo en el bucket o URL completa
 * @returns URL pública de la imagen
 */
export function getPublicAvatarUrl(filePath: string): string {
  // Si ya es una URL completa, retornarla
  if (filePath.startsWith("http")) {
    return filePath;
  }

  // Extraer solo el nombre del archivo
  const fileName = filePath.split("/").pop() || filePath;

  const { data } = supabase.storage
    .from(AVATARS_BUCKET)
    .getPublicUrl(fileName);

  return data.publicUrl;
}

/**
 * Normaliza una URL de avatar, asegurándose de que sea una URL válida
 * @param url - URL del avatar (puede ser de Supabase Storage o externa)
 * @returns URL normalizada
 */
export function normalizeAvatarUrl(url: string | null | undefined): string {
  if (!url) {
    return "https://via.placeholder.com/150?text=No+Image";
  }

  // Si ya es una URL completa, retornarla
  if (url.startsWith("http")) {
    return url;
  }

  // Si es solo un nombre de archivo, obtener la URL pública
  return getPublicAvatarUrl(url);
}

/**
 * Verifica si una URL es de Supabase Storage
 */
export function isSupabaseStorageUrl(url: string): boolean {
  return url.includes("supabase.co/storage/v1/object/public/avatars");
}

