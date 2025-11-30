import { useState } from "react";
import type { Collaborator } from "../types";

type Props = {
  collaborator: Collaborator;
  isSelected: boolean;
  disabled: boolean;
  onSelect: () => void;
};

export default function CollaboratorCard({
  collaborator,
  isSelected,
  disabled,
  onSelect,
}: Props) {
  const [active, setActive] = useState(false);
  return (
    <div
      onClick={() => setActive((v) => !v)}
      onMouseLeave={() => setActive(false)}
      className={`relative group rounded-3xl overflow-hidden border border-white/10 bg-black/20 backdrop-blur-lg transition ${
        isSelected ? "border-[#FFD080]" : "hover:border-[#FFD080]/60"
      } aspect-square shadow-[0_15px_35px_rgba(0,0,0,0.35)]`}
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,208,128,0.25),transparent_60%)] opacity-0 group-hover:opacity-100 transition" />
      <div className="pointer-events-none absolute inset-0 border border-white/10 rounded-3xl" />
      {isSelected ? (
        <span className="absolute top-3 right-3 z-20 rounded-full border border-[#FFD080]/40 bg-black/40 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-[#FFD080]">
          Nominado
        </span>
      ) : null}

      {/* Imagen de fondo */}
      <img
        src={collaborator.avatarUrl}
        alt={collaborator.fullName}
        className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-105 group-hover:rotate-4 group-hover:blur-sm"
      />

      {/* Gradiente base */}
      <div className="absolute inset-0 bg-linear-to-t from-[#04050b] via-transparent to-transparent" />

      {/* Contenido base */}
      <div
        className={`relative z-10 h-full flex flex-col justify-end p-4 transition-opacity duration-200 ${
          active ? "opacity-0" : "group-hover:opacity-0"
        }`}
      >
        <p className="text-white text-base sm:text-lg font-semibold tracking-tight">
          {collaborator.fullName}
        </p>
        {collaborator.role ? (
          <p className="text-white/70 text-xs sm:text-sm line-clamp-2">
            {collaborator.role}
          </p>
        ) : null}
      </div>

      {/* Overlay interactivo */}
      <div
        className={`absolute inset-0 transition opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto group-hover:bg-black/60 ${
          active ? "opacity-100 pointer-events-auto" : ""
        }`}
      >
        <div className="absolute inset-0 bg-linear-to-b from-white/15 via-white/5 to-transparent" />
        <div
          className="relative z-10 h-full w-full flex flex-col items-center justify-end gap-4 p-4 text-white text-center"
          onClick={(e) => e.stopPropagation()}
        >
          <div>
            <p className="text-base sm:text-lg uppercase tracking-tight">
              {collaborator.fullName}
            </p>
            <p className="text-white/80 text-xs sm:text-sm line-clamp-2">
              {collaborator.role ?? "Colaborador/a de IT"}
            </p>
          </div>
          <button
            onClick={onSelect}
            disabled={disabled && !isSelected}
            className={`cursor-pointer uppercase pointer-events-auto w-full px-4 py-2 rounded-full text-sm tracking-wide transition ${
              isSelected
                ? "bg-[#FFD080] text-[#080808]"
                : disabled
                ? "bg-white/10 text-white/60 cursor-not-allowed"
                : "bg-white/10 text-white/60 hover:bg-white/20 hover:text-white border border-[#FFD080]/20"
            }`}
          >
            {isSelected ? "Seleccionado" : "Nominar"}
          </button>
        </div>
      </div>
    </div>
  );
}
