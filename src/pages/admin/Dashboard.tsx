import { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import Swal from "sweetalert2";
import Icon from "../../components/Icon";
import { supabase } from "../../lib/supabase";
import { getVotingStatus, setVotingStatus } from "../../lib/votingStatus";
import SelectWinnerModal from "../../components/admin/SelectWinnerModal";
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

export default function Dashboard() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [totalCollaborators, setTotalCollaborators] = useState<number>(0);
  const [nominations, setNominations] = useState<NominationData[]>([]);
  const [voters, setVoters] = useState<{ id: number }[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [votingOpen, setVotingOpen] = useState<boolean>(true);
  const [isSelectWinnerModalOpen, setIsSelectWinnerModalOpen] = useState(false);
  const [selectedCategoryForWinner, setSelectedCategoryForWinner] = useState<{
    id: number;
    name: string;
    emoji?: string;
  } | null>(null);

  // Cargar estado de votaciones
  useEffect(() => {
    const loadVotingStatus = async () => {
      const status = await getVotingStatus();
      setVotingOpen(status);
    };
    loadVotingStatus();
  }, []);

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

        // Cargar total de colaboradores
        const { data: collaboratorsData, error: collaboratorsError } =
          await supabase.from("collaborators").select("id");

        if (!collaboratorsError && collaboratorsData) {
          setTotalCollaborators(collaboratorsData.length);
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
        console.error("Error al cargar datos del dashboard:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadAllData();
  }, []);

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

  // Cargar detalles completos de colaboradores para el top 3
  const [collaboratorsDetails, setCollaboratorsDetails] = useState<
    Collaborator[]
  >([]);

  useEffect(() => {
    const loadCollaboratorsDetails = async () => {
      if (nominations.length === 0) return;

      try {
        // Obtener IDs únicos de colaboradores que tienen nominaciones
        const collaboratorIds = [
          ...new Set(nominations.map((n) => n.collaborator_id)),
        ];

        if (collaboratorIds.length === 0) return;

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

  // Top 3 colaboradores más nominados
  const topThreeNominated = useMemo(() => {
    const votes: Record<
      number,
      { collaborator: Collaborator; totalVotes: number }
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
          };
        }
        votes[nom.collaborator_id].totalVotes += 1;
      }
    });

    return Object.values(votes)
      .sort((a, b) => b.totalVotes - a.totalVotes)
      .slice(0, 3);
  }, [nominations, collaboratorsDetails]);

  // Categoría con más votos
  const categoryWithMostVotes = useMemo<{
    category: Category;
    votes: number;
  } | null>(() => {
    let maxVotes = 0;
    let categoryWithMax: Category | null = null;

    categories.forEach((category) => {
      const categoryNominations = nominationsByCategory[category.id] || [];
      const totalVotes = categoryNominations.reduce(
        (sum, n) => sum + n.count,
        0
      );
      if (totalVotes > maxVotes) {
        maxVotes = totalVotes;
        categoryWithMax = category;
      }
    });

    return categoryWithMax
      ? { category: categoryWithMax, votes: maxVotes }
      : null;
  }, [categories, nominationsByCategory]);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div>
          <h1 className="text-2xl font-light text-white uppercase tracking-wide">
            Dashboard
          </h1>
          <p className="text-white/60 text-sm mt-1">
            Panel de administración de IT Awards 2025
          </p>
        </div>

        {/* Skeleton de métricas principales */}
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

        {/* Skeleton de resumen de votantes y categoría más activa */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {[...Array(2)].map((_, index) => (
            <div
              key={index}
              className="rounded-2xl bg-black/20 border border-white/10 p-4 backdrop-blur relative overflow-hidden animate-pulse"
            >
              <div className="h-6 bg-white/10 rounded w-40 mb-4" />
              <div className="space-y-3">
                <div className="h-4 bg-white/10 rounded w-full" />
                <div className="h-4 bg-white/10 rounded w-3/4" />
                <div className="h-4 bg-white/10 rounded w-2/3" />
              </div>
              <div className="absolute inset-0 animate-shimmer pointer-events-none" />
            </div>
          ))}
        </div>

        {/* Skeleton de top 3 colaboradores */}
        <div className="rounded-2xl bg-black/20 border border-white/10 p-4 backdrop-blur relative overflow-hidden animate-pulse">
          <div className="h-6 bg-white/10 rounded w-64 mb-4" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {[...Array(3)].map((_, index) => (
              <div
                key={index}
                className="p-4 rounded-lg bg-white/5 border border-white/10 space-y-2"
              >
                <div className="h-6 bg-white/10 rounded w-3/4" />
                <div className="h-16 w-16 rounded-full bg-white/10 mx-auto" />
                <div className="h-6 bg-white/10 rounded w-12 mx-auto" />
              </div>
            ))}
          </div>
          <div className="absolute inset-0 animate-shimmer pointer-events-none" />
        </div>

        {/* Skeleton de resumen por categoría */}
        <div className="rounded-2xl bg-black/20 border border-white/10 p-4 backdrop-blur relative overflow-hidden animate-pulse">
          <div className="h-6 bg-white/10 rounded w-48 mb-4" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
            {[...Array(5)].map((_, index) => (
              <div
                key={index}
                className="p-3 rounded-lg bg-white/5 border border-white/10 space-y-2"
              >
                <div className="h-4 bg-white/10 rounded w-full" />
                <div className="h-6 bg-white/10 rounded w-12" />
                <div className="h-3 bg-white/5 rounded w-16" />
              </div>
            ))}
          </div>
          <div className="absolute inset-0 animate-shimmer pointer-events-none" />
        </div>
      </div>
    );
  }

  const handleToggleVoting = async () => {
    const newStatus = !votingOpen;
    const result = await Swal.fire({
      title: newStatus ? "¿Abrir votaciones?" : "¿Cerrar votaciones?",
      html: `
        <div style="text-align: left; color: rgba(255, 255, 255, 0.9); font-size: 14px;">
          <p style="margin-bottom: 12px;">
            ${newStatus
              ? "Las votaciones se abrirán y los usuarios podrán votar nuevamente."
              : "Las votaciones se cerrarán y los usuarios no podrán votar más. Podrás mostrar los ganadores."}
          </p>
        </div>
      `,
      icon: "question",
      showCancelButton: true,
      confirmButtonText: newStatus ? "Sí, abrir" : "Sí, cerrar",
      cancelButtonText: "Cancelar",
      confirmButtonColor: "#FFD080",
      cancelButtonColor: "#6c757d",
      background: "#080808",
      color: "#ffffff",
      customClass: {
        popup: "swal2-popup-custom",
        title: "swal2-title-custom",
        htmlContainer: "swal2-html-container-custom",
        confirmButton: "swal2-confirm-custom",
        cancelButton: "swal2-cancel-custom",
      },
    });

    if (result.isConfirmed) {
      await setVotingStatus(newStatus);
      setVotingOpen(newStatus);
      await Swal.fire({
        title: newStatus ? "¡Votaciones abiertas!" : "¡Votaciones cerradas!",
        text: newStatus
          ? "Los usuarios ahora pueden votar."
          : "Las votaciones han sido cerradas. Puedes mostrar los ganadores.",
        icon: "success",
        confirmButtonColor: "#FFD080",
        background: "#080808",
        color: "#ffffff",
        timer: 2000,
        timerProgressBar: true,
      });
    }
  };

  const handleShowWinner = (category: Category) => {
    setSelectedCategoryForWinner({
      id: category.id,
      name: category.name,
      emoji: category.emoji,
    });
    setIsSelectWinnerModalOpen(true);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-light text-white uppercase tracking-wide">
            Dashboard
          </h1>
          <p className="text-white/60 text-xs sm:text-sm mt-1">
            Panel de administración de IT Awards 2025
          </p>
        </div>
        
        {/* Botones de control */}
        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          <button
            onClick={handleToggleVoting}
            className={`px-4 py-2 rounded-lg font-semibold text-sm transition ${
              votingOpen
                ? "bg-red-500/20 border border-red-500/30 text-red-400 hover:bg-red-500/30"
                : "bg-green-500/20 border border-green-500/30 text-green-400 hover:bg-green-500/30"
            }`}
          >
            <div className="flex items-center gap-2">
              <Icon
                icon={votingOpen ? "mdi:lock" : "mdi:lock-open"}
                width={18}
                height={18}
              />
              <span>{votingOpen ? "Cerrar Votaciones" : "Abrir Votaciones"}</span>
            </div>
          </button>
        </div>
      </div>

      {/* Métricas principales */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-3">
        <div className="rounded-2xl bg-black/20 border border-white/10 p-3 sm:p-4 backdrop-blur">
          <p className="text-white/60 text-[10px] sm:text-xs uppercase tracking-wide mb-1 line-clamp-1">
            Total Categorías
          </p>
          <p className="text-xl sm:text-2xl font-semibold text-white">
            {categories.length}
          </p>
        </div>

        <div className="rounded-2xl bg-black/20 border border-white/10 p-3 sm:p-4 backdrop-blur">
          <p className="text-white/60 text-[10px] sm:text-xs uppercase tracking-wide mb-1 line-clamp-1">
            Total Colaboradores
          </p>
          <p className="text-xl sm:text-2xl font-semibold text-white">
            {totalCollaborators}
          </p>
        </div>

        <div className="rounded-2xl bg-black/20 border border-white/10 p-3 sm:p-4 backdrop-blur">
          <p className="text-white/60 text-[10px] sm:text-xs uppercase tracking-wide mb-1 line-clamp-1">
            Total Nominaciones
          </p>
          <p className="text-xl sm:text-2xl font-semibold text-[#FFD080]">
            {totalNominations}
          </p>
        </div>

        <div className="rounded-2xl bg-black/20 border border-white/10 p-3 sm:p-4 backdrop-blur">
          <p className="text-white/60 text-[10px] sm:text-xs uppercase tracking-wide mb-1 line-clamp-1">
            Participación
          </p>
          <p className="text-xl sm:text-2xl font-semibold text-white">
            {participationRate}%
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Resumen de votantes */}
        <div className="rounded-2xl bg-black/20 border border-white/10 p-3 sm:p-4 backdrop-blur">
          <h2 className="text-base sm:text-lg font-semibold text-white mb-3 sm:mb-4">
            Resumen de Votantes
          </h2>
          <div className="space-y-2 sm:space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-white/60 text-xs sm:text-sm">
                Total votantes:
              </span>
              <span className="text-white font-semibold text-sm sm:text-base">
                {totalVoters}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-white/60 text-xs sm:text-sm">
                Ya votaron:
              </span>
              <span className="text-[#FFD080] font-semibold text-sm sm:text-base">
                {votersWhoVoted}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-white/60 text-xs sm:text-sm">
                Pendientes:
              </span>
              <span className="text-white/60 font-semibold text-sm sm:text-base">
                {totalVoters - votersWhoVoted}
              </span>
            </div>
            <div className="pt-2 border-t border-white/10">
              <div className="flex items-center justify-between mb-2">
                <span className="text-white/60 text-xs">Progreso</span>
                <span className="text-[#FFD080] text-xs font-semibold">
                  {participationRate}%
                </span>
              </div>
              <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                <div
                  className="h-full bg-linear-to-r from-[#FFD080] to-[#D4A574] rounded-full transition-all"
                  style={{ width: `${participationRate}%` }}
                />
              </div>
            </div>
            <div className="pt-2">
              <Link
                to="/admin/usuarios"
                className="text-xs text-[#FFD080] hover:text-[#FFD080]/80 transition"
              >
                Ver listado completo →
              </Link>
            </div>
          </div>
        </div>

        {/* Categoría más votada */}
        <div className="rounded-2xl bg-black/20 border border-white/10 p-3 sm:p-4 backdrop-blur">
          <h2 className="text-base sm:text-lg font-semibold text-white mb-3 sm:mb-4">
            Categoría Más Activa
          </h2>
          <div className="space-y-3">
            {categoryWithMostVotes ? (
              <>
                <div className="flex items-center gap-3">
                  {categoryWithMostVotes.category.emoji && (
                    <span className="text-3xl">
                      {categoryWithMostVotes.category.emoji}
                    </span>
                  )}
                  <div>
                    <p className="text-white font-semibold text-sm">
                      {categoryWithMostVotes.category.name}
                    </p>
                    <p className="text-white/60 text-xs">
                      {categoryWithMostVotes.votes} votos recibidos
                    </p>
                  </div>
                </div>
                <div className="pt-2 border-t border-white/10">
                  <Link
                    to="/admin/categorias"
                    className="text-xs text-[#FFD080] hover:text-[#FFD080]/80 transition"
                  >
                    Ver todas las categorías →
                  </Link>
                </div>
              </>
            ) : (
              <p className="text-white/60 text-sm">
                Aún no hay votos registrados
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Ganadores por Categoría */}
      {!votingOpen && categories.length > 0 && (
        <div className="rounded-2xl bg-black/20 border border-white/10 p-3 sm:p-4 backdrop-blur">
          <div className="flex items-center justify-between mb-3 sm:mb-4">
            <h2 className="text-base sm:text-lg font-semibold text-white">
              Mostrar Ganadores
            </h2>
            <span className="text-xs text-white/60 bg-red-500/20 px-2 py-1 rounded border border-red-500/30">
              Votaciones Cerradas
            </span>
          </div>
          <p className="text-white/60 text-xs sm:text-sm mb-4">
            Selecciona una categoría para mostrar el ganador en una nueva ventana con confeti
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-3">
            {categories.map((category) => {
              const categoryNominations = nominationsByCategory[category.id] || [];
              const hasVotes = categoryNominations.length > 0;

              return (
                <button
                  key={category.id}
                  onClick={() => handleShowWinner(category)}
                  disabled={!hasVotes}
                  className={`p-3 rounded-lg border transition text-left ${
                    hasVotes
                      ? "bg-white/5 border-white/15 hover:bg-white/10 hover:border-[#FFD080]/30"
                      : "bg-white/5 border-white/10 opacity-50 cursor-not-allowed"
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    {category.emoji && <span className="text-lg">{category.emoji}</span>}
                    <span className="text-white font-medium text-sm truncate">
                      {category.name}
                    </span>
                  </div>
                  <p className="text-white/60 text-xs">
                    {hasVotes
                      ? `${categoryNominations.length} candidato(s) con votos`
                      : "Sin votos"}
                  </p>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Top 3 Colaboradores */}
      {topThreeNominated.length > 0 && (
        <div className="rounded-2xl bg-black/20 border border-white/10 p-3 sm:p-4 backdrop-blur">
          <h2 className="text-base sm:text-lg font-semibold text-white mb-3 sm:mb-4">
            Top 3 Colaboradores Más Nominados
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {topThreeNominated.map((item, index) => {
              const medalIcons = [
                "mdi:trophy",
                "mdi:trophy-variant",
                "mdi:trophy-outline",
              ];
              return (
                <div
                  key={item.collaborator.id}
                  className="p-4 rounded-lg bg-white/5 border border-white/10"
                >
                  <div className="flex items-center gap-3 mb-2">
                    <Icon
                      icon={medalIcons[index]}
                      className="text-[#FFD080]"
                      width={24}
                      height={24}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-white font-semibold text-sm truncate">
                        {item.collaborator.fullName}
                      </p>
                    </div>
                  </div>
                  <img
                    src={item.collaborator.avatarUrl}
                    alt={item.collaborator.fullName}
                    className="size-16 rounded-full object-cover border-2 border-[#FFD080]/30 mx-auto mb-2"
                    onError={(e) => {
                      e.currentTarget.src =
                        "https://via.placeholder.com/150?text=No+Image";
                    }}
                  />
                  <div className="text-center">
                    <p className="text-2xl font-semibold text-[#FFD080]">
                      {item.totalVotes}
                    </p>
                    <p className="text-white/60 text-xs">votos totales</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Resumen rápido por categoría */}
      <div className="rounded-2xl bg-black/20 border border-white/10 p-3 sm:p-4 backdrop-blur">
        <div className="flex items-center justify-between mb-3 sm:mb-4 flex-wrap gap-2">
          <h2 className="text-base sm:text-lg font-semibold text-white">
            Resumen por Categoría
          </h2>
          <Link
            to="/admin/nominaciones"
            className="text-xs text-[#FFD080] hover:text-[#FFD080]/80 transition"
          >
            Ver detalles →
          </Link>
        </div>
        {categories.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
            {categories.map((category) => {
              const categoryNominations =
                nominationsByCategory[category.id] || [];
              const totalVotes = categoryNominations.reduce(
                (sum, n) => sum + n.count,
                0
              );
              return (
                <div
                  key={category.id}
                  className="p-3 rounded-lg bg-white/5 border border-white/10"
                >
                  <div className="flex items-center gap-2 mb-2">
                    {category.emoji && (
                      <span className="text-lg">{category.emoji}</span>
                    )}
                    <p className="text-white font-medium text-xs truncate">
                      {category.name}
                    </p>
                  </div>
                  <p className="text-[#FFD080] text-lg font-semibold">
                    {totalVotes}
                  </p>
                  <p className="text-white/60 text-xs">votos</p>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-white/60 text-sm text-center py-4">
            No hay categorías registradas aún
          </p>
        )}
      </div>

      {/* Modal para seleccionar ganador */}
      {selectedCategoryForWinner && (
        <SelectWinnerModal
          isOpen={isSelectWinnerModalOpen}
          onClose={() => {
            setIsSelectWinnerModalOpen(false);
            setSelectedCategoryForWinner(null);
          }}
          categoryId={selectedCategoryForWinner.id}
          categoryName={selectedCategoryForWinner.name}
          categoryEmoji={selectedCategoryForWinner.emoji}
        />
      )}
    </div>
  );
}
