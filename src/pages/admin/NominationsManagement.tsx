import { useState, useEffect, useMemo } from "react";
import Icon from "../../components/Icon";
import { supabase } from "../../lib/supabase";
import type { Collaborator, Category } from "../../types";

type NominationData = {
  voter_id: number;
  category_id: number;
  collaborator_id: number;
};

type NominationsByCategory = Record<
  number,
  { collaboratorId: number; count: number }[]
>;

export default function NominationsManagement() {
  const [nominations, setNominations] = useState<NominationData[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [collaborators, setCollaborators] = useState<Collaborator[]>([]);
  const [categoryRelations, setCategoryRelations] = useState<
    Record<number, number[]>
  >({});
  const [isLoading, setIsLoading] = useState(true);

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
        setNominations(data as NominationData[]);
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

  // Cargar relaciones categoría-colaborador para contar nominados disponibles
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
            if (!relations[rel.category_id]) {
              relations[rel.category_id] = [];
            }
            relations[rel.category_id].push(rel.collaborator_id);
          }
        );
        setCategoryRelations(relations);
      }
    } catch (error) {
      console.error("Error inesperado al cargar relaciones:", error);
    }
  };

  useEffect(() => {
    const loadAllData = async () => {
      setIsLoading(true);
      await Promise.all([
        loadNominations(),
        loadCategories(),
        loadCollaborators(),
        loadCategoryRelations(),
      ]);
      setIsLoading(false);
    };
    loadAllData();
  }, []);

  // Agrupar nominaciones por categoría y contar votos
  const nominationsByCategory = useMemo<NominationsByCategory>(() => {
    const grouped: NominationsByCategory = {};

    nominations.forEach((nom) => {
      if (!grouped[nom.category_id]) {
        grouped[nom.category_id] = [];
      }

      const existing = grouped[nom.category_id].find(
        (n) => n.collaboratorId === nom.collaborator_id
      );

      if (existing) {
        existing.count += 1;
      } else {
        grouped[nom.category_id].push({
          collaboratorId: nom.collaborator_id,
          count: 1,
        });
      }
    });

    // Ordenar por cantidad de votos (descendente)
    Object.keys(grouped).forEach((catId) => {
      grouped[Number(catId)].sort((a, b) => b.count - a.count);
    });

    return grouped;
  }, [nominations]);

  const totalNominations = nominations.length;
  const uniqueVoters = useMemo(() => {
    const voterSet = new Set(nominations.map((n) => n.voter_id));
    return voterSet.size;
  }, [nominations]);

  // Obtener todas las nominaciones con detalles y conteo de votos
  const nominationsWithDetails = useMemo(() => {
    return categories.map((category) => {
      const categoryNominations = nominationsByCategory[category.id] || [];
      const totalVotes = categoryNominations.reduce(
        (sum, n) => sum + n.count,
        0
      );

      // Mapear nominaciones con detalles del colaborador
      const nominationsWithCollaborators = categoryNominations
        .map((nom) => {
          const collaborator = collaborators.find(
            (c) => c.id === nom.collaboratorId
          );

          if (!collaborator) return null;
          return {
            collaborator,
            votes: nom.count,
          };
        })
        .filter(
          (item): item is { collaborator: Collaborator; votes: number } =>
            item !== null
        );

      // Contar colaboradores únicos nominados en esta categoría
      const uniqueNominees = categoryNominations.length;

      return {
        category,
        nominations: nominationsWithCollaborators,
        totalVotes,
        totalNominees: uniqueNominees,
      };
    });
  }, [nominationsByCategory, categories, collaborators, categoryRelations]);

  // Contar votos totales por colaborador (suma de todas las categorías)
  const votesByCollaborator = useMemo(() => {
    const votes: Record<
      number,
      { collaborator: Collaborator; count: number; categories: number[] }
    > = {};

    Object.entries(nominationsByCategory).forEach(
      ([categoryIdStr, categoryNominations]) => {
        const categoryId = parseInt(categoryIdStr, 10);
        const category = categories.find((c) => c.id === categoryId);
        categoryNominations.forEach((nom) => {
          const collaborator = collaborators.find(
            (c) => c.id === nom.collaboratorId
          );

          if (collaborator) {
            if (!votes[nom.collaboratorId]) {
              votes[nom.collaboratorId] = {
                collaborator,
                count: 0,
                categories: [],
              };
            }
            votes[nom.collaboratorId].count += nom.count;
            if (
              category &&
              !votes[nom.collaboratorId].categories.includes(categoryId)
            ) {
              votes[nom.collaboratorId].categories.push(categoryId);
            }
          }
        });
      }
    );

    return Object.values(votes).sort((a, b) => b.count - a.count);
  }, [nominationsByCategory, categories, collaborators]);

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-light text-white uppercase tracking-wide">
            Gestión de Nominaciones
          </h1>
          <p className="text-white/60 text-xs sm:text-sm mt-1">
            Administra las nominaciones por categoría
          </p>
        </div>
        <div className="flex items-center gap-2 sm:gap-4 w-full sm:w-auto">
          <div className="flex-1 sm:flex-none rounded-lg bg-black/30 border border-white/10 px-3 sm:px-4 py-2">
            <p className="text-[10px] sm:text-xs text-white/60 uppercase tracking-wide">
              Total Nominaciones
            </p>
            <p className="text-lg sm:text-xl font-semibold text-white mt-0.5">
              {isLoading ? "..." : totalNominations}
            </p>
          </div>
          <div className="flex-1 sm:flex-none rounded-lg bg-black/30 border border-white/10 px-3 sm:px-4 py-2">
            <p className="text-[10px] sm:text-xs text-white/60 uppercase tracking-wide">
              Usuarios Votantes
            </p>
            <p className="text-lg sm:text-xl font-semibold text-white mt-0.5">
              {isLoading ? "..." : uniqueVoters}
            </p>
          </div>
        </div>
      </div>

      {isLoading ? (
        <>
          {/* Skeleton de resumen por categoría */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {[...Array(6)].map((_, index) => (
              <div
                key={index}
                className="rounded-2xl bg-black/20 border border-white/10 p-4 backdrop-blur relative overflow-hidden animate-pulse"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="size-6 bg-white/10 rounded-full" />
                    <div>
                      <div className="h-4 bg-white/10 rounded w-24 mb-2" />
                      <div className="h-3 bg-white/5 rounded w-32" />
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="h-5 bg-white/10 rounded w-8 mb-1" />
                    <div className="h-3 bg-white/5 rounded w-12 mx-auto" />
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="h-12 bg-white/5 rounded-lg border border-white/10" />
                  <div className="h-12 bg-white/5 rounded-lg border border-white/10" />
                </div>
                <div className="absolute inset-0 animate-shimmer pointer-events-none" />
              </div>
            ))}
          </div>

          {/* Skeleton de tabla detallada */}
          <div className="rounded-2xl bg-black/20 border border-white/10 backdrop-blur relative overflow-hidden animate-pulse mt-4">
            <div className="p-4 border-b border-white/10">
              <div className="h-6 bg-white/10 rounded w-64" />
            </div>
            <div className="p-4 space-y-4">
              <div className="space-y-3">
                <div className="h-4 bg-white/10 rounded w-40 mb-3" />
                <div className="h-12 bg-white/5 rounded-lg" />
                <div className="h-12 bg-white/5 rounded-lg" />
                <div className="h-12 bg-white/5 rounded-lg" />
              </div>
            </div>
            <div className="absolute inset-0 animate-shimmer pointer-events-none" />
          </div>

          {/* Skeleton de top nominados */}
          <div className="rounded-2xl bg-black/20 border border-white/10 backdrop-blur relative overflow-hidden animate-pulse mt-4">
            <div className="p-4 border-b border-white/10">
              <div className="h-6 bg-white/10 rounded w-56" />
            </div>
            <div className="p-4 space-y-2">
              {[...Array(5)].map((_, index) => (
                <div
                  key={index}
                  className="flex items-center gap-4 p-3 rounded-lg bg-white/5 border border-white/10"
                >
                  <div className="size-8 bg-white/10 rounded-full" />
                  <div className="size-10 bg-white/10 rounded-full" />
                  <div className="flex-1">
                    <div className="h-4 bg-white/10 rounded w-32 mb-2" />
                    <div className="h-3 bg-white/5 rounded w-24" />
                  </div>
                  <div className="text-right">
                    <div className="h-6 bg-white/10 rounded w-12 mb-1" />
                    <div className="h-3 bg-white/5 rounded w-20" />
                  </div>
                </div>
              ))}
            </div>
            <div className="absolute inset-0 animate-shimmer pointer-events-none" />
          </div>
        </>
      ) : (
        <>
          {/* Resumen por categoría */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {nominationsWithDetails.map(
              ({ category, nominations, totalVotes, totalNominees }) => (
                <div
                  key={category.id}
                  className="rounded-2xl bg-black/20 border border-white/10 p-4 backdrop-blur"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      {category.emoji && (
                        <span className="text-2xl">{category.emoji}</span>
                      )}
                      <div>
                        <h3 className="text-white font-semibold text-sm">
                          {category.name}
                        </h3>
                        <p className="text-white/50 text-xs">
                          {totalNominees} nominados disponibles
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-semibold text-[#FFD080]">
                        {totalVotes}
                      </p>
                      <p className="text-xs text-white/60">votos</p>
                    </div>
                  </div>
                  {nominations.length > 0 ? (
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {nominations.map((nom, idx) => (
                        <div
                          key={`${nom.collaborator.id}-${idx}`}
                          className="flex items-center justify-between gap-3 p-2 rounded-lg bg-white/5 border border-white/10"
                        >
                          <div className="flex items-center gap-2 flex-1 min-w-0">
                            <img
                              src={nom.collaborator.avatarUrl}
                              alt={nom.collaborator.fullName}
                              className="size-8 rounded-full object-cover border border-white/20 shrink-0"
                              onError={(e) => {
                                e.currentTarget.src =
                                  "https://via.placeholder.com/150?text=No+Image";
                              }}
                            />
                            <p className="text-white font-medium text-xs truncate">
                              {nom.collaborator.fullName}
                            </p>
                          </div>
                          <span className="inline-flex items-center justify-center px-2 py-1 rounded-full text-xs font-semibold bg-[#FFD080]/20 text-[#FFD080] border border-[#FFD080]/30 min-w-8">
                            {nom.votes}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-3 rounded-lg bg-white/5 border border-white/10 text-center">
                      <p className="text-white/40 text-xs">Sin nominaciones</p>
                    </div>
                  )}
                </div>
              )
            )}
          </div>

          {/* Tabla detallada de nominaciones por categoría */}
          <div className="rounded-2xl bg-black/20 border border-white/10 backdrop-blur overflow-hidden">
            <div className="p-4 border-b border-white/10">
              <h2 className="text-lg font-semibold text-white uppercase tracking-wide">
                Detalle de Nominaciones por Categoría
              </h2>
            </div>
            <div className="divide-y divide-white/5">
              {nominationsWithDetails.map(
                ({ category, nominations, totalVotes }) => (
                  <div key={category.id} className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        {category.emoji && (
                          <span className="text-xl">{category.emoji}</span>
                        )}
                        <h3 className="text-white font-semibold text-sm">
                          {category.name}
                        </h3>
                        <span className="text-white/60 text-xs">
                          ({totalVotes} votos totales)
                        </span>
                      </div>
                    </div>
                    {nominations.length > 0 ? (
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead className="bg-black/30">
                            <tr>
                              <th className="px-3 py-2 text-left text-xs font-semibold text-white/60 uppercase tracking-wider">
                                Colaborador
                              </th>
                              <th className="px-3 py-2 text-center text-xs font-semibold text-white/60 uppercase tracking-wider">
                                Votos
                              </th>
                              <th className="px-3 py-2 text-center text-xs font-semibold text-white/60 uppercase tracking-wider">
                                Porcentaje
                              </th>
                              <th className="px-3 py-2 text-center text-xs font-semibold text-white/60 uppercase tracking-wider">
                                Acciones
                              </th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-white/5">
                            {nominations.map((nom, idx) => {
                              const percentage =
                                totalVotes > 0
                                  ? ((nom.votes / totalVotes) * 100).toFixed(1)
                                  : "0";
                              return (
                                <tr
                                  key={`${nom.collaborator.id}-${idx}`}
                                  className="hover:bg-white/5 transition-colors"
                                >
                                  <td className="px-3 py-2">
                                    <div className="flex items-center gap-2">
                                      <img
                                        src={nom.collaborator.avatarUrl}
                                        alt={nom.collaborator.fullName}
                                        className="size-8 rounded-full object-cover border border-white/20"
                                        onError={(e) => {
                                          e.currentTarget.src =
                                            "https://via.placeholder.com/150?text=No+Image";
                                        }}
                                      />
                                      <span className="text-white text-sm">
                                        {nom.collaborator.fullName}
                                      </span>
                                    </div>
                                  </td>
                                  <td className="px-3 py-2 text-center">
                                    <span className="inline-flex items-center justify-center px-2.5 py-1 rounded-full text-xs font-semibold bg-[#FFD080]/20 text-[#FFD080] border border-[#FFD080]/30">
                                      {nom.votes}
                                    </span>
                                  </td>
                                  <td className="px-3 py-2 text-center">
                                    <span className="text-white/70 text-sm">
                                      {percentage}%
                                    </span>
                                  </td>
                                  <td className="px-3 py-2">
                                    <div className="flex items-center justify-center gap-2">
                                      <button
                                        className="px-2 py-1 rounded-lg border border-white/20 text-white/70 hover:text-white hover:bg-white/10 transition text-xs flex items-center justify-center"
                                        title="Ver detalles"
                                      >
                                        <Icon
                                          icon="mdi:eye"
                                          width={16}
                                          height={16}
                                        />
                                      </button>
                                    </div>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <p className="text-white/40 text-sm text-center py-4">
                        Sin nominaciones en esta categoría
                      </p>
                    )}
                  </div>
                )
              )}
            </div>
          </div>

          {/* Top nominados */}
          {votesByCollaborator.length > 0 && (
            <div className="rounded-2xl bg-black/20 border border-white/10 backdrop-blur overflow-hidden">
              <div className="p-4 border-b border-white/10">
                <h2 className="text-lg font-semibold text-white uppercase tracking-wide">
                  Colaboradores Más Nominados
                </h2>
              </div>
              <div className="p-4">
                <div className="space-y-2">
                  {votesByCollaborator.slice(0, 5).map((item, index) => (
                    <div
                      key={item.collaborator.id}
                      className="flex items-center gap-4 p-3 rounded-lg bg-white/5 border border-white/10"
                    >
                      <div className="flex items-center justify-center size-8 rounded-full bg-[#FFD080]/20 text-[#FFD080] font-semibold text-sm border border-[#FFD080]/30">
                        {index + 1}
                      </div>
                      <img
                        src={item.collaborator.avatarUrl}
                        alt={item.collaborator.fullName}
                        className="size-10 rounded-full object-cover border border-white/20"
                        onError={(e) => {
                          e.currentTarget.src =
                            "https://via.placeholder.com/150?text=No+Image";
                        }}
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-white font-medium text-sm">
                          {item.collaborator.fullName}
                        </p>
                        <div className="flex flex-wrap gap-1.5 mt-1">
                          {item.categories.map((catId) => {
                            const cat = categories.find((c) => c.id === catId);
                            return cat ? (
                              <span
                                key={catId}
                                className="text-xs text-white/60"
                              >
                                {cat.emoji && <span>{cat.emoji} </span>}
                                {cat.name}
                              </span>
                            ) : null;
                          })}
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-semibold text-[#FFD080]">
                          {item.count}
                        </p>
                        <p className="text-xs text-white/60">nominaciones</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
