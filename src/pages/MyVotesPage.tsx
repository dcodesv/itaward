import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { useAuthStore } from "../store/useAuthStore";
import { useNominationsStore } from "../store/useNominationsStore";
import { supabase } from "../lib/supabase";
import type { Category, Collaborator } from "../types";

type VoteDetail = {
  category: Category;
  collaborator: Collaborator;
};

export default function MyVotesPage() {
  const { voterId, employeeCode, fullName } = useAuthStore();
  const { getCurrentUserNominations, syncWithSupabase, clearNomination } =
    useNominationsStore();
  const [votes, setVotes] = useState<VoteDetail[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [totalCategories, setTotalCategories] = useState(0);

  // Función para cargar todos los votos del usuario
  const loadMyVotes = useCallback(async () => {
    if (!voterId || !employeeCode) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);

      // Sincronizar primero las nominaciones
      await syncWithSupabase();

      // Obtener las nominaciones del usuario desde el store
      const userNominations = getCurrentUserNominations();

      // Cargar todas las categorías
      const { data: categoriesData, error: categoriesError } = await supabase
        .from("categories")
        .select("*")
        .order("name", { ascending: true });

      if (categoriesError) {
        console.error("Error al cargar categorías:", categoriesError);
        setIsLoading(false);
        return;
      }

      // Contar total de categorías
      setTotalCategories(categoriesData?.length || 0);

      // Filtrar solo las categorías que tienen nominación
      const categoriesWithVotes = categoriesData?.filter((cat) => {
        const categoryIdStr = cat.id.toString();
        return (
          userNominations[categoryIdStr] &&
          userNominations[categoryIdStr] !== null
        );
      });

      if (!categoriesWithVotes || categoriesWithVotes.length === 0) {
        setVotes([]);
        setIsLoading(false);
        return;
      }

      // Para cada categoría con voto, cargar el colaborador
      const votesDetails: VoteDetail[] = [];

      for (const cat of categoriesWithVotes) {
        const collaboratorIdStr = userNominations[cat.id.toString()];
        if (!collaboratorIdStr) continue;

        const collaboratorId = parseInt(collaboratorIdStr, 10);
        if (isNaN(collaboratorId)) continue;

        const { data: collaboratorData, error: collaboratorError } =
          await supabase
            .from("collaborators")
            .select("*")
            .eq("id", collaboratorId)
            .single();

        if (collaboratorError || !collaboratorData) {
          console.error(
            `Error al cargar colaborador ${collaboratorId}:`,
            collaboratorError
          );
          continue;
        }

        votesDetails.push({
          category: {
            id: cat.id,
            name: cat.name,
            description: cat.description || undefined,
            emoji: cat.emoji || undefined,
          },
          collaborator: {
            id: collaboratorData.id,
            fullName: collaboratorData.full_name,
            avatarUrl: collaboratorData.avatar_url,
            role: collaboratorData.role || undefined,
          },
        });
      }

      setVotes(votesDetails);
    } catch (error) {
      console.error("Error inesperado al cargar votos:", error);
    } finally {
      setIsLoading(false);
    }
  }, [voterId, employeeCode, getCurrentUserNominations, syncWithSupabase]);

  // Cargar votos cuando cambian las dependencias
  useEffect(() => {
    loadMyVotes();
  }, [loadMyVotes]);

  const handleRemoveVote = async (categoryId: number) => {
    if (
      !confirm(
        "¿Estás seguro de que quieres quitar este voto? Podrás votar de nuevo más tarde."
      )
    ) {
      return;
    }

    try {
      await clearNomination(categoryId.toString());
      // Recargar los votos después de eliminar
      await loadMyVotes();
    } catch (error) {
      console.error("Error al quitar voto:", error);
    }
  };

  if (!employeeCode || !fullName) {
    return (
      <div className="min-h-screen bg-linear-to-l from-[#080808] via-[#101019] to-[#080808] relative overflow-hidden pt-10">
        <div className="relative w-full px-4 md:px-10 py-12 flex flex-col gap-10 items-center justify-center">
          <div className="rounded-3xl bg-white/5 border border-white/10 p-8 backdrop-blur text-center">
            <p className="text-white/70 text-sm mb-4">
              Debes iniciar sesión para ver tus votos
            </p>
            <Link
              to="/login"
              className="inline-flex items-center justify-center px-6 py-3 rounded-full bg-linear-to-r from-[#FFD080] to-[#D4A574] text-[#080808] font-semibold hover:opacity-90 transition"
            >
              Iniciar Sesión
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const votesCount = votes.length;

  return (
    <div className="min-h-screen bg-linear-to-l from-[#080808] via-[#101019] to-[#080808] relative overflow-hidden pt-10">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -bottom-40 -left-40 size-[400px] rounded-full bg-[#FFD080]/20 blur-3xl" />
        <div className="absolute -bottom-40 -right-40 size-[400px] rounded-full bg-[#FFD080]/20 blur-3xl" />
        <div className="absolute top-[250px] mx-auto left-0 right-0 size-[400px] rounded-full bg-[#FFD080]/15 blur-3xl" />
      </div>

      <section className="relative w-full px-4 md:px-10 py-12 flex flex-col gap-10">
        <header className="flex flex-col items-center text-center gap-3 sm:gap-4 px-4">
          <div>
            <p className="text-white/60 uppercase tracking-[0.2em] sm:tracking-[0.3em] text-sm sm:text-base md:text-lg">
              Mis Votos
            </p>
            <h1 className="mt-2 text-base sm:text-lg md:text-xl font-light text-white uppercase max-w-2xl">
              Revisa todas tus nominaciones
            </h1>
          </div>
        </header>

        {/* Resumen */}
        <div className="rounded-3xl bg-white/5 border border-white/10 p-6 backdrop-blur">
          {isLoading ? (
            <div className="relative flex flex-col md:flex-row items-center justify-between gap-4 animate-pulse overflow-hidden">
              <div className="text-center md:text-left space-y-3 flex-1">
                <div className="h-4 bg-white/10 rounded w-40 mx-auto md:mx-0" />
                <div className="h-10 bg-white/10 rounded w-24 mx-auto md:mx-0" />
                <div className="h-4 bg-white/5 rounded w-64 mx-auto md:mx-0" />
              </div>
              <div className="h-12 bg-white/10 rounded-full w-48" />
              {/* Efecto shimmer */}
              <div className="absolute inset-0 animate-shimmer pointer-events-none" />
            </div>
          ) : (
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="text-center md:text-left">
                <p className="text-white/60 text-sm uppercase tracking-wide">
                  Resumen de tus Votos
                </p>
                <p className="text-3xl font-semibold text-[#FFD080] mt-1">
                  {votesCount} / {totalCategories}
                </p>
                <p className="text-white/60 text-xs mt-1">
                  {votesCount === totalCategories
                    ? "¡Has completado todas tus votaciones! 🎉"
                    : `Te faltan ${totalCategories - votesCount} categorías por votar`}
                </p>
              </div>
              <Link
                to="/categorias"
                className="w-full sm:w-auto px-6 py-3 rounded-full bg-linear-to-r from-[#FFD080] to-[#D4A574] text-[#080808] font-semibold hover:opacity-90 transition text-sm text-center"
              >
                {votesCount === totalCategories
                  ? "Ver Categorías"
                  : "Continuar Votando"}
              </Link>
            </div>
          )}
        </div>

        {/* Lista de votos */}
        <div className="rounded-3xl bg-black/25 border border-white/10 p-6 md:p-10 backdrop-blur">
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
              {[...Array(6)].map((_, index) => (
                <div
                  key={index}
                  className="relative rounded-2xl bg-white/5 border border-white/10 p-5 backdrop-blur animate-pulse overflow-hidden"
                >
                  {/* Skeleton para categoría */}
                  <div className="flex items-center gap-2 pb-3 border-b border-white/10 mb-4">
                    <div className="size-6 rounded-full bg-white/10 shrink-0" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-white/10 rounded w-3/4" />
                      <div className="h-3 bg-white/5 rounded w-full" />
                    </div>
                  </div>

                  {/* Skeleton para colaborador */}
                  <div className="flex flex-col items-center text-center gap-3 mb-4">
                    <div className="size-20 rounded-full bg-white/10" />
                    <div className="w-full space-y-2">
                      <div className="h-5 bg-white/10 rounded w-3/4 mx-auto" />
                      <div className="h-4 bg-white/5 rounded w-1/2 mx-auto" />
                    </div>
                  </div>

                  {/* Skeleton para botones */}
                  <div className="flex flex-col gap-2 pt-3 border-t border-white/10">
                    <div className="h-10 bg-white/10 rounded-lg w-full" />
                    <div className="h-10 bg-white/5 rounded-lg w-full" />
                  </div>

                  {/* Efecto shimmer */}
                  <div className="absolute inset-0 animate-shimmer pointer-events-none" />
                </div>
              ))}
            </div>
          ) : votes.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
              {votes.map((vote) => (
                <div
                  key={`${vote.category.id}-${vote.collaborator.id}`}
                  className="rounded-2xl bg-white/5 border border-white/10 p-5 backdrop-blur hover:border-[#FFD080]/50 transition-all"
                >
                  <div className="flex flex-col gap-4">
                    {/* Categoría */}
                    <div className="flex items-center gap-2 pb-3 border-b border-white/10">
                      {vote.category.emoji && (
                        <span className="text-2xl">{vote.category.emoji}</span>
                      )}
                      <div className="flex-1 min-w-0">
                        <h3 className="text-white font-semibold text-sm truncate">
                          {vote.category.name}
                        </h3>
                        {vote.category.description && (
                          <p className="text-white/50 text-xs mt-0.5 line-clamp-2">
                            {vote.category.description}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Colaborador votado */}
                    <div className="flex flex-col items-center text-center gap-3">
                      <img
                        src={vote.collaborator.avatarUrl}
                        alt={vote.collaborator.fullName}
                        className="size-20 rounded-full object-cover border-2 border-[#FFD080]/30 shadow-lg"
                        onError={(e) => {
                          e.currentTarget.src =
                            "https://via.placeholder.com/150?text=No+Image";
                        }}
                      />
                      <div className="w-full">
                        <p className="text-white font-semibold text-base">
                          {vote.collaborator.fullName}
                        </p>
                        {vote.collaborator.role && (
                          <p className="text-white/60 text-sm mt-1">
                            {vote.collaborator.role}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Acciones */}
                    <div className="flex flex-col gap-2 pt-3 border-t border-white/10">
                      <Link
                        to={`/categorias/${vote.category.id}`}
                        className="w-full px-4 py-2 rounded-lg border border-[#FFD080]/30 text-[#FFD080] text-sm font-medium hover:bg-[#FFD080]/10 transition text-center"
                      >
                        Cambiar Voto
                      </Link>
                      <button
                        onClick={() => handleRemoveVote(vote.category.id)}
                        className="w-full px-4 py-2 rounded-lg border border-white/20 text-white/70 text-sm font-medium hover:bg-white/10 hover:text-white transition"
                      >
                        Quitar Voto
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-white/70 text-sm mb-4">
                Aún no has realizado ninguna nominación
              </p>
              <Link
                to="/categorias"
                className="inline-flex items-center justify-center px-6 py-3 rounded-full bg-linear-to-r from-[#FFD080] to-[#D4A574] text-[#080808] font-semibold hover:opacity-90 transition"
              >
                Comenzar a Votar
              </Link>
            </div>
          )}
        </div>

        {votes.length > 0 && (
          <p className="text-center text-white/60 text-sm">
            Puedes cambiar o quitar tus votos en cualquier momento antes de que
            se cierren las votaciones.
          </p>
        )}
      </section>
    </div>
  );
}

