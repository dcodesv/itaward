import { useMemo, useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import Swal from "sweetalert2";
import { useAuthStore } from "../store/useAuthStore";
import { useNominationsStore } from "../store/useNominationsStore";
import { supabase } from "../lib/supabase";
import "../App.css";

export default function UserBanner() {
  const navigate = useNavigate();
  const { employeeCode, fullName, logout } = useAuthStore();
  const userNominations = useNominationsStore((state) => state.userNominations);
  const [totalCategories, setTotalCategories] = useState<number>(0);

  // Cargar total de categorías desde Supabase
  useEffect(() => {
    const loadCategoriesCount = async () => {
      try {
        const { data, error } = await supabase.from("categories").select("id");

        if (!error && data) {
          setTotalCategories(data.length);
        }
      } catch (error) {
        console.error("Error al cargar total de categorías:", error);
      }
    };

    loadCategoriesCount();
  }, []);

  // Obtener nominaciones del usuario actual
  const nominations = useMemo(() => {
    if (!employeeCode) return {};
    return userNominations[employeeCode] ?? {};
  }, [userNominations, employeeCode]);

  if (!employeeCode || !fullName) return null;

  // Contar cuántas categorías tiene nominaciones
  const nominationsCount = Object.values(nominations).filter(
    (nom) => nom !== null
  ).length;

  const handleLogout = async () => {
    const result = await Swal.fire({
      title: "¿Cerrar sesión?",
      html: `
        <div style="text-align: left; color: rgba(255, 255, 255, 0.9); font-size: 14px;">
          <p style="margin-bottom: 12px;">¿Estás seguro de que quieres cerrar sesión?</p>
          <p style="margin-top: 12px; color: rgba(255, 255, 255, 0.6); font-size: 13px;">
            Tus votos se mantendrán guardados y podrás verlos al iniciar sesión nuevamente.
          </p>
        </div>
      `,
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Sí, cerrar sesión",
      cancelButtonText: "Cancelar",
      confirmButtonColor: "#FFD080",
      cancelButtonColor: "#6c757d",
      background: "#080808",
      color: "#ffffff",
      backdrop: `
        rgba(0, 0, 0, 0.8)
        left top
        no-repeat
      `,
      customClass: {
        popup: "swal2-popup-custom",
        title: "swal2-title-custom",
        htmlContainer: "swal2-html-container-custom",
        confirmButton: "swal2-confirm-custom",
        cancelButton: "swal2-cancel-custom",
      },
      buttonsStyling: true,
      reverseButtons: true,
    });

    if (result.isConfirmed) {
      logout();
      navigate("/");
    }
  };

  return (
    <div className="w-full bg-linear-to-r from-[#FFD080] to-[#D4A574] border-b border-[#FFD080]/30 px-2 md:px-4 py-1.5">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-2 md:gap-4">
        <div className="flex items-center gap-2 md:gap-4 min-w-0 flex-1">
          <div className="min-w-0 flex-1">
            <p className="text-[#080808] text-xs md:text-sm font-medium truncate">
              {employeeCode} - {fullName}
            </p>
          </div>
          <div className="hidden md:flex items-center gap-2 shrink-0">
            <span className="text-[#080808]/80 text-sm">Nominaciones:</span>
            <Link
              to="/mis-votos"
              className="text-[#080808] font-semibold text-sm hover:underline"
            >
              {nominationsCount}/{totalCategories}
            </Link>
          </div>
          {/* Contador compacto en móvil */}
          <div className="md:hidden flex items-center shrink-0">
            <Link
              to="/mis-votos"
              className="text-[#080808] font-semibold text-xs md:text-sm hover:underline"
              title={`Nominaciones: ${nominationsCount}/${totalCategories}`}
            >
              {nominationsCount}/{totalCategories}
            </Link>
          </div>
        </div>
        <div className="flex items-center gap-1.5 md:gap-2 shrink-0">
          <Link
            to="/mis-votos"
            className="px-2 md:px-3 py-1 rounded-full bg-[#080808]/20 hover:bg-[#080808]/30 text-[#080808] text-xs md:text-sm font-medium transition border border-[#080808]/30"
          >
            <span className="hidden sm:inline">Mis Votos</span>
            <span className="sm:hidden">Votos</span>
          </Link>
          <button
            onClick={handleLogout}
            className="px-2 md:px-3 py-1 rounded-full bg-[#080808]/20 hover:bg-[#080808]/30 text-[#080808] text-xs md:text-sm font-medium transition border border-[#080808]/30"
            title="Cerrar sesión"
          >
            <span className="hidden sm:inline">Cerrar sesión</span>
            <span className="sm:hidden">Salir</span>
          </button>
        </div>
      </div>
    </div>
  );
}
