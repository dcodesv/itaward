import { Link } from "react-router-dom";
import type { Category } from "../types";

type Props = {
  category: Category;
  nomineesCount?: number;
};

export default function CategoryCard({ category, nomineesCount = 0 }: Props) {
  return (
    <Link
      to={`/categorias/${category.id}`}
      className="cursor-pointer relative group overflow-hidden rounded-3xl border border-white/10 hover:border-[#FFD080] backdrop-blur-xl p-5 transition"
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,208,128,0.25),transparent_60%)] opacity-0 group-hover:opacity-100 transition" />
      <div className="pointer-events-none absolute inset-0 border border-white/5 rounded-3xl" />
      <div className="relative z-10 flex items-start gap-2 sm:gap-3 mb-3">
        {category.emoji && (
          <span className="text-2xl sm:text-3xl shrink-0">{category.emoji}</span>
        )}
        <div className="flex-1 min-w-0">
          <h3 className="group-hover:text-[#FFD080] text-lg sm:text-xl text-white uppercase tracking-[0.05rem] break-words">
            {category.name}
          </h3>
          {category.description ? (
            <p className="group-hover:text-[#FFD080] relative z-10 mt-2 text-sm sm:text-base text-white/60 leading-relaxed font-light line-clamp-2">
              {category.description}
            </p>
          ) : null}
        </div>
      </div>
      <ul className="relative z-10 mt-4 text-white/60 text-xs sm:text-sm list-disc list-inside">
        <li>{nomineesCount} nominados</li>
      </ul>
    </Link>
  );
}
