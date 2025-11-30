import { useState, type FormEvent } from "react";
import Modal from "../Modal";
import { supabase } from "../../lib/supabase";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
};

export default function CreateCategoryModal({
  isOpen,
  onClose,
  onSuccess,
}: Props) {
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    emoji: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      // Validaciones
      if (!formData.name.trim()) {
        setError("El nombre es obligatorio");
        setIsLoading(false);
        return;
      }

      // Insertar en Supabase (el ID se genera automáticamente)
      const categoryData = {
        name: formData.name.trim(),
        description: formData.description.trim() || null,
        emoji: formData.emoji.trim() || null,
      };

      const { error: insertError } = await supabase
        .from("categories")
        // @ts-expect-error - Supabase types will be generated after schema is applied
        .insert(categoryData);

      if (insertError) {
        setError(insertError.message || "Error al crear la categoría");
        setIsLoading(false);
        return;
      }

      // Limpiar formulario y cerrar
      setFormData({ name: "", description: "", emoji: "" });
      onSuccess();
      onClose();
    } catch (err) {
      setError("Error inesperado al crear la categoría");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    if (!isLoading) {
      setFormData({ name: "", description: "", emoji: "" });
      setError(null);
      onClose();
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Nueva Categoría">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label
            htmlFor="category-name"
            className="block text-white/80 text-sm font-medium mb-2"
          >
            Nombre <span className="text-red-400">*</span>
          </label>
          <input
            id="category-name"
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
            htmlFor="category-description"
            className="block text-white/80 text-sm font-medium mb-2"
          >
            Descripción
          </label>
          <textarea
            id="category-description"
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
            htmlFor="category-emoji"
            className="block text-white/80 text-sm font-medium mb-2"
          >
            Emoji
          </label>
          <input
            id="category-emoji"
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
            {isLoading ? "Creando..." : "Crear Categoría"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
