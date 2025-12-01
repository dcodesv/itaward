import React, { useState, useEffect, useMemo } from "react";
import Swal from "sweetalert2";
import Icon from "../../components/Icon";
import { supabase } from "../../lib/supabase";
import CreateVoterModal from "../../components/admin/CreateVoterModal";
import EditVoterModal from "../../components/admin/EditVoterModal";
import UploadVotersExcelModal from "../../components/admin/UploadVotersExcelModal";
import type { Category, Collaborator } from "../../types";

type Voter = {
  id: number;
  employee_code: string;
  full_name: string;
  created_at: string;
};

export default function UsersManagement() {
  const [voters, setVoters] = useState<Voter[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [selectedVoterId, setSelectedVoterId] = useState<number | null>(null);
  const [editingVoter, setEditingVoter] = useState<Voter | null>(null);
  const [nominations, setNominations] = useState<
    Record<number, Record<number, number>>
  >({});
  const [categories, setCategories] = useState<Category[]>([]);
  const [collaborators, setCollaborators] = useState<Collaborator[]>([]);
  const totalCategories = categories.length;

  // Cargar votantes desde Supabase
  const loadVoters = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from("voters")
        .select("*")
        .order("full_name", { ascending: true });

      if (error) {
        console.error("Error al cargar votantes:", error);
        return;
      }

      if (data && Array.isArray(data)) {
        setVoters(data as Voter[]);
      }
    } catch (error) {
      console.error("Error inesperado al cargar votantes:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Cargar nominaciones desde Supabase
  const loadNominations = async () => {
    try {
      const { data, error } = await supabase
        .from("nominations")
        .select("voter_id, category_id, collaborator_id");

      if (error) {
        console.error("Error al cargar nominaciones:", error);
        return;
      }

      if (data && Array.isArray(data)) {
        const nominationsMap: Record<number, Record<number, number>> = {};
        data.forEach(
          (nom: {
            voter_id: number;
            category_id: number;
            collaborator_id: number;
          }) => {
            if (!nominationsMap[nom.voter_id]) {
              nominationsMap[nom.voter_id] = {};
            }
            nominationsMap[nom.voter_id][nom.category_id] = nom.collaborator_id;
          }
        );
        setNominations(nominationsMap);
      }
    } catch (error) {
      console.error("Error inesperado al cargar nominaciones:", error);
    }
  };

  // Cargar categorías desde Supabase
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

  // Cargar colaboradores desde Supabase
  const loadCollaborators = async () => {
    try {
      const { data, error } = await supabase
        .from("collaborators")
        .select("*")
        .order("full_name", { ascending: true });

      if (error) {
        console.error("Error al cargar colaboradores:", error);
        return;
      }

      if (data && Array.isArray(data)) {
        const mappedCollaborators: Collaborator[] = data.map(
          (collab: {
            id: number;
            full_name: string;
            avatar_url: string;
            role: string | null;
          }) => ({
            id: collab.id,
            fullName: collab.full_name,
            avatarUrl: collab.avatar_url,
            role: collab.role || undefined,
          })
        );
        setCollaborators(mappedCollaborators);
      }
    } catch (error) {
      console.error("Error inesperado al cargar colaboradores:", error);
    }
  };

  useEffect(() => {
    loadVoters();
    loadNominations();
    loadCategories();
    loadCollaborators();
  }, []);

  const handleSuccess = () => {
    loadVoters();
    loadNominations();
    loadCategories();
    loadCollaborators();
  };

  // Calcular estadísticas
  const totalVoters = voters.length;
  const votersWhoVoted = useMemo(() => {
    return voters.filter((v) => {
      const voterNominations = nominations[v.id];
      return voterNominations && Object.keys(voterNominations).length > 0;
    }).length;
  }, [voters, nominations]);
  const votersPending = totalVoters - votersWhoVoted;

  const formatDate = (dateString?: string) => {
    if (!dateString) return "-";
    const date = new Date(dateString);
    return date.toLocaleDateString("es-ES", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const handleViewVotes = (voterId: number) => {
    setSelectedVoterId(selectedVoterId === voterId ? null : voterId);
  };

  const handleEditVoter = (voter: Voter) => {
    setEditingVoter(voter);
    setIsEditModalOpen(true);
  };

  const handleCloseEditModal = () => {
    setIsEditModalOpen(false);
    setEditingVoter(null);
  };

  const handleDeleteVoter = async (voter: Voter) => {
    // Configurar SweetAlert2 con el tema de la aplicación
    const result = await Swal.fire({
      title: "¿Eliminar votante?",
      html: `
        <div style="text-align: left; color: rgba(255, 255, 255, 0.9); font-size: 14px;">
          <p style="margin-bottom: 12px;">Estás a punto de eliminar al votante:</p>
          <p style="margin-bottom: 8px; font-weight: 600; color: #FFD080;">
            ${voter.employee_code} - ${voter.full_name}
          </p>
          <p style="margin-top: 16px; color: rgba(255, 255, 255, 0.6); font-size: 13px;">
            Esta acción también eliminará <strong>todas las nominaciones</strong> asociadas a este votante y no se puede deshacer.
          </p>
        </div>
      `,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Sí, eliminar",
      cancelButtonText: "Cancelar",
      confirmButtonColor: "#FFD080",
      cancelButtonColor: "#6c757d",
      background: "#080808",
      color: "#ffffff",
      backdrop: `
        rgba(0, 0, 0, 0.8)
        left top
        no-repeat
      `,
      customClass: {
        popup: "swal2-popup-custom",
        title: "swal2-title-custom",
        htmlContainer: "swal2-html-container-custom",
        confirmButton: "swal2-confirm-custom",
        cancelButton: "swal2-cancel-custom",
      },
      buttonsStyling: true,
      reverseButtons: true,
    });

    if (result.isConfirmed) {
      try {
        // Primero eliminar todas las nominaciones del votante
        const { error: nominationsError } = await supabase
          .from("nominations")
          .delete()
          .eq("voter_id", voter.id);

        if (nominationsError) {
          console.error("Error al eliminar nominaciones:", nominationsError);
          await Swal.fire({
            title: "Error",
            text: "Hubo un error al eliminar las nominaciones del votante.",
            icon: "error",
            confirmButtonColor: "#FFD080",
            background: "#080808",
            color: "#ffffff",
          });
          return;
        }

        // Luego eliminar el votante
        const { error: deleteError } = await supabase
          .from("voters")
          .delete()
          .eq("id", voter.id);

        if (deleteError) {
          console.error("Error al eliminar votante:", deleteError);
          await Swal.fire({
            title: "Error",
            text: "Hubo un error al eliminar el votante.",
            icon: "error",
            confirmButtonColor: "#FFD080",
            background: "#080808",
            color: "#ffffff",
          });
          return;
        }

        // Mostrar confirmación de éxito
        await Swal.fire({
          title: "¡Eliminado!",
          text: `El votante ${voter.full_name} y todas sus nominaciones han sido eliminados.`,
          icon: "success",
          confirmButtonColor: "#FFD080",
          background: "#080808",
          color: "#ffffff",
          timer: 2000,
          timerProgressBar: true,
        });

        // Recargar datos para actualizar estadísticas
        handleSuccess();
      } catch (error) {
        console.error("Error inesperado al eliminar votante:", error);
        await Swal.fire({
          title: "Error",
          text: "Ocurrió un error inesperado al eliminar el votante.",
          icon: "error",
          confirmButtonColor: "#FFD080",
          background: "#080808",
          color: "#ffffff",
        });
      }
    }
  };

  const getCategoriesVotedByVoter = (voterId: number) => {
    const voterNominations = nominations[voterId];
    return voterNominations ? Object.keys(voterNominations).length : 0;
  };

  const getVoterNominations = (voterId: number) => {
    return nominations[voterId] || {};
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-light text-white uppercase tracking-wide">
            Listado de Votantes
          </h1>
          <p className="text-white/60 text-xs sm:text-sm mt-1">
            Gestiona y visualiza el registro de empleados que han votado
          </p>
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            onClick={() => setIsUploadModalOpen(true)}
            className="flex-1 sm:flex-none px-3 sm:px-4 py-2 rounded-lg bg-white/10 border border-white/20 text-white hover:bg-white/20 transition flex items-center justify-center gap-2 text-xs sm:text-sm"
          >
            <Icon icon="mdi:file-excel" width={18} height={18} />
            <span className="hidden sm:inline">Importar Excel</span>
            <span className="sm:hidden">Excel</span>
          </button>
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex-1 sm:flex-none px-3 sm:px-4 py-2 rounded-lg bg-linear-to-r from-[#FFD080] to-[#D4A574] text-[#080808] text-xs sm:text-sm font-semibold hover:opacity-90 transition"
          >
            + Nuevo Votante
          </button>
        </div>
      </div>

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
                Total Votantes
              </p>
              <p className="text-lg sm:text-xl font-semibold text-white mt-0.5">
                {totalVoters}
              </p>
            </div>
            <div className="flex-1 sm:flex-none rounded-lg bg-black/30 border border-white/10 px-3 sm:px-4 py-2">
              <p className="text-[10px] sm:text-xs text-white/60 uppercase tracking-wide">
                Votaron
              </p>
              <p className="text-lg sm:text-xl font-semibold text-[#FFD080] mt-0.5">
                {votersWhoVoted}
              </p>
            </div>
            <div className="flex-1 sm:flex-none rounded-lg bg-black/30 border border-white/10 px-3 sm:px-4 py-2">
              <p className="text-[10px] sm:text-xs text-white/60 uppercase tracking-wide">
                Pendientes
              </p>
              <p className="text-lg sm:text-xl font-semibold text-white/60 mt-0.5">
                {votersPending}
              </p>
            </div>
          </>
        )}
      </div>

      <div className="rounded-2xl bg-black/20 border border-white/10 backdrop-blur overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-black/30 border-b border-white/10">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-white/60 uppercase tracking-wider">
                  Código Empleado
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-white/60 uppercase tracking-wider">
                  Nombre Completo
                </th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-white/60 uppercase tracking-wider">
                  Categorías Votadas
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-white/60 uppercase tracking-wider">
                  Fecha de Votación
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
                        <div className="h-4 bg-white/10 rounded w-24" />
                      </td>
                      <td className="px-4 py-3">
                        <div className="h-4 bg-white/10 rounded w-32" />
                      </td>
                      <td className="px-4 py-3 text-center">
                        <div className="h-6 bg-white/10 rounded-full w-12 mx-auto" />
                      </td>
                      <td className="px-4 py-3">
                        <div className="h-4 bg-white/10 rounded w-28" />
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-center gap-2">
                          <div className="h-8 w-8 bg-white/10 rounded-lg" />
                          <div className="h-8 w-8 bg-white/10 rounded-lg" />
                        </div>
                      </td>
                      <div className="absolute inset-0 animate-shimmer pointer-events-none" />
                    </tr>
                  ))}
                </>
              ) : (
                voters.map((voter) => {
                  const categoriesVoted = getCategoriesVotedByVoter(voter.id);
                  const voterNominations = getVoterNominations(voter.id);
                  const isExpanded = selectedVoterId === voter.id;

                  return (
                    <React.Fragment key={voter.id}>
                      <tr className="hover:bg-white/5 transition-colors">
                        <td className="px-4 py-3">
                          <span className="text-white font-medium text-sm font-mono">
                            {voter.employee_code}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-white text-sm">
                            {voter.full_name}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          {categoriesVoted > 0 ? (
                            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-[#FFD080]/20 text-[#FFD080] border border-[#FFD080]/30">
                              {categoriesVoted}/{totalCategories}
                            </span>
                          ) : (
                            <span className="text-white/40 text-sm">
                              0/{totalCategories}
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-white/60 text-sm">
                            {formatDate(voter.created_at)}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={() => handleEditVoter(voter)}
                              className="px-3 py-1.5 rounded-lg border border-white/20 text-white/70 hover:text-white hover:bg-white/10 transition text-xs flex items-center justify-center"
                              title="Editar votante"
                            >
                              <Icon icon="mdi:pencil" width={16} height={16} />
                            </button>
                            <button
                              onClick={() => handleDeleteVoter(voter)}
                              className="px-3 py-1.5 rounded-lg border border-red-500/30 text-red-400/70 hover:text-red-400 hover:bg-red-500/10 transition text-xs flex items-center justify-center"
                              title="Eliminar votante"
                            >
                              <Icon icon="mdi:delete" width={16} height={16} />
                            </button>
                            {categoriesVoted > 0 && (
                              <button
                                onClick={() => handleViewVotes(voter.id)}
                                className="px-3 py-1.5 rounded-lg border border-white/20 text-white/70 hover:text-white hover:bg-white/10 transition text-xs flex items-center justify-center"
                                title="Ver votos"
                              >
                                <Icon
                                  icon={isExpanded ? "mdi:eye-off" : "mdi:eye"}
                                  width={16}
                                  height={16}
                                />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                      {isExpanded && voterNominations && (
                        <tr>
                          <td colSpan={5} className="px-4 py-4 bg-black/10">
                            <div className="space-y-3">
                              <h4 className="text-white font-semibold text-sm mb-3">
                                Votos de {voter.full_name}
                              </h4>
                              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                {Object.entries(voterNominations).map(
                                  ([categoryIdStr, collaboratorId]) => {
                                    const categoryId = parseInt(
                                      categoryIdStr,
                                      10
                                    );
                                    const category = categories.find(
                                      (c) => c.id === categoryId
                                    );
                                    const collaborator = collaborators.find(
                                      (c) => c.id === collaboratorId
                                    );

                                    if (!category || !collaborator) return null;

                                    return (
                                      <div
                                        key={categoryId}
                                        className="flex items-center gap-3 p-3 rounded-lg bg-white/5 border border-white/10"
                                      >
                                        <span className="text-xl">
                                          {category.emoji}
                                        </span>
                                        <div className="flex-1 min-w-0">
                                          <p className="text-white font-medium text-xs">
                                            {category.name}
                                          </p>
                                          <p className="text-white/60 text-xs truncate">
                                            {collaborator.fullName}
                                          </p>
                                        </div>
                                      </div>
                                    );
                                  }
                                )}
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        {!isLoading && voters.length === 0 && (
          <div className="p-8 text-center">
            <p className="text-white/70 text-sm">
              No hay votantes registrados aún.
            </p>
          </div>
        )}
      </div>

      <CreateVoterModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={handleSuccess}
      />

      <EditVoterModal
        isOpen={isEditModalOpen}
        onClose={handleCloseEditModal}
        onSuccess={() => {
          handleSuccess();
          handleCloseEditModal();
        }}
        voter={editingVoter}
      />

      <UploadVotersExcelModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        onSuccess={() => {
          loadVoters();
        }}
      />
    </div>
  );
}
