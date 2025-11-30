import { useState, useEffect } from "react";
import { Link, NavLink } from "react-router-dom";
import logoAward from "../assets/ITHA2025.png";
import UserBanner from "./UserBanner";
import { useAuthStore } from "../store/useAuthStore";

export default function TopNav() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated());
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const closeMenu = () => setIsMenuOpen(false);

  // Cerrar menú con Escape y bloquear scroll cuando está abierto
  useEffect(() => {
    if (!isMenuOpen) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        closeMenu();
      }
    };

    document.addEventListener("keydown", handleEscape);
    document.body.style.overflow = "hidden"; // Bloquear scroll

    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = ""; // Restaurar scroll
    };
  }, [isMenuOpen]);

  const navLinks = [
    { to: "/", label: "Inicio" },
    { to: "/categorias", label: "Categorías" },
    { to: "/participantes", label: "Participantes" },
    ...(isAuthenticated ? [{ to: "/mis-votos", label: "Mis Votos" }] : []),
  ];

  return (
    <header className="sticky top-0 z-50">
      <div
        className={`w-full px-2 md:px-8 py-2 flex items-center justify-between ${
          isAuthenticated
            ? "bg-[#080808]"
            : "bg-linear-to-b from-[#080808] to-[#080808]/0"
        }`}
      >
        <Link to="/" className="flex items-center gap-2">
          <img
            src={logoAward}
            alt="IT Awards 2025"
            className="h-7 md:h-9 w-auto drop-shadow"
            loading="eager"
            decoding="async"
          />
          <span className="sr-only">IT Awards</span>
        </Link>

        {/* Menú desktop - visible solo en md y superior */}
        <nav className="hidden md:flex items-center gap-4 md:gap-6">
          {navLinks.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) =>
                `text-sm font-medium ${
                  isActive ? "text-[#FFD080]" : "text-white/60 hover:text-white"
                }`
              }
            >
              {link.label}
            </NavLink>
          ))}
        </nav>

        {/* Botón hamburguesa - visible solo en móvil */}
        <button
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          className="md:hidden flex flex-col gap-1.5 p-2 rounded-lg hover:bg-white/10 transition"
          aria-label="Menú"
          aria-expanded={isMenuOpen}
        >
          <span
            className={`block h-0.5 w-6 bg-white transition-all ${
              isMenuOpen ? "rotate-45 translate-y-2" : ""
            }`}
          />
          <span
            className={`block h-0.5 w-6 bg-white transition-all ${
              isMenuOpen ? "opacity-0" : ""
            }`}
          />
          <span
            className={`block h-0.5 w-6 bg-white transition-all ${
              isMenuOpen ? "-rotate-45 -translate-y-2" : ""
            }`}
          />
        </button>
      </div>

      {/* Menú móvil - overlay */}
      {isMenuOpen && (
        <>
          {/* Overlay oscuro */}
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] md:hidden"
            onClick={closeMenu}
          />
          {/* Menú deslizante */}
          <nav
            className={`fixed top-0 right-0 h-full w-64 bg-[#080808] border-l border-white/10 shadow-2xl z-[70] md:hidden transform transition-transform duration-300 ease-in-out ${
              isMenuOpen ? "translate-x-0" : "translate-x-full"
            }`}
          >
            <div className="flex flex-col h-full pt-20">
              {navLinks.map((link) => (
                <NavLink
                  key={link.to}
                  to={link.to}
                  onClick={closeMenu}
                  className={({ isActive }) =>
                    `px-6 py-4 text-base font-medium border-b border-white/5 ${
                      isActive
                        ? "text-[#FFD080] bg-[#FFD080]/10"
                        : "text-white/70 hover:text-white hover:bg-white/5"
                    }`
                  }
                >
                  {link.label}
                </NavLink>
              ))}
            </div>
          </nav>
        </>
      )}

      <UserBanner />
    </header>
  );
}
