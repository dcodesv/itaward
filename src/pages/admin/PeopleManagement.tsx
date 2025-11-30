import { useState, useEffect, useMemo } from "react";
import Swal from "sweetalert2";
import Icon from "../../components/Icon";
import { supabase } from "../../lib/supabase";
import CreateCollaboratorModal from "../../components/admin/CreateCollaboratorModal";
import EditCollaboratorModal from "../../components/admin/EditCollaboratorModal";
import type { Collaborator, Category } from "../../types";

type CollaboratorWithCategories = Collaborator & {
  categories: number[];
};

export default function PeopleManagement() {
  const [collaborators, setCollaborators] = useState<Collaborator[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [categoryRelations, setCategoryRelations] = useState<
    Record<number, number[]>
  >({});
  const [isLoading, setIsLoading] = useState(true);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedCollaboratorId, setSelectedCollaboratorId] = useState<
    number | null
  >(null);

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
    } finally {
      setIsLoading(false);
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

  // Cargar relaciones categoría-colaborador
  const loadCategoryRelations = async () => {
    try {
      const { data, error } = await supabase
        .from("category_collaborators")
        .select("category_id, collaborator_id");

      if (error) {
        console.error("Error al cargar relaciones:", error);
        return;
      }

      if (data && Array.isArray(data)) {
        const relations: Record<number, number[]> = {};
        data.forEach(
          (rel: { category_id: number; collaborator_id: number }) => {
            if (!relations[rel.collaborator_id]) {
              relations[rel.collaborator_id] = [];
            }
            relations[rel.collaborator_id].push(rel.category_id);
          }
        );
        setCategoryRelations(relations);
      }
    } catch (error) {
      console.error("Error inesperado al cargar relaciones:", error);
    }
  };

  useEffect(() => {
    loadCollaborators();
    loadCategories();
    loadCategoryRelations();
  }, []);

  const handleSuccess = () => {
    loadCollaborators();
    loadCategoryRelations();
  };

  const handleEdit = (collaboratorId: number) => {
    setSelectedCollaboratorId(collaboratorId);
    setIsEditModalOpen(true);
  };

  const handleDelete = async (collaborator: CollaboratorWithCategories) => {
    // Verificar si tiene nominaciones
    const { data: nominations } = await supabase
      .from("nominations")
      .select("id")
      .eq("collaborator_id", collaborator.id);

    const hasNominations = nominations && nominations.length > 0;
    const categoriesCount = collaborator.categories.length;

    // Configurar SweetAlert2 con el tema de la aplicación
    const result = await Swal.fire({
      title: "¿Eliminar colaborador?",
      html: `
        <div style="text-align: left; color: rgba(255, 255, 255, 0.9); font-size: 14px;">
          <p style="margin-bottom: 12px;">Estás a punto de eliminar al colaborador:</p>
          <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 12px;">
            <img 
              src="${collaborator.avatarUrl}" 
              alt="${collaborator.fullName}"
              style="width: 48px; height: 48px; border-radius: 50%; object-fit: cover; border: 2px solid rgba(255, 208, 128, 0.3);"
              onerror="this.src='https://via.placeholder.com/150?text=No+Image'"
            />
            <div>
              <p style="margin: 0; font-weight: 600; color: #FFD080; font-size: 16px;">
                ${collaborator.fullName}
              </p>
              ${
                collaborator.role
                  ? `<p style="margin: 4px 0 0 0; color: rgba(255, 255, 255, 0.6); font-size: 13px;">${collaborator.role}</p>`
                  : ""
              }
            </div>
          </div>
          ${
            categoriesCount > 0 || hasNominations
              ? `
            <p style="margin-top: 16px; color: rgba(255, 255, 255, 0.6); font-size: 13px;">
              <strong>Advertencia:</strong> Este colaborador tiene:
              ${
                categoriesCount > 0
                  ? `<br>• ${categoriesCount} categoría(s) asociada(s)`
                  : ""
              }
              ${
                hasNominations
                  ? `<br>• ${
                      nominations?.length || 0
                    } nominación(es) recibida(s)`
                  : ""
              }
              <br><br>Todas estas relaciones y nominaciones se eliminarán permanentemente y no se puede deshacer.
            </p>
          `
              : `
            <p style="margin-top: 16px; color: rgba(255, 255, 255, 0.6); font-size: 13px;">
              Esta acción no se puede deshacer.
            </p>
          `
          }
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
        // Eliminar nominaciones primero
        if (hasNominations) {
          const { error: nominationsDeleteError } = await supabase
            .from("nominations")
            .delete()
            .eq("collaborator_id", collaborator.id);

          if (nominationsDeleteError) {
            console.error(
              "Error al eliminar nominaciones:",
              nominationsDeleteError
            );
            await Swal.fire({
              title: "Error",
              text: "Hubo un error al eliminar las nominaciones del colaborador.",
              icon: "error",
              confirmButtonColor: "#FFD080",
              background: "#080808",
              color: "#ffffff",
            });
            return;
          }
        }

        // Eliminar relaciones categoría-colaborador
        if (categoriesCount > 0) {
          const { error: relationsDeleteError } = await supabase
            .from("category_collaborators")
            .delete()
            .eq("collaborator_id", collaborator.id);

          if (relationsDeleteError) {
            console.error(
              "Error al eliminar relaciones:",
              relationsDeleteError
            );
            await Swal.fire({
              title: "Error",
              text: "Hubo un error al eliminar las relaciones del colaborador.",
              icon: "error",
              confirmButtonColor: "#FFD080",
              background: "#080808",
              color: "#ffffff",
            });
            return;
          }
        }

        // Eliminar colaborador
        const { error: deleteError } = await supabase
          .from("collaborators")
          .delete()
          .eq("id", collaborator.id);

        if (deleteError) {
          console.error("Error al eliminar colaborador:", deleteError);
          await Swal.fire({
            title: "Error",
            text: "Hubo un error al eliminar el colaborador.",
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
          text: `El colaborador "${collaborator.fullName}" ha sido eliminado.`,
          icon: "success",
          confirmButtonColor: "#FFD080",
          background: "#080808",
          color: "#ffffff",
          timer: 2000,
          timerProgressBar: true,
        });

        // Recargar datos
        handleSuccess();
      } catch (error) {
        console.error("Error inesperado al eliminar colaborador:", error);
        await Swal.fire({
          title: "Error",
          text: "Ocurrió un error inesperado al eliminar el colaborador.",
          icon: "error",
          confirmButtonColor: "#FFD080",
          background: "#080808",
          color: "#ffffff",
        });
      }
    }
  };

  // Combinar colaboradores con sus categorías
  const collaboratorsWithCategories = useMemo<
    CollaboratorWithCategories[]
  >(() => {
    return collaborators.map((collaborator) => ({
      ...collaborator,
      categories: categoryRelations[collaborator.id] || [],
    }));
  }, [collaborators, categoryRelations]);

  const getCategoryName = (categoryId: number) => {
    return (
      categories.find((c) => c.id === categoryId)?.name ??
      `Categoría ${categoryId}`
    );
  };

  const getCategoryEmoji = (categoryId: number) => {
    return categories.find((c) => c.id === categoryId)?.emoji;
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-light text-white uppercase tracking-wide">
            Gestión de Personas
          </h1>
          <p className="text-white/60 text-xs sm:text-sm mt-1">
            Administra los colaboradores disponibles para nominación
          </p>
        </div>
        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="w-full sm:w-auto px-3 sm:px-4 py-2 rounded-lg bg-linear-to-r from-[#FFD080] to-[#D4A574] text-[#080808] text-xs sm:text-sm font-semibold hover:opacity-90 transition"
        >
          + Nueva Persona
        </button>
      </div>

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
                  Categorías Nominadas
                </th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-white/60 uppercase tracking-wider">
                  Total
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
                        <div className="flex flex-wrap gap-2">
                          <div className="h-6 bg-white/10 rounded-full w-20" />
                          <div className="h-6 bg-white/10 rounded-full w-24" />
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <div className="h-6 bg-white/10 rounded-full w-8 mx-auto" />
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
                collaboratorsWithCategories.map((collaborator) => (
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
                      <div className="flex flex-wrap gap-2 max-w-md">
                        {collaborator.categories.length > 0 ? (
                          collaborator.categories.map((categoryId) => {
                            const category = categories.find(
                              (c) => c.id === categoryId
                            );
                            return (
                              <span
                                key={categoryId}
                                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-[#FFD080]/20 text-[#FFD080] border border-[#FFD080]/30"
                                title={category?.description}
                              >
                                {getCategoryEmoji(categoryId) && (
                                  <span className="text-xs">
                                    {getCategoryEmoji(categoryId)}
                                  </span>
                                )}
                                <span>{getCategoryName(categoryId)}</span>
                              </span>
                            );
                          })
                        ) : (
                          <span className="text-white/40 text-xs">
                            Sin categorías
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="inline-flex items-center justify-center px-3 py-1 rounded-full text-xs font-semibold bg-white/10 text-white border border-white/20 min-w-8">
                        {collaborator.categories.length}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => handleEdit(collaborator.id)}
                          className="px-3 py-1.5 rounded-lg border border-white/20 text-white/70 hover:text-white hover:bg-white/10 transition text-xs flex items-center justify-center"
                          title="Editar"
                        >
                          <Icon icon="mdi:pencil" width={16} height={16} />
                        </button>
                        <button
                          onClick={() => handleDelete(collaborator)}
                          className="px-3 py-1.5 rounded-lg border border-red-500/30 text-red-400/70 hover:text-red-400 hover:bg-red-500/10 transition text-xs flex items-center justify-center"
                          title="Eliminar"
                        >
                          <Icon icon="mdi:delete" width={16} height={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {!isLoading && collaboratorsWithCategories.length === 0 && (
          <div className="p-8 text-center">
            <p className="text-white/70 text-sm">
              No hay colaboradores registrados aún.
            </p>
          </div>
        )}
      </div>

      <CreateCollaboratorModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={handleSuccess}
      />

      <EditCollaboratorModal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setSelectedCollaboratorId(null);
        }}
        onSuccess={handleSuccess}
        collaboratorId={selectedCollaboratorId}
      />
    </div>
  );
}
