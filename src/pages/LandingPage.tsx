import { Link } from "react-router-dom";
import logoAward from "../assets/ITA2025.png";
import robotHero from "../assets/it-award-fondo.png";
import categoriasBanner from "../assets/categorias.png";
import colaboradorBanner from "../assets/participantes.png";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-linear-to-l from-[#080808] via-[#101019] to-[#080808] relative overflow-hidden -mt-[64px]">
      {/* Fondo y decoraciones sutiles */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -bottom-40 -left-40 size-[400px] rounded-full bg-[#FFD080]/20 blur-3xl" />
        <div className="absolute -bottom-40 -right-40 size-[400px] rounded-full bg-[#FFD080]/20 blur-3xl" />
        <div className="absolute top-[350px] mx-auto left-0 right-0 size-[400px] rounded-full bg-[#FFD080]/20 blur-3xl" />
      </div>

      <section className="w-full px-2 sm:px-4 md:px-8 py-2 md:py-4 flex flex-col items-center justify-center">
        <div className="w-full h-[300px] sm:h-[400px] md:h-[500px] lg:h-[600px] relative flex items-center justify-center">
          <div
            className="flex flex-col items-center gap-2 w-full sm:w-10/12 md:w-8/12 h-full"
            style={{
              backgroundImage: `url(${robotHero})`,
              backgroundSize: "cover",
              backgroundPosition: "top center",
              backgroundRepeat: "no-repeat",
              // Agrega esto para el difuminado:
              maskImage:
                "linear-gradient(to right, transparent, #08090f 20%, #08090f 80%, transparent)",
              WebkitMaskImage:
                "linear-gradient(to right, transparent, #08090f 20%, #08090f 80%, transparent)", // Para soporte en Safari/Chrome
            }}
          ></div>
        </div>

        <div className="flex flex-col items-center justify-center mt-10">
          <div className="flex items-center justify-center flex-col gap-2">
            <img
              src={logoAward}
              alt="IT Awards 2025"
              className="h-32 sm:h-40 md:h-50 w-auto object-contain"
            />
            <p className="text-white/60 uppercase tracking-[0.2em] sm:tracking-[0.3em] text-sm sm:text-base md:text-lg px-4 text-center">
              Categorías y colaboradores
            </p>
            <h1 className="uppercase px-4 sm:px-6 text-base sm:text-lg md:text-xl font-light text-center text-white max-w-3xl">
              Conoce las categorías y vota por tu colaborador favorito.
            </h1>
          </div>

          <div className="flex flex-col items-center justify-center mb-10 w-full">
            <div className="mt-6 sm:mt-10 px-4 sm:px-6 md:px-0 flex flex-col sm:flex-row items-center justify-center gap-6 sm:gap-10 md:gap-20 w-full max-w-4xl">
              <Link
                to="/categorias"
                className="border border-[#FFD080] inline-flex items-center justify-center w-full sm:w-[280px] h-[280px] sm:h-[300px] md:w-[300px] md:h-[300px] rounded-2xl overflow-hidden opacity-80 hover:opacity-100 hover:scale-105 transition"
              >
                <img
                  src={categoriasBanner}
                  alt="Categorías"
                  className="w-full h-full object-cover"
                />
              </Link>

              <Link
                to="/participantes"
                className="border border-[#FFD080] inline-flex items-center justify-center w-full sm:w-[280px] h-[280px] sm:h-[300px] md:w-[300px] md:h-[300px] rounded-2xl overflow-hidden opacity-80 hover:opacity-100 hover:scale-105 transition"
              >
                <img
                  src={colaboradorBanner}
                  alt="Participantes"
                  className="w-full h-full object-cover"
                />
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
