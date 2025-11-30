import { useState, useEffect, type FormEvent, useRef } from "react";
import Modal from "../Modal";
import { supabase } from "../../lib/supabase";
import { uploadAvatar, getPublicAvatarUrl, isSupabaseStorageUrl } from "../../lib/storage";
import type { Category } from "../../types";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
};

export default function CreateCollaboratorModal({
  isOpen,
  onClose,
  onSuccess,
}: Props) {
  const [formData, setFormData] = useState({
    fullName: "",
    avatarUrl: "",
    role: "",
    categoryIds: [] as number[],
  });
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingCategories, setIsLoadingCategories] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Cargar categorías al abrir el modal
  useEffect(() => {
    if (isOpen) {
      loadCategories();
    }
  }, [isOpen]);

  const loadCategories = async () => {
    try {
      setIsLoadingCategories(true);
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
    } finally {
      setIsLoadingCategories(false);
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
          avatarUrl = await uploadAvatar(selectedFile);
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

      // Insertar colaborador en Supabase
      const collaboratorData = {
        full_name: formData.fullName.trim(),
        avatar_url: avatarUrl,
        role: formData.role.trim() || null,
      };

      const { data: newCollaborator, error: insertError } = await supabase
        .from("collaborators")
        // @ts-expect-error - Supabase types will be generated after schema is applied
        .insert(collaboratorData)
        .select()
        .single();

      if (insertError || !newCollaborator) {
        setError(insertError?.message || "Error al crear el colaborador");
        setIsLoading(false);
        return;
      }

      // Asociar con categorías seleccionadas
      if (formData.categoryIds.length > 0) {
        const categoryCollaborators = formData.categoryIds.map(
          (categoryId) => ({
            category_id: categoryId,
            collaborator_id: newCollaborator.id,
          })
        );

        const { error: relationError } = await supabase
          .from("category_collaborators")
          // @ts-expect-error - Supabase types will be generated after schema is applied
          .insert(categoryCollaborators);

        if (relationError) {
          console.error("Error al asociar categorías:", relationError);
          // No fallar la creación si solo falla la asociación
        }
      }

      // Limpiar formulario y cerrar
      setFormData({ fullName: "", avatarUrl: "", role: "", categoryIds: [] });
      setSelectedFile(null);
      setPreviewUrl(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      onSuccess();
      onClose();
    } catch (err) {
      setError("Error inesperado al crear el colaborador");
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
    <Modal isOpen={isOpen} onClose={handleClose} title="Nuevo Colaborador">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label
            htmlFor="collaborator-full-name"
            className="block text-white/80 text-sm font-medium mb-2"
          >
            Nombre Completo <span className="text-red-400">*</span>
          </label>
          <input
            id="collaborator-full-name"
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
            htmlFor="collaborator-avatar"
            className="block text-white/80 text-sm font-medium mb-2"
          >
            Imagen del Avatar <span className="text-red-400">*</span>
          </label>
          
          {/* Input de archivo */}
          <input
            ref={fileInputRef}
            id="collaborator-avatar"
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
              {selectedFile ? "Cambiar imagen" : "Seleccionar imagen"}
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

            {/* Vista previa de URL manual (si no hay archivo seleccionado) */}
            {!selectedFile && formData.avatarUrl && (
              <div className="mt-2">
                <p className="text-white/60 text-xs mb-2">Vista previa (URL):</p>
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
            htmlFor="collaborator-role"
            className="block text-white/80 text-sm font-medium mb-2"
          >
            Rol
          </label>
          <input
            id="collaborator-role"
            type="text"
            value={formData.role}
            onChange={(e) => setFormData({ ...formData, role: e.target.value })}
            placeholder="Desarrollador, Diseñador, etc."
            className="w-full bg-white/5 border border-white/15 rounded-lg px-4 py-2 text-white placeholder:text-white/40 focus:outline-none focus:border-[#FFD080] transition"
            disabled={isLoading}
          />
        </div>

        <div>
          <label className="block text-white/80 text-sm font-medium mb-2">
            Categorías
          </label>
          {isLoadingCategories ? (
            <p className="text-white/50 text-xs">Cargando categorías...</p>
          ) : (
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
          )}
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
            disabled={isLoading || isLoadingCategories || isUploading}
            className="flex-1 px-4 py-2 rounded-lg bg-linear-to-r from-[#FFD080] to-[#D4A574] text-[#080808] font-semibold hover:opacity-90 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isUploading ? "Subiendo imagen..." : isLoading ? "Creando..." : "Crear Colaborador"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
