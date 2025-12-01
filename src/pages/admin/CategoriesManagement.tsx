import { useState, useEffect } from "react";
import Swal from "sweetalert2";
import Icon from "../../components/Icon";
import { supabase } from "../../lib/supabase";
import CreateCategoryModal from "../../components/admin/CreateCategoryModal";
import EditCategoryModal from "../../components/admin/EditCategoryModal";
import type { Category } from "../../types";

export default function CategoriesManagement() {
  const [categoriesList, setCategoriesList] = useState<Category[]>([]);
  const [nominationsByCategory, setNominationsByCategory] = useState<
    Record<number, number>
  >({});
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);

  // Cargar categorías desde Supabase
  const loadCategories = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from("categories")
        .select("*")
        .order("name", { ascending: true });

      if (error) {
        console.error("Error al cargar categorías:", error);
        return;
      }

      if (data && Array.isArray(data)) {
        // Mapear los datos de Supabase al formato de la app
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
        setCategoriesList(mappedCategories);
      } else {
        setCategoriesList([]);
      }
    } catch (error) {
      console.error("Error inesperado al cargar categorías:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Cargar nominaciones para contar colaboradores nominados por categoría
  const loadNominations = async () => {
    try {
      const { data, error } = await supabase
        .from("nominations")
        .select("category_id, collaborator_id");

      if (error) {
        console.error("Error al cargar nominaciones:", error);
        return;
      }

      if (data && Array.isArray(data)) {
        // Contar colaboradores únicos nominados por categoría
        const nominationsCount: Record<number, Set<number>> = {};
        
        data.forEach(
          (nom: { category_id: number; collaborator_id: number }) => {
            if (!nominationsCount[nom.category_id]) {
              nominationsCount[nom.category_id] = new Set();
            }
            nominationsCount[nom.category_id].add(nom.collaborator_id);
          }
        );

        // Convertir Sets a números
        const counts: Record<number, number> = {};
        Object.keys(nominationsCount).forEach((categoryId) => {
          counts[parseInt(categoryId, 10)] = nominationsCount[parseInt(categoryId, 10)].size;
        });

        setNominationsByCategory(counts);
      }
    } catch (error) {
      console.error("Error inesperado al cargar nominaciones:", error);
    }
  };

  useEffect(() => {
    const loadAllData = async () => {
      await Promise.all([
        loadCategories(),
        loadNominations(),
      ]);
    };
    loadAllData();
  }, []);

  const handleSuccess = () => {
    loadCategories(); // Recargar categorías después de crear/editar
    loadNominations(); // Recargar nominaciones
  };

  const handleEditCategory = (category: Category) => {
    setEditingCategory(category);
    setIsEditModalOpen(true);
  };

  const handleCloseEditModal = () => {
    setIsEditModalOpen(false);
    setEditingCategory(null);
  };

  const handleDeleteCategory = async (category: Category) => {
    // Verificar si la categoría tiene colaboradores asociados
    const { data: relations } = await supabase
      .from("category_collaborators")
      .select("collaborator_id")
      .eq("category_id", category.id);

    const hasCollaborators = relations && relations.length > 0;

    // Verificar si tiene nominaciones
    const { data: nominations } = await supabase
      .from("nominations")
      .select("id")
      .eq("category_id", category.id);

    const hasNominations = nominations && nominations.length > 0;

    // Configurar SweetAlert2 con el tema de la aplicación
    const result = await Swal.fire({
      title: "¿Eliminar categoría?",
      html: `
        <div style="text-align: left; color: rgba(255, 255, 255, 0.9); font-size: 14px;">
          <p style="margin-bottom: 12px;">Estás a punto de eliminar la categoría:</p>
          <p style="margin-bottom: 8px; font-weight: 600; color: #FFD080;">
            ${category.emoji ? category.emoji + " " : ""}${category.name}
          </p>
          ${
            hasCollaborators || hasNominations
              ? `
            <p style="margin-top: 16px; color: rgba(255, 255, 255, 0.6); font-size: 13px;">
              <strong>Advertencia:</strong> Esta categoría tiene:
              ${
                hasCollaborators
                  ? `<br>• ${
                      relations?.length || 0
                    } colaborador(es) asociado(s)`
                  : ""
              }
              ${
                hasNominations
                  ? `<br>• ${
                      nominations?.length || 0
                    } nominación(es) registrada(s)`
                  : ""
              }
              <br><br>Todas estas relaciones se eliminarán permanentemente y no se puede deshacer.
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
            .eq("category_id", category.id);

          if (nominationsDeleteError) {
            console.error(
              "Error al eliminar nominaciones:",
              nominationsDeleteError
            );
            await Swal.fire({
              title: "Error",
              text: "Hubo un error al eliminar las nominaciones de la categoría.",
              icon: "error",
              confirmButtonColor: "#FFD080",
              background: "#080808",
              color: "#ffffff",
            });
            return;
          }
        }

        // Eliminar relaciones categoría-colaborador
        if (hasCollaborators) {
          const { error: relationsDeleteError } = await supabase
            .from("category_collaborators")
            .delete()
            .eq("category_id", category.id);

          if (relationsDeleteError) {
            console.error(
              "Error al eliminar relaciones:",
              relationsDeleteError
            );
            await Swal.fire({
              title: "Error",
              text: "Hubo un error al eliminar las relaciones de la categoría.",
              icon: "error",
              confirmButtonColor: "#FFD080",
              background: "#080808",
              color: "#ffffff",
            });
            return;
          }
        }

        // Eliminar la categoría
        const { error: deleteError } = await supabase
          .from("categories")
          .delete()
          .eq("id", category.id);

        if (deleteError) {
          console.error("Error al eliminar categoría:", deleteError);
          await Swal.fire({
            title: "Error",
            text: "Hubo un error al eliminar la categoría.",
            icon: "error",
            confirmButtonColor: "#FFD080",
            background: "#080808",
            color: "#ffffff",
          });
          return;
        }

        // Mostrar confirmación de éxito
        await Swal.fire({
          title: "¡Eliminada!",
          text: `La categoría "${category.name}" ha sido eliminada.`,
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
        console.error("Error inesperado al eliminar categoría:", error);
        await Swal.fire({
          title: "Error",
          text: "Ocurrió un error inesperado al eliminar la categoría.",
          icon: "error",
          confirmButtonColor: "#FFD080",
          background: "#080808",
          color: "#ffffff",
        });
      }
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-light text-white uppercase tracking-wide">
            Gestión de Categorías
          </h1>
          <p className="text-white/60 text-xs sm:text-sm mt-1">
            Administra las categorías de votación disponibles
          </p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="w-full sm:w-auto px-3 sm:px-4 py-2 rounded-lg bg-linear-to-r from-[#FFD080] to-[#D4A574] text-[#080808] text-xs sm:text-sm font-semibold hover:opacity-90 transition"
        >
          + Nueva Categoría
        </button>
      </div>

      <div className="rounded-2xl bg-black/20 border border-white/10 backdrop-blur overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-black/30 border-b border-white/10">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-white/60 uppercase tracking-wider">
                  Categoría
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-white/60 uppercase tracking-wider">
                  Descripción
                </th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-white/60 uppercase tracking-wider">
                  Nominados
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
                          <div className="size-6 bg-white/10 rounded-full" />
                          <div className="h-4 bg-white/10 rounded w-32" />
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="h-4 bg-white/10 rounded w-full max-w-md" />
                      </td>
                      <td className="px-4 py-3 text-center">
                        <div className="h-6 bg-white/10 rounded-full w-12 mx-auto" />
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
                categoriesList.map((category) => {
                  // Número de colaboradores únicos que han sido nominados en esta categoría
                  const nomineesCount = nominationsByCategory[category.id] || 0;
                  
                  return (
                    <tr
                      key={category.id}
                      className="hover:bg-white/5 transition-colors"
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          {category.emoji ? (
                            <span className="text-xl">{category.emoji}</span>
                          ) : (
                            <Icon
                              icon="mdi:trophy-outline"
                              className="text-xl text-[#FFD080]"
                              width={24}
                              height={24}
                            />
                          )}
                          <span className="text-white font-medium text-sm">
                            {category.name}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-white/60 text-sm max-w-md">
                          {category.description ?? "Sin descripción"}
                        </p>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-[#FFD080]/20 text-[#FFD080] border border-[#FFD080]/30">
                          {nomineesCount}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => handleEditCategory(category)}
                            className="px-3 py-1.5 rounded-lg border border-white/20 text-white/70 hover:text-white hover:bg-white/10 transition text-xs flex items-center justify-center"
                            title="Editar"
                          >
                            <Icon icon="mdi:pencil" width={16} height={16} />
                          </button>
                          <button
                            onClick={() => handleDeleteCategory(category)}
                            className="px-3 py-1.5 rounded-lg border border-red-500/30 text-red-400/70 hover:text-red-400 hover:bg-red-500/10 transition text-xs flex items-center justify-center"
                            title="Eliminar"
                          >
                            <Icon icon="mdi:delete" width={16} height={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        {!isLoading && categoriesList.length === 0 && (
          <div className="p-8 text-center">
            <p className="text-white/70 text-sm">
              No hay categorías creadas aún.
            </p>
          </div>
        )}
      </div>

      <CreateCategoryModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={handleSuccess}
      />

      <EditCategoryModal
        isOpen={isEditModalOpen}
        onClose={handleCloseEditModal}
        onSuccess={() => {
          handleSuccess();
          handleCloseEditModal();
        }}
        category={editingCategory}
      />
    </div>
  );
}
