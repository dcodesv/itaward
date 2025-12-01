import { useState, useEffect } from "react";
import Modal from "../Modal";
import { supabase } from "../../lib/supabase";
import Icon from "../Icon";
import type { Category, Collaborator } from "../../types";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import logoAward from "../../assets/ITHA2025.png";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  categoryId: number;
  categoryName: string;
  categoryEmoji?: string;
};

type TopCandidate = {
  collaborator: Collaborator;
  votes: number;
  position: number;
};

export default function SelectWinnerModal({
  isOpen,
  onClose,
  categoryId,
  categoryName,
  categoryEmoji,
}: Props) {
  const [topCandidates, setTopCandidates] = useState<TopCandidate[]>([]);
  const [selectedPosition, setSelectedPosition] = useState<number>(1);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadTopCandidates();
    }
  }, [isOpen, categoryId]);

  const loadTopCandidates = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Cargar nominaciones de esta categoría
      const { data: nominations, error: nominationsError } = await supabase
        .from("nominations")
        .select("collaborator_id")
        .eq("category_id", categoryId);

      if (nominationsError) {
        setError("Error al cargar nominaciones");
        setIsLoading(false);
        return;
      }

      // Contar votos por colaborador
      const voteCounts: Record<number, number> = {};
      nominations?.forEach((nom: { collaborator_id: number }) => {
        voteCounts[nom.collaborator_id] =
          (voteCounts[nom.collaborator_id] || 0) + 1;
      });

      // Ordenar por votos y obtener top 3
      const sorted = Object.entries(voteCounts)
        .map(([collaboratorId, count]) => ({
          collaboratorId: parseInt(collaboratorId, 10),
          count,
        }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 3);

      // Cargar datos de los colaboradores
      const collaboratorIds = sorted.map((s) => s.collaboratorId);
      if (collaboratorIds.length === 0) {
        setTopCandidates([]);
        setIsLoading(false);
        return;
      }

      const { data: collaboratorsData, error: collaboratorsError } =
        await supabase
          .from("collaborators")
          .select("*")
          .in("id", collaboratorIds);

      if (collaboratorsError) {
        setError("Error al cargar colaboradores");
        setIsLoading(false);
        return;
      }

      // Mapear colaboradores con sus votos y posiciones
      const candidates: TopCandidate[] = sorted
        .map((item, index) => {
          const collaboratorData = collaboratorsData?.find(
            (c: { id: number }) => c.id === item.collaboratorId
          );

          if (!collaboratorData) {
            return null;
          }

          return {
            collaborator: {
              id: collaboratorData.id,
              fullName: collaboratorData.full_name,
              avatarUrl: collaboratorData.avatar_url,
              role: collaboratorData.role || undefined,
            },
            votes: item.count,
            position: index + 1,
          };
        })
        .filter((c): c is TopCandidate => c !== null);

      setTopCandidates(candidates);
      if (candidates.length > 0) {
        setSelectedPosition(1); // Por defecto seleccionar el primero
      }
    } catch (error) {
      console.error("Error inesperado:", error);
      setError("Error al cargar candidatos");
    } finally {
      setIsLoading(false);
    }
  };

  const handleShowWinner = () => {
    if (selectedPosition && topCandidates.length > 0) {
      const winnerUrl = `/ganador?categoryId=${categoryId}&position=${selectedPosition}`;
      window.open(winnerUrl, "_blank", "width=1200,height=800");
      onClose();
    }
  };

  const handleGeneratePDF = async () => {
    if (topCandidates.length === 0) return;

    const selectedCandidate = topCandidates.find(
      (c) => c.position === selectedPosition
    );
    if (!selectedCandidate) return;

    try {
      setIsGeneratingPDF(true);

      // Crear plantilla HTML
      const htmlContent = `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="UTF-8">
            <style>
              * {
                margin: 0;
                padding: 0;
                box-sizing: border-box;
              }
              body {
                width: 279.4mm;
                height: 215.9mm;
                background: linear-gradient(135deg, #080808 0%, #101019 50%, #080808 100%);
                display: flex;
                align-items: center;
                justify-content: center;
                font-family: 'Arial', 'Helvetica', sans-serif;
                color: #ffffff;
                padding: 50px;
                position: relative;
                overflow: hidden;
              }
              .confetti {
                position: absolute;
                width: 12px;
                height: 12px;
                opacity: 0.6;
              }
              .confetti:nth-child(1) { top: 8%; left: 12%; background: rgba(255, 208, 128, 0.6); transform: rotate(45deg); }
              .confetti:nth-child(2) { top: 18%; left: 78%; background: rgba(255, 107, 107, 0.6); transform: rotate(-30deg); }
              .confetti:nth-child(3) { top: 4%; left: 48%; background: rgba(78, 205, 196, 0.6); transform: rotate(60deg); }
              .confetti:nth-child(4) { top: 28%; left: 8%; background: rgba(255, 230, 109, 0.6); transform: rotate(-45deg); }
              .confetti:nth-child(5) { top: 14%; left: 68%; background: rgba(149, 225, 211, 0.6); transform: rotate(30deg); }
              .confetti:nth-child(6) { top: 38%; left: 83%; background: rgba(255, 208, 128, 0.6); transform: rotate(-60deg); }
              .confetti:nth-child(7) { top: 48%; left: 4%; background: rgba(255, 107, 107, 0.6); transform: rotate(45deg); }
              .confetti:nth-child(8) { top: 58%; left: 88%; background: rgba(78, 205, 196, 0.6); transform: rotate(-30deg); }
              .confetti:nth-child(9) { top: 68%; left: 18%; background: rgba(255, 230, 109, 0.6); transform: rotate(60deg); }
              .confetti:nth-child(10) { top: 78%; left: 58%; background: rgba(149, 225, 211, 0.6); transform: rotate(-45deg); }
              .confetti:nth-child(11) { top: 23%; left: 38%; background: rgba(255, 208, 128, 0.6); transform: rotate(30deg); }
              .confetti:nth-child(12) { top: 53%; left: 73%; background: rgba(255, 107, 107, 0.6); transform: rotate(-60deg); }
              .confetti:nth-child(13) { top: 33%; left: 28%; background: rgba(78, 205, 196, 0.6); transform: rotate(45deg); }
              .confetti:nth-child(14) { top: 63%; left: 48%; background: rgba(255, 230, 109, 0.6); transform: rotate(-30deg); }
              .confetti:nth-child(15) { top: 43%; left: 93%; background: rgba(149, 225, 211, 0.6); transform: rotate(60deg); }
              .confetti:nth-child(16) { top: 73%; left: 23%; background: rgba(255, 208, 128, 0.6); transform: rotate(-45deg); }
              .confetti:nth-child(17) { top: 83%; left: 63%; background: rgba(255, 107, 107, 0.6); transform: rotate(30deg); }
              .confetti:nth-child(18) { top: 88%; left: 13%; background: rgba(78, 205, 196, 0.6); transform: rotate(-60deg); }
              .confetti:nth-child(19) { top: 10%; left: 53%; background: rgba(255, 230, 109, 0.6); transform: rotate(45deg); }
              .confetti:nth-child(20) { top: 20%; left: 23%; background: rgba(149, 225, 211, 0.6); transform: rotate(-30deg); }
              .confetti:nth-child(21) { top: 6%; left: 35%; background: rgba(255, 208, 128, 0.6); transform: rotate(60deg); }
              .confetti:nth-child(22) { top: 16%; left: 65%; background: rgba(255, 107, 107, 0.6); transform: rotate(-45deg); }
              .confetti:nth-child(23) { top: 26%; left: 18%; background: rgba(78, 205, 196, 0.6); transform: rotate(30deg); }
              .confetti:nth-child(24) { top: 36%; left: 58%; background: rgba(255, 230, 109, 0.6); transform: rotate(-60deg); }
              .confetti:nth-child(25) { top: 46%; left: 88%; background: rgba(149, 225, 211, 0.6); transform: rotate(45deg); }
              .confetti:nth-child(26) { top: 56%; left: 28%; background: rgba(255, 208, 128, 0.6); transform: rotate(-30deg); }
              .confetti:nth-child(27) { top: 66%; left: 68%; background: rgba(255, 107, 107, 0.6); transform: rotate(60deg); }
              .confetti:nth-child(28) { top: 76%; left: 8%; background: rgba(78, 205, 196, 0.6); transform: rotate(-45deg); }
              .confetti:nth-child(29) { top: 86%; left: 48%; background: rgba(255, 230, 109, 0.6); transform: rotate(30deg); }
              .confetti:nth-child(30) { top: 92%; left: 78%; background: rgba(149, 225, 211, 0.6); transform: rotate(-60deg); }
              .confetti:nth-child(31) { top: 13%; left: 43%; background: rgba(255, 208, 128, 0.6); transform: rotate(45deg); }
              .confetti:nth-child(32) { top: 41%; left: 53%; background: rgba(255, 107, 107, 0.6); transform: rotate(-30deg); }
              .confetti:nth-child(33) { top: 51%; left: 13%; background: rgba(78, 205, 196, 0.6); transform: rotate(60deg); }
              .confetti:nth-child(34) { top: 61%; left: 83%; background: rgba(255, 230, 109, 0.6); transform: rotate(-45deg); }
              .confetti:nth-child(35) { top: 71%; left: 33%; background: rgba(149, 225, 211, 0.6); transform: rotate(30deg); }
              .confetti:nth-child(36) { top: 81%; left: 73%; background: rgba(255, 208, 128, 0.6); transform: rotate(-60deg); }
              .confetti:nth-child(37) { top: 2%; left: 25%; background: rgba(255, 107, 107, 0.6); transform: rotate(45deg); }
              .confetti:nth-child(38) { top: 32%; left: 63%; background: rgba(78, 205, 196, 0.6); transform: rotate(-30deg); }
              .confetti:nth-child(39) { top: 42%; left: 3%; background: rgba(255, 230, 109, 0.6); transform: rotate(60deg); }
              .confetti:nth-child(40) { top: 72%; left: 43%; background: rgba(149, 225, 211, 0.6); transform: rotate(-45deg); }
              .container {
                position: relative;
                z-index: 10;
                width: 100%;
                max-width: 900px;
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
              }
              .logo-container {
                margin-bottom: 30px;
                position: relative;
              }
              .logo {
                height: 70px;
                width: auto;
                filter: drop-shadow(0 4px 8px rgba(255, 208, 128, 0.3));
              }
              .category {
                text-align: center;
                margin-bottom: 25px;
                position: relative;
              }
              .category-text {
                font-size: 16px;
                color: rgba(255, 255, 255, 0.7);
                text-transform: uppercase;
                letter-spacing: 4px;
                margin-bottom: 12px;
                font-weight: 300;
              }
              .category-emoji {
                font-size: 28px;
                margin-right: 10px;
              }
              .divider {
                width: 120px;
                height: 3px;
                background: linear-gradient(to right, transparent, #FFD080, transparent);
                margin: 0 auto;
                box-shadow: 0 2px 8px rgba(255, 208, 128, 0.4);
              }
              .winner-name {
                font-size: 64px;
                font-weight: bold;
                text-transform: uppercase;
                text-align: center;
                color: #ffffff;
                margin-bottom: 15px;
                letter-spacing: 3px;
                text-shadow: 0 4px 20px rgba(255, 208, 128, 0.3);
                line-height: 1.2;
              }
              .winner-role {
                font-size: 24px;
                color: rgba(255, 255, 255, 0.8);
                text-align: center;
                margin-bottom: 20px;
                margin-top: 0;
                font-weight: 300;
              }
              .votes-container {
                display: flex;
                align-items: center;
                justify-content: center;
                gap: 10px;
                margin-bottom: 25px;
                margin-top: 0;
                padding: 10px 24px;
                background: rgba(255, 255, 255, 0.05);
                border: 1px solid rgba(255, 255, 255, 0.1);
                border-radius: 30px;
                backdrop-filter: blur(10px);
              }
                .votes-container span{
                margin-top: -18px;
                }
              .votes-icon {
                width: 20px;
                height: 20px;
                color: #FFD080;
                display: flex;
                align-items: center;
                justify-content: center;
                margin: 0;
                padding: 0;
              }
              .votes {
                font-size: 18px;
                color: #FFD080;
                font-weight: 600;
                line-height: 1;
                display: flex;
                align-items: center;
                margin: 0;
                padding: 0;
              }
              .message {
                background: linear-gradient(135deg, rgba(255, 208, 128, 0.15) 0%, rgba(255, 208, 128, 0.05) 100%);
                border: 2px solid rgba(255, 208, 128, 0.3);
                border-radius: 20px;
                padding: 25px 50px;
                text-align: center;
                max-width: 600px;
                box-shadow: 0 8px 32px rgba(255, 208, 128, 0.2);
                backdrop-filter: blur(10px);
                margin-top: 0;
              }
              .message-text {
                font-size: 22px;
                color: rgba(255, 255, 255, 0.95);
                font-weight: 300;
                letter-spacing: 1px;
                line-height: 1.4;
                margin: 0;
                margin-top: -20px;
                padding: 0;
              }
              .trophy-decoration {
                position: absolute;
                font-size: 100px;
                opacity: 0.15;
                z-index: 1;
                filter: drop-shadow(0 4px 8px rgba(255, 208, 128, 0.3));
              }
              .trophy-left {
                left: 30px;
                top: 50%;
                transform: translateY(-50%);
              }
              .trophy-right {
                right: 30px;
                top: 50%;
                transform: translateY(-50%);
              }
              .diploma-border {
                position: absolute;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                border: 3px solid rgba(255, 208, 128, 0.3);
                border-radius: 15px;
                pointer-events: none;
                z-index: 5;
              }
              .diploma-corner {
                position: absolute;
                width: 60px;
                height: 60px;
                border: 2px solid rgba(255, 208, 128, 0.4);
                z-index: 5;
              }
              .corner-tl {
                top: 20px;
                left: 20px;
                border-right: none;
                border-bottom: none;
                border-top-left-radius: 10px;
              }
              .corner-tr {
                top: 20px;
                right: 20px;
                border-left: none;
                border-bottom: none;
                border-top-right-radius: 10px;
              }
              .corner-bl {
                bottom: 20px;
                left: 20px;
                border-right: none;
                border-top: none;
                border-bottom-left-radius: 10px;
              }
              .corner-br {
                bottom: 20px;
                right: 20px;
                border-left: none;
                border-top: none;
                border-bottom-right-radius: 10px;
              }
            </style>
          </head>
          <body>
            <div class="diploma-border"></div>
            <div class="diploma-corner corner-tl"></div>
            <div class="diploma-corner corner-tr"></div>
            <div class="diploma-corner corner-bl"></div>
            <div class="diploma-corner corner-br"></div>
            <div class="confetti"></div>
            <div class="confetti"></div>
            <div class="confetti"></div>
            <div class="confetti"></div>
            <div class="confetti"></div>
            <div class="confetti"></div>
            <div class="confetti"></div>
            <div class="confetti"></div>
            <div class="confetti"></div>
            <div class="confetti"></div>
            <div class="confetti"></div>
            <div class="confetti"></div>
            <div class="confetti"></div>
            <div class="confetti"></div>
            <div class="confetti"></div>
            <div class="confetti"></div>
            <div class="confetti"></div>
            <div class="confetti"></div>
            <div class="confetti"></div>
            <div class="confetti"></div>
            <div class="confetti"></div>
            <div class="confetti"></div>
            <div class="confetti"></div>
            <div class="confetti"></div>
            <div class="confetti"></div>
            <div class="confetti"></div>
            <div class="confetti"></div>
            <div class="confetti"></div>
            <div class="confetti"></div>
            <div class="confetti"></div>
            <div class="confetti"></div>
            <div class="confetti"></div>
            <div class="confetti"></div>
            <div class="confetti"></div>
            <div class="confetti"></div>
            <div class="confetti"></div>
            <div class="trophy-decoration trophy-left">🏆</div>
            <div class="trophy-decoration trophy-right">🏆</div>
            <div class="container">
              <div class="logo-container">
                <img src="${logoAward}" alt="IT Awards 2025" class="logo" />
              </div>
              <div class="category">
                <div class="category-text">
                  <span class="category-emoji">${categoryEmoji || ""}</span>
                  ${categoryName}
                </div>
                <div class="divider"></div>
              </div>
              <h1 class="winner-name">${
                selectedCandidate.collaborator.fullName
              }</h1>
              ${
                selectedCandidate.collaborator.role
                  ? `<p class="winner-role">${selectedCandidate.collaborator.role}</p>`
                  : ""
              }
              <div class="votes-container">
                <svg class="votes-icon" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M18 13h-.68l-2 2h1.91L19 17H5l1.78-2h2.05l-2-2H6l-3 3v4c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2v-4l-3-3zm-1-5.05l-4.95 4.95-3.79-3.79 4.95-4.95L17 7.95zm-4.24-5.66L6.39 8.66c-.39.39-.39 1.02 0 1.41l4.95 4.95c.39.39 1.02.39 1.41 0l6.36-6.36c.39-.39.39-1.02 0-1.41L14.16 2.29c-.38-.39-1.02-.39-1.41 0z"/>
                </svg>
                <span class="votes">${selectedCandidate.votes} ${
        selectedCandidate.votes === 1 ? "voto" : "votos"
      }</span>
              </div>
              <div class="message">
                <p class="message-text">¡Felicitaciones por este reconocimiento!</p>
              </div>
            </div>
          </body>
        </html>
      `;

      // Crear un iframe temporal para renderizar el HTML
      const iframe = document.createElement("iframe");
      iframe.style.position = "absolute";
      iframe.style.left = "-9999px";
      iframe.style.top = "0";
      iframe.style.width = "279.4mm";
      iframe.style.height = "215.9mm";
      document.body.appendChild(iframe);

      const iframeDoc =
        iframe.contentDocument || iframe.contentWindow?.document;
      if (!iframeDoc) {
        throw new Error("No se pudo acceder al documento del iframe");
      }

      iframeDoc.open();
      iframeDoc.write(htmlContent);
      iframeDoc.close();

      // Esperar a que se cargue el logo
      await new Promise((resolve) => {
        const logoImg = iframeDoc.querySelector(".logo") as HTMLImageElement;
        if (logoImg) {
          if (logoImg.complete) {
            resolve(null);
          } else {
            logoImg.onload = () => resolve(null);
            logoImg.onerror = () => resolve(null);
            setTimeout(() => resolve(null), 2000);
          }
        } else {
          setTimeout(() => resolve(null), 500);
        }
      });

      // Usar html2canvas para capturar el iframe
      const canvas = await html2canvas(iframeDoc.body, {
        backgroundColor: "#080808",
        scale: 2,
        useCORS: true,
        logging: false,
        width: 1056, // 279.4mm en pixels a 96dpi
        height: 816, // 215.9mm en pixels a 96dpi
      });

      // Limpiar el iframe
      document.body.removeChild(iframe);

      // Crear PDF en formato landscape tamaño carta (letter)
      const pdf = new jsPDF("landscape", "mm", "letter");
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = canvas.width;
      const imgHeight = canvas.height;
      const ratio = Math.min(
        pdfWidth / (imgWidth * 0.264583),
        pdfHeight / (imgHeight * 0.264583)
      );
      const imgX = (pdfWidth - imgWidth * 0.264583 * ratio) / 2;
      const imgY = (pdfHeight - imgHeight * 0.264583 * ratio) / 2;

      pdf.addImage(
        canvas.toDataURL("image/png"),
        "PNG",
        imgX,
        imgY,
        imgWidth * 0.264583 * ratio,
        imgHeight * 0.264583 * ratio
      );

      // Nombre del archivo
      const fileName = `Ganador_${categoryName.replace(
        /\s+/g,
        "_"
      )}_${selectedCandidate.collaborator.fullName.replace(/\s+/g, "_")}.pdf`;
      pdf.save(fileName);
    } catch (error) {
      console.error("Error al generar PDF:", error);
      alert(
        `Error al generar el PDF: ${
          error instanceof Error ? error.message : "Error desconocido"
        }`
      );
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  const positionLabels: Record<
    number,
    { label: string; icon: string; emoji: string }
  > = {
    1: { label: "Primer Lugar", icon: "mdi:trophy", emoji: "🥇" },
    2: { label: "Segundo Lugar", icon: "mdi:trophy-variant", emoji: "🥈" },
    3: { label: "Tercer Lugar", icon: "mdi:trophy-outline", emoji: "🥉" },
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Ganador - ${categoryEmoji || ""} ${categoryName}`}
    >
      <div className="space-y-6">
        {isLoading ? (
          <div className="py-8 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#FFD080] mx-auto mb-4"></div>
            <p className="text-white/60 text-sm">Cargando candidatos...</p>
          </div>
        ) : error ? (
          <div className="p-4 rounded-lg bg-red-500/20 border border-red-500/30">
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        ) : topCandidates.length === 0 ? (
          <div className="py-8 text-center">
            <p className="text-white/60 text-sm">
              No hay votos registrados en esta categoría aún.
            </p>
          </div>
        ) : (
          <>
            <div>
              <p className="text-white/80 text-sm font-medium mb-4">
                Selecciona la posición del ganador a mostrar:
              </p>
              <div className="space-y-3">
                {topCandidates.map((candidate) => {
                  const positionInfo = positionLabels[candidate.position];
                  const isSelected = selectedPosition === candidate.position;

                  return (
                    <button
                      key={candidate.collaborator.id}
                      onClick={() => setSelectedPosition(candidate.position)}
                      className={`w-full p-4 rounded-lg border transition-all ${
                        isSelected
                          ? "bg-[#FFD080]/20 border-[#FFD080] border-2"
                          : "bg-white/5 border-white/15 hover:bg-white/10"
                      }`}
                    >
                      <div className="flex items-center gap-4">
                        <div className="flex-shrink-0">
                          <div
                            className={`size-12 rounded-full flex items-center justify-center text-2xl ${
                              isSelected ? "bg-[#FFD080]/20" : "bg-white/10"
                            }`}
                          >
                            {positionInfo.emoji}
                          </div>
                        </div>
                        <div className="flex-1 text-left">
                          <div className="flex items-center gap-2 mb-1">
                            <Icon
                              icon={positionInfo.icon}
                              className={
                                isSelected ? "text-[#FFD080]" : "text-white/60"
                              }
                              width={20}
                              height={20}
                            />
                            <span
                              className={`font-semibold ${
                                isSelected ? "text-[#FFD080]" : "text-white"
                              }`}
                            >
                              {positionInfo.label}
                            </span>
                          </div>
                          <p className="text-white font-medium text-sm">
                            {candidate.collaborator.fullName}
                          </p>
                          {candidate.collaborator.role && (
                            <p className="text-white/60 text-xs">
                              {candidate.collaborator.role}
                            </p>
                          )}
                        </div>
                        <div className="flex-shrink-0 text-right">
                          <p className="text-[#FFD080] font-semibold text-lg">
                            {candidate.votes}
                          </p>
                          <p className="text-white/60 text-xs">
                            {candidate.votes === 1 ? "voto" : "votos"}
                          </p>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-4 border-t border-white/10">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2 rounded-lg border border-white/20 text-white/70 hover:text-white hover:bg-white/10 transition"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleGeneratePDF}
                disabled={isGeneratingPDF}
                className="flex-1 px-4 py-2 rounded-lg bg-white/10 border border-white/20 text-white hover:bg-white/20 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 whitespace-nowrap"
              >
                <Icon
                  icon={isGeneratingPDF ? "mdi:loading" : "mdi:file-pdf-box"}
                  className={isGeneratingPDF ? "animate-spin" : ""}
                  width={20}
                  height={20}
                />
                <span className="text-sm sm:text-base">
                  {isGeneratingPDF ? "Generando..." : "Descargar PDF"}
                </span>
              </button>
              <button
                type="button"
                onClick={handleShowWinner}
                className="flex-1 px-4 py-2 rounded-lg bg-linear-to-r from-[#FFD080] to-[#D4A574] text-[#080808] font-semibold hover:opacity-90 transition whitespace-nowrap"
              >
                Mostrar Ganador
              </button>
            </div>
          </>
        )}
      </div>
    </Modal>
  );
}
