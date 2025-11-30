import { useState, useEffect, useMemo } from "react";
import Icon from "../../components/Icon";
import { supabase } from "../../lib/supabase";
import type { Category, Collaborator } from "../../types";

type NominationData = {
  voter_id: number;
  category_id: number;
  collaborator_id: number;
};

type NominationsByCategory = Record<
  number,
  { collaboratorId: number; count: number }[]
>;

export default function Statistics() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [nominations, setNominations] = useState<NominationData[]>([]);
  const [voters, setVoters] = useState<{ id: number }[]>([]);
  const [collaboratorsDetails, setCollaboratorsDetails] = useState<
    Collaborator[]
  >([]);
  const [isLoading, setIsLoading] = useState(true);

  // Cargar todos los datos desde Supabase
  useEffect(() => {
    const loadAllData = async () => {
      try {
        setIsLoading(true);

        // Cargar categorías
        const { data: categoriesData, error: categoriesError } = await supabase
          .from("categories")
          .select("*")
          .order("name", { ascending: true });

        if (!categoriesError && categoriesData) {
          const mappedCategories: Category[] = categoriesData.map(
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

        // Cargar nominaciones
        const { data: nominationsData, error: nominationsError } =
          await supabase
            .from("nominations")
            .select("voter_id, category_id, collaborator_id");

        if (!nominationsError && nominationsData) {
          setNominations(nominationsData as NominationData[]);
        }

        // Cargar votantes (solo IDs para contar)
        const { data: votersData, error: votersError } = await supabase
          .from("voters")
          .select("id");

        if (!votersError && votersData) {
          setVoters(votersData);
        }
      } catch (error) {
        console.error("Error al cargar datos de estadísticas:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadAllData();
  }, []);

  // Cargar detalles de colaboradores que tienen nominaciones
  useEffect(() => {
    const loadCollaboratorsDetails = async () => {
      if (nominations.length === 0) {
        setCollaboratorsDetails([]);
        return;
      }

      try {
        // Obtener IDs únicos de colaboradores que tienen nominaciones
        const collaboratorIds = [
          ...new Set(nominations.map((n) => n.collaborator_id)),
        ];

        if (collaboratorIds.length === 0) {
          setCollaboratorsDetails([]);
          return;
        }

        const { data, error } = await supabase
          .from("collaborators")
          .select("*")
          .in("id", collaboratorIds);

        if (!error && data) {
          const mapped: Collaborator[] = data.map(
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
          setCollaboratorsDetails(mapped);
        }
      } catch (error) {
        console.error("Error al cargar detalles de colaboradores:", error);
      }
    };

    loadCollaboratorsDetails();
  }, [nominations]);

  // Agrupar nominaciones por categoría
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
  const totalVoters = voters.length;

  // Calcular votantes que han votado (votantes únicos con nominaciones)
  const votersWhoVoted = useMemo(() => {
    const voterSet = new Set(nominations.map((n) => n.voter_id));
    return voterSet.size;
  }, [nominations]);

  const participationRate =
    totalVoters > 0 ? ((votersWhoVoted / totalVoters) * 100).toFixed(1) : "0";

  // Calcular total de votos por categoría
  const votesByCategory = useMemo(() => {
    return categories.map((category) => {
      const categoryNominations = nominationsByCategory[category.id] || [];
      const totalVotes = categoryNominations.reduce(
        (sum, n) => sum + n.count,
        0
      );
      return {
        category,
        totalVotes,
      };
    });
  }, [categories, nominationsByCategory]);

  // Top nominados global (suma de todas las categorías)
  const topNominated = useMemo(() => {
    const votes: Record<
      number,
      { collaborator: Collaborator; totalVotes: number; categories: number[] }
    > = {};

    nominations.forEach((nom) => {
      const collaborator = collaboratorsDetails.find(
        (c) => c.id === nom.collaborator_id
      );

      if (collaborator) {
        if (!votes[nom.collaborator_id]) {
          votes[nom.collaborator_id] = {
            collaborator,
            totalVotes: 0,
            categories: [],
          };
        }
        votes[nom.collaborator_id].totalVotes += 1;
        if (!votes[nom.collaborator_id].categories.includes(nom.category_id)) {
          votes[nom.collaborator_id].categories.push(nom.category_id);
        }
      }
    });

    return Object.values(votes)
      .sort((a, b) => b.totalVotes - a.totalVotes)
      .slice(0, 10);
  }, [nominations, collaboratorsDetails]);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-light text-white uppercase tracking-wide">
            Estadísticas
          </h1>
          <p className="text-white/60 text-xs sm:text-sm mt-1">
            Visualiza las estadísticas de votación y nominaciones
          </p>
        </div>

        {/* Skeleton de métricas generales */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[...Array(4)].map((_, index) => (
            <div
              key={index}
              className="rounded-2xl bg-black/20 border border-white/10 p-4 backdrop-blur relative overflow-hidden animate-pulse"
            >
              <div className="h-4 bg-white/10 rounded w-24 mb-2" />
              <div className="h-8 bg-white/10 rounded w-16" />
              <div className="absolute inset-0 animate-shimmer pointer-events-none" />
            </div>
          ))}
        </div>

        {/* Skeleton de gráfico de votaciones por categoría */}
        <div className="rounded-2xl bg-black/20 border border-white/10 p-4 backdrop-blur relative overflow-hidden animate-pulse">
          <div className="h-6 bg-white/10 rounded w-64 mb-4" />
          <div className="space-y-4">
            {[...Array(5)].map((_, index) => (
              <div key={index}>
                <div className="flex items-center justify-between mb-2">
                  <div className="h-4 bg-white/10 rounded w-32" />
                  <div className="h-4 bg-white/10 rounded w-16" />
                </div>
                <div className="h-3 bg-white/5 rounded-full" />
              </div>
            ))}
          </div>
          <div className="absolute inset-0 animate-shimmer pointer-events-none" />
        </div>

        {/* Skeleton de top 10 colaboradores */}
        <div className="rounded-2xl bg-black/20 border border-white/10 p-4 backdrop-blur relative overflow-hidden animate-pulse">
          <div className="h-6 bg-white/10 rounded w-64 mb-4" />
          <div className="space-y-2">
            {[...Array(5)].map((_, index) => (
              <div
                key={index}
                className="flex items-center gap-4 p-3 rounded-lg bg-white/5 border border-white/10"
              >
                <div className="size-8 bg-white/10 rounded-full" />
                <div className="size-10 bg-white/10 rounded-full" />
                <div className="flex-1">
                  <div className="h-4 bg-white/10 rounded w-32 mb-2" />
                  <div className="h-3 bg-white/5 rounded w-48" />
                </div>
                <div className="text-right">
                  <div className="h-6 bg-white/10 rounded w-12 mb-1" />
                  <div className="h-3 bg-white/5 rounded w-16" />
                </div>
              </div>
            ))}
          </div>
          <div className="absolute inset-0 animate-shimmer pointer-events-none" />
        </div>

        {/* Skeleton de detalle por categoría */}
        <div className="rounded-2xl bg-black/20 border border-white/10 p-4 backdrop-blur relative overflow-hidden animate-pulse">
          <div className="h-6 bg-white/10 rounded w-48 mb-4" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[...Array(4)].map((_, index) => (
              <div
                key={index}
                className="p-3 rounded-lg bg-white/5 border border-white/10 space-y-3"
              >
                <div className="h-5 bg-white/10 rounded w-32" />
                <div className="h-12 bg-white/5 rounded-lg" />
                <div className="h-12 bg-white/5 rounded-lg" />
                <div className="h-12 bg-white/5 rounded-lg" />
              </div>
            ))}
          </div>
          <div className="absolute inset-0 animate-shimmer pointer-events-none" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-light text-white uppercase tracking-wide">
          Estadísticas
        </h1>
        <p className="text-white/60 text-sm mt-1">
          Visualiza las estadísticas de votación y nominaciones
        </p>
      </div>

      {/* Métricas generales */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="rounded-2xl bg-black/20 border border-white/10 p-4 backdrop-blur">
          <p className="text-white/60 text-xs uppercase tracking-wide mb-1">
            Total Nominaciones
          </p>
          <p className="text-2xl font-semibold text-white">
            {totalNominations}
          </p>
        </div>
        <div className="rounded-2xl bg-black/20 border border-white/10 p-4 backdrop-blur">
          <p className="text-white/60 text-xs uppercase tracking-wide mb-1">
            Usuarios Votantes
          </p>
          <p className="text-2xl font-semibold text-[#FFD080]">
            {votersWhoVoted}
          </p>
        </div>
        <div className="rounded-2xl bg-black/20 border border-white/10 p-4 backdrop-blur">
          <p className="text-white/60 text-xs uppercase tracking-wide mb-1">
            Total Votantes
          </p>
          <p className="text-2xl font-semibold text-white">{totalVoters}</p>
        </div>
        <div className="rounded-2xl bg-black/20 border border-white/10 p-4 backdrop-blur">
          <p className="text-white/60 text-xs uppercase tracking-wide mb-1">
            Participación
          </p>
          <p className="text-2xl font-semibold text-white">
            {participationRate}%
          </p>
        </div>
      </div>

      {/* Gráfico de votaciones por categoría */}
      {votesByCategory.length > 0 && (
        <div className="rounded-2xl bg-black/20 border border-white/10 p-4 backdrop-blur">
          <h2 className="text-lg font-semibold text-white mb-4">
            Votaciones por Categoría
          </h2>
          <div className="space-y-4">
            {votesByCategory.map(({ category, totalVotes }) => {
              const maxVotes = Math.max(
                ...votesByCategory.map((v) => v.totalVotes),
                1
              );
              const percentage =
                maxVotes > 0 ? (totalVotes / maxVotes) * 100 : 0;

              return (
                <div key={category.id}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      {category.emoji && (
                        <span className="text-lg">{category.emoji}</span>
                      )}
                      <span className="text-white text-sm font-medium">
                        {category.name}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-white/60 text-xs">
                        {totalVotes} votos
                      </span>
                      <span className="text-[#FFD080] text-sm font-semibold">
                        {percentage.toFixed(0)}%
                      </span>
                    </div>
                  </div>
                  <div className="h-3 bg-white/5 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-linear-to-r from-[#FFD080] to-[#D4A574] rounded-full transition-all"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Top Nominados Global */}
      {topNominated.length > 0 && (
        <div className="rounded-2xl bg-black/20 border border-white/10 p-4 backdrop-blur">
          <h2 className="text-lg font-semibold text-white mb-4">
            Top 10 Colaboradores Más Nominados
          </h2>
          <div className="space-y-2">
            {topNominated.map((item, index) => (
              <div
                key={item.collaborator.id}
                className="flex items-center gap-4 p-3 rounded-lg bg-white/5 border border-white/10"
              >
                <div className="flex items-center justify-center size-8 rounded-full bg-[#FFD080]/20 text-[#FFD080] font-semibold text-sm border border-[#FFD080]/30 shrink-0">
                  {index + 1}
                </div>
                <img
                  src={item.collaborator.avatarUrl}
                  alt={item.collaborator.fullName}
                  className="size-10 rounded-full object-cover border border-white/20 shrink-0"
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
                        <span key={catId} className="text-xs text-white/60">
                          {cat.emoji && <span>{cat.emoji} </span>}
                          {cat.name}
                        </span>
                      ) : null;
                    })}
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-2xl font-semibold text-[#FFD080]">
                    {item.totalVotes}
                  </p>
                  <p className="text-xs text-white/60">votos totales</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Estadísticas detalladas por categoría */}
      {categories.length > 0 && (
        <div className="rounded-2xl bg-black/20 border border-white/10 p-4 backdrop-blur">
          <h2 className="text-lg font-semibold text-white mb-4">
            Detalle por Categoría
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {categories.map((category) => {
              const categoryNominations =
                nominationsByCategory[category.id] || [];
              const totalVotes = categoryNominations.reduce(
                (sum, n) => sum + n.count,
                0
              );
              const topThree = categoryNominations.slice(0, 3);

              const getPlaceLabel = (index: number) => {
                if (index === 0) return "Ganador";
                if (index === 1) return "2do Lugar";
                if (index === 2) return "3er Lugar";
                return "";
              };

              const getPlaceIcon = (index: number) => {
                if (index === 0) return "mdi:trophy";
                if (index === 1) return "mdi:trophy-variant";
                if (index === 2) return "mdi:trophy-outline";
                return "";
              };

              return (
                <div
                  key={category.id}
                  className="p-4 rounded-lg bg-white/5 border border-white/10"
                >
                  <div className="flex items-center gap-2 mb-3">
                    {category.emoji && (
                      <span className="text-xl">{category.emoji}</span>
                    )}
                    <h3 className="text-white font-semibold text-sm">
                      {category.name}
                    </h3>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-white/60 text-xs">
                        Total votos:
                      </span>
                      <span className="text-white font-semibold text-sm">
                        {totalVotes}
                      </span>
                    </div>
                    {topThree.length > 0 && (
                      <div className="pt-2 border-t border-white/10 space-y-3">
                        {topThree.map((nominee, index) => {
                          const collaborator = collaboratorsDetails.find(
                            (c) => c.id === nominee.collaboratorId
                          );
                          if (!collaborator) return null;

                          return (
                            <div key={nominee.collaboratorId}>
                              <div className="flex items-center gap-2 mb-1.5">
                                <Icon
                                  icon={getPlaceIcon(index)}
                                  className="text-[#FFD080]"
                                  width={16}
                                  height={16}
                                />
                                <p className="text-white/60 text-xs">
                                  {getPlaceLabel(index)}
                                </p>
                              </div>
                              <div className="flex items-center gap-2">
                                <img
                                  src={collaborator.avatarUrl}
                                  alt={collaborator.fullName}
                                  className="size-8 rounded-full object-cover border border-white/20 shrink-0"
                                  onError={(e) => {
                                    e.currentTarget.src =
                                      "https://via.placeholder.com/150?text=No+Image";
                                  }}
                                />
                                <div className="flex-1 min-w-0">
                                  <p className="text-white font-medium text-xs truncate">
                                    {collaborator.fullName}
                                  </p>
                                  <p className="text-[#FFD080] text-xs">
                                    {nominee.count} votos
                                  </p>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                    {topThree.length === 0 && (
                      <div className="pt-2 border-t border-white/10">
                        <p className="text-white/40 text-xs">
                          Aún no hay votos en esta categoría
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {categories.length === 0 && nominations.length === 0 && (
        <div className="rounded-2xl bg-black/20 border border-white/10 p-8 backdrop-blur text-center">
          <p className="text-white/70 text-sm">
            Aún no hay datos disponibles para mostrar estadísticas
          </p>
        </div>
      )}
    </div>
  );
}
