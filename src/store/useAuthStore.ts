import { create } from "zustand";
import { persist } from "zustand/middleware";
import { supabase } from "../lib/supabase";

type AuthState = {
  employeeCode: string | null;
  fullName: string | null;
  voterId: number | null;
  login: (employeeCode: string) => Promise<boolean>;
  logout: () => void;
  isAuthenticated: () => boolean;
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      employeeCode: null,
      fullName: null,
      voterId: null,
      login: async (employeeCode: string) => {
        try {
          const { data, error } = await supabase
            .from("voters")
            .select("id, employee_code, full_name")
            .ilike("employee_code", employeeCode.trim().toUpperCase())
            .single();

          if (error || !data) {
            return false;
          }

          const voterData = data as {
            id: number;
            employee_code: string;
            full_name: string;
          };

          set({
            employeeCode: voterData.employee_code,
            fullName: voterData.full_name,
            voterId: voterData.id,
          });
          return true;
        } catch (error) {
          console.error("Error al iniciar sesión:", error);
          return false;
        }
      },
      logout: () => {
        set({
          employeeCode: null,
          fullName: null,
          voterId: null,
        });
      },
      isAuthenticated: () => {
        return get().employeeCode !== null;
      },
    }),
    {
      name: "it-awards-auth-v1",
      version: 2,
      partialize: (state) => ({
        employeeCode: state.employeeCode,
        fullName: state.fullName,
        voterId: state.voterId,
      }),
    }
  )
);
