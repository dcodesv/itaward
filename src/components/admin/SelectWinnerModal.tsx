import { useState, useEffect } from "react";
import Modal from "../Modal";
import { supabase } from "../../lib/supabase";
import Icon from "../Icon";
import type { Category, Collaborator } from "../../types";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  categoryId: number;
  categoryName: string;
  categoryEmoji?: string;
};

type TopCandidate = {
  collaborator: Collaborator;
  votes: number;
  position: number;
};

export default function SelectWinnerModal({
  isOpen,
  onClose,
  categoryId,
  categoryName,
  categoryEmoji,
}: Props) {
  const [topCandidates, setTopCandidates] = useState<TopCandidate[]>([]);
  const [selectedPosition, setSelectedPosition] = useState<number>(1);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      loadTopCandidates();
    }
  }, [isOpen, categoryId]);

  const loadTopCandidates = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Cargar nominaciones de esta categoría
      const { data: nominations, error: nominationsError } = await supabase
        .from("nominations")
        .select("collaborator_id")
        .eq("category_id", categoryId);

      if (nominationsError) {
        setError("Error al cargar nominaciones");
        setIsLoading(false);
        return;
      }

      // Contar votos por colaborador
      const voteCounts: Record<number, number> = {};
      nominations?.forEach((nom: { collaborator_id: number }) => {
        voteCounts[nom.collaborator_id] = (voteCounts[nom.collaborator_id] || 0) + 1;
      });

      // Ordenar por votos y obtener top 3
      const sorted = Object.entries(voteCounts)
        .map(([collaboratorId, count]) => ({
          collaboratorId: parseInt(collaboratorId, 10),
          count,
        }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 3);

      // Cargar datos de los colaboradores
      const collaboratorIds = sorted.map((s) => s.collaboratorId);
      if (collaboratorIds.length === 0) {
        setTopCandidates([]);
        setIsLoading(false);
        return;
      }

      const { data: collaboratorsData, error: collaboratorsError } = await supabase
        .from("collaborators")
        .select("*")
        .in("id", collaboratorIds);

      if (collaboratorsError) {
        setError("Error al cargar colaboradores");
        setIsLoading(false);
        return;
      }

      // Mapear colaboradores con sus votos y posiciones
      const candidates: TopCandidate[] = sorted.map((item, index) => {
        const collaboratorData = collaboratorsData?.find(
          (c: { id: number }) => c.id === item.collaboratorId
        );

        if (!collaboratorData) {
          return null;
        }

        return {
          collaborator: {
            id: collaboratorData.id,
            fullName: collaboratorData.full_name,
            avatarUrl: collaboratorData.avatar_url,
            role: collaboratorData.role || undefined,
          },
          votes: item.count,
          position: index + 1,
        };
      }).filter((c): c is TopCandidate => c !== null);

      setTopCandidates(candidates);
      if (candidates.length > 0) {
        setSelectedPosition(1); // Por defecto seleccionar el primero
      }
    } catch (error) {
      console.error("Error inesperado:", error);
      setError("Error al cargar candidatos");
    } finally {
      setIsLoading(false);
    }
  };

  const handleShowWinner = () => {
    if (selectedPosition && topCandidates.length > 0) {
      const winnerUrl = `/ganador?categoryId=${categoryId}&position=${selectedPosition}`;
      window.open(winnerUrl, "_blank", "width=1200,height=800");
      onClose();
    }
  };

  const positionLabels: Record<number, { label: string; icon: string; emoji: string }> = {
    1: { label: "Primer Lugar", icon: "mdi:trophy", emoji: "🥇" },
    2: { label: "Segundo Lugar", icon: "mdi:trophy-variant", emoji: "🥈" },
    3: { label: "Tercer Lugar", icon: "mdi:trophy-outline", emoji: "🥉" },
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Ganador - ${categoryEmoji || ""} ${categoryName}`}
    >
      <div className="space-y-6">
        {isLoading ? (
          <div className="py-8 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#FFD080] mx-auto mb-4"></div>
            <p className="text-white/60 text-sm">Cargando candidatos...</p>
          </div>
        ) : error ? (
          <div className="p-4 rounded-lg bg-red-500/20 border border-red-500/30">
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        ) : topCandidates.length === 0 ? (
          <div className="py-8 text-center">
            <p className="text-white/60 text-sm">
              No hay votos registrados en esta categoría aún.
            </p>
          </div>
        ) : (
          <>
            <div>
              <p className="text-white/80 text-sm font-medium mb-4">
                Selecciona la posición del ganador a mostrar:
              </p>
              <div className="space-y-3">
                {topCandidates.map((candidate) => {
                  const positionInfo = positionLabels[candidate.position];
                  const isSelected = selectedPosition === candidate.position;

                  return (
                    <button
                      key={candidate.collaborator.id}
                      onClick={() => setSelectedPosition(candidate.position)}
                      className={`w-full p-4 rounded-lg border transition-all ${
                        isSelected
                          ? "bg-[#FFD080]/20 border-[#FFD080] border-2"
                          : "bg-white/5 border-white/15 hover:bg-white/10"
                      }`}
                    >
                      <div className="flex items-center gap-4">
                        <div className="flex-shrink-0">
                          <div
                            className={`size-12 rounded-full flex items-center justify-center text-2xl ${
                              isSelected ? "bg-[#FFD080]/20" : "bg-white/10"
                            }`}
                          >
                            {positionInfo.emoji}
                          </div>
                        </div>
                        <div className="flex-1 text-left">
                          <div className="flex items-center gap-2 mb-1">
                            <Icon
                              icon={positionInfo.icon}
                              className={isSelected ? "text-[#FFD080]" : "text-white/60"}
                              width={20}
                              height={20}
                            />
                            <span
                              className={`font-semibold ${
                                isSelected ? "text-[#FFD080]" : "text-white"
                              }`}
                            >
                              {positionInfo.label}
                            </span>
                          </div>
                          <p className="text-white font-medium text-sm">
                            {candidate.collaborator.fullName}
                          </p>
                          {candidate.collaborator.role && (
                            <p className="text-white/60 text-xs">
                              {candidate.collaborator.role}
                            </p>
                          )}
                        </div>
                        <div className="flex-shrink-0 text-right">
                          <p className="text-[#FFD080] font-semibold text-lg">
                            {candidate.votes}
                          </p>
                          <p className="text-white/60 text-xs">
                            {candidate.votes === 1 ? "voto" : "votos"}
                          </p>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex items-center gap-3 pt-4 border-t border-white/10">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2 rounded-lg border border-white/20 text-white/70 hover:text-white hover:bg-white/10 transition"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleShowWinner}
                className="flex-1 px-4 py-2 rounded-lg bg-linear-to-r from-[#FFD080] to-[#D4A574] text-[#080808] font-semibold hover:opacity-90 transition"
              >
                Mostrar Ganador
              </button>
            </div>
          </>
        )}
      </div>
    </Modal>
  );
}

