import { useState, useEffect, type FormEvent, useRef } from "react";
import Modal from "../Modal";
import { supabase } from "../../lib/supabase";
import { uploadAvatar, deleteAvatar, getPublicAvatarUrl, isSupabaseStorageUrl } from "../../lib/storage";
import type { Category } from "../../types";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  collaboratorId: number | null;
};

export default function EditCollaboratorModal({
  isOpen,
  onClose,
  onSuccess,
  collaboratorId,
}: Props) {
  const [formData, setFormData] = useState({
    fullName: "",
    avatarUrl: "",
    role: "",
    categoryIds: [] as number[],
  });
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [originalAvatarUrl, setOriginalAvatarUrl] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Cargar datos del colaborador y categorías al abrir el modal
  useEffect(() => {
    if (isOpen && collaboratorId) {
      loadCategories();
      loadCollaboratorData();
    }
  }, [isOpen, collaboratorId]);

  const loadCategories = async () => {
    try {
      const { data, error } = await supabase
        .from("categories")
        .select("*")
        .order("name", { ascending: true });

      if (error) {
        console.error("Error al cargar categorías:", error);
        return;
      }

      if (data && Array.isArray(data)) {
        const mappedCategories: Category[] = data.map(
          (cat: {
            id: number;
            name: string;
            description: string | null;
            emoji: string | null;
          }) => ({
            id: cat.id,
            name: cat.name,
            description: cat.description || undefined,
            emoji: cat.emoji || undefined,
          })
        );
        setCategories(mappedCategories);
      }
    } catch (error) {
      console.error("Error inesperado al cargar categorías:", error);
    }
  };

  const loadCollaboratorData = async () => {
    if (!collaboratorId) return;

    try {
      setIsLoadingData(true);

      // Cargar datos del colaborador
      const { data: collaborator, error: collaboratorError } = await supabase
        .from("collaborators")
        .select("*")
        .eq("id", collaboratorId)
        .single();

      if (collaboratorError || !collaborator) {
        setError("Error al cargar datos del colaborador");
        return;
      }

      // Cargar categorías asociadas
      const { data: categoryRelations, error: relationError } = await supabase
        .from("category_collaborators")
        .select("category_id")
        .eq("collaborator_id", collaboratorId);

      if (relationError) {
        console.error("Error al cargar categorías asociadas:", relationError);
      }

      const collaboratorData = collaborator as {
        id: number;
        full_name: string;
        avatar_url: string;
        role: string | null;
      };

      const avatarUrl = collaboratorData.avatar_url;
      setFormData({
        fullName: collaboratorData.full_name,
        avatarUrl: avatarUrl,
        role: collaboratorData.role || "",
        categoryIds:
          categoryRelations?.map(
            (r: { category_id: number }) => r.category_id
          ) || [],
      });
      setOriginalAvatarUrl(avatarUrl);
      // Si es una URL de Supabase Storage, mostrar preview
      if (isSupabaseStorageUrl(avatarUrl)) {
        setPreviewUrl(avatarUrl);
      }
    } catch (error) {
      console.error("Error inesperado:", error);
      setError("Error al cargar datos");
    } finally {
      setIsLoadingData(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      // Crear preview local
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
      // Limpiar URL manual si había una
      setFormData({ ...formData, avatarUrl: "" });
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!collaboratorId) return;

    setError(null);
    setIsLoading(true);

    try {
      // Validaciones
      if (!formData.fullName.trim()) {
        setError("El nombre completo es obligatorio");
        setIsLoading(false);
        return;
      }

      let avatarUrl = formData.avatarUrl.trim();

      // Si hay un archivo seleccionado, subirlo primero
      if (selectedFile) {
        setIsUploading(true);
        try {
          // Eliminar imagen anterior si era de Supabase Storage
          if (originalAvatarUrl && isSupabaseStorageUrl(originalAvatarUrl)) {
            await deleteAvatar(originalAvatarUrl);
          }
          avatarUrl = await uploadAvatar(selectedFile, collaboratorId);
        } catch (uploadError: any) {
          setError(uploadError.message || "Error al subir la imagen");
          setIsLoading(false);
          setIsUploading(false);
          return;
        } finally {
          setIsUploading(false);
        }
      }

      if (!avatarUrl) {
        setError("Debes subir una imagen o proporcionar una URL");
        setIsLoading(false);
        return;
      }

      // Actualizar colaborador en Supabase
      const collaboratorData = {
        full_name: formData.fullName.trim(),
        avatar_url: avatarUrl,
        role: formData.role.trim() || null,
      };

      const { error: updateError } = await supabase
        .from("collaborators")
        // @ts-expect-error - Supabase types will be generated after schema is applied
        .update(collaboratorData)
        .eq("id", collaboratorId);

      if (updateError) {
        setError(updateError.message || "Error al actualizar el colaborador");
        setIsLoading(false);
        return;
      }

      // Actualizar relaciones con categorías
      // 1. Eliminar relaciones existentes
      await supabase
        .from("category_collaborators")
        .delete()
        .eq("collaborator_id", collaboratorId);

      // 2. Crear nuevas relaciones
      if (formData.categoryIds.length > 0) {
        const categoryCollaborators = formData.categoryIds.map(
          (categoryId) => ({
            category_id: categoryId,
            collaborator_id: collaboratorId,
          })
        );

        const { error: relationError } = await supabase
          .from("category_collaborators")
          // @ts-expect-error - Supabase types will be generated after schema is applied
          .insert(categoryCollaborators);

        if (relationError) {
          console.error("Error al actualizar categorías:", relationError);
        }
      }

      onSuccess();
      onClose();
    } catch (err) {
      setError("Error inesperado al actualizar el colaborador");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    if (!isLoading) {
      setFormData({ fullName: "", avatarUrl: "", role: "", categoryIds: [] });
      setSelectedFile(null);
      setPreviewUrl(null);
      setOriginalAvatarUrl("");
      setError(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      onClose();
    }
  };

  const toggleCategory = (categoryId: number) => {
    setFormData((prev) => ({
      ...prev,
      categoryIds: prev.categoryIds.includes(categoryId)
        ? prev.categoryIds.filter((id) => id !== categoryId)
        : [...prev.categoryIds, categoryId],
    }));
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Editar Colaborador">
      {isLoadingData ? (
        <div className="py-8 text-center">
          <p className="text-white/60 text-sm">Cargando datos...</p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="edit-collaborator-full-name"
              className="block text-white/80 text-sm font-medium mb-2"
            >
              Nombre Completo <span className="text-red-400">*</span>
            </label>
            <input
              id="edit-collaborator-full-name"
              type="text"
              value={formData.fullName}
              onChange={(e) =>
                setFormData({ ...formData, fullName: e.target.value })
              }
              placeholder="Juan Pérez, María García, etc."
              className="w-full bg-white/5 border border-white/15 rounded-lg px-4 py-2 text-white placeholder:text-white/40 focus:outline-none focus:border-[#FFD080] transition"
              required
              disabled={isLoading}
            />
          </div>

          <div>
            <label
              htmlFor="edit-collaborator-avatar"
              className="block text-white/80 text-sm font-medium mb-2"
            >
              Imagen del Avatar <span className="text-red-400">*</span>
            </label>
            
            {/* Input de archivo */}
            <input
              ref={fileInputRef}
              id="edit-collaborator-avatar"
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
              disabled={isLoading || isUploading}
            />
            
            <div className="space-y-3">
              {/* Botón para seleccionar archivo */}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isLoading || isUploading}
                className="w-full px-4 py-2 rounded-lg border border-white/15 text-white/70 hover:text-white hover:bg-white/10 transition disabled:opacity-50 disabled:cursor-not-allowed text-sm"
              >
                {selectedFile ? "Cambiar imagen" : "Seleccionar nueva imagen"}
              </button>

              {/* Vista previa de imagen subida */}
              {previewUrl && (
                <div className="mt-2">
                  <p className="text-white/60 text-xs mb-2">Vista previa:</p>
                  <img
                    src={previewUrl}
                    alt="Vista previa"
                    className="size-20 rounded-full object-cover border border-white/20"
                  />
                </div>
              )}

              {/* Vista previa de URL actual o manual (si no hay archivo seleccionado) */}
              {!selectedFile && formData.avatarUrl && (
                <div className="mt-2">
                  <p className="text-white/60 text-xs mb-2">
                    {isSupabaseStorageUrl(formData.avatarUrl) ? "Imagen actual:" : "Vista previa (URL):"}
                  </p>
                  <img
                    src={formData.avatarUrl}
                    alt="Vista previa"
                    className="size-20 rounded-full object-cover border border-white/20"
                    onError={(e) => {
                      e.currentTarget.style.display = "none";
                    }}
                  />
                </div>
              )}

              {/* Input alternativo para URL (opcional) */}
              {!selectedFile && (
                <div>
                  <p className="text-white/50 text-xs mb-2">O ingresa una URL:</p>
                  <input
                    type="url"
                    value={formData.avatarUrl}
                    onChange={(e) =>
                      setFormData({ ...formData, avatarUrl: e.target.value })
                    }
                    placeholder="https://ejemplo.com/avatar.jpg"
                    className="w-full bg-white/5 border border-white/15 rounded-lg px-4 py-2 text-white placeholder:text-white/40 focus:outline-none focus:border-[#FFD080] transition text-sm"
                    disabled={isLoading || isUploading}
                  />
                </div>
              )}

              {selectedFile && (
                <p className="text-white/50 text-xs">
                  Archivo seleccionado: {selectedFile.name} ({(selectedFile.size / 1024).toFixed(1)} KB)
                </p>
              )}
            </div>
          </div>

          <div>
            <label
              htmlFor="edit-collaborator-role"
              className="block text-white/80 text-sm font-medium mb-2"
            >
              Rol
            </label>
            <input
              id="edit-collaborator-role"
              type="text"
              value={formData.role}
              onChange={(e) =>
                setFormData({ ...formData, role: e.target.value })
              }
              placeholder="Desarrollador, Diseñador, etc."
              className="w-full bg-white/5 border border-white/15 rounded-lg px-4 py-2 text-white placeholder:text-white/40 focus:outline-none focus:border-[#FFD080] transition"
              disabled={isLoading}
            />
          </div>

          <div>
            <label className="block text-white/80 text-sm font-medium mb-2">
              Categorías
            </label>
            <div className="max-h-40 overflow-y-auto space-y-2 p-3 rounded-lg bg-white/5 border border-white/10">
              {categories.length > 0 ? (
                categories.map((category) => (
                  <label
                    key={category.id}
                    className="flex items-center gap-2 cursor-pointer hover:bg-white/5 p-2 rounded"
                  >
                    <input
                      type="checkbox"
                      checked={formData.categoryIds.includes(category.id)}
                      onChange={() => toggleCategory(category.id)}
                      disabled={isLoading}
                      className="rounded border-white/20 text-[#FFD080] focus:ring-[#FFD080]"
                    />
                    <span className="text-white text-sm">
                      {category.emoji && (
                        <span className="mr-1">{category.emoji}</span>
                      )}
                      {category.name}
                    </span>
                  </label>
                ))
              ) : (
                <p className="text-white/50 text-xs">
                  No hay categorías disponibles
                </p>
              )}
            </div>
            <p className="mt-1 text-white/50 text-xs">
              Selecciona las categorías en las que este colaborador puede ser
              nominado
            </p>
          </div>

          {error && (
            <div className="p-3 rounded-lg bg-red-500/20 border border-red-500/30">
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}

          <div className="flex items-center gap-3 pt-2">
            <button
              type="button"
              onClick={handleClose}
              disabled={isLoading}
              className="flex-1 px-4 py-2 rounded-lg border border-white/20 text-white/70 hover:text-white hover:bg-white/10 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isLoading || isUploading}
              className="flex-1 px-4 py-2 rounded-lg bg-linear-to-r from-[#FFD080] to-[#D4A574] text-[#080808] font-semibold hover:opacity-90 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isUploading ? "Subiendo imagen..." : isLoading ? "Guardando..." : "Guardar Cambios"}
            </button>
          </div>
        </form>
      )}
    </Modal>
  );
}
