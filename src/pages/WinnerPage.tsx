import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { supabase } from "../lib/supabase";
import type { Category, Collaborator } from "../types";
import Confetti from "react-confetti";
import Icon from "../components/Icon";

export default function WinnerPage() {
  const [searchParams] = useSearchParams();
  const categoryId = searchParams.get("categoryId");
  const position = searchParams.get("position") || "1"; // 1, 2, o 3
  
  const [category, setCategory] = useState<Category | null>(null);
  const [winner, setWinner] = useState<Collaborator | null>(null);
  const [votes, setVotes] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(true);
  const [windowSize, setWindowSize] = useState({
    width: window.innerWidth,
    height: window.innerHeight,
  });

  useEffect(() => {
    const handleResize = () => {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    const loadWinner = async () => {
      if (!categoryId) {
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        const categoryIdNum = parseInt(categoryId, 10);

        // Cargar categoría
        const { data: categoryData, error: categoryError } = await supabase
          .from("categories")
          .select("*")
          .eq("id", categoryIdNum)
          .single();

        if (categoryError || !categoryData) {
          console.error("Error al cargar categoría:", categoryError);
          setIsLoading(false);
          return;
        }

        setCategory({
          id: categoryData.id,
          name: categoryData.name,
          description: categoryData.description || undefined,
          emoji: categoryData.emoji || undefined,
        });

        // Cargar nominaciones de esta categoría
        const { data: nominations, error: nominationsError } = await supabase
          .from("nominations")
          .select("collaborator_id")
          .eq("category_id", categoryIdNum);

        if (nominationsError) {
          console.error("Error al cargar nominaciones:", nominationsError);
          setIsLoading(false);
          return;
        }

        // Contar votos por colaborador
        const voteCounts: Record<number, number> = {};
        nominations?.forEach((nom: { collaborator_id: number }) => {
          voteCounts[nom.collaborator_id] = (voteCounts[nom.collaborator_id] || 0) + 1;
        });

        // Ordenar por votos y obtener la posición solicitada
        const sorted = Object.entries(voteCounts)
          .map(([collaboratorId, count]) => ({
            collaboratorId: parseInt(collaboratorId, 10),
            count,
          }))
          .sort((a, b) => b.count - a.count);

        const positionIndex = parseInt(position, 10) - 1;
        const selected = sorted[positionIndex];

        if (!selected) {
          setIsLoading(false);
          return;
        }

        // Cargar datos del colaborador ganador
        const { data: collaboratorData, error: collaboratorError } = await supabase
          .from("collaborators")
          .select("*")
          .eq("id", selected.collaboratorId)
          .single();

        if (collaboratorError || !collaboratorData) {
          console.error("Error al cargar colaborador:", collaboratorError);
          setIsLoading(false);
          return;
        }

        setWinner({
          id: collaboratorData.id,
          fullName: collaboratorData.full_name,
          avatarUrl: collaboratorData.avatar_url,
          role: collaboratorData.role || undefined,
        });

        setVotes(selected.count);
      } catch (error) {
        console.error("Error inesperado:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadWinner();
  }, [categoryId, position]);


  if (isLoading) {
    return (
      <div className="min-h-screen bg-linear-to-l from-[#080808] via-[#101019] to-[#080808] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-[#FFD080] mx-auto mb-4"></div>
          <p className="text-white/60 text-sm">Cargando ganador...</p>
        </div>
      </div>
    );
  }

  if (!category || !winner) {
    return (
      <div className="min-h-screen bg-linear-to-l from-[#080808] via-[#101019] to-[#080808] flex items-center justify-center">
        <div className="text-center">
          <p className="text-white/60 text-sm">No se encontró información del ganador</p>
        </div>
      </div>
    );
  }

  const positionLabels: Record<string, { label: string; icon: string }> = {
    "1": { label: "🥇 Primer Lugar", icon: "mdi:trophy" },
    "2": { label: "🥈 Segundo Lugar", icon: "mdi:trophy-variant" },
    "3": { label: "🥉 Tercer Lugar", icon: "mdi:trophy-outline" },
  };

  const positionInfo = positionLabels[position] || positionLabels["1"];

  return (
    <div className="min-h-screen bg-linear-to-l from-[#080808] via-[#101019] to-[#080808] relative overflow-hidden flex items-center justify-center">
      <Confetti
        width={windowSize.width}
        height={windowSize.height}
        recycle={true}
        numberOfPieces={200}
        gravity={0.3}
      />

      {/* Fondo decorativo */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -bottom-40 -left-40 size-[500px] rounded-full bg-[#FFD080]/30 blur-3xl animate-pulse" />
        <div className="absolute -bottom-40 -right-40 size-[500px] rounded-full bg-[#FFD080]/30 blur-3xl animate-pulse" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 size-[600px] rounded-full bg-[#FFD080]/20 blur-3xl" />
      </div>

      <div className="relative z-10 w-full max-w-4xl px-4 py-12">
        <div className="rounded-3xl bg-white/5 border border-white/10 p-8 md:p-12 backdrop-blur-xl text-center">
          {/* Categoría */}
          <div className="mb-6">
            <p className="text-white/60 uppercase tracking-[0.2em] text-sm mb-2">
              {category.emoji && <span className="text-2xl mr-2">{category.emoji}</span>}
              {category.name}
            </p>
            <div className="h-1 w-32 bg-gradient-to-r from-transparent via-[#FFD080] to-transparent mx-auto mb-4" />
          </div>

          {/* Posición */}
          <div className="mb-8">
            <div className="inline-flex items-center gap-3 px-6 py-3 rounded-full bg-[#FFD080]/20 border border-[#FFD080]/30 mb-4">
              <Icon icon={positionInfo.icon} className="text-[#FFD080]" width={32} height={32} />
              <span className="text-[#FFD080] font-semibold text-lg uppercase tracking-wide">
                {positionInfo.label}
              </span>
            </div>
          </div>

          {/* Imagen del ganador */}
          <div className="mb-8 flex justify-center">
            <div className="relative">
              <div className="absolute inset-0 bg-[#FFD080]/30 rounded-full blur-2xl animate-pulse" />
              <img
                src={winner.avatarUrl}
                alt={winner.fullName}
                className="relative size-48 md:size-64 rounded-full object-cover border-4 border-[#FFD080] shadow-2xl"
                onError={(e) => {
                  e.currentTarget.src = "https://via.placeholder.com/300?text=No+Image";
                }}
              />
            </div>
          </div>

          {/* Nombre del ganador */}
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-4 uppercase tracking-tight">
            {winner.fullName}
          </h1>

          {/* Rol */}
          {winner.role && (
            <p className="text-xl md:text-2xl text-white/70 mb-8">
              {winner.role}
            </p>
          )}

          {/* Votos recibidos */}
          <div className="inline-flex items-center gap-3 px-6 py-3 rounded-full bg-white/10 border border-white/20 mb-8">
            <Icon icon="mdi:vote" className="text-[#FFD080]" width={24} height={24} />
            <span className="text-white font-semibold text-lg">
              {votes} {votes === 1 ? "voto" : "votos"}
            </span>
          </div>

          {/* Mensaje de felicitación */}
          <div className="mt-8 p-6 rounded-2xl bg-[#FFD080]/10 border border-[#FFD080]/20">
            <p className="text-white/90 text-lg md:text-xl font-light">
              ¡Felicitaciones por este reconocimiento!
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

