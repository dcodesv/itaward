import { supabase } from "./supabase";

const VOTING_STATUS_KEY = "voting_status";

/**
 * Obtiene el estado actual de las votaciones
 * @returns true si las votaciones están abiertas, false si están cerradas
 */
export async function getVotingStatus(): Promise<boolean> {
  try {
    // Intentar obtener desde una tabla de configuración
    // Por ahora usamos localStorage como fallback
    const stored = localStorage.getItem(VOTING_STATUS_KEY);
    if (stored !== null) {
      return stored === "open";
    }
    // Por defecto, las votaciones están abiertas
    return true;
  } catch (error) {
    console.error("Error al obtener estado de votaciones:", error);
    return true; // Por defecto abiertas
  }
}

/**
 * Establece el estado de las votaciones
 * @param isOpen - true para abrir, false para cerrar
 */
export async function setVotingStatus(isOpen: boolean): Promise<void> {
  try {
    localStorage.setItem(VOTING_STATUS_KEY, isOpen ? "open" : "closed");
    // Aquí podrías guardar en Supabase si tienes una tabla de configuración
  } catch (error) {
    console.error("Error al establecer estado de votaciones:", error);
  }
}

