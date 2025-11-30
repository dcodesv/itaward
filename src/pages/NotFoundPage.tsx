import { Link } from "react-router-dom";
import Icon from "../components/Icon";

export default function NotFoundPage() {
  return (
    <div className="min-h-screen bg-linear-to-l from-[#080808] via-[#101019] to-[#080808] relative overflow-hidden flex items-center justify-center px-4 py-8 -mt-12">
      {/* Fondo decorativo - igual que otras páginas */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -bottom-40 -left-40 size-[400px] rounded-full bg-[#FFD080]/20 blur-3xl" />
        <div className="absolute -bottom-40 -right-40 size-[400px] rounded-full bg-[#FFD080]/20 blur-3xl" />
        <div className="absolute top-[250px] mx-auto left-0 right-0 size-[400px] rounded-full bg-[#FFD080]/15 blur-3xl" />
      </div>

      <section className="relative w-full max-w-4xl flex flex-col items-center justify-center z-10">
        {/* Tarjeta principal con backdrop-blur */}
        <div className="rounded-3xl bg-white/5 border border-white/10 p-6 sm:p-8 md:p-10 backdrop-blur-xl w-full">
          <div className="text-center">
            {/* Icono visual */}
            <div className="flex justify-center mb-4">
              <div className="relative">
                <div className="absolute inset-0 bg-[#FFD080]/20 rounded-full blur-xl animate-pulse" />
                <div className="relative bg-[#FFD080]/10 border border-[#FFD080]/30 rounded-full p-3 sm:p-4">
                  <Icon
                    icon="mdi:alert-circle-outline"
                    className="text-[#FFD080]"
                    width={40}
                    height={40}
                  />
                </div>
              </div>
            </div>

            {/* Número 404 */}
            <div className="mb-4">
              <h1 className="text-6xl sm:text-7xl md:text-8xl font-bold text-[#FFD080] mb-3 leading-none tracking-tight">
                404
              </h1>
              <div className="h-0.5 w-20 sm:w-24 bg-gradient-to-r from-transparent via-[#FFD080] to-transparent mx-auto" />
            </div>

            {/* Título y descripción */}
            <div className="mb-6 sm:mb-8">
              <p className="text-white/60 uppercase tracking-[0.2em] text-xs sm:text-sm mb-2">
                Error
              </p>
              <h2 className="text-lg sm:text-xl md:text-2xl font-light text-white mb-3 uppercase tracking-wide max-w-2xl mx-auto">
                Página no encontrada
              </h2>
              <p className="text-white/60 text-xs sm:text-sm md:text-base max-w-md mx-auto leading-relaxed">
                Lo sentimos, la página que buscas no existe o ha sido movida.
                Por favor, verifica la URL o regresa a la página principal.
              </p>
            </div>

            {/* Botones de acción */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-6">
              <Link
                to="/"
                className="w-full sm:w-auto px-8 py-3 bg-gradient-to-r from-[#FFD080] to-[#D4A574] text-[#080808] font-semibold rounded-lg hover:opacity-90 hover:scale-105 transition-all duration-200 uppercase tracking-wider text-sm sm:text-base flex items-center justify-center gap-2"
              >
                <Icon icon="mdi:home" width={20} height={20} />
                <span>Volver al inicio</span>
              </Link>

              <Link
                to="/categorias"
                className="w-full sm:w-auto px-8 py-3 border border-[#FFD080] text-[#FFD080] font-semibold rounded-lg hover:bg-[#FFD080]/10 hover:scale-105 transition-all duration-200 uppercase tracking-wider text-sm sm:text-base flex items-center justify-center gap-2"
              >
                <Icon icon="mdi:trophy" width={20} height={20} />
                <span>Ver categorías</span>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
