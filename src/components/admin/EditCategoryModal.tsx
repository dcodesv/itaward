import { useState, useEffect, type FormEvent } from "react";
import Modal from "../Modal";
import { supabase } from "../../lib/supabase";
import type { Category } from "../../types";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  category: Category | null;
};

export default function EditCategoryModal({
  isOpen,
  onClose,
  onSuccess,
  category,
}: Props) {
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    emoji: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Cargar datos de la categoría cuando se abre el modal
  useEffect(() => {
    if (isOpen && category) {
      setFormData({
        name: category.name,
        description: category.description || "",
        emoji: category.emoji || "",
      });
      setError(null);
    }
  }, [isOpen, category]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    if (!category) {
      setError("No se ha seleccionado una categoría para editar");
      setIsLoading(false);
      return;
    }

    try {
      // Validaciones
      if (!formData.name.trim()) {
        setError("El nombre es obligatorio");
        setIsLoading(false);
        return;
      }

      // Actualizar en Supabase
      const { error: updateError } = await supabase
        .from("categories")
        .update({
          name: formData.name.trim(),
          description: formData.description.trim() || null,
          emoji: formData.emoji.trim() || null,
        })
        .eq("id", category.id);

      if (updateError) {
        setError(updateError.message || "Error al actualizar la categoría");
        setIsLoading(false);
        return;
      }

      // Limpiar y cerrar
      onSuccess();
      onClose();
    } catch (err) {
      setError("Error inesperado al actualizar la categoría");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    if (!isLoading) {
      setError(null);
      onClose();
    }
  };

  if (!category) return null;

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title={`Editar ${category.name}`}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label
            htmlFor="edit-category-name"
            className="block text-white/80 text-sm font-medium mb-2"
          >
            Nombre <span className="text-red-400">*</span>
          </label>
          <input
            id="edit-category-name"
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="Creatividad, Tecnología, etc."
            className="w-full bg-white/5 border border-white/15 rounded-lg px-4 py-2 text-white placeholder:text-white/40 focus:outline-none focus:border-[#FFD080] transition"
            required
            disabled={isLoading}
          />
        </div>

        <div>
          <label
            htmlFor="edit-category-description"
            className="block text-white/80 text-sm font-medium mb-2"
          >
            Descripción
          </label>
          <textarea
            id="edit-category-description"
            value={formData.description}
            onChange={(e) =>
              setFormData({ ...formData, description: e.target.value })
            }
            placeholder="Descripción de la categoría..."
            rows={3}
            className="w-full bg-white/5 border border-white/15 rounded-lg px-4 py-2 text-white placeholder:text-white/40 focus:outline-none focus:border-[#FFD080] transition resize-none"
            disabled={isLoading}
          />
        </div>

        <div>
          <label
            htmlFor="edit-category-emoji"
            className="block text-white/80 text-sm font-medium mb-2"
          >
            Emoji
          </label>
          <input
            id="edit-category-emoji"
            type="text"
            value={formData.emoji}
            onChange={(e) =>
              setFormData({ ...formData, emoji: e.target.value })
            }
            placeholder="🎨, 💻, ✨, etc."
            maxLength={2}
            className="w-full bg-white/5 border border-white/15 rounded-lg px-4 py-2 text-white placeholder:text-white/40 focus:outline-none focus:border-[#FFD080] transition text-2xl text-center"
            disabled={isLoading}
          />
          <p className="mt-1 text-white/50 text-xs">
            Emoji asociado a la categoría (opcional)
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
            disabled={isLoading}
            className="flex-1 px-4 py-2 rounded-lg bg-linear-to-r from-[#FFD080] to-[#D4A574] text-[#080808] font-semibold hover:opacity-90 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? "Guardando..." : "Guardar Cambios"}
          </button>
        </div>
      </form>
    </Modal>
  );
}

