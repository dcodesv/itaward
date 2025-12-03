import { useState, useEffect } from "react";
import { Outlet, NavLink, Link } from "react-router-dom";
import Icon from "../../components/Icon";

export default function AdminLayout() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Cerrar sidebar con Escape y bloquear scroll cuando está abierto
  useEffect(() => {
    if (!isSidebarOpen) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsSidebarOpen(false);
      }
    };

    document.addEventListener("keydown", handleEscape);
    document.body.style.overflow = "hidden"; // Bloquear scroll

    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = ""; // Restaurar scroll
    };
  }, [isSidebarOpen]);

  const closeSidebar = () => setIsSidebarOpen(false);

  return (
    <div className="min-h-screen bg-linear-to-l from-[#080808] via-[#101019] to-[#080808]">
      <div className="flex h-screen relative">
        {/* Sidebar */}
        <aside
          className={`fixed md:static inset-y-0 left-0 z-50 w-56 bg-black/40 border-r border-white/10 backdrop-blur-xl flex flex-col transform transition-transform duration-300 ease-in-out ${
            isSidebarOpen
              ? "translate-x-0"
              : "-translate-x-full md:translate-x-0"
          }`}
        >
          <div className="p-3 border-b border-white/10 flex items-center justify-between md:justify-start">
            <div>
              <h1 className="text-base sm:text-lg font-semibold text-white uppercase tracking-wide">
                Admin Panel
              </h1>
              <p className="text-xs text-white/60 mt-0.5">IT Awards 2025</p>
            </div>
            <button
              onClick={closeSidebar}
              className="md:hidden p-1 rounded-lg hover:bg-white/10 transition ml-auto"
              aria-label="Cerrar menú"
            >
              <Icon icon="mdi:close" width={20} height={20} />
            </button>
          </div>

          <nav className="p-2 space-y-0.5 flex-1 overflow-y-auto">
            <NavLink
              to="/admin"
              end
              onClick={closeSidebar}
              className={({ isActive }) =>
                `flex items-center gap-2 px-3 py-2 rounded-lg transition text-sm ${
                  isActive
                    ? "bg-[#FFD080]/20 text-[#FFD080] border border-[#FFD080]/30"
                    : "text-white/70 hover:text-white hover:bg-white/5"
                }`
              }
            >
              <Icon icon="mdi:view-dashboard" className="text-sm" />
              <span className="text-sm font-medium">Dashboard</span>
            </NavLink>

            <NavLink
              to="/admin/categorias"
              onClick={closeSidebar}
              className={({ isActive }) =>
                `flex items-center gap-2 px-3 py-2 rounded-lg transition text-sm ${
                  isActive
                    ? "bg-[#FFD080]/20 text-[#FFD080] border border-[#FFD080]/30"
                    : "text-white/70 hover:text-white hover:bg-white/5"
                }`
              }
            >
              <Icon icon="mdi:trophy" className="text-sm" />
              <span className="text-sm font-medium">Categorías</span>
            </NavLink>

            <NavLink
              to="/admin/personas"
              onClick={closeSidebar}
              className={({ isActive }) =>
                `flex items-center gap-2 px-3 py-2 rounded-lg transition text-sm ${
                  isActive
                    ? "bg-[#FFD080]/20 text-[#FFD080] border border-[#FFD080]/30"
                    : "text-white/70 hover:text-white hover:bg-white/5"
                }`
              }
            >
              <Icon icon="mdi:account-group" className="text-sm" />
              <span className="text-sm font-medium">Personas</span>
            </NavLink>

            <NavLink
              to="/admin/nominaciones"
              onClick={closeSidebar}
              className={({ isActive }) =>
                `flex items-center gap-2 px-3 py-2 rounded-lg transition text-sm ${
                  isActive
                    ? "bg-[#FFD080]/20 text-[#FFD080] border border-[#FFD080]/30"
                    : "text-white/70 hover:text-white hover:bg-white/5"
                }`
              }
            >
              <Icon icon="mdi:clipboard-list" className="text-sm" />
              <span className="text-sm font-medium">Nominaciones</span>
            </NavLink>

            <NavLink
              to="/admin/usuarios"
              onClick={closeSidebar}
              className={({ isActive }) =>
                `flex items-center gap-2 px-3 py-2 rounded-lg transition text-sm ${
                  isActive
                    ? "bg-[#FFD080]/20 text-[#FFD080] border border-[#FFD080]/30"
                    : "text-white/70 hover:text-white hover:bg-white/5"
                }`
              }
            >
              <Icon icon="mdi:vote" className="text-sm" />
              <span className="text-sm font-medium">Votantes</span>
            </NavLink>

            <NavLink
              to="/admin/estadisticas"
              onClick={closeSidebar}
              className={({ isActive }) =>
                `flex items-center gap-2 px-3 py-2 rounded-lg transition text-sm ${
                  isActive
                    ? "bg-[#FFD080]/20 text-[#FFD080] border border-[#FFD080]/30"
                    : "text-white/70 hover:text-white hover:bg-white/5"
                }`
              }
            >
              <Icon icon="mdi:chart-line" className="text-sm" />
              <span className="text-sm font-medium">Estadísticas</span>
            </NavLink>

            <NavLink
              to="/admin/loteria"
              onClick={closeSidebar}
              className={({ isActive }) =>
                `flex items-center gap-2 px-3 py-2 rounded-lg transition text-sm ${
                  isActive
                    ? "bg-[#FFD080]/20 text-[#FFD080] border border-[#FFD080]/30"
                    : "text-white/70 hover:text-white hover:bg-white/5"
                }`
              }
            >
              <Icon icon="mdi:ticket" className="text-sm" />
              <span className="text-sm font-medium">Lotería</span>
            </NavLink>

            <Link
              to="/loteria-display"
              target="_blank"
              rel="noopener noreferrer"
              onClick={closeSidebar}
              className="flex items-center gap-2 px-3 py-2 rounded-lg transition text-sm text-white/70 hover:text-white hover:bg-white/5 border border-white/10 hover:border-[#FFD080]/30"
            >
              <Icon icon="mdi:projector-screen" className="text-sm" />
              <span className="text-sm font-medium">Ver Proyector</span>
              <Icon icon="mdi:open-in-new" className="text-xs ml-auto" />
            </Link>
          </nav>

          <div className="p-2 border-t border-white/10">
            <Link
              to="/"
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-white/70 hover:text-white hover:bg-white/5 transition text-xs"
            >
              <Icon icon="mdi:arrow-left" className="text-xs" />
              <span>Volver al sitio</span>
            </Link>
          </div>
        </aside>

        {/* Overlay para móvil */}
        {isSidebarOpen && (
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden"
            onClick={closeSidebar}
          />
        )}

        {/* Botón hamburguesa para móvil */}
        <button
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className="md:hidden fixed top-2 left-2 z-50 flex flex-col gap-1.5 p-2 rounded-lg bg-black/60 backdrop-blur-sm border border-white/10 hover:bg-black/80 transition"
          aria-label="Menú"
          aria-expanded={isSidebarOpen}
        >
          <span
            className={`block h-0.5 w-6 bg-white transition-all ${
              isSidebarOpen ? "rotate-45 translate-y-2" : ""
            }`}
          />
          <span
            className={`block h-0.5 w-6 bg-white transition-all ${
              isSidebarOpen ? "opacity-0" : ""
            }`}
          />
          <span
            className={`block h-0.5 w-6 bg-white transition-all ${
              isSidebarOpen ? "-rotate-45 -translate-y-2" : ""
            }`}
          />
        </button>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto md:ml-0">
          <div className="p-2 sm:p-3 md:p-4 pt-14 md:pt-2">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
