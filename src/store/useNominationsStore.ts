import { create } from "zustand";
import { persist } from "zustand/middleware";
import { useAuthStore } from "./useAuthStore";
import { supabase } from "../lib/supabase";

type NominationsState = {
  // employeeCode -> { categoryId -> collaboratorId }
  userNominations: Record<string, Record<string, string | null>>;
  nominate: (categoryId: string, collaboratorId: string) => Promise<void>;
  clearNomination: (categoryId: string) => Promise<void>;
  getNominationId: (categoryId: string) => string | null;
  getCurrentUserNominations: () => Record<string, string | null>;
  syncWithSupabase: () => Promise<void>;
};

const getAuthInfo = () => {
  const state = useAuthStore.getState();
  return {
    employeeCode: state.employeeCode,
    voterId: state.voterId,
  };
};

export const useNominationsStore = create<NominationsState>()(
  persist(
    (set, get) => ({
      userNominations: {},
      nominate: async (categoryId, collaboratorId) => {
        const { employeeCode, voterId } = getAuthInfo();
        if (!employeeCode || !voterId) return;

        const categoryIdNum = parseInt(categoryId, 10);
        const collaboratorIdNum = parseInt(collaboratorId, 10);

        if (isNaN(categoryIdNum) || isNaN(collaboratorIdNum)) {
          console.error("IDs inválidos para nominación");
          return;
        }

        try {
          // Guardar en localStorage primero para UX inmediata
          set((prev) => ({
            userNominations: {
              ...prev.userNominations,
              [employeeCode]: {
                ...prev.userNominations[employeeCode],
                [categoryId]: collaboratorId,
              },
            },
          }));

          // Guardar en Supabase
          // Primero verificar si ya existe una nominación para esta combinación
          const { data: existing } = await supabase
            .from("nominations")
            .select("id")
            .eq("voter_id", voterId)
            .eq("category_id", categoryIdNum)
            .maybeSingle();

          let error = null;

          if (existing) {
            // Actualizar la nominación existente
            const { error: updateError } = await supabase
              .from("nominations")
              // @ts-expect-error - Supabase types will be generated after schema is applied
              .update({ collaborator_id: collaboratorIdNum })
              .eq("voter_id", voterId)
              .eq("category_id", categoryIdNum);
            error = updateError;
          } else {
            // Crear nueva nominación
            const { error: insertError } = await supabase
              .from("nominations")
              // @ts-expect-error - Supabase types will be generated after schema is applied
              .insert({
                voter_id: voterId,
                category_id: categoryIdNum,
                collaborator_id: collaboratorIdNum,
              });
            error = insertError;
          }

          if (error) {
            console.error("Error al guardar nominación en Supabase:", error);
            // Revertir cambio en localStorage si falla
            set((prev) => ({
              userNominations: {
                ...prev.userNominations,
                [employeeCode]: {
                  ...prev.userNominations[employeeCode],
                  [categoryId]:
                    prev.userNominations[employeeCode]?.[categoryId] || null,
                },
              },
            }));
          }
        } catch (error) {
          console.error("Error inesperado al guardar nominación:", error);
        }
      },
      clearNomination: async (categoryId) => {
        const { employeeCode, voterId } = getAuthInfo();
        if (!employeeCode || !voterId) return;

        const categoryIdNum = parseInt(categoryId, 10);
        if (isNaN(categoryIdNum)) {
          console.error("ID de categoría inválido");
          return;
        }

        try {
          // Eliminar de localStorage primero
          set((prev) => ({
            userNominations: {
              ...prev.userNominations,
              [employeeCode]: {
                ...prev.userNominations[employeeCode],
                [categoryId]: null,
              },
            },
          }));

          // Eliminar de Supabase
          const { error } = await supabase
            .from("nominations")
            .delete()
            .eq("voter_id", voterId)
            .eq("category_id", categoryIdNum);

          if (error) {
            console.error("Error al eliminar nominación en Supabase:", error);
          }
        } catch (error) {
          console.error("Error inesperado al eliminar nominación:", error);
        }
      },
      getNominationId: (categoryId) => {
        const { employeeCode } = getAuthInfo();
        if (!employeeCode) return null;
        const userNominations = get().userNominations[employeeCode];
        return userNominations?.[categoryId] ?? null;
      },
      getCurrentUserNominations: () => {
        const { employeeCode } = getAuthInfo();
        if (!employeeCode) return {};
        return get().userNominations[employeeCode] ?? {};
      },
      syncWithSupabase: async () => {
        const { employeeCode, voterId } = getAuthInfo();
        if (!employeeCode || !voterId) return;

        try {
          // Primero: migrar nominaciones existentes de localStorage a Supabase
          const localNominations = get().userNominations[employeeCode] || {};

          // Migrar cada nominación local a Supabase si no existe
          for (const [categoryIdStr, collaboratorIdStr] of Object.entries(
            localNominations
          )) {
            if (collaboratorIdStr) {
              const categoryIdNum = parseInt(categoryIdStr, 10);
              const collaboratorIdNum = parseInt(collaboratorIdStr, 10);

              if (!isNaN(categoryIdNum) && !isNaN(collaboratorIdNum)) {
                // Verificar si ya existe en Supabase
                const { data: existing } = await supabase
                  .from("nominations")
                  .select("id")
                  .eq("voter_id", voterId)
                  .eq("category_id", categoryIdNum)
                  .single();

                if (!existing) {
                  // Crear en Supabase si no existe
                  await supabase
                    .from("nominations")
                    // @ts-expect-error - Supabase types will be generated after schema is applied
                    .insert({
                      voter_id: voterId,
                      category_id: categoryIdNum,
                      collaborator_id: collaboratorIdNum,
                    });
                }
              }
            }
          }

          // Segundo: cargar nominaciones desde Supabase para actualizar localStorage
          const { data, error } = await supabase
            .from("nominations")
            .select("category_id, collaborator_id")
            .eq("voter_id", voterId);

          if (error) {
            console.error("Error al sincronizar nominaciones:", error);
            return;
          }

          if (data && Array.isArray(data)) {
            // Mapear a formato localStorage
            const nominations: Record<string, string> = {};
            data.forEach(
              (nom: { category_id: number; collaborator_id: number }) => {
                nominations[nom.category_id.toString()] =
                  nom.collaborator_id.toString();
              }
            );

            // Actualizar localStorage
            set((prev) => ({
              userNominations: {
                ...prev.userNominations,
                [employeeCode]: nominations,
              },
            }));
          }
        } catch (error) {
          console.error("Error inesperado al sincronizar:", error);
        }
      },
    }),
    {
      name: "it-awards-nominations-v1",
      version: 2,
      partialize: (state) => ({ userNominations: state.userNominations }),
    }
  )
);
