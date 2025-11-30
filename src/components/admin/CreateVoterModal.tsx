import { useState, type FormEvent } from "react";
import Modal from "../Modal";
import { supabase } from "../../lib/supabase";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
};

export default function CreateVoterModal({
  isOpen,
  onClose,
  onSuccess,
}: Props) {
  const [formData, setFormData] = useState({
    employeeCode: "",
    fullName: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      // Validaciones
      if (!formData.employeeCode.trim()) {
        setError("El código de empleado es obligatorio");
        setIsLoading(false);
        return;
      }

      if (!formData.fullName.trim()) {
        setError("El nombre completo es obligatorio");
        setIsLoading(false);
        return;
      }

      // Insertar en Supabase (el ID se genera automáticamente)
      const voterData = {
        employee_code: formData.employeeCode.trim().toUpperCase(),
        full_name: formData.fullName.trim(),
      };
      
      const { error: insertError } = await supabase
        .from("voters")
        // @ts-expect-error - Supabase types will be generated after schema is applied
        .insert(voterData);

      if (insertError) {
        if (insertError.code === "23505") {
          // Violación de constraint único
          setError("Ya existe un votante con ese código de empleado");
        } else {
          setError(insertError.message || "Error al crear el votante");
        }
        setIsLoading(false);
        return;
      }

      // Limpiar formulario y cerrar
      setFormData({ employeeCode: "", fullName: "" });
      onSuccess();
      onClose();
    } catch (err) {
      setError("Error inesperado al crear el votante");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    if (!isLoading) {
      setFormData({ employeeCode: "", fullName: "" });
      setError(null);
      onClose();
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Nuevo Votante">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label
            htmlFor="voter-employee-code"
            className="block text-white/80 text-sm font-medium mb-2"
          >
            Código de Empleado <span className="text-red-400">*</span>
          </label>
          <input
            id="voter-employee-code"
            type="text"
            value={formData.employeeCode}
            onChange={(e) =>
              setFormData({
                ...formData,
                employeeCode: e.target.value.toUpperCase(),
              })
            }
            placeholder="EMP001, EMP002, etc."
            className="w-full bg-white/5 border border-white/15 rounded-lg px-4 py-2 text-white placeholder:text-white/40 focus:outline-none focus:border-[#FFD080] transition font-mono"
            required
            disabled={isLoading}
          />
          <p className="mt-1 text-white/50 text-xs">
            Código único de empleado (se convertirá a mayúsculas)
          </p>
        </div>

        <div>
          <label
            htmlFor="voter-full-name"
            className="block text-white/80 text-sm font-medium mb-2"
          >
            Nombre Completo <span className="text-red-400">*</span>
          </label>
          <input
            id="voter-full-name"
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
            {isLoading ? "Creando..." : "Crear Votante"}
          </button>
        </div>
      </form>
    </Modal>
  );
}

