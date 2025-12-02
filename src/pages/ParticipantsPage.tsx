import { useState, useEffect, useMemo } from "react";
import { supabase } from "../lib/supabase";
import type { Collaborator, Category } from "../types";

type ParticipantWithCategories = Collaborator & {
  categories: number[];
};

export default function ParticipantsPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [collaborators, setCollaborators] = useState<Collaborator[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [categoryRelations, setCategoryRelations] = useState<
    Record<number, number[]>
  >({});
  const [isLoading, setIsLoading] = useState(true);

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

  // Cargar relaciones categoría-colaborador (combinando category_collaborators y nominations)
  const loadCategoryRelations = async () => {
    try {
      // Cargar relaciones de category_collaborators
      const { data: categoryRelationsData, error: relationsError } =
        await supabase
          .from("category_collaborators")
          .select("category_id, collaborator_id");

      if (relationsError) {
        console.error("Error al cargar relaciones:", relationsError);
      }

      // Cargar nominaciones reales
      const { data: nominationsData, error: nominationsError } = await supabase
        .from("nominations")
        .select("category_id, collaborator_id");

      if (nominationsError) {
        console.error("Error al cargar nominaciones:", nominationsError);
      }

      // Combinar ambas fuentes de datos
      const relations: Record<number, Set<number>> = {};

      // Agregar relaciones de category_collaborators
      if (categoryRelationsData && Array.isArray(categoryRelationsData)) {
        categoryRelationsData.forEach(
          (rel: { category_id: number; collaborator_id: number }) => {
            if (!relations[rel.collaborator_id]) {
              relations[rel.collaborator_id] = new Set();
            }
            relations[rel.collaborator_id].add(rel.category_id);
          }
        );
      }

      // Agregar categorías de nominaciones reales
      if (nominationsData && Array.isArray(nominationsData)) {
        nominationsData.forEach(
          (nom: { category_id: number; collaborator_id: number }) => {
            if (!relations[nom.collaborator_id]) {
              relations[nom.collaborator_id] = new Set();
            }
            relations[nom.collaborator_id].add(nom.category_id);
          }
        );
      }

      // Convertir Sets a Arrays
      const relationsArray: Record<number, number[]> = {};
      Object.keys(relations).forEach((collabId) => {
        relationsArray[parseInt(collabId, 10)] = Array.from(
          relations[parseInt(collabId, 10)]
        );
      });

      setCategoryRelations(relationsArray);
    } catch (error) {
      console.error("Error inesperado al cargar relaciones:", error);
    }
  };

  useEffect(() => {
    const loadAllData = async () => {
      setIsLoading(true);
      await Promise.all([
        loadCollaborators(),
        loadCategories(),
        loadCategoryRelations(),
      ]);
      setIsLoading(false);
    };
    loadAllData();
  }, []);

  // Obtener todos los colaboradores únicos y las categorías en las que están
  const allParticipants = useMemo<ParticipantWithCategories[]>(() => {
    return collaborators.map((collaborator) => ({
      ...collaborator,
      categories: categoryRelations[collaborator.id] || [],
    }));
  }, [collaborators, categoryRelations]);

  // Filtrar participantes por búsqueda
  const filteredParticipants = useMemo(() => {
    if (!searchTerm.trim()) return allParticipants;
    const term = searchTerm.toLowerCase();
    return allParticipants.filter(
      (participant) =>
        participant.fullName.toLowerCase().includes(term) ||
        participant.role?.toLowerCase().includes(term) ||
        participant.categories.some((catId) => {
          const category = categories.find((c) => c.id === catId);
          return category?.name.toLowerCase().includes(term);
        })
    );
  }, [allParticipants, searchTerm, categories]);

  const getCategoryDetails = (categoryId: number) => {
    return categories.find((c) => c.id === categoryId);
  };

  return (
    <div className="min-h-screen bg-linear-to-l from-[#080808] via-[#101019] to-[#080808] relative overflow-hidden -mt-[64px] pt-10">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -bottom-40 -left-40 size-[400px] rounded-full bg-[#FFD080]/20 blur-3xl" />
        <div className="absolute -bottom-40 -right-40 size-[400px] rounded-full bg-[#FFD080]/20 blur-3xl" />
        <div className="absolute top-[250px] mx-auto left-0 right-0 size-[400px] rounded-full bg-[#FFD080]/15 blur-3xl" />
      </div>

      <section className="relative w-full px-4 md:px-10 py-12 flex flex-col gap-10">
        <header className="flex flex-col items-center text-center gap-3 sm:gap-4 px-4">
          <div>
            <p className="text-white/60 uppercase tracking-[0.2em] sm:tracking-[0.3em] text-sm sm:text-base md:text-lg">
              Participantes
            </p>
            <h1 className="mt-2 text-base sm:text-lg md:text-xl font-light text-white uppercase max-w-2xl">
              Conoce a todos los colaboradores participantes
            </h1>
          </div>
        </header>

        {/* Resumen */}
        <div className="rounded-3xl bg-white/5 border border-white/10 p-6 backdrop-blur">
          {isLoading ? (
            <div className="relative flex flex-col md:flex-row items-center justify-between gap-4 animate-pulse overflow-hidden">
              <div className="text-center md:text-left space-y-3">
                <div className="h-4 bg-white/10 rounded w-40 mx-auto md:mx-0" />
                <div className="h-10 bg-white/10 rounded w-24 mx-auto md:mx-0" />
              </div>
              <div className="h-10 bg-white/10 rounded-full w-full md:w-96" />
              {/* Efecto shimmer */}
              <div className="absolute inset-0 animate-shimmer pointer-events-none" />
            </div>
          ) : (
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="text-center md:text-left">
                <p className="text-white/60 text-xs sm:text-sm uppercase tracking-wide">
                  Total de Participantes
                </p>
                <p className="text-2xl sm:text-3xl font-semibold text-[#FFD080] mt-1">
                  {allParticipants.length}
                </p>
              </div>
              <div className="w-full md:w-96">
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Buscar por nombre, rol o categoría..."
                  className="w-full bg-white/5 border border-white/15 rounded-full px-4 py-2 text-white placeholder:text-white/40 focus:outline-none focus:border-[#FFD080]"
                />
              </div>
            </div>
          )}
        </div>

        {/* Lista de participantes */}
        <div className="rounded-3xl bg-black/25 border border-white/10 p-6 md:p-10 backdrop-blur">
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
              {[...Array(6)].map((_, index) => (
                <div
                  key={index}
                  className="relative rounded-2xl bg-white/5 border border-white/10 p-5 backdrop-blur animate-pulse overflow-hidden"
                >
                  <div className="flex flex-col items-center text-center gap-4">
                    {/* Skeleton para avatar con badge */}
                    <div className="relative">
                      <div className="size-24 rounded-full bg-white/10" />
                      <div className="absolute -bottom-2 -right-2 size-8 rounded-full bg-white/10 border border-white/20" />
                    </div>

                    {/* Skeleton para nombre y rol */}
                    <div className="w-full space-y-2">
                      <div className="h-6 bg-white/10 rounded w-3/4 mx-auto" />
                      <div className="h-4 bg-white/5 rounded w-1/2 mx-auto" />
                    </div>

                    {/* Skeleton para badges de categorías */}
                    <div className="flex flex-wrap gap-2 justify-center w-full">
                      <div className="h-6 bg-white/10 rounded-full w-20" />
                      <div className="h-6 bg-white/10 rounded-full w-24" />
                      <div className="h-6 bg-white/10 rounded-full w-16" />
                    </div>
                  </div>

                  {/* Efecto shimmer */}
                  <div className="absolute inset-0 animate-shimmer pointer-events-none" />
                </div>
              ))}
            </div>
          ) : filteredParticipants.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
              {filteredParticipants.map((participant) => (
                <div
                  key={participant.id}
                  className="rounded-2xl bg-white/5 border border-white/10 p-5 backdrop-blur hover:border-[#FFD080]/50 transition-all hover:scale-[1.02]"
                >
                  <div className="flex flex-col items-center text-center gap-4">
                    <div className="relative">
                      <img
                        src={participant.avatarUrl}
                        alt={participant.fullName}
                        className="size-24 rounded-full object-cover border-2 border-[#FFD080]/30 shadow-lg"
                        onError={(e) => {
                          e.currentTarget.src =
                            "https://via.placeholder.com/150?text=No+Image";
                        }}
                      />
                      {/* Temporarily hidden: Category counter badge */}
                      {/* {participant.categories.length > 0 && (
                        <div className="absolute -bottom-2 -right-2 flex items-center justify-center size-8 rounded-full bg-[#FFD080]/20 text-[#FFD080] text-xs font-semibold border border-[#FFD080]/30">
                          {participant.categories.length}
                        </div>
                      )} */}
                    </div>
                    <div className="w-full">
                      <h3 className="text-white font-semibold text-base sm:text-lg mb-1">
                        {participant.fullName}
                      </h3>
                      {participant.role && (
                        <p className="text-white/60 text-xs sm:text-sm mb-3">
                          {participant.role}
                        </p>
                      )}
                      {/* Temporarily hidden: Nominated categories badges */}
                      {/* {participant.categories.length > 0 && (
                        <div className="flex flex-wrap gap-2 justify-center">
                          {participant.categories.map((categoryId) => {
                            const category = getCategoryDetails(categoryId);
                            return category ? (
                              <span
                                key={categoryId}
                                className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-[#FFD080]/20 text-[#FFD080] border border-[#FFD080]/30"
                              >
                                {category.emoji && (
                                  <span>{category.emoji}</span>
                                )}
                                <span>{category.name}</span>
                              </span>
                            ) : null;
                          })}
                        </div>
                      )} */}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-white/50 text-sm">
                No se encontraron participantes con ese criterio de búsqueda.
              </p>
            </div>
          )}
        </div>

        {filteredParticipants.length > 0 && (
          <p className="text-center text-white/60 text-sm">
            Mostrando {filteredParticipants.length} de {allParticipants.length}{" "}
            participantes
          </p>
        )}
      </section>
    </div>
  );
}
