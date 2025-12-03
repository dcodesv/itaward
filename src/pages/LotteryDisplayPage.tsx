import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import type { Collaborator } from "../types";
import Snowfall from "../components/Snowfall";
import Icon from "../components/Icon";

type CollaboratorWithLottery = Collaborator & {
  lotteryName: string | null;
  lotteryShout: string | null;
};

export default function LotteryDisplayPage() {
  const [collaborators, setCollaborators] = useState<CollaboratorWithLottery[]>(
    []
  );
  const [currentCollaborator, setCurrentCollaborator] =
    useState<CollaboratorWithLottery | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAnimating, setIsAnimating] = useState(false);
  const [usedIndices, setUsedIndices] = useState<Set<number>>(new Set());

  // Cargar colaboradores con datos de lotería
  useEffect(() => {
    const loadCollaborators = async () => {
      try {
        setIsLoading(true);
        const { data, error } = await supabase
          .from("collaborators")
          .select("*")
          .not("lottery_name", "is", null)
          .order("full_name", { ascending: true });

        if (error) {
          console.error("Error al cargar colaboradores:", error);
          return;
        }

        if (data && Array.isArray(data)) {
          const mappedCollaborators: CollaboratorWithLottery[] = data.map(
            (collab: {
              id: number;
              full_name: string;
              avatar_url: string;
              role: string | null;
              lottery_name: string | null;
              lottery_shout: string | null;
            }) => ({
              id: collab.id,
              fullName: collab.full_name,
              avatarUrl: collab.avatar_url,
              role: collab.role || undefined,
              lotteryName: collab.lottery_name || null,
              lotteryShout: collab.lottery_shout || null,
            })
          );

          setCollaborators(mappedCollaborators);

          // Seleccionar el primer colaborador al azar
          if (mappedCollaborators.length > 0) {
            const randomIndex = Math.floor(
              Math.random() * mappedCollaborators.length
            );
            setCurrentCollaborator(mappedCollaborators[randomIndex]);
            setUsedIndices(new Set([randomIndex]));
          }
        }
      } catch (error) {
        console.error("Error inesperado al cargar colaboradores:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadCollaborators();
  }, []);

  const getRandomCollaborator = () => {
    if (collaborators.length === 0) return null;

    // Si ya se usaron todos, reiniciar
    if (usedIndices.size >= collaborators.length) {
      setUsedIndices(new Set());
    }

    // Obtener índices disponibles
    const availableIndices = collaborators
      .map((_, index) => index)
      .filter((index) => !usedIndices.has(index));

    if (availableIndices.length === 0) {
      // Si no hay disponibles, reiniciar y tomar uno al azar
      const randomIndex = Math.floor(Math.random() * collaborators.length);
      setUsedIndices(new Set([randomIndex]));
      return collaborators[randomIndex];
    }

    // Seleccionar uno al azar de los disponibles
    const randomIndex =
      availableIndices[Math.floor(Math.random() * availableIndices.length)];
    setUsedIndices((prev) => new Set([...prev, randomIndex]));
    return collaborators[randomIndex];
  };

  const handleNext = () => {
    if (isAnimating || collaborators.length === 0) return;

    setIsAnimating(true);

    // Animación de salida
    setTimeout(() => {
      const next = getRandomCollaborator();
      if (next) {
        setCurrentCollaborator(next);
      }

      // Animación de entrada
      setTimeout(() => {
        setIsAnimating(false);
      }, 100);
    }, 300);
  };

  // Navegación con teclado
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === " " || e.key === "ArrowRight" || e.key === "Enter") {
        e.preventDefault();
        handleNext();
      }
    };

    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, [isAnimating, collaborators.length]);

  if (isLoading) {
    return (
      <div className="h-screen w-screen bg-gradient-to-br from-[#0a1a0a] via-[#1a0a0a] to-[#0a0a1a] flex items-center justify-center relative overflow-hidden">
        <Snowfall />
        <div className="text-center relative z-10">
          <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-[#FFD080] mx-auto mb-4"></div>
          <p className="text-white/60 text-sm">Cargando personajes...</p>
        </div>
      </div>
    );
  }

  if (collaborators.length === 0) {
    return (
      <div className="h-screen w-screen bg-gradient-to-br from-[#0a1a0a] via-[#1a0a0a] to-[#0a0a1a] flex items-center justify-center relative overflow-hidden">
        <Snowfall />
        <div className="text-center relative z-10">
          <p className="text-white/60 text-sm">
            No hay colaboradores con nombres de lotería configurados
          </p>
        </div>
      </div>
    );
  }

  if (!currentCollaborator) {
    return null;
  }

  return (
    <div className="h-screen w-screen bg-gradient-to-br from-[#0a1a0a] via-[#1a0a0a] to-[#0a0a1a] relative overflow-hidden flex items-center justify-center xmas-pattern">
      <Snowfall />

      {/* Efectos de fondo navideños */}
      <div className="pointer-events-none absolute inset-0">
        {/* Luces navideñas animadas */}
        <div className="absolute top-10 left-10 w-3 h-3 bg-red-500 rounded-full animate-pulse shadow-lg shadow-red-500/50" />
        <div
          className="absolute top-20 right-20 w-3 h-3 bg-green-500 rounded-full animate-pulse shadow-lg shadow-green-500/50"
          style={{ animationDelay: "0.5s" }}
        />
        <div
          className="absolute bottom-20 left-20 w-3 h-3 bg-yellow-500 rounded-full animate-pulse shadow-lg shadow-yellow-500/50"
          style={{ animationDelay: "1s" }}
        />
        <div
          className="absolute bottom-10 right-10 w-3 h-3 bg-red-500 rounded-full animate-pulse shadow-lg shadow-red-500/50"
          style={{ animationDelay: "1.5s" }}
        />
        <div
          className="absolute top-1/2 left-1/4 w-3 h-3 bg-green-500 rounded-full animate-pulse shadow-lg shadow-green-500/50"
          style={{ animationDelay: "0.3s" }}
        />
        <div
          className="absolute top-1/2 right-1/4 w-3 h-3 bg-yellow-500 rounded-full animate-pulse shadow-lg shadow-yellow-500/50"
          style={{ animationDelay: "0.8s" }}
        />

        {/* Efectos de brillo */}
        <div className="absolute -bottom-40 -left-40 size-[500px] rounded-full bg-red-500/20 blur-3xl animate-pulse" />
        <div
          className="absolute -bottom-40 -right-40 size-[500px] rounded-full bg-green-500/20 blur-3xl animate-pulse"
          style={{ animationDelay: "1s" }}
        />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 size-[600px] rounded-full bg-yellow-500/10 blur-3xl" />
      </div>

      {/* Decoración navideña superior - fuera del contenedor */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 flex justify-center items-center gap-2">
        <span
          className="text-xl sm:text-2xl md:text-3xl animate-bounce"
          style={{ animationDelay: "0s" }}
        >
          🎄
        </span>
        <span
          className="text-lg sm:text-xl md:text-2xl animate-bounce"
          style={{ animationDelay: "0.2s" }}
        >
          ⭐
        </span>
        <span
          className="text-xl sm:text-2xl md:text-3xl animate-bounce"
          style={{ animationDelay: "0.4s" }}
        >
          🎄
        </span>
      </div>

      <div className="relative z-10 w-full max-w-2xl h-full flex flex-col items-center justify-center px-4 py-4 -mt-10">
        <div
          className={`w-full rounded-3xl bg-white/5 border-2 border-white/10 px-4 py-10 backdrop-blur-xl text-center transition-all duration-300 flex flex-col items-center justify-center ${
            isAnimating ? "opacity-0 scale-95" : "opacity-100 scale-100"
          }`}
          style={{ maxHeight: "90%" }}
        >
          {/* Avatar con efecto de brillo */}
          <div className="mb-3 sm:mb-4 md:mb-6 flex justify-center flex-shrink-0">
            <div className="relative">
              {/* Aura navideña */}
              <div className="absolute inset-0 bg-gradient-to-r from-red-500/30 via-green-500/30 to-yellow-500/30 rounded-full blur-2xl animate-pulse" />
              <div
                className="absolute inset-0 bg-gradient-to-r from-green-500/30 via-red-500/30 to-yellow-500/30 rounded-full blur-xl animate-pulse"
                style={{ animationDelay: "0.5s" }}
              />

              {/* Imagen del colaborador */}
              <div className="relative inline-block">
                <div className="absolute inset-0 border-4 border-red-500/50 rounded-full animate-ping" />
                <div
                  className="relative rounded-full p-1"
                  style={{
                    background:
                      "linear-gradient(45deg, #ef4444, #22c55e, #eab308, #ef4444)",
                    backgroundSize: "200% 200%",
                    animation: "gradient 3s ease infinite",
                  }}
                >
                  <img
                    src={currentCollaborator.avatarUrl}
                    alt={currentCollaborator.fullName}
                    className="relative size-24 md:size-52 rounded-full object-cover block"
                    style={{
                      boxShadow:
                        "0 0 30px rgba(239, 68, 68, 0.5), 0 0 60px rgba(34, 197, 94, 0.3), 0 0 90px rgba(234, 179, 8, 0.2)",
                    }}
                    onError={(e) => {
                      e.currentTarget.src =
                        "https://via.placeholder.com/300?text=No+Image";
                    }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Nombre de lotería */}
          <h1 className="text-xl sm:text-3xl font-bold text-white mb-2 sm:mb-3 md:mb-4 uppercase tracking-tight px-2 animate-fade-in flex-shrink-0">
            <span className="bg-gradient-to-r from-white/40 via-white to-white/40 bg-clip-text text-transparent">
              {currentCollaborator.lotteryName}
            </span>
          </h1>

          {/* Grito de lotería */}
          {currentCollaborator.lotteryShout && (
            <div className="mb-1 px-2 flex-shrink-0">
              <div className="inline-block px-2 py-1 rounded-2xl bg-gradient-to-l from-red-500/20 via-green-500/20 border-2 border-white/20 backdrop-blur-lg">
                <p className="text-base lg:text-xl text-white leading-relaxed animate-fade-in">
                  "{currentCollaborator.lotteryShout}"
                </p>
              </div>
            </div>
          )}

          {/* Nombre real (opcional, más pequeño) */}
          <div className="mt-2 sm:mt-3 md:mt-4 flex-shrink-0">
            <p className="text-white/60 text-xs md:text-sm uppercase tracking-[2px]">
              {currentCollaborator.fullName}
            </p>
            {currentCollaborator.role && (
              <p className="text-white/40 text-xs md:text-sm tracking-[2px]">
                {currentCollaborator.role}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Botón para siguiente y decoración inferior - fuera del contenedor */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center gap-3 sm:gap-4">
        {/* Botón para siguiente (opcional, puede ocultarse para proyector) */}
        <button
          onClick={handleNext}
          disabled={isAnimating}
          className="px-2 sm:px-4 py-1 rounded-full bg-gradient-to-r from-red-500/40 via-green-500/40 text-white text-sm sm md:text-md shadow-lg hover:shadow-xl hover:scale-105 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 cursor-pointer"
        >
          <span>Siguiente Personaje</span>
          <Icon icon="mdi:arrow-right" width={18} height={18} />
        </button>

        {/* Instrucciones */}
        <div className="text-center">
          <p className="text-white/40 text-xs">
            Presiona Espacio, Enter o → para siguiente personaje
          </p>
          <p className="text-white/30 text-xs">
            Mostrando {usedIndices.size} de {collaborators.length} personajes
          </p>
        </div>
      </div>

      {/* Estilos de animación personalizados */}
      <style
        dangerouslySetInnerHTML={{
          __html: `
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes gradient {
          0% {
            background-position: 0% 50%;
          }
          50% {
            background-position: 100% 50%;
          }
          100% {
            background-position: 0% 50%;
          }
        }
        .animate-fade-in {
          animation: fade-in 0.6s ease-out;
        }
      `,
        }}
      />
    </div>
  );
}
