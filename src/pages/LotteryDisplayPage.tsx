import { useEffect, useState, useCallback } from "react";
import { supabase } from "../lib/supabase";
import type { Collaborator } from "../types";
import Snowfall from "../components/Snowfall";
import Icon from "../components/Icon";

type CollaboratorWithLottery = Omit<
  Collaborator,
  "lotteryName" | "lotteryShout"
> & {
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
          const mappedCollaborators = data.map(
            (collab: {
              id: number;
              full_name: string;
              avatar_url: string;
              role: string | null;
              lottery_name: string | null;
              lottery_shout: string | null;
            }): CollaboratorWithLottery => ({
              id: collab.id,
              fullName: collab.full_name,
              avatarUrl: collab.avatar_url,
              role: collab.role || undefined,
              lotteryName: collab.lottery_name ?? null,
              lotteryShout: collab.lottery_shout ?? null,
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

  const getRandomCollaborator = useCallback(() => {
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
  }, [collaborators, usedIndices]);

  const handleNext = useCallback(() => {
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
  }, [isAnimating, collaborators.length, getRandomCollaborator]);

  // Navegación con teclado
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === " " || e.key === "ArrowRight" || e.key === "Enter") {
        e.preventDefault();
        if (!isAnimating && collaborators.length > 0) {
          handleNext();
        }
      }
    };

    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, [isAnimating, collaborators.length, handleNext]);

  if (isLoading) {
    return (
      <div
        className="h-screen w-screen flex items-center justify-center relative overflow-hidden"
        style={{
          background: "#5a1d1d",
          backgroundImage:
            "radial-gradient(ellipse at center, rgba(127, 46, 42, 0.9) 0%, rgba(90, 29, 28, 1) 100%)",
        }}
      >
        <Snowfall />
        <div className="text-center relative z-10">
          <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-[#D4AF37] mx-auto mb-4"></div>
          <p
            className="text-white/90 text-sm tracking-wide"
            style={{ fontFamily: "'Cormorant Garamond', 'Georgia', serif" }}
          >
            Cargando personajes...
          </p>
        </div>
      </div>
    );
  }

  if (collaborators.length === 0) {
    return (
      <div
        className="h-screen w-screen flex items-center justify-center relative overflow-hidden"
        style={{
          background: "#5a1d1d",
          backgroundImage:
            "radial-gradient(ellipse at center, rgba(127, 46, 42, 0.9) 0%, rgba(90, 29, 28, 1) 100%)",
        }}
      >
        <Snowfall />
        <div className="text-center relative z-10">
          <p
            className="text-white/90 text-sm tracking-wide"
            style={{ fontFamily: "'Cormorant Garamond', 'Georgia', serif" }}
          >
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
    <div
      className="h-screen w-screen relative overflow-hidden flex items-center justify-center"
      style={{
        background: "#5a1d1d",
        backgroundImage:
          "radial-gradient(ellipse at center, rgba(127, 46, 42, 0.85) 0%, rgba(90, 29, 28, 1) 100%)",
      }}
    >
      {/* Efecto de viñeta sutil */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          boxShadow: "inset 0 0 200px rgba(0, 0, 0, 0.3)",
        }}
      />

      <Snowfall />

      {/* Decoraciones minimalistas elegantes */}
      <div className="pointer-events-none absolute inset-0 z-0">
        {/* Árboles de papel estilizados */}
        <svg
          className="absolute bottom-20 left-12 w-24 h-32"
          viewBox="0 0 100 120"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          style={{ opacity: 0.12 }}
        >
          <path
            d="M50 10 L30 50 L50 45 L70 50 Z M50 45 L35 75 L50 70 L65 75 Z M50 70 L40 100 L50 95 L60 100 Z"
            fill="#7f2e2a"
            stroke="#7f2e2a"
            strokeWidth="1"
            opacity="0.4"
          />
        </svg>
        <svg
          className="absolute bottom-16 left-8 w-16 h-20"
          viewBox="0 0 100 120"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          style={{ opacity: 0.1 }}
        >
          <path
            d="M50 10 L30 50 L50 45 L70 50 Z M50 45 L35 75 L50 70 L65 75 Z M50 70 L40 100 L50 95 L60 100 Z"
            fill="#7f2e2a"
            stroke="#7f2e2a"
            strokeWidth="1"
            opacity="0.4"
          />
        </svg>
        <svg
          className="absolute bottom-20 right-12 w-24 h-32"
          viewBox="0 0 100 120"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          style={{ opacity: 0.12 }}
        >
          <path
            d="M50 10 L30 50 L50 45 L70 50 Z M50 45 L35 75 L50 70 L65 75 Z M50 70 L40 100 L50 95 L60 100 Z"
            fill="#7f2e2a"
            stroke="#7f2e2a"
            strokeWidth="1"
            opacity="0.4"
          />
        </svg>
        <svg
          className="absolute bottom-16 right-8 w-16 h-20"
          viewBox="0 0 100 120"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          style={{ opacity: 0.1 }}
        >
          <path
            d="M50 10 L30 50 L50 45 L70 50 Z M50 45 L35 75 L50 70 L65 75 Z M50 70 L40 100 L50 95 L60 100 Z"
            fill="#7f2e2a"
            stroke="#7f2e2a"
            strokeWidth="1"
            opacity="0.4"
          />
        </svg>

        {/* Esferas blancas opacas */}
        <div
          className="absolute bottom-24 left-32 w-16 h-16 rounded-full bg-white/25 shadow-lg"
          style={{
            boxShadow: "0 4px 12px rgba(0, 0, 0, 0.2)",
          }}
        />
        <div
          className="absolute bottom-20 left-16 w-12 h-12 rounded-full bg-white/20 shadow-lg"
          style={{
            boxShadow: "0 4px 12px rgba(0, 0, 0, 0.2)",
          }}
        />
        <div
          className="absolute bottom-24 right-32 w-16 h-16 rounded-full bg-white/25 shadow-lg"
          style={{
            boxShadow: "0 4px 12px rgba(0, 0, 0, 0.2)",
          }}
        />

        {/* Esferas transparentes flotantes */}
        <div
          className="absolute top-32 left-20 w-20 h-20 rounded-full border-2 border-white/15 bg-white/5 backdrop-blur-sm"
          style={{
            boxShadow: "0 0 20px rgba(255, 255, 255, 0.1)",
            animation: "float 6s ease-in-out infinite",
          }}
        />
        <div
          className="absolute top-40 right-24 w-16 h-16 rounded-full border-2 border-white/15 bg-white/5 backdrop-blur-sm"
          style={{
            boxShadow: "0 0 20px rgba(255, 255, 255, 0.1)",
            animation: "float 8s ease-in-out infinite",
            animationDelay: "1s",
          }}
        />
        <div
          className="absolute bottom-32 right-20 w-18 h-18 rounded-full border-2 border-white/15 bg-white/5 backdrop-blur-sm"
          style={{
            boxShadow: "0 0 20px rgba(255, 255, 255, 0.1)",
            animation: "float 7s ease-in-out infinite",
            animationDelay: "2s",
          }}
        />
      </div>

      {/* Contenido principal */}
      <div className="relative z-10 w-full max-w-4xl h-full flex flex-col items-center justify-center px-8 py-2 -mt-24">
        <div
          className={`w-full text-center transition-all duration-500 flex flex-col items-center justify-center ${
            isAnimating
              ? "opacity-0 translate-y-4"
              : "opacity-100 translate-y-0"
          }`}
        >
          {/* Avatar elegante */}
          <div className="mb-8 flex justify-center">
            <div className="relative">
              {/* Efecto de flashes detrás de la foto - múltiples cámaras */}
              <div className="absolute inset-0 flex items-center justify-center">
                {/* Flash 1 - Izquierda arriba */}
                <div
                  className="absolute w-32 h-32 md:w-56 md:h-56 rounded-full"
                  style={{
                    background:
                      "radial-gradient(circle, rgba(255, 255, 255, 1) 0%, rgba(255, 255, 255, 0.9) 20%, rgba(212, 175, 55, 0.7) 40%, transparent 70%)",
                    filter: "blur(35px)",
                    animation: "cameraFlash1 5.5s ease-in-out infinite",
                    transform: "translate(-40%, -30%)",
                  }}
                />
                {/* Flash 2 - Derecha arriba */}
                <div
                  className="absolute w-28 h-28 md:w-52 md:h-52 rounded-full"
                  style={{
                    background:
                      "radial-gradient(circle, rgba(255, 255, 255, 1) 0%, rgba(255, 255, 255, 0.85) 25%, rgba(212, 175, 55, 0.65) 45%, transparent 75%)",
                    filter: "blur(33px)",
                    animation: "cameraFlash2 6s ease-in-out infinite",
                    transform: "translate(35%, -25%)",
                  }}
                />
                {/* Flash 3 - Izquierda abajo */}
                <div
                  className="absolute w-30 h-30 md:w-54 md:h-54 rounded-full"
                  style={{
                    background:
                      "radial-gradient(circle, rgba(255, 255, 255, 0.95) 0%, rgba(255, 255, 255, 0.8) 22%, rgba(212, 175, 55, 0.6) 42%, transparent 72%)",
                    filter: "blur(34px)",
                    animation: "cameraFlash3 5.8s ease-in-out infinite",
                    transform: "translate(-35%, 30%)",
                  }}
                />
                {/* Flash 4 - Derecha abajo */}
                <div
                  className="absolute w-26 h-26 md:w-50 md:h-50 rounded-full"
                  style={{
                    background:
                      "radial-gradient(circle, rgba(255, 255, 255, 1) 0%, rgba(255, 255, 255, 0.88) 23%, rgba(212, 175, 55, 0.68) 43%, transparent 73%)",
                    filter: "blur(32px)",
                    animation: "cameraFlash4 6.2s ease-in-out infinite",
                    transform: "translate(30%, 28%)",
                  }}
                />
                {/* Flash 5 - Centro izquierda */}
                <div
                  className="absolute w-24 h-24 md:w-48 md:h-48 rounded-full"
                  style={{
                    background:
                      "radial-gradient(circle, rgba(255, 255, 255, 0.9) 0%, rgba(255, 255, 255, 0.75) 24%, rgba(212, 175, 55, 0.55) 44%, transparent 74%)",
                    filter: "blur(31px)",
                    animation: "cameraFlash5 5.6s ease-in-out infinite",
                    transform: "translate(-45%, 5%)",
                  }}
                />
                {/* Flash 6 - Centro derecha */}
                <div
                  className="absolute w-22 h-22 md:w-46 md:h-46 rounded-full"
                  style={{
                    background:
                      "radial-gradient(circle, rgba(255, 255, 255, 0.92) 0%, rgba(255, 255, 255, 0.78) 26%, rgba(212, 175, 55, 0.58) 46%, transparent 76%)",
                    filter: "blur(30px)",
                    animation: "cameraFlash6 6.4s ease-in-out infinite",
                    transform: "translate(42%, -5%)",
                  }}
                />
                {/* Flash 7 - Arriba centro */}
                <div
                  className="absolute w-20 h-20 md:w-44 md:h-44 rounded-full"
                  style={{
                    background:
                      "radial-gradient(circle, rgba(255, 255, 255, 0.88) 0%, rgba(255, 255, 255, 0.72) 28%, rgba(212, 175, 55, 0.52) 48%, transparent 78%)",
                    filter: "blur(29px)",
                    animation: "cameraFlash7 5.9s ease-in-out infinite",
                    transform: "translate(-5%, -40%)",
                  }}
                />
                {/* Flash 8 - Abajo centro */}
                <div
                  className="absolute w-18 h-18 md:w-42 md:h-42 rounded-full"
                  style={{
                    background:
                      "radial-gradient(circle, rgba(255, 255, 255, 0.86) 0%, rgba(255, 255, 255, 0.7) 30%, rgba(212, 175, 55, 0.5) 50%, transparent 80%)",
                    filter: "blur(28px)",
                    animation: "cameraFlash8 6.1s ease-in-out infinite",
                    transform: "translate(8%, 38%)",
                  }}
                />
              </div>
              <div
                className="absolute inset-0 rounded-full"
                style={{
                  background:
                    "radial-gradient(circle, rgba(212, 175, 55, 0.3) 0%, transparent 70%)",
                  filter: "blur(20px)",
                }}
              />
              <img
                src={currentCollaborator.avatarUrl}
                alt={currentCollaborator.fullName}
                className="relative size-32 md:size-44 rounded-full object-cover block border-2 border-[#D4AF37]/50 z-10"
                style={{
                  boxShadow: "0 8px 32px rgba(0, 0, 0, 0.4)",
                }}
                onError={(e) => {
                  e.currentTarget.src =
                    "https://via.placeholder.com/300?text=No+Image";
                }}
              />
            </div>
          </div>

          {/* Nombre de lotería - tipografía elegante */}
          <h1
            className="text-4xl md:text-4xl font-normal mb-2 tracking-wide"
            style={{
              fontFamily:
                "'Cormorant Garamond', 'Playfair Display', 'Georgia', serif",
              color: "#D4AF37",
              fontWeight: 400,
            }}
          >
            {currentCollaborator.lotteryName}
          </h1>

          {/* Grito de lotería - estilo minimalista */}
          {currentCollaborator.lotteryShout && (
            <div className="mt-2 px-6 max-w-2xl mx-auto">
              <p
                className="text-lg md:text-2xl text-white/80 font-light leading-tight"
                style={{
                  fontFamily: "'Cormorant Garamond', 'Georgia', serif",
                  letterSpacing: "0.1em",
                  fontStyle: "italic",
                }}
              >
                "{currentCollaborator.lotteryShout}"
              </p>
            </div>
          )}

          {/* Nombre real - discreto */}
          <div className="mt-6">
            <p
              className="text-white/70 text-sm md:text-base uppercase tracking-[0.2em]"
              style={{
                fontFamily: "'Source Sans Pro', sans-serif",
                letterSpacing: "0.2em",
                fontWeight: 300,
              }}
            >
              {currentCollaborator.fullName}
            </p>
            {currentCollaborator.role && (
              <p
                className="text-white/50 text-xs md:text-sm tracking-wider"
                style={{
                  fontFamily: "'Source Sans Pro', sans-serif",
                  letterSpacing: "0.1em",
                  fontWeight: 300,
                }}
              >
                {currentCollaborator.role}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Botón minimalista */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center gap-3">
        <button
          onClick={handleNext}
          disabled={isAnimating}
          className="px-8 py-3 text-white/90 text-sm uppercase tracking-[0.15em] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-3 hover:text-[#D4AF37]"
          style={{
            fontFamily: "'Source Sans Pro', sans-serif",
            fontWeight: 300,
            borderBottom: "1px solid rgba(212, 175, 55, 0.4)",
            borderRadius: 0,
            background: "transparent",
          }}
        >
          <span>Siguiente Personaje</span>
          <Icon icon="mdi:arrow-right" width={16} height={16} />
        </button>

        <p
          className="text-white/40 text-xs tracking-wide"
          style={{
            fontFamily: "'Source Sans Pro', sans-serif",
            fontWeight: 300,
          }}
        >
          Presiona Espacio, Enter o → • {usedIndices.size} de{" "}
          {collaborators.length}
        </p>
      </div>

      {/* Estilos de animación personalizados */}
      <style
        dangerouslySetInnerHTML={{
          __html: `
        @keyframes float {
          0%, 100% {
            transform: translateY(0px);
          }
          50% {
            transform: translateY(-20px);
          }
        }
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
        @keyframes cameraFlash1 {
          0%, 85%, 100% {
            opacity: 0;
            transform: translate(-40%, -30%) scale(0.5);
          }
          5% {
            opacity: 0.3;
            transform: translate(-40%, -30%) scale(0.8);
          }
          10% {
            opacity: 1;
            transform: translate(-40%, -30%) scale(1.5);
          }
          15% {
            opacity: 0.9;
            transform: translate(-40%, -30%) scale(1.3);
          }
          20% {
            opacity: 0.6;
            transform: translate(-40%, -30%) scale(1.1);
          }
          25% {
            opacity: 0;
            transform: translate(-40%, -30%) scale(0.8);
          }
        }
        @keyframes cameraFlash2 {
          0%, 83%, 100% {
            opacity: 0;
            transform: translate(35%, -25%) scale(0.4);
          }
          6% {
            opacity: 0.25;
            transform: translate(35%, -25%) scale(0.7);
          }
          12% {
            opacity: 1;
            transform: translate(35%, -25%) scale(1.6);
          }
          17% {
            opacity: 0.85;
            transform: translate(35%, -25%) scale(1.2);
          }
          22% {
            opacity: 0.5;
            transform: translate(35%, -25%) scale(1);
          }
          27% {
            opacity: 0;
            transform: translate(35%, -25%) scale(0.7);
          }
        }
        @keyframes cameraFlash3 {
          0%, 82%, 100% {
            opacity: 0;
            transform: translate(-35%, 30%) scale(0.6);
          }
          7% {
            opacity: 0.35;
            transform: translate(-35%, 30%) scale(0.9);
          }
          13% {
            opacity: 1;
            transform: translate(-35%, 30%) scale(1.4);
          }
          18% {
            opacity: 0.8;
            transform: translate(-35%, 30%) scale(1.1);
          }
          23% {
            opacity: 0.55;
            transform: translate(-35%, 30%) scale(0.95);
          }
          28% {
            opacity: 0;
            transform: translate(-35%, 30%) scale(0.6);
          }
        }
        @keyframes cameraFlash4 {
          0%, 81%, 100% {
            opacity: 0;
            transform: translate(30%, 28%) scale(0.5);
          }
          8% {
            opacity: 0.3;
            transform: translate(30%, 28%) scale(0.8);
          }
          14% {
            opacity: 1;
            transform: translate(30%, 28%) scale(1.5);
          }
          19% {
            opacity: 0.88;
            transform: translate(30%, 28%) scale(1.25);
          }
          24% {
            opacity: 0.6;
            transform: translate(30%, 28%) scale(1.05);
          }
          29% {
            opacity: 0;
            transform: translate(30%, 28%) scale(0.65);
          }
        }
        @keyframes cameraFlash5 {
          0%, 86%, 100% {
            opacity: 0;
            transform: translate(-45%, 5%) scale(0.4);
          }
          4% {
            opacity: 0.28;
            transform: translate(-45%, 5%) scale(0.75);
          }
          9% {
            opacity: 1;
            transform: translate(-45%, 5%) scale(1.7);
          }
          14% {
            opacity: 0.92;
            transform: translate(-45%, 5%) scale(1.35);
          }
          19% {
            opacity: 0.65;
            transform: translate(-45%, 5%) scale(1.1);
          }
          24% {
            opacity: 0;
            transform: translate(-45%, 5%) scale(0.55);
          }
        }
        @keyframes cameraFlash6 {
          0%, 80%, 100% {
            opacity: 0;
            transform: translate(42%, -5%) scale(0.45);
          }
          9% {
            opacity: 0.32;
            transform: translate(42%, -5%) scale(0.85);
          }
          15% {
            opacity: 1;
            transform: translate(42%, -5%) scale(1.55);
          }
          20% {
            opacity: 0.86;
            transform: translate(42%, -5%) scale(1.28);
          }
          25% {
            opacity: 0.58;
            transform: translate(42%, -5%) scale(1.08);
          }
          30% {
            opacity: 0;
            transform: translate(42%, -5%) scale(0.6);
          }
        }
        @keyframes cameraFlash7 {
          0%, 79%, 100% {
            opacity: 0;
            transform: translate(-5%, -40%) scale(0.5);
          }
          10% {
            opacity: 0.34;
            transform: translate(-5%, -40%) scale(0.9);
          }
          16% {
            opacity: 1;
            transform: translate(-5%, -40%) scale(1.45);
          }
          21% {
            opacity: 0.9;
            transform: translate(-5%, -40%) scale(1.22);
          }
          26% {
            opacity: 0.62;
            transform: translate(-5%, -40%) scale(1.05);
          }
          31% {
            opacity: 0;
            transform: translate(-5%, -40%) scale(0.58);
          }
        }
        @keyframes cameraFlash8 {
          0%, 78%, 100% {
            opacity: 0;
            transform: translate(8%, 38%) scale(0.48);
          }
          11% {
            opacity: 0.36;
            transform: translate(8%, 38%) scale(0.88);
          }
          17% {
            opacity: 1;
            transform: translate(8%, 38%) scale(1.52);
          }
          22% {
            opacity: 0.87;
            transform: translate(8%, 38%) scale(1.26);
          }
          27% {
            opacity: 0.6;
            transform: translate(8%, 38%) scale(1.1);
          }
          32% {
            opacity: 0;
            transform: translate(8%, 38%) scale(0.62);
          }
        }
      `,
        }}
      />
    </div>
  );
}
