import { useState, useEffect } from "react";
import type { FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../store/useAuthStore";
import { useNominationsStore } from "../store/useNominationsStore";

export default function LoginPage() {
  const [employeeCode, setEmployeeCode] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const login = useAuthStore((state) => state.login);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated());
  const syncWithSupabase = useNominationsStore(
    (state) => state.syncWithSupabase
  );
  const navigate = useNavigate();

  // Redirigir si ya está autenticado
  useEffect(() => {
    if (isAuthenticated) {
      navigate("/categorias", { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const success = await login(employeeCode.trim());

      if (success) {
        // Sincronizar nominaciones desde Supabase después del login
        await syncWithSupabase();
        navigate("/categorias");
      } else {
        setError(
          "Código de empleado no válido. Por favor, intenta nuevamente."
        );
        setIsLoading(false);
      }
    } catch {
      setError("Error al iniciar sesión. Por favor, intenta nuevamente.");
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-linear-to-l from-[#080808] via-[#101019] to-[#080808] relative overflow-hidden -mt-[64px] flex items-center justify-center">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -bottom-40 -left-40 size-[400px] rounded-full bg-[#FFD080]/20 blur-3xl" />
        <div className="absolute -bottom-40 -right-40 size-[400px] rounded-full bg-[#FFD080]/20 blur-3xl" />
      </div>

      <div className="relative z-10 w-full max-w-md px-4 sm:px-6 py-8">
        <div className="rounded-3xl bg-white/5 border border-white/10 p-6 sm:p-8 backdrop-blur-xl">
          <div className="text-center mb-6 sm:mb-8">
            <h1 className="text-xl sm:text-2xl font-light text-white uppercase tracking-wide mb-2">
              Iniciar Sesión
            </h1>
            <p className="text-white/60 text-xs sm:text-sm px-2">
              Ingresa tu código de empleado para comenzar a votar
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label
                htmlFor="employeeCode"
                className="block text-white/80 text-sm font-medium mb-2"
              >
                Código de Empleado
              </label>
              <input
                id="employeeCode"
                type="text"
                value={employeeCode}
                onChange={(e) => setEmployeeCode(e.target.value.toUpperCase())}
                placeholder="Ejemplo: 001"
                className="w-full bg-white/5 border border-white/15 rounded-full px-4 py-3 text-white placeholder:text-white/40 focus:outline-none focus:border-[#FFD080] transition"
                required
                disabled={isLoading}
                autoFocus
              />
              {error && <p className="mt-2 text-red-400 text-xs">{error}</p>}
            </div>

            <button
              type="submit"
              disabled={isLoading || !employeeCode.trim()}
              className="w-full px-6 py-3 rounded-full bg-linear-to-r from-[#FFD080] to-[#D4A574] text-[#080808] font-semibold hover:opacity-90 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? "Verificando..." : "Ingresar"}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-white/10">
            <p className="text-white/50 text-xs text-center">
              Si no tienes un código de empleado, contacta al administrador.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
