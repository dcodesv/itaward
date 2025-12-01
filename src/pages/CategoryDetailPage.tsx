import { useState, useEffect } from "react";
import { Link, useParams } from "react-router-dom";
import Swal from "sweetalert2";
import Icon from "../components/Icon";
import CollaboratorCard from "../components/CollaboratorCard";
import { useNominationsStore } from "../store/useNominationsStore";
import { supabase } from "../lib/supabase";
import type { Category, Collaborator } from "../types";
import "../App.css";

export default function CategoryDetailPage() {
  const { categoryId = "" } = useParams();
  const [category, setCategory] = useState<Category | null>(null);
  const [collaborators, setCollaborators] = useState<Collaborator[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingCollaborators, setIsLoadingCollaborators] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  // Cargar categoría
  useEffect(() => {
    const loadCategory = async () => {
      try {
        setIsLoading(true);
        const categoryIdNum = parseInt(categoryId, 10);

        if (isNaN(categoryIdNum)) {
          setIsLoading(false);
          return;
        }

        const { data, error } = await supabase
          .from("categories")
          .select("*")
          .eq("id", categoryIdNum)
          .single();

        if (error) {
          console.error("Error al cargar categoría:", error);
          setIsLoading(false);
          return;
        }

        if (data) {
          const categoryData = data as {
            id: number;
            name: string;
            description: string | null;
            emoji: string | null;
          };
          setCategory({
            id: categoryData.id,
            name: categoryData.name,
            description: categoryData.description || undefined,
            emoji: categoryData.emoji || undefined,
          });
        }
      } catch (error) {
        console.error("Error inesperado al cargar categoría:", error);
      } finally {
        setIsLoading(false);
      }
    };

    if (categoryId) {
      loadCategory();
    }
  }, [categoryId]);

  // Cargar colaboradores de la categoría
  useEffect(() => {
    const loadCollaborators = async () => {
      try {
        setIsLoadingCollaborators(true);
        const categoryIdNum = parseInt(categoryId, 10);

        if (isNaN(categoryIdNum)) {
          setIsLoadingCollaborators(false);
          return;
        }

        // Obtener las relaciones categoría-colaborador para esta categoría específica
        const { data: relations, error: relationsError } = await supabase
          .from("category_collaborators")
          .select("collaborator_id")
          .eq("category_id", categoryIdNum);

        if (relationsError) {
          console.error("Error al cargar relaciones:", relationsError);
          setIsLoadingCollaborators(false);
          return;
        }

        // Obtener todos los colaboradores que tienen relaciones con alguna categoría
        const { data: allRelations, error: allRelationsError } = await supabase
          .from("category_collaborators")
          .select("collaborator_id");

        if (allRelationsError) {
          console.error("Error al cargar todas las relaciones:", allRelationsError);
          setIsLoadingCollaborators(false);
          return;
        }

        // IDs de colaboradores que tienen relaciones específicas con alguna categoría
        const collaboratorsWithSpecificCategories = new Set(
          allRelations?.map((rel: { collaborator_id: number }) => rel.collaborator_id) || []
        );

        // IDs de colaboradores específicos para esta categoría
        const specificCollaboratorIds = relations?.map(
          (rel: { collaborator_id: number }) => rel.collaborator_id
        ) || [];

        // Cargar todos los colaboradores
        const { data: allCollaborators, error: allCollaboratorsError } =
          await supabase
            .from("collaborators")
            .select("*")
            .order("full_name", { ascending: true });

        if (allCollaboratorsError) {
          console.error("Error al cargar colaboradores:", allCollaboratorsError);
          setIsLoadingCollaborators(false);
          return;
        }

        if (!allCollaborators || allCollaborators.length === 0) {
          setCollaborators([]);
          setIsLoadingCollaborators(false);
          return;
        }

        // Filtrar colaboradores:
        // 1. Los que tienen relación específica con esta categoría
        // 2. Los que NO tienen relaciones con ninguna categoría (pueden ser nominados en todas)
        const filteredCollaborators = allCollaborators.filter((collab: { id: number }) => {
          const hasSpecificRelation = specificCollaboratorIds.includes(collab.id);
          const hasNoRelations = !collaboratorsWithSpecificCategories.has(collab.id);
          return hasSpecificRelation || hasNoRelations;
        });

        const collaboratorsData = filteredCollaborators;

        if (collaboratorsData && Array.isArray(collaboratorsData)) {
          const mappedCollaborators: Collaborator[] = collaboratorsData.map(
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
        setIsLoadingCollaborators(false);
      }
    };

    if (categoryId) {
      loadCollaborators();
    }
  }, [categoryId]);

  const categoryIdNum = parseInt(categoryId, 10);
  const categoryIdStr = isNaN(categoryIdNum)
    ? categoryId
    : categoryIdNum.toString();

  const nominationId = useNominationsStore((s) =>
    s.getNominationId(categoryIdStr)
  );
  const nominate = useNominationsStore((s) => s.nominate);
  const clearNomination = useNominationsStore((s) => s.clearNomination);
  const syncWithSupabase = useNominationsStore((s) => s.syncWithSupabase);

  // Sincronizar nominaciones desde Supabase al cargar
  useEffect(() => {
    const syncNominations = async () => {
      await syncWithSupabase();
    };
    syncNominations();
  }, [syncWithSupabase, categoryId]);

  const filteredCollaborators = collaborators.filter((person) =>
    person.fullName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // No retornar temprano, mostrar skeleton loading en la estructura principal

  if (!category) {
    return (
      <div className="min-h-screen bg-linear-to-l from-[#080808] via-[#101019] to-[#080808] -mt-[64px]">
        <section className="w-full px-4 md:px-8 py-10">
          <p className="text-white">
            Categoría no encontrada.{" "}
            <Link className="text-[#FFD080] underline" to="/categorias">
              Volver a categorías
            </Link>
          </p>
        </section>
      </div>
    );
  }

  const hasNomination = Boolean(nominationId);

  return (
    <div className="min-h-screen bg-linear-to-l from-[#080808] via-[#101019] to-[#080808] relative overflow-hidden pt-10">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -bottom-40 -left-40 size-[400px] rounded-full bg-[#FFD080]/20 blur-3xl" />
        <div className="absolute -bottom-40 -right-40 size-[400px] rounded-full bg-[#FFD080]/20 blur-3xl" />
        <div className="absolute top-[200px] mx-auto left-0 right-0 size-[420px] rounded-full bg-[#FFD080]/15 blur-3xl" />
      </div>

      <section className="relative w-full px-4 md:px-10 py-12 flex flex-col gap-10">
        <div className="rounded-3xl bg-white/5 border border-white/10 p-4 md:p-6 backdrop-blur">
          <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div className="flex-1">
              <Link
                to="/categorias"
                className="py-2 px-2 inline-flex items-center gap-2 text-white/60 hover:text-white uppercase tracking-[0.2em] text-xs"
              >
                <Icon icon="mdi:arrow-left" width={16} height={16} />
                Volver
              </Link>
              {isLoading ? (
                <div className="mt-4 space-y-3 animate-pulse">
                  <div className="h-8 bg-white/10 rounded w-3/4" />
                  <div className="h-4 bg-white/5 rounded w-full" />
                  <div className="h-4 bg-white/5 rounded w-5/6" />
                </div>
              ) : category ? (
                <>
                  <h1 className="mt-4 text-xl sm:text-2xl md:text-3xl font-light text-white flex items-center gap-2 sm:gap-3 uppercase">
                    {category.name}
                  </h1>
                  {category.description ? (
                    <p className="text-white/60 mt-2 text-sm sm:text-base max-w-2xl">
                      {category.description}
                    </p>
                  ) : null}
                </>
              ) : null}
            </div>

            {/* Skeleton para resumen */}
            {isLoadingCollaborators ? (
              <div className="relative bg-black/30 border border-white/10 rounded-2xl p-5 w-full md:w-auto flex flex-col justify-start items-center gap-2 animate-pulse overflow-hidden">
                <div className="h-3 bg-white/10 rounded w-20" />
                <div className="h-8 bg-white/10 rounded w-32 mt-2" />
                <div className="h-4 bg-white/5 rounded w-40 mt-2" />
                <div className="h-4 bg-white/5 rounded w-36 mt-2" />
                {/* Efecto shimmer */}
                <div className="absolute inset-0 animate-shimmer pointer-events-none" />
              </div>
            ) : (
              <div className="bg-black/30 border border-white/10 rounded-2xl p-4 sm:p-5 text-white/80 w-full md:w-auto flex flex-col justify-start items-center gap-2">
                <p className="text-xs sm:text-sm uppercase tracking-[0.2em] sm:tracking-[0.3em] text-white/50">
                  Resumen
                </p>
                <p className="text-xs sm:text-sm font-light text-white mt-2 uppercase">
                  <span className="text-xl sm:text-2xl font-semibold">
                    {collaborators.length}
                  </span>{" "}
                  candidatos
                </p>
                {hasNomination ? (
                  <p className="uppercase text-xs sm:text-sm mt-2 text-[#FFD080]/60 text-center px-2">
                    Has nominado a <br className="hidden sm:block" />
                    <span className="font-semibold text-[#FFD080] block sm:inline">
                      {
                        collaborators.find(
                          (c) => c.id.toString() === nominationId
                        )?.fullName
                      }
                    </span>
                  </p>
                ) : (
                  <p className="text-xs sm:text-sm mt-2 text-center px-2">
                    Aún no eliges a nadie en esta categoría.
                  </p>
                )}
                {hasNomination ? (
                  <button
                    onClick={async () => {
                      const collaboratorName = collaborators.find(
                        (c) => c.id.toString() === nominationId
                      )?.fullName;
                      await clearNomination(categoryIdStr);
                      // Mostrar toast de éxito
                      Swal.fire({
                        toast: true,
                        position: "top-end",
                        showConfirmButton: false,
                        timer: 3000,
                        timerProgressBar: true,
                        icon: "success",
                        title: "Nominación eliminada",
                        html: `
                          <div style="text-align: left; color: rgba(255, 255, 255, 0.9); font-size: 14px; line-height: 1.5;">
                            Se eliminó la nominación de <strong style="color: #FFD080;">${collaboratorName}</strong><br>
                            <span style="color: rgba(255, 255, 255, 0.6); font-size: 13px;">en la categoría ${
                              category.emoji || ""
                            } ${category.name}</span>
                          </div>
                        `,
                        background: "#080808",
                        color: "#ffffff",
                        customClass: {
                          popup: "swal2-popup-custom swal2-toast",
                          title: "swal2-title-custom",
                          htmlContainer: "swal2-html-container-custom",
                        },
                      });
                      // Recargar colaboradores para reflejar cambios
                      window.location.reload();
                    }}
                    className="mt-4 inline-flex items-center justify-center rounded-xl border border-[#FFD080]/20 px-4 py-2 text-xs uppercase text-white/80 hover:bg-white/10 hover:text-white transition cursor-pointer"
                  >
                    Quitar nominación
                  </button>
                ) : null}
              </div>
            )}
          </div>
        </div>

        <div className="rounded-3xl bg-black/25 border border-white/10 p-6 md:p-10 backdrop-blur">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between text-white/70 text-xs sm:text-sm mb-5">
            <p className="text-center md:text-left">
              Elige a tu colaborador favorito; el detalle se guarda solo en tu
              dispositivo.
            </p>
            <div className="relative w-full md:w-72">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar colaborador..."
                className="w-full bg-white/5 border border-white/15 rounded-full px-4 py-2 text-white placeholder:text-white/40 focus:outline-none focus:border-[#FFD080]"
                disabled={isLoadingCollaborators}
              />
            </div>
          </div>
          {isLoadingCollaborators ? (
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-5">
              {[...Array(8)].map((_, index) => (
                <div
                  key={index}
                  className="relative rounded-3xl overflow-hidden border border-white/10 bg-black/20 backdrop-blur-lg aspect-square animate-pulse"
                >
                  {/* Skeleton para imagen de fondo */}
                  <div className="absolute inset-0 bg-white/10" />

                  {/* Skeleton para gradiente */}
                  <div className="absolute inset-0 bg-linear-to-t from-[#04050b]/50 via-transparent to-transparent" />

                  {/* Skeleton para contenido */}
                  <div className="relative z-10 h-full flex flex-col justify-end p-4">
                    <div className="h-6 bg-white/10 rounded w-3/4 mb-2" />
                    <div className="h-4 bg-white/5 rounded w-1/2" />
                  </div>

                  {/* Efecto shimmer */}
                  <div className="absolute inset-0 animate-shimmer pointer-events-none" />
                </div>
              ))}
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-5">
                {filteredCollaborators.map((person) => {
                  const isSelected = nominationId === person.id.toString();
                  return (
                    <CollaboratorCard
                      key={person.id}
                      collaborator={person}
                      isSelected={isSelected}
                      disabled={hasNomination}
                      onSelect={async () => {
                        await nominate(categoryIdStr, person.id.toString());
                        // Mostrar toast de éxito
                        Swal.fire({
                          toast: true,
                          position: "top-end",
                          showConfirmButton: false,
                          timer: 3000,
                          timerProgressBar: true,
                          icon: "success",
                          title: "¡Voto guardado!",
                          html: `
                            <div style="text-align: left; color: rgba(255, 255, 255, 0.9); font-size: 14px; line-height: 1.5;">
                              Has nominado a <strong style="color: #FFD080;">${
                                person.fullName
                              }</strong><br>
                              <span style="color: rgba(255, 255, 255, 0.6); font-size: 13px;">en la categoría ${
                                category.emoji || ""
                              } ${category.name}</span>
                            </div>
                          `,
                          background: "#080808",
                          color: "#ffffff",
                          customClass: {
                            popup: "swal2-popup-custom swal2-toast",
                            title: "swal2-title-custom",
                            htmlContainer: "swal2-html-container-custom",
                          },
                        });
                        // Recargar para reflejar el cambio
                        window.location.reload();
                      }}
                    />
                  );
                })}
              </div>
              {filteredCollaborators.length === 0 && !isLoadingCollaborators ? (
                <p className="mt-6 text-center text-white/50 text-sm">
                  No encontramos colaboradores con ese nombre. Intenta con otro
                  término.
                </p>
              ) : null}
            </>
          )}
        </div>

        <p className="text-center text-white/60 text-sm pb-6">
          Regla: solo puedes nominar a una persona por categoría. Puedes retirar
          tu nominación en cualquier momento antes de enviar el resultado final.
        </p>
      </section>
    </div>
  );
}
