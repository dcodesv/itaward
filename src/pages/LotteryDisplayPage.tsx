import { useEffect, useState, useCallback } from "react";
import { supabase } from "../lib/supabase";
import type { Collaborator } from "../types";
import Snowfall from "../components/Snowfall";
import Icon from "../components/Icon";
import gorroNavideno from "../assets/gorro-navideno.png";

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
  const [showMystery, setShowMystery] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [shownCollaborators, setShownCollaborators] = useState<
    CollaboratorWithLottery[]
  >([]);
  const [hasFinished, setHasFinished] = useState(false);
  const emojiOpacity = 0.2;

  const STORAGE_KEY = "lottery_shown_collaborators";

  // Funciones para sessionStorage
  const saveToSessionStorage = useCallback(
    (collaborator: CollaboratorWithLottery) => {
      try {
        const stored = sessionStorage.getItem(STORAGE_KEY);
        const existing: CollaboratorWithLottery[] = stored
          ? JSON.parse(stored)
          : [];

        // Verificar si ya existe para evitar duplicados
        const exists = existing.some((c) => c.id === collaborator.id);
        if (!exists) {
          const updated = [...existing, collaborator];
          sessionStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
          setShownCollaborators(updated);
        }
      } catch (error) {
        console.error("Error al guardar en sessionStorage:", error);
      }
    },
    []
  );

  const loadFromSessionStorage = useCallback(() => {
    try {
      const stored = sessionStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed: CollaboratorWithLottery[] = JSON.parse(stored);
        setShownCollaborators(parsed);
      }
    } catch (error) {
      console.error("Error al cargar de sessionStorage:", error);
    }
  }, []);

  const clearSessionStorage = useCallback(() => {
    try {
      sessionStorage.removeItem(STORAGE_KEY);
      setShownCollaborators([]);
    } catch (error) {
      console.error("Error al limpiar sessionStorage:", error);
    }
  }, []);

  const handleReset = useCallback(() => {
    // Limpiar sessionStorage
    clearSessionStorage();
    // Resetear todos los estados
    setCurrentCollaborator(null);
    setUsedIndices(new Set());
    setShowMystery(false);
    setHasStarted(false);
    setHasFinished(false);
    setIsAnimating(false);
  }, [clearSessionStorage]);

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
          // No seleccionar el primer colaborador automáticamente
          // Se seleccionará cuando el usuario presione una tecla o el botón
        }
      } catch (error) {
        console.error("Error inesperado al cargar colaboradores:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadCollaborators();
    loadFromSessionStorage();
  }, [loadFromSessionStorage]);

  const getRandomCollaborator = useCallback(() => {
    if (collaborators.length === 0) return null;

    // Obtener índices disponibles
    const availableIndices = collaborators
      .map((_, index) => index)
      .filter((index) => !usedIndices.has(index));

    if (availableIndices.length === 0) {
      // Si no hay disponibles, retornar null para indicar que se terminaron
      return null;
    }

    // Seleccionar uno al azar de los disponibles
    const randomIndex =
      availableIndices[Math.floor(Math.random() * availableIndices.length)];
    const newUsedIndices = new Set([...usedIndices, randomIndex]);
    setUsedIndices(newUsedIndices);

    return collaborators[randomIndex];
  }, [collaborators, usedIndices]);

  const handleReveal = useCallback(() => {
    if (showMystery) {
      setShowMystery(false);
      // Guardar en sessionStorage cuando se revela
      if (currentCollaborator) {
        saveToSessionStorage(currentCollaborator);
      }
    }
  }, [showMystery, currentCollaborator, saveToSessionStorage]);

  const handleNext = useCallback(() => {
    if (isAnimating || collaborators.length === 0) return;

    // Si no ha comenzado, iniciar el juego
    if (!hasStarted) {
      setHasStarted(true);
      const firstCollaborator = getRandomCollaborator();
      if (firstCollaborator) {
        setCurrentCollaborator(firstCollaborator);
        setShowMystery(true);
      }
      return;
    }

    // Si está en modo misterio, revelar primero
    if (showMystery) {
      handleReveal();
      return;
    }

    // Si ya se terminaron todos, mostrar pantalla de fin
    if (usedIndices.size >= collaborators.length) {
      setHasFinished(true);
      return;
    }

    setIsAnimating(true);
    setShowMystery(true);

    // Animación de salida
    setTimeout(() => {
      const next = getRandomCollaborator();
      if (next) {
        setCurrentCollaborator(next);
        // Mostrar modo misterio
        setTimeout(() => {
          setIsAnimating(false);
        }, 100);
      } else {
        // No hay más colaboradores, mostrar pantalla de fin
        setIsAnimating(false);
        setHasFinished(true);
      }
    }, 300);
  }, [
    isAnimating,
    collaborators.length,
    getRandomCollaborator,
    showMystery,
    handleReveal,
    hasStarted,
    usedIndices.size,
  ]);

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

  // Pantalla de fin cuando se terminaron todos los colaboradores
  if (hasFinished && !isLoading && collaborators.length > 0) {
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

        {/* Decoraciones navideñas de fondo */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {/* Emojis navideños distribuidos */}
          <div
            className="absolute top-8 left-12 text-4xl md:text-6xl"
            style={{
              opacity: emojiOpacity,
              filter: "drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3))",
              animation: "float 5s ease-in-out infinite",
            }}
          >
            ⭐
          </div>
          <div
            className="absolute top-20 right-16 text-3xl md:text-5xl"
            style={{
              opacity: emojiOpacity,
              filter: "drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3))",
              animation: "float 6s ease-in-out infinite",
              animationDelay: "0.5s",
            }}
          >
            🔔
          </div>
          <div
            className="absolute bottom-24 left-20 text-5xl md:text-7xl"
            style={{
              opacity: emojiOpacity,
              filter: "drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3))",
              animation: "float 7s ease-in-out infinite",
              animationDelay: "1s",
            }}
          >
            🎄
          </div>
          <div
            className="absolute bottom-32 right-24 text-4xl md:text-6xl"
            style={{
              opacity: emojiOpacity,
              filter: "drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3))",
              animation: "float 5.5s ease-in-out infinite",
              animationDelay: "1.5s",
            }}
          >
            ❄️
          </div>
        </div>

        {/* Contenido de fin */}
        <div className="relative z-10 text-center px-8 max-w-2xl">
          <div
            className="text-5xl md:text-7xl font-normal mb-6"
            style={{
              fontFamily:
                "'Cormorant Garamond', 'Playfair Display', 'Georgia', serif",
              color: "#D4AF37",
              fontWeight: 400,
              animation: "fade-in 0.8s ease-in-out",
            }}
          >
            ¡Finalizaron!
          </div>
          <p
            className="text-white/80 text-lg md:text-xl mb-8 tracking-wide"
            style={{
              fontFamily: "'Cormorant Garamond', 'Georgia', serif",
              animation: "fade-in 1s ease-in-out",
            }}
          >
            Todas las personas han sido mostradas
          </p>
          <button
            onClick={handleReset}
            className="px-8 py-3 text-white/90 text-sm uppercase tracking-[0.15em] transition-all hover:text-[#D4AF37] flex items-center gap-3 mx-auto"
            style={{
              fontFamily: "'Source Sans Pro', sans-serif",
              fontWeight: 300,
              borderBottom: "1px solid rgba(212, 175, 55, 0.4)",
              borderRadius: 0,
              background: "transparent",
              animation: "fade-in 1.2s ease-in-out",
            }}
          >
            <Icon icon="mdi:refresh" width={20} height={20} />
            <span>Reiniciar Lotería</span>
          </button>
        </div>

        {/* Botón de historial en esquina inferior derecha */}
        <button
          onClick={() => {
            loadFromSessionStorage();
            setShowHistoryModal(true);
          }}
          className="absolute bottom-8 right-8 z-20 p-3 rounded-full bg-[#D4AF37]/20 hover:bg-[#D4AF37]/30 transition-all backdrop-blur-sm border border-[#D4AF37]/40"
          style={{
            boxShadow: "0 4px 12px rgba(0, 0, 0, 0.3)",
          }}
          title="Ver historial de personas que ya salieron"
        >
          <Icon
            icon="mdi:history"
            width={24}
            height={24}
            className="text-[#D4AF37]"
          />
        </button>

        {/* Modal de historial */}
        {showHistoryModal && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{
              background: "rgba(0, 0, 0, 0.7)",
              backdropFilter: "blur(4px)",
            }}
            onClick={(e) => {
              if (e.target === e.currentTarget) {
                setShowHistoryModal(false);
              }
            }}
          >
            <div
              className="relative w-full max-w-3xl max-h-[80vh] overflow-hidden flex flex-col"
              style={{
                background: "#5a1d1d",
                backgroundImage:
                  "radial-gradient(ellipse at center, rgba(127, 46, 42, 0.9) 0%, rgba(90, 29, 28, 1) 100%)",
                borderRadius: "8px",
                boxShadow: "0 8px 32px rgba(0, 0, 0, 0.5)",
              }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header del modal */}
              <div className="flex items-center justify-between p-6 border-b border-[#D4AF37]/30">
                <h2
                  className="text-2xl md:text-3xl font-normal"
                  style={{
                    fontFamily:
                      "'Cormorant Garamond', 'Playfair Display', 'Georgia', serif",
                    color: "#D4AF37",
                    fontWeight: 400,
                  }}
                >
                  Personas que ya salieron
                </h2>
                <button
                  onClick={() => setShowHistoryModal(false)}
                  className="p-2 hover:bg-[#D4AF37]/20 rounded-full transition-all"
                >
                  <Icon
                    icon="mdi:close"
                    width={24}
                    height={24}
                    className="text-white/80 hover:text-[#D4AF37]"
                  />
                </button>
              </div>

              {/* Buscador */}
              <div className="p-6 border-b border-[#D4AF37]/20">
                <div className="relative">
                  <Icon
                    icon="mdi:magnify"
                    width={20}
                    height={20}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-white/50"
                  />
                  <input
                    type="text"
                    placeholder="Buscar por nombre o nombre de lotería..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-white/10 border border-[#D4AF37]/30 rounded-lg text-white placeholder-white/50 focus:outline-none focus:border-[#D4AF37] focus:bg-white/15 transition-all"
                    style={{
                      fontFamily: "'Source Sans Pro', sans-serif",
                    }}
                  />
                </div>
              </div>

              {/* Listado de colaboradores */}
              <div className="flex-1 overflow-y-auto p-6">
                {shownCollaborators.length === 0 ? (
                  <div className="text-center py-12">
                    <p
                      className="text-white/60 text-lg"
                      style={{
                        fontFamily: "'Cormorant Garamond', 'Georgia', serif",
                      }}
                    >
                      Aún no ha salido ninguna persona
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {shownCollaborators
                      .filter((collab) => {
                        if (!searchTerm) return true;
                        const search = searchTerm.toLowerCase();
                        return (
                          collab.fullName.toLowerCase().includes(search) ||
                          collab.lotteryName?.toLowerCase().includes(search) ||
                          collab.role?.toLowerCase().includes(search)
                        );
                      })
                      .map((collab) => (
                        <div
                          key={collab.id}
                          className="flex items-center gap-4 p-4 bg-white/5 rounded-lg border border-[#D4AF37]/20 hover:bg-white/10 transition-all"
                        >
                          <img
                            src={collab.avatarUrl}
                            alt={collab.fullName}
                            className="w-16 h-16 rounded-full object-cover border-2 border-[#D4AF37]/50"
                            onError={(e) => {
                              e.currentTarget.src =
                                "https://via.placeholder.com/300?text=No+Image";
                            }}
                          />
                          <div className="flex-1 min-w-0">
                            <p
                              className="text-white/90 font-semibold truncate"
                              style={{
                                fontFamily: "'Source Sans Pro', sans-serif",
                              }}
                            >
                              {collab.fullName}
                            </p>
                            <p
                              className="text-[#D4AF37] text-sm truncate"
                              style={{
                                fontFamily:
                                  "'Cormorant Garamond', 'Georgia', serif",
                              }}
                            >
                              {collab.lotteryName}
                            </p>
                            {collab.role && (
                              <p
                                className="text-white/50 text-xs truncate"
                                style={{
                                  fontFamily: "'Source Sans Pro', sans-serif",
                                }}
                              >
                                {collab.role}
                              </p>
                            )}
                          </div>
                        </div>
                      ))}
                  </div>
                )}
              </div>

              {/* Footer con contador */}
              <div className="p-4 border-t border-[#D4AF37]/20 text-center">
                <p
                  className="text-white/60 text-sm"
                  style={{
                    fontFamily: "'Source Sans Pro', sans-serif",
                  }}
                >
                  Total: {shownCollaborators.length} persona
                  {shownCollaborators.length !== 1 ? "s" : ""}
                  {searchTerm &&
                    ` • Mostrando: ${
                      shownCollaborators.filter((collab) => {
                        const search = searchTerm.toLowerCase();
                        return (
                          collab.fullName.toLowerCase().includes(search) ||
                          collab.lotteryName?.toLowerCase().includes(search) ||
                          collab.role?.toLowerCase().includes(search)
                        );
                      }).length
                    }`}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Pantalla de bienvenida antes de comenzar
  if (!hasStarted && !isLoading && collaborators.length > 0) {
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

        {/* Contenido de bienvenida */}
        <div className="relative z-10 text-center px-8">
          <h1
            className="text-5xl md:text-6xl lg:text-7xl font-normal mb-8 tracking-wide"
            style={{
              fontFamily:
                "'Cormorant Garamond', 'Playfair Display', 'Georgia', serif",
              color: "#D4AF37",
              fontWeight: 400,
              letterSpacing: "0.1em",
            }}
          >
            ¡Listos para Iniciar!
          </h1>
          <p
            className="text-xl md:text-2xl text-white/80 font-light mb-12"
            style={{
              fontFamily: "'Cormorant Garamond', 'Georgia', serif",
              letterSpacing: "0.05em",
            }}
          >
            Presiona una tecla o el botón para comenzar
          </p>

          {/* Botón para comenzar */}
          <button
            onClick={handleNext}
            className="px-10 py-4 text-white/90 text-base uppercase tracking-[0.15em] transition-all flex items-center gap-3 mx-auto hover:text-[#D4AF37]"
            style={{
              fontFamily: "'Source Sans Pro', sans-serif",
              fontWeight: 300,
              borderBottom: "1px solid rgba(212, 175, 55, 0.4)",
              borderRadius: 0,
              background: "transparent",
            }}
          >
            <span>Comenzar</span>
            <Icon icon="mdi:arrow-right" width={20} height={20} />
          </button>
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
            filter: "blur(8px)",
          }}
        />
        <div
          className="absolute bottom-20 left-16 w-12 h-12 rounded-full bg-white/20 shadow-lg"
          style={{
            boxShadow: "0 4px 12px rgba(0, 0, 0, 0.2)",
            filter: "blur(6px)",
          }}
        />
        <div
          className="absolute bottom-24 right-32 w-16 h-16 rounded-full bg-white/25 shadow-lg"
          style={{
            boxShadow: "0 4px 12px rgba(0, 0, 0, 0.2)",
            filter: "blur(8px)",
          }}
        />

        {/* Esferas transparentes flotantes */}
        <div
          className="absolute top-32 left-20 w-20 h-20 rounded-full border-2 border-white/15 bg-white/5 backdrop-blur-sm"
          style={{
            boxShadow: "0 0 20px rgba(255, 255, 255, 0.1)",
            animation: "float 6s ease-in-out infinite",
            filter: "blur(10px)",
          }}
        />
        <div
          className="absolute top-40 right-24 w-16 h-16 rounded-full border-2 border-white/15 bg-white/5 backdrop-blur-sm"
          style={{
            boxShadow: "0 0 20px rgba(255, 255, 255, 0.1)",
            animation: "float 8s ease-in-out infinite",
            animationDelay: "1s",
            filter: "blur(8px)",
          }}
        />
        <div
          className="absolute bottom-32 right-20 w-18 h-18 rounded-full border-2 border-white/15 bg-white/5 backdrop-blur-sm"
          style={{
            boxShadow: "0 0 20px rgba(255, 255, 255, 0.1)",
            animation: "float 7s ease-in-out infinite",
            animationDelay: "2s",
            filter: "blur(9px)",
          }}
        />

        {/* Decoraciones navideñas con emojis - distribuidas por toda la pantalla */}
        {/* Estrellas - distribución completa */}
        <div
          className="absolute top-6 left-0 text-xl md:text-3xl"
          style={{
            opacity: emojiOpacity,
            filter: "drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3))",
            animation: "float 8s ease-in-out infinite",
          }}
        >
          ⭐
        </div>
        <div
          className="absolute top-6 right-0 text-2xl md:text-4xl"
          style={{
            opacity: emojiOpacity,
            filter: "drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3))",
            animation: "float 7s ease-in-out infinite",
            animationDelay: "1s",
          }}
        >
          ⭐
        </div>

        <div
          className="absolute top-75 left-40 text-4xl md:text-4xl"
          style={{
            opacity: emojiOpacity,
            filter: "drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3))",
            animation: "float 8.5s ease-in-out infinite",
            animationDelay: "1.5s",
          }}
        >
          ⭐
        </div>
        <div
          className="absolute top-75 right-40 text-2xl md:text-3xl"
          style={{
            opacity: emojiOpacity,
            filter: "drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3))",
            animation: "float 7.5s ease-in-out infinite",
            animationDelay: "2.5s",
          }}
        >
          ⭐
        </div>
        <div
          className="absolute bottom-50 left-20 text-3xl md:text-4xl"
          style={{
            opacity: emojiOpacity,
            filter: "drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3))",
            animation: "float 9.5s ease-in-out infinite",
            animationDelay: "0.8s",
          }}
        >
          ⭐
        </div>
        <div
          className="absolute bottom-50 right-20 text-3xl md:text-3xl"
          style={{
            opacity: emojiOpacity,
            filter: "drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3))",
            animation: "float 8s ease-in-out infinite",
            animationDelay: "1.8s",
          }}
        >
          ⭐
        </div>
        <div
          className="absolute bottom-0 left-0 text-3xl md:text-4xl"
          style={{
            opacity: emojiOpacity,
            filter: "drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3))",
            animation: "float 8.5s ease-in-out infinite",
            animationDelay: "0.3s",
          }}
        >
          ⭐
        </div>
        <div
          className="absolute bottom-0 right-0 text-3xl md:text-3xl"
          style={{
            opacity: emojiOpacity,
            filter: "drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3))",
            animation: "float 7.8s ease-in-out infinite",
            animationDelay: "2.2s",
          }}
        >
          ⭐
        </div>

        {/* Campanas - distribución completa */}
        <div
          className="absolute top-10 right-20 text-2xl md:text-4xl"
          style={{
            opacity: emojiOpacity,
            filter: "drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3))",
            animation: "float 7.5s ease-in-out infinite",
            animationDelay: "1.5s",
          }}
        >
          🔔
        </div>
        <div
          className="absolute top-10 left-20 text-4xl md:text-3xl"
          style={{
            opacity: emojiOpacity,
            filter: "drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3))",
            animation: "float 8.5s ease-in-out infinite",
            animationDelay: "2.5s",
          }}
        >
          🔔
        </div>
        <div
          className="absolute top-60 right-10 text-xl md:text-3xl"
          style={{
            opacity: emojiOpacity,
            filter: "drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3))",
            animation: "float 6s ease-in-out infinite",
            animationDelay: "0.8s",
          }}
        >
          🔔
        </div>
        <div
          className="absolute top-60 left-10 text-3xl md:text-4xl"
          style={{
            opacity: emojiOpacity,
            filter: "drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3))",
            animation: "float 7.8s ease-in-out infinite",
            animationDelay: "1.2s",
          }}
        >
          🔔
        </div>
        <div
          className="absolute bottom-10 right-20 text-3xl md:text-5xl"
          style={{
            opacity: emojiOpacity,
            filter: "drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3))",
            animation: "float 8.2s ease-in-out infinite",
            animationDelay: "2.2s",
          }}
        >
          🔔
        </div>
        <div
          className="absolute bottom-20 left-20 text-5xl md:text-3xl"
          style={{
            opacity: emojiOpacity,
            filter: "drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3))",
            animation: "float 9s ease-in-out infinite",
            animationDelay: "0.5s",
          }}
        >
          🔔
        </div>

        {/* Copos de nieve - distribución completa */}
        <div
          className="absolute top-20 left-80 text-lg md:text-3xl"
          style={{
            opacity: emojiOpacity,
            filter: "drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3))",
            animation: "float 9s ease-in-out infinite",
            animationDelay: "1.2s",
          }}
        >
          ❄️
        </div>
        <div
          className="absolute top-20 right-80 text-4xl md:text-4xl"
          style={{
            opacity: emojiOpacity,
            filter: "drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3))",
            animation: "float 7s ease-in-out infinite",
            animationDelay: "2s",
          }}
        >
          ❄️
        </div>
        <div
          className="absolute top-40 left-50 text-3xl md:text-5xl"
          style={{
            opacity: emojiOpacity,
            filter: "drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3))",
            animation: "float 8s ease-in-out infinite",
            animationDelay: "3s",
          }}
        >
          ❄️
        </div>
        <div
          className="absolute top-40 right-50 text-3xl md:text-3xl"
          style={{
            opacity: emojiOpacity,
            filter: "drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3))",
            animation: "float 7.2s ease-in-out infinite",
            animationDelay: "1.5s",
          }}
        >
          ❄️
        </div>
        <div
          className="absolute top-100 left-20 text-2xl md:text-4xl"
          style={{
            opacity: emojiOpacity,
            filter: "drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3))",
            animation: "float 8.8s ease-in-out infinite",
            animationDelay: "2.8s",
          }}
        >
          ❄️
        </div>
        <div
          className="absolute top-100 right-20 text-xl md:text-3xl"
          style={{
            opacity: emojiOpacity,
            filter: "drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3))",
            animation: "float 9.2s ease-in-out infinite",
            animationDelay: "0.3s",
          }}
        >
          ❄️
        </div>
        <div
          className="absolute bottom-0 left-50 text-3xl md:text-4xl"
          style={{
            opacity: emojiOpacity,
            filter: "drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3))",
            animation: "float 8.3s ease-in-out infinite",
            animationDelay: "1.9s",
          }}
        >
          ❄️
        </div>

        {/* Árboles de Navidad - distribución completa */}
        <div
          className="absolute top-10 left-120 text-2xl md:text-5xl"
          style={{
            opacity: emojiOpacity,
            filter: "drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3))",
            animation: "float 10s ease-in-out infinite",
          }}
        >
          🎄
        </div>
        <div
          className="absolute top-10 right-120 text-5xl md:text-4xl"
          style={{
            opacity: emojiOpacity,
            filter: "drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3))",
            animation: "float 9.5s ease-in-out infinite",
            animationDelay: "1.5s",
          }}
        >
          🎄
        </div>
        <div
          className="absolute top-60 left-80 text-4xl md:text-3xl"
          style={{
            opacity: emojiOpacity,
            filter: "drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3))",
            animation: "float 8.5s ease-in-out infinite",
            animationDelay: "2.2s",
          }}
        >
          🎄
        </div>
        <div
          className="absolute top-80 right-70 text-xl md:text-4xl"
          style={{
            opacity: emojiOpacity,
            filter: "drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3))",
            animation: "float 9.8s ease-in-out infinite",
            animationDelay: "0.7s",
          }}
        >
          🎄
        </div>
        <div
          className="absolute bottom-80 left-100 text-3xl md:text-3xl"
          style={{
            opacity: emojiOpacity,
            filter: "drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3))",
            animation: "float 8.3s ease-in-out infinite",
            animationDelay: "1.9s",
          }}
        >
          🎄
        </div>
        <div
          className="absolute bottom-10 right-100 text-4xl md:text-5xl"
          style={{
            opacity: emojiOpacity,
            filter: "drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3))",
            animation: "float 10.2s ease-in-out infinite",
            animationDelay: "2.5s",
          }}
        >
          🎄
        </div>
        <div
          className="absolute bottom-20 left-60 text-3xl md:text-4xl"
          style={{
            opacity: emojiOpacity,
            filter: "drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3))",
            animation: "float 9.3s ease-in-out infinite",
            animationDelay: "0.4s",
          }}
        >
          🎄
        </div>

        {/* Regalos - distribución completa */}
        <div
          className="absolute top-30 left-150 text-4xl md:text-3xl"
          style={{
            opacity: emojiOpacity,
            filter: "drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3))",
            animation: "float 7s ease-in-out infinite",
            animationDelay: "0.5s",
          }}
        >
          🎁
        </div>
        <div
          className="absolute top-30 right-150 text-xl md:text-4xl"
          style={{
            opacity: emojiOpacity,
            filter: "drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3))",
            animation: "float 8s ease-in-out infinite",
            animationDelay: "1.8s",
          }}
        >
          🎁
        </div>
        <div
          className="absolute top-60 right-120 text-3xl md:text-3xl"
          style={{
            opacity: emojiOpacity,
            filter: "drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3))",
            animation: "float 6.5s ease-in-out infinite",
            animationDelay: "2.8s",
          }}
        >
          🎁
        </div>
        <div
          className="absolute top-60 left-120 text-3xl md:text-5xl"
          style={{
            opacity: emojiOpacity,
            filter: "drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3))",
            animation: "float 7.5s ease-in-out infinite",
            animationDelay: "1.2s",
          }}
        >
          🎁
        </div>
        <div
          className="absolute bottom-40 left-80 text-2xl md:text-4xl"
          style={{
            opacity: emojiOpacity,
            filter: "drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3))",
            animation: "float 8.5s ease-in-out infinite",
            animationDelay: "0.9s",
          }}
        >
          🎁
        </div>
        <div
          className="absolute bottom-40 right-80 text-5xl md:text-3xl"
          style={{
            opacity: emojiOpacity,
            filter: "drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3))",
            animation: "float 7.8s ease-in-out infinite",
            animationDelay: "2.3s",
          }}
        >
          🎁
        </div>
        <div
          className="absolute bottom-0 left-100 text-3xl md:text-4xl"
          style={{
            opacity: emojiOpacity,
            filter: "drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3))",
            animation: "float 8.7s ease-in-out infinite",
            animationDelay: "1.1s",
          }}
        >
          🎁
        </div>

        <div
          className="absolute top-80 right-150 text-4xl md:text-3xl"
          style={{
            opacity: emojiOpacity,
            filter: "drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3))",
            animation: "float 9s ease-in-out infinite",
            animationDelay: "0.3s",
          }}
        >
          🎅
        </div>
        <div
          className="absolute bottom-30 left-140 text-3xl md:text-5xl"
          style={{
            opacity: emojiOpacity,
            filter: "drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3))",
            animation: "float 6.8s ease-in-out infinite",
            animationDelay: "1.7s",
          }}
        >
          🧦
        </div>
        <div
          className="absolute bottom-40 right-180 text-2xl md:text-4xl"
          style={{
            opacity: emojiOpacity,
            filter: "drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3))",
            animation: "float 8.2s ease-in-out infinite",
            animationDelay: "1.4s",
          }}
        >
          🎅
        </div>
      </div>

      {/* Contenido principal */}
      <div className="relative z-10 w-full max-w-4xl h-full flex flex-col items-center justify-center px-8 py-2 -mt-20">
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
              {/* Efecto de flashes detrás de la foto - múltiples cámaras - solo cuando la foto es visible */}
              {!showMystery && (
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
              )}
              <div
                className="absolute inset-0 rounded-full"
                style={{
                  background:
                    "radial-gradient(circle, rgba(212, 175, 55, 0.3) 0%, transparent 70%)",
                  filter: "blur(20px)",
                }}
              />
              <div className="relative z-10">
                <img
                  src={currentCollaborator.avatarUrl}
                  alt={currentCollaborator.fullName}
                  className="size-32 md:size-44 rounded-full object-cover block border-2 border-[#D4AF37]/50"
                  style={{
                    boxShadow: "0 8px 32px rgba(0, 0, 0, 0.4)",
                    filter: showMystery ? "brightness(0.2) blur(8px)" : "none",
                    transition: "filter 0.5s ease-in-out",
                  }}
                  onError={(e) => {
                    e.currentTarget.src =
                      "https://via.placeholder.com/300?text=No+Image";
                  }}
                />
                {/* Gorrito navideño - solo visible cuando la foto es visible */}
                {!showMystery && (
                  <img
                    src={gorroNavideno}
                    alt="Gorrito navideño"
                    className="absolute  right-[-45px] md:right-[-55px] rotate-[35deg] w-28 md:w-38 z-20 top-[-50px] md:top-[-60px]"
                    style={{
                      animation: "fade-in 0.5s ease-in-out",
                      filter: "drop-shadow(0 4px 8px rgba(0, 0, 0, 0.3))",
                    }}
                  />
                )}
                {/* Signo de interrogación cuando está en modo misterio */}
                {showMystery && (
                  <div
                    className="absolute inset-0 flex items-center justify-center"
                    style={{
                      animation: "fade-in 0.3s ease-in-out",
                    }}
                  >
                    <span
                      className="text-6xl md:text-8xl font-bold"
                      style={{
                        fontFamily: "'Cormorant Garamond', serif",
                        color: "#5a1d1d",
                        textShadow:
                          "0 0 20px rgba(90, 29, 28, 0.8), 0 0 40px rgba(90, 29, 28, 0.6)",
                        filter: "drop-shadow(0 0 15px rgba(90, 29, 28, 0.5))",
                      }}
                    >
                      ?
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Grito de lotería - estilo minimalista - siempre visible */}
          {currentCollaborator.lotteryShout && (
            <div className="mb-2 px-6 max-w-2xl mx-auto">
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

          {/* Nombre de lotería - tipografía elegante - solo visible cuando la foto es visible */}
          {!showMystery && (
            <h1
              className="text-4xl md:text-4xl font-normal mt-2 tracking-wide"
              style={{
                fontFamily:
                  "'Cormorant Garamond', 'Playfair Display', 'Georgia', serif",
                color: "#D4AF37",
                fontWeight: 400,
                animation: "fade-in 0.5s ease-in-out",
              }}
            >
              {currentCollaborator.lotteryName}
            </h1>
          )}

          {/* Nombre real - discreto - solo visible cuando se revela */}
          {!showMystery && (
            <div className="mt-6">
              <p
                className="text-white/70 text-sm md:text-base uppercase tracking-[0.2em]"
                style={{
                  fontFamily: "'Source Sans Pro', sans-serif",
                  letterSpacing: "0.2em",
                  fontWeight: 300,
                  animation: "fade-in 0.5s ease-in-out",
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
                    animation: "fade-in 0.5s ease-in-out",
                  }}
                >
                  {currentCollaborator.role}
                </p>
              )}
            </div>
          )}
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

      {/* Botón de historial en esquina inferior derecha */}
      <button
        onClick={() => {
          loadFromSessionStorage();
          setShowHistoryModal(true);
        }}
        className="absolute bottom-8 right-8 z-20 p-3 rounded-full bg-[#D4AF37]/20 hover:bg-[#D4AF37]/30 transition-all backdrop-blur-sm border border-[#D4AF37]/40"
        style={{
          boxShadow: "0 4px 12px rgba(0, 0, 0, 0.3)",
        }}
        title="Ver historial de personas que ya salieron"
      >
        <Icon
          icon="mdi:history"
          width={24}
          height={24}
          className="text-[#D4AF37]"
        />
      </button>

      {/* Modal de historial */}
      {showHistoryModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{
            background: "rgba(0, 0, 0, 0.7)",
            backdropFilter: "blur(4px)",
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowHistoryModal(false);
            }
          }}
        >
          <div
            className="relative w-full max-w-3xl max-h-[80vh] overflow-hidden flex flex-col"
            style={{
              background: "#5a1d1d",
              backgroundImage:
                "radial-gradient(ellipse at center, rgba(127, 46, 42, 0.9) 0%, rgba(90, 29, 28, 1) 100%)",
              borderRadius: "8px",
              boxShadow: "0 8px 32px rgba(0, 0, 0, 0.5)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header del modal */}
            <div className="flex items-center justify-between p-6 border-b border-[#D4AF37]/30">
              <h2
                className="text-2xl md:text-3xl font-normal"
                style={{
                  fontFamily:
                    "'Cormorant Garamond', 'Playfair Display', 'Georgia', serif",
                  color: "#D4AF37",
                  fontWeight: 400,
                }}
              >
                Personas que ya salieron
              </h2>
              <button
                onClick={() => setShowHistoryModal(false)}
                className="p-2 hover:bg-[#D4AF37]/20 rounded-full transition-all"
              >
                <Icon
                  icon="mdi:close"
                  width={24}
                  height={24}
                  className="text-white/80 hover:text-[#D4AF37]"
                />
              </button>
            </div>

            {/* Buscador */}
            <div className="p-6 border-b border-[#D4AF37]/20">
              <div className="relative">
                <Icon
                  icon="mdi:magnify"
                  width={20}
                  height={20}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-white/50"
                />
                <input
                  type="text"
                  placeholder="Buscar por nombre o nombre de lotería..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-white/10 border border-[#D4AF37]/30 rounded-lg text-white placeholder-white/50 focus:outline-none focus:border-[#D4AF37] focus:bg-white/15 transition-all"
                  style={{
                    fontFamily: "'Source Sans Pro', sans-serif",
                  }}
                />
              </div>
            </div>

            {/* Listado de colaboradores */}
            <div className="flex-1 overflow-y-auto p-6">
              {shownCollaborators.length === 0 ? (
                <div className="text-center py-12">
                  <p
                    className="text-white/60 text-lg"
                    style={{
                      fontFamily: "'Cormorant Garamond', 'Georgia', serif",
                    }}
                  >
                    Aún no ha salido ninguna persona
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {shownCollaborators
                    .filter((collab) => {
                      if (!searchTerm) return true;
                      const search = searchTerm.toLowerCase();
                      return (
                        collab.fullName.toLowerCase().includes(search) ||
                        collab.lotteryName?.toLowerCase().includes(search) ||
                        collab.role?.toLowerCase().includes(search)
                      );
                    })
                    .map((collab) => (
                      <div
                        key={collab.id}
                        className="flex items-center gap-4 p-4 bg-white/5 rounded-lg border border-[#D4AF37]/20 hover:bg-white/10 transition-all"
                      >
                        <img
                          src={collab.avatarUrl}
                          alt={collab.fullName}
                          className="w-16 h-16 rounded-full object-cover border-2 border-[#D4AF37]/50"
                          onError={(e) => {
                            e.currentTarget.src =
                              "https://via.placeholder.com/300?text=No+Image";
                          }}
                        />
                        <div className="flex-1 min-w-0">
                          <p
                            className="text-white/90 font-semibold truncate"
                            style={{
                              fontFamily: "'Source Sans Pro', sans-serif",
                            }}
                          >
                            {collab.fullName}
                          </p>
                          <p
                            className="text-[#D4AF37] text-sm truncate"
                            style={{
                              fontFamily:
                                "'Cormorant Garamond', 'Georgia', serif",
                            }}
                          >
                            {collab.lotteryName}
                          </p>
                          {collab.role && (
                            <p
                              className="text-white/50 text-xs truncate"
                              style={{
                                fontFamily: "'Source Sans Pro', sans-serif",
                              }}
                            >
                              {collab.role}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </div>

            {/* Footer con contador */}
            <div className="p-4 border-t border-[#D4AF37]/20 text-center">
              <p
                className="text-white/60 text-sm"
                style={{
                  fontFamily: "'Source Sans Pro', sans-serif",
                }}
              >
                Total: {shownCollaborators.length} persona
                {shownCollaborators.length !== 1 ? "s" : ""}
                {searchTerm &&
                  ` • Mostrando: ${
                    shownCollaborators.filter((collab) => {
                      const search = searchTerm.toLowerCase();
                      return (
                        collab.fullName.toLowerCase().includes(search) ||
                        collab.lotteryName?.toLowerCase().includes(search) ||
                        collab.role?.toLowerCase().includes(search)
                      );
                    }).length
                  }`}
              </p>
            </div>
          </div>
        </div>
      )}

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
