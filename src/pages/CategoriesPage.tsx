import { useState, useEffect } from "react";
import CategoryCard from "../components/CategoryCard";
import { supabase } from "../lib/supabase";
import type { Category } from "../types";

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [nominationsByCategory, setNominationsByCategory] = useState<
    Record<number, number>
  >({});
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadAllData = async () => {
      try {
        setIsLoading(true);

        // Cargar categorías
        const { data: categoriesData, error: categoriesError } = await supabase
          .from("categories")
          .select("*")
          .order("name", { ascending: true });

        if (categoriesError) {
          console.error("Error al cargar categorías:", categoriesError);
          return;
        }

        if (categoriesData && Array.isArray(categoriesData)) {
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

        // Cargar nominaciones para contar colaboradores nominados por categoría
        const { data: nominationsData, error: nominationsError } = await supabase
          .from("nominations")
          .select("category_id, collaborator_id");

        if (nominationsError) {
          console.error("Error al cargar nominaciones:", nominationsError);
          return;
        }

        if (nominationsData && Array.isArray(nominationsData)) {
          // Contar colaboradores únicos nominados por categoría
          const nominationsCount: Record<number, Set<number>> = {};

          nominationsData.forEach(
            (nom: { category_id: number; collaborator_id: number }) => {
              if (!nominationsCount[nom.category_id]) {
                nominationsCount[nom.category_id] = new Set();
              }
              nominationsCount[nom.category_id].add(nom.collaborator_id);
            }
          );

          // Convertir Sets a números
          const counts: Record<number, number> = {};
          Object.keys(nominationsCount).forEach((categoryId) => {
            counts[parseInt(categoryId, 10)] =
              nominationsCount[parseInt(categoryId, 10)].size;
          });

          setNominationsByCategory(counts);
        }
      } catch (error) {
        console.error("Error inesperado al cargar datos:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadAllData();
  }, []);

  return (
    <div className="min-h-screen bg-linear-to-l from-[#080808] via-[#101019] to-[#080808] relative overflow-hidden">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -bottom-40 -left-40 size-[400px] rounded-full bg-[#FFD080]/20 blur-3xl" />
        <div className="absolute -bottom-40 -right-40 size-[400px] rounded-full bg-[#FFD080]/20 blur-3xl" />
        <div className="absolute top-[250px] mx-auto left-0 right-0 size-[400px] rounded-full bg-[#FFD080]/15 blur-3xl" />
      </div>

      <section className="relative w-full px-4 md:px-10 py-14 flex flex-col gap-10">
        <header className="flex flex-col items-center text-center gap-3 sm:gap-4 px-4">
          <div>
            <p className="text-white/60 uppercase tracking-[0.2em] sm:tracking-[0.3em] text-sm sm:text-base md:text-lg">
              Categorías a votar
            </p>
            <h1 className="mt-2 text-base sm:text-lg md:text-xl font-light text-white uppercase max-w-2xl">
              Selecciona para ver más detalles de cada categoría
            </h1>
          </div>
        </header>

        <div className="rounded-3xl bg-white/5 border border-white/10 p-6 md:p-10 backdrop-blur">
          {isLoading ? (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
              {[...Array(6)].map((_, index) => (
                <div
                  key={index}
                  className="relative overflow-hidden rounded-3xl border border-white/10 backdrop-blur-xl p-5 animate-pulse"
                >
                  <div className="flex items-start gap-3 mb-3">
                    <div className="size-8 rounded-full bg-white/10 shrink-0" />
                    <div className="flex-1 space-y-2">
                      <div className="h-6 bg-white/10 rounded w-3/4" />
                      <div className="h-4 bg-white/5 rounded w-full" />
                      <div className="h-4 bg-white/5 rounded w-5/6" />
                    </div>
                  </div>
                  <div className="mt-4 space-y-2">
                    <div className="h-4 bg-white/10 rounded w-1/3" />
                  </div>
                  {/* Efecto shimmer */}
                  <div className="absolute inset-0 animate-shimmer pointer-events-none" />
                </div>
              ))}
            </div>
          ) : categories.length > 0 ? (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
              {categories.map((c) => (
                <CategoryCard
                  key={c.id}
                  category={c}
                  nomineesCount={nominationsByCategory[c.id] || 0}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-white/60 text-sm">
                No hay categorías disponibles en este momento.
              </p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
