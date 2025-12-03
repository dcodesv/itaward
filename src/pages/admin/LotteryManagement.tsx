import { useState, useEffect, useMemo } from "react";
import Swal from "sweetalert2";
import Icon from "../../components/Icon";
import { supabase } from "../../lib/supabase";
import type { Collaborator } from "../../types";
import Modal from "../../components/Modal";

type CollaboratorWithLottery = Collaborator & {
  lotteryName: string | null;
  lotteryShout: string | null;
};

export default function LotteryManagement() {
  const [collaborators, setCollaborators] = useState<CollaboratorWithLottery[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedCollaborator, setSelectedCollaborator] = useState<CollaboratorWithLottery | null>(null);
  const [lotteryName, setLotteryName] = useState("");
  const [lotteryShout, setLotteryShout] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  // Cargar colaboradores desde Supabase
  const loadCollaborators = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from("collaborators")
        .select("*")
        .order("full_name", { ascending: true });

      if (error) {
        console.error("Error al cargar colaboradores:", error);
        return;
      }

      if (data && Array.isArray(data)) {
        const mappedCollaborators: CollaboratorWithLottery[] = data.map(
          (collab: {
            id: number;
            full_name: string;
            avatar_url: string;
            role: string | null;
            lottery_name: string | null;
            lottery_shout: string | null;
          }) => ({
            id: collab.id,
            fullName: collab.full_name,
            avatarUrl: collab.avatar_url,
            role: collab.role || undefined,
            lotteryName: collab.lottery_name || null,
            lotteryShout: collab.lottery_shout || null,
          })
        );
        setCollaborators(mappedCollaborators);
      }
    } catch (error) {
      console.error("Error inesperado al cargar colaboradores:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadCollaborators();
  }, []);

  const handleEdit = (collaborator: CollaboratorWithLottery) => {
    setSelectedCollaborator(collaborator);
    setLotteryName(collaborator.lotteryName || "");
    setLotteryShout(collaborator.lotteryShout || "");
    setIsEditModalOpen(true);
  };

  const handleSave = async () => {
    if (!selectedCollaborator) return;

    setIsSaving(true);
    try {
      const { error } = await supabase
        .from("collaborators")
        // @ts-expect-error - Supabase types will be generated after schema is applied
        .update({
          lottery_name: lotteryName.trim() || null,
          lottery_shout: lotteryShout.trim() || null,
        })
        .eq("id", selectedCollaborator.id);

      if (error) {
        throw error;
      }

      await Swal.fire({
        title: "¡Guardado!",
        text: "Los datos de lotería han sido actualizados correctamente.",
        icon: "success",
        confirmButtonColor: "#FFD080",
        background: "#080808",
        color: "#ffffff",
        timer: 2000,
        timerProgressBar: true,
      });

      setIsEditModalOpen(false);
      setSelectedCollaborator(null);
      setLotteryName("");
      setLotteryShout("");
      loadCollaborators();
    } catch (error: any) {
      console.error("Error al guardar:", error);
      await Swal.fire({
        title: "Error",
        text: error.message || "Hubo un error al guardar el nombre de lotería.",
        icon: "error",
        confirmButtonColor: "#FFD080",
        background: "#080808",
        color: "#ffffff",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleClose = () => {
    if (!isSaving) {
      setIsEditModalOpen(false);
      setSelectedCollaborator(null);
      setLotteryName("");
      setLotteryShout("");
    }
  };

  // Filtrar colaboradores por término de búsqueda
  const filteredCollaborators = useMemo(() => {
    if (!searchTerm.trim()) {
      return collaborators;
    }

    const searchLower = searchTerm.toLowerCase().trim();
    return collaborators.filter(
      (collaborator) =>
        collaborator.fullName.toLowerCase().includes(searchLower) ||
        (collaborator.role &&
          collaborator.role.toLowerCase().includes(searchLower)) ||
        (collaborator.lotteryName &&
          collaborator.lotteryName.toLowerCase().includes(searchLower)) ||
        (collaborator.lotteryShout &&
          collaborator.lotteryShout.toLowerCase().includes(searchLower))
    );
  }, [collaborators, searchTerm]);

  // Calcular estadísticas
  const totalCollaborators = collaborators.length;
  const withLotteryName = collaborators.filter((c) => c.lotteryName).length;
  const withoutLotteryName = totalCollaborators - withLotteryName;

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-light text-white uppercase tracking-wide">
            Gestión de Lotería
          </h1>
          <p className="text-white/60 text-xs sm:text-sm mt-1">
            Asigna nombres descriptivos para el juego de lotería
          </p>
        </div>
      </div>

      {/* KPIs */}
      <div className="flex items-center gap-2 sm:gap-4">
        {isLoading ? (
          <>
            {[...Array(3)].map((_, index) => (
              <div
                key={index}
                className="flex-1 sm:flex-none rounded-lg bg-black/30 border border-white/10 px-3 sm:px-4 py-2 relative overflow-hidden animate-pulse"
              >
                <div className="h-3 bg-white/10 rounded w-20 mb-2" />
                <div className="h-6 bg-white/10 rounded w-12" />
                <div className="absolute inset-0 animate-shimmer pointer-events-none" />
              </div>
            ))}
          </>
        ) : (
          <>
            <div className="flex-1 sm:flex-none rounded-lg bg-black/30 border border-white/10 px-3 sm:px-4 py-2">
              <p className="text-[10px] sm:text-xs text-white/60 uppercase tracking-wide">
                Total Colaboradores
              </p>
              <p className="text-lg sm:text-xl font-semibold text-white mt-0.5">
                {totalCollaborators}
              </p>
            </div>
            <div className="flex-1 sm:flex-none rounded-lg bg-black/30 border border-white/10 px-3 sm:px-4 py-2">
              <p className="text-[10px] sm:text-xs text-white/60 uppercase tracking-wide">
                Con Nombre de Lotería
              </p>
              <p className="text-lg sm:text-xl font-semibold text-[#FFD080] mt-0.5">
                {withLotteryName}
              </p>
            </div>
            <div className="flex-1 sm:flex-none rounded-lg bg-black/30 border border-white/10 px-3 sm:px-4 py-2">
              <p className="text-[10px] sm:text-xs text-white/60 uppercase tracking-wide">
                Sin Nombre
              </p>
              <p className="text-lg sm:text-xl font-semibold text-white/60 mt-0.5">
                {withoutLotteryName}
              </p>
            </div>
          </>
        )}
      </div>

      {/* Buscador */}
      <div className="relative">
        <div className="relative">
          <Icon
            icon="mdi:magnify"
            className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40"
            width={20}
            height={20}
          />
          <input
            type="text"
            placeholder="Buscar por nombre, rol, nombre de lotería o grito..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-white/5 border border-white/10 text-white placeholder-white/40 focus:border-[#FFD080] focus:outline-none text-sm"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/60 transition"
            >
              <Icon icon="mdi:close" width={18} height={18} />
            </button>
          )}
        </div>
        {searchTerm && (
          <p className="text-white/60 text-xs mt-2">
            {filteredCollaborators.length} resultado(s) encontrado(s)
          </p>
        )}
      </div>

      {/* Tabla */}
      <div className="rounded-2xl bg-black/20 border border-white/10 backdrop-blur overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-black/30 border-b border-white/10">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-white/60 uppercase tracking-wider">
                  Colaborador
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-white/60 uppercase tracking-wider">
                  Rol
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-white/60 uppercase tracking-wider">
                  Nombre de Lotería
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-white/60 uppercase tracking-wider">
                  Grito
                </th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-white/60 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {isLoading ? (
                <>
                  {[...Array(5)].map((_, index) => (
                    <tr
                      key={index}
                      className="hover:bg-white/5 transition-colors relative overflow-hidden animate-pulse"
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="size-10 bg-white/10 rounded-full" />
                          <div className="h-4 bg-white/10 rounded w-32" />
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="h-4 bg-white/10 rounded w-24" />
                      </td>
                      <td className="px-4 py-3">
                        <div className="h-4 bg-white/10 rounded w-32" />
                      </td>
                      <td className="px-4 py-3">
                        <div className="h-4 bg-white/10 rounded w-40" />
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-center">
                          <div className="h-8 w-8 bg-white/10 rounded-lg" />
                        </div>
                      </td>
                      <div className="absolute inset-0 animate-shimmer pointer-events-none" />
                    </tr>
                  ))}
                </>
              ) : (
                filteredCollaborators.map((collaborator) => (
                  <tr
                    key={collaborator.id}
                    className="hover:bg-white/5 transition-colors"
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <img
                          src={collaborator.avatarUrl}
                          alt={collaborator.fullName}
                          className="size-10 rounded-full object-cover border border-white/20"
                          onError={(e) => {
                            e.currentTarget.src =
                              "https://via.placeholder.com/150?text=No+Image";
                          }}
                        />
                        <span className="text-white font-medium text-sm">
                          {collaborator.fullName}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-white/60 text-sm">
                        {collaborator.role ?? "Sin especificar"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {collaborator.lotteryName ? (
                        <span className="text-[#FFD080] text-sm font-medium">
                          {collaborator.lotteryName}
                        </span>
                      ) : (
                        <span className="text-white/40 text-sm italic">
                          Sin asignar
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {collaborator.lotteryShout ? (
                        <span className="text-white/70 text-sm italic line-clamp-2 max-w-xs">
                          {collaborator.lotteryShout}
                        </span>
                      ) : (
                        <span className="text-white/40 text-sm italic">
                          Sin asignar
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center">
                        <button
                          onClick={() => handleEdit(collaborator)}
                          className="px-3 py-1.5 rounded-lg border border-white/20 text-white/70 hover:text-white hover:bg-white/10 transition text-xs flex items-center justify-center gap-1.5"
                          title="Editar nombre de lotería"
                        >
                          <Icon icon="mdi:pencil" width={16} height={16} />
                          <span>Editar</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {!isLoading && filteredCollaborators.length === 0 && (
          <div className="p-8 text-center">
            <p className="text-white/70 text-sm">
              {searchTerm
                ? "No se encontraron colaboradores con ese criterio de búsqueda."
                : "No hay colaboradores registrados aún."}
            </p>
          </div>
        )}
      </div>

      {/* Modal de edición */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={handleClose}
        title="Editar Datos de Lotería"
      >
        {selectedCollaborator && (
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-3 rounded-lg bg-white/5 border border-white/10">
              <img
                src={selectedCollaborator.avatarUrl}
                alt={selectedCollaborator.fullName}
                className="size-12 rounded-full object-cover border border-white/20"
                onError={(e) => {
                  e.currentTarget.src =
                    "https://via.placeholder.com/150?text=No+Image";
                }}
              />
              <div>
                <p className="text-white font-medium text-sm">
                  {selectedCollaborator.fullName}
                </p>
                {selectedCollaborator.role && (
                  <p className="text-white/60 text-xs mt-0.5">
                    {selectedCollaborator.role}
                  </p>
                )}
              </div>
            </div>

            <div>
              <label
                htmlFor="lottery-name"
                className="block text-white/80 text-sm font-medium mb-2"
              >
                Nombre Descriptivo de Lotería
              </label>
              <input
                id="lottery-name"
                type="text"
                value={lotteryName}
                onChange={(e) => setLotteryName(e.target.value)}
                placeholder='Ej: "The big boss", "El rapero del codigo"'
                className="w-full bg-white/5 border border-white/15 rounded-lg px-4 py-2 text-white placeholder:text-white/40 focus:outline-none focus:border-[#FFD080] transition"
                disabled={isSaving}
                autoFocus
              />
              <p className="text-white/50 text-xs mt-1">
                Nombre descriptivo que aparecerá en el juego de lotería
              </p>
            </div>

            <div>
              <label
                htmlFor="lottery-shout"
                className="block text-white/80 text-sm font-medium mb-2"
              >
                Grito de Lotería
              </label>
              <textarea
                id="lottery-shout"
                value={lotteryShout}
                onChange={(e) => setLotteryShout(e.target.value)}
                placeholder='Ej: "¡El jefe mayor, con poder y honor!"'
                rows={3}
                className="w-full bg-white/5 border border-white/15 rounded-lg px-4 py-2 text-white placeholder:text-white/40 focus:outline-none focus:border-[#FFD080] transition resize-none"
                disabled={isSaving}
              />
              <p className="text-white/50 text-xs mt-1">
                Grito característico con rima para este colaborador
              </p>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={handleClose}
                disabled={isSaving}
                className="flex-1 px-4 py-2 rounded-lg border border-white/20 text-white/70 hover:text-white hover:bg-white/10 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={isSaving}
                className="flex-1 px-4 py-2 rounded-lg bg-linear-to-r from-[#FFD080] to-[#D4A574] text-[#080808] font-semibold hover:opacity-90 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSaving ? "Guardando..." : "Guardar"}
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

