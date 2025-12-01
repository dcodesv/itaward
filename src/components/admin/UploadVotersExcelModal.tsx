import { useState, FormEvent } from "react";
import Modal from "../Modal";
import { supabase } from "../../lib/supabase";
import Swal from "sweetalert2";
import * as XLSX from "xlsx";
import Icon from "../Icon";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
};

type ExcelRow = Record<string, any>;
type ColumnMapping = {
  employeeCode: string | null;
  fullName: string | null;
};

export default function UploadVotersExcelModal({
  isOpen,
  onClose,
  onSuccess,
}: Props) {
  const [file, setFile] = useState<File | null>(null);
  const [excelData, setExcelData] = useState<ExcelRow[]>([]);
  const [excelColumns, setExcelColumns] = useState<string[]>([]);
  const [columnMapping, setColumnMapping] = useState<ColumnMapping>({
    employeeCode: null,
    fullName: null,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState<"upload" | "mapping" | "preview">("upload");

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    if (
      !selectedFile.name.endsWith(".xlsx") &&
      !selectedFile.name.endsWith(".xls")
    ) {
      setError("Por favor, selecciona un archivo Excel (.xlsx o .xls)");
      return;
    }

    setFile(selectedFile);
    setError(null);
    processExcelFile(selectedFile);
  };

  const processExcelFile = async (file: File) => {
    try {
      setIsProcessing(true);
      setError(null);

      const arrayBuffer = await file.arrayBuffer();
      const workbook = XLSX.read(arrayBuffer, { type: "array" });
      const firstSheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[firstSheetName];
      const data = XLSX.utils.sheet_to_json<ExcelRow>(worksheet, {
        raw: false,
      });

      if (data.length === 0) {
        setError("El archivo Excel está vacío o no tiene datos");
        setIsProcessing(false);
        return;
      }

      // Obtener las columnas del Excel
      const columns = Object.keys(data[0]);
      setExcelColumns(columns);
      setExcelData(data);
      setStep("mapping");

      // Intentar mapeo automático
      const autoMapping: ColumnMapping = {
        employeeCode: null,
        fullName: null,
      };

      columns.forEach((col) => {
        const colLower = col.toLowerCase().trim();
        if (
          (colLower.includes("codigo") ||
            colLower.includes("código") ||
            colLower.includes("code") ||
            colLower.includes("empleado") ||
            colLower.includes("employee")) &&
          !autoMapping.employeeCode
        ) {
          autoMapping.employeeCode = col;
        }
        if (
          (colLower.includes("nombre") ||
            colLower.includes("name") ||
            colLower.includes("completo") ||
            colLower.includes("full")) &&
          !autoMapping.fullName
        ) {
          autoMapping.fullName = col;
        }
      });

      setColumnMapping(autoMapping);
    } catch (err) {
      console.error("Error al procesar Excel:", err);
      setError("Error al leer el archivo Excel. Por favor, verifica que el archivo sea válido.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleMappingChange = (field: keyof ColumnMapping, column: string) => {
    setColumnMapping((prev) => ({
      ...prev,
      [field]: column === "" ? null : column,
    }));
  };

  const handlePreview = () => {
    if (!columnMapping.employeeCode || !columnMapping.fullName) {
      setError("Debes mapear ambos campos: Código de Empleado y Nombre Completo");
      return;
    }

    setStep("preview");
    setError(null);
  };

  const handleImport = async () => {
    if (!columnMapping.employeeCode || !columnMapping.fullName) {
      setError("Debes mapear ambos campos: Código de Empleado y Nombre Completo");
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      // Preparar datos para insertar
      const votersToInsert = excelData
        .map((row) => {
          const employeeCode = String(row[columnMapping.employeeCode!] || "").trim().toUpperCase();
          const fullName = String(row[columnMapping.fullName!] || "").trim();

          if (!employeeCode || !fullName) {
            return null;
          }

          return {
            employee_code: employeeCode,
            full_name: fullName,
          };
        })
        .filter((voter) => voter !== null) as Array<{
        employee_code: string;
        full_name: string;
      }>;

      if (votersToInsert.length === 0) {
        setError("No hay datos válidos para importar");
        setIsLoading(false);
        return;
      }

      // Insertar en lotes para evitar problemas de tamaño
      const batchSize = 100;
      let inserted = 0;
      let errors = 0;
      const errorsList: string[] = [];

      for (let i = 0; i < votersToInsert.length; i += batchSize) {
        const batch = votersToInsert.slice(i, i + batchSize);
        
        const { data, error: insertError } = await supabase
          .from("voters")
          .insert(batch)
          .select();

        if (insertError) {
          // Si hay error, intentar insertar uno por uno para identificar los problemáticos
          for (const voter of batch) {
            const { error: singleError } = await supabase
              .from("voters")
              .insert(voter);

            if (singleError) {
              errors++;
              if (singleError.code === "23505") {
                errorsList.push(
                  `Código duplicado: ${voter.employee_code} - ${voter.full_name}`
                );
              } else {
                errorsList.push(
                  `${voter.employee_code} - ${voter.full_name}: ${singleError.message}`
                );
              }
            } else {
              inserted++;
            }
          }
        } else {
          inserted += batch.length;
        }
      }

      // Mostrar resultado
      if (inserted > 0) {
        await Swal.fire({
          title: "¡Importación completada!",
          html: `
            <div style="text-align: left; color: rgba(255, 255, 255, 0.9); font-size: 14px;">
              <p style="margin-bottom: 12px;">
                Se importaron <strong style="color: #FFD080;">${inserted}</strong> votante(s) exitosamente.
              </p>
              ${errors > 0 ? `
                <p style="margin-bottom: 8px; color: rgba(255, 107, 107, 0.9);">
                  ${errors} registro(s) no se pudieron importar (posiblemente duplicados o con errores).
                </p>
                ${errorsList.length > 0 ? `
                  <details style="margin-top: 12px;">
                    <summary style="cursor: pointer; color: rgba(255, 107, 107, 0.9);">Ver detalles de errores</summary>
                    <ul style="margin-top: 8px; padding-left: 20px; max-height: 200px; overflow-y: auto;">
                      ${errorsList.slice(0, 10).map((err) => `<li style="margin-bottom: 4px;">${err}</li>`).join("")}
                      ${errorsList.length > 10 ? `<li>... y ${errorsList.length - 10} más</li>` : ""}
                    </ul>
                  </details>
                ` : ""}
              ` : ""}
            </div>
          `,
          icon: errors > 0 ? "warning" : "success",
          confirmButtonColor: "#FFD080",
          background: "#080808",
          color: "#ffffff",
          customClass: {
            popup: "swal2-popup-custom",
            title: "swal2-title-custom",
            htmlContainer: "swal2-html-container-custom",
            confirmButton: "swal2-confirm-custom",
          },
        });
      } else {
        await Swal.fire({
          title: "Error en la importación",
          text: "No se pudo importar ningún votante. Verifica los datos y vuelve a intentar.",
          icon: "error",
          confirmButtonColor: "#FFD080",
          background: "#080808",
          color: "#ffffff",
        });
      }

      // Limpiar y cerrar
      handleReset();
      onSuccess();
      onClose();
    } catch (err) {
      console.error("Error al importar:", err);
      setError("Error inesperado al importar los votantes");
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setFile(null);
    setExcelData([]);
    setExcelColumns([]);
    setColumnMapping({ employeeCode: null, fullName: null });
    setError(null);
    setStep("upload");
  };

  const handleClose = () => {
    if (!isLoading && !isProcessing) {
      handleReset();
      onClose();
    }
  };

  const previewData = excelData.slice(0, 5);

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Importar Votantes desde Excel"
    >
      <div className="space-y-6">
        {step === "upload" && (
          <>
            <div>
              <p className="text-white/80 text-sm mb-4">
                Selecciona un archivo Excel (.xlsx o .xls) con los datos de los votantes.
              </p>
              <p className="text-white/60 text-xs mb-4">
                El archivo debe contener al menos las columnas: <strong>Código de Empleado</strong> y <strong>Nombre Completo</strong>.
              </p>
              <label className="block">
                <input
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={handleFileChange}
                  disabled={isProcessing}
                  className="hidden"
                  id="excel-file-input"
                />
                <div className="border-2 border-dashed border-white/20 rounded-lg p-8 text-center cursor-pointer hover:border-[#FFD080]/50 transition">
                  {isProcessing ? (
                    <div>
                      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#FFD080] mx-auto mb-4"></div>
                      <p className="text-white/60 text-sm">Procesando archivo...</p>
                    </div>
                  ) : file ? (
                    <div>
                      <Icon icon="mdi:file-excel" className="text-green-400 mx-auto mb-2" width={48} height={48} />
                      <p className="text-white font-medium">{file.name}</p>
                      <p className="text-white/60 text-xs mt-1">
                        {(file.size / 1024).toFixed(2)} KB
                      </p>
                    </div>
                  ) : (
                    <div>
                      <Icon icon="mdi:cloud-upload" className="text-white/60 mx-auto mb-2" width={48} height={48} />
                      <p className="text-white/80 text-sm mb-1">
                        Haz clic para seleccionar un archivo Excel
                      </p>
                      <p className="text-white/60 text-xs">
                        Formatos soportados: .xlsx, .xls
                      </p>
                    </div>
                  )}
                </div>
              </label>
            </div>
          </>
        )}

        {step === "mapping" && (
          <>
            <div>
              <p className="text-white/80 text-sm mb-4">
                Mapea las columnas de tu Excel con los campos de la base de datos:
              </p>
              <div className="space-y-4">
                <div>
                  <label className="block text-white/70 text-sm mb-2">
                    Código de Empleado <span className="text-red-400">*</span>
                  </label>
                  <select
                    value={columnMapping.employeeCode || ""}
                    onChange={(e) =>
                      handleMappingChange("employeeCode", e.target.value)
                    }
                    className="w-full px-4 py-2 rounded-lg bg-white/5 border border-white/20 text-white focus:border-[#FFD080] focus:outline-none"
                  >
                    <option value="">-- Selecciona una columna --</option>
                    {excelColumns.map((col) => (
                      <option key={col} value={col}>
                        {col}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-white/70 text-sm mb-2">
                    Nombre Completo <span className="text-red-400">*</span>
                  </label>
                  <select
                    value={columnMapping.fullName || ""}
                    onChange={(e) =>
                      handleMappingChange("fullName", e.target.value)
                    }
                    className="w-full px-4 py-2 rounded-lg bg-white/5 border border-white/20 text-white focus:border-[#FFD080] focus:outline-none"
                  >
                    <option value="">-- Selecciona una columna --</option>
                    {excelColumns.map((col) => (
                      <option key={col} value={col}>
                        {col}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 pt-4 border-t border-white/10">
              <button
                type="button"
                onClick={() => setStep("upload")}
                className="flex-1 px-4 py-2 rounded-lg border border-white/20 text-white/70 hover:text-white hover:bg-white/10 transition"
              >
                Volver
              </button>
              <button
                type="button"
                onClick={handlePreview}
                disabled={!columnMapping.employeeCode || !columnMapping.fullName}
                className="flex-1 px-4 py-2 rounded-lg bg-linear-to-r from-[#FFD080] to-[#D4A574] text-[#080808] font-semibold hover:opacity-90 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Vista Previa
              </button>
            </div>
          </>
        )}

        {step === "preview" && (
          <>
            <div>
              <p className="text-white/80 text-sm mb-4">
                Vista previa de los datos a importar ({excelData.length} registro(s)):
              </p>
              <div className="max-h-64 overflow-y-auto rounded-lg border border-white/10">
                <table className="w-full text-sm">
                  <thead className="bg-white/5 sticky top-0">
                    <tr>
                      <th className="px-4 py-2 text-left text-white/70 font-semibold">
                        Código de Empleado
                      </th>
                      <th className="px-4 py-2 text-left text-white/70 font-semibold">
                        Nombre Completo
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {previewData.map((row, index) => (
                      <tr
                        key={index}
                        className="border-t border-white/10 hover:bg-white/5"
                      >
                        <td className="px-4 py-2 text-white/90">
                          {String(
                            row[columnMapping.employeeCode!] || ""
                          ).toUpperCase()}
                        </td>
                        <td className="px-4 py-2 text-white/90">
                          {String(row[columnMapping.fullName!] || "")}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {excelData.length > 5 && (
                <p className="text-white/60 text-xs mt-2">
                  Mostrando 5 de {excelData.length} registros
                </p>
              )}
            </div>

            <div className="flex items-center gap-3 pt-4 border-t border-white/10">
              <button
                type="button"
                onClick={() => setStep("mapping")}
                className="flex-1 px-4 py-2 rounded-lg border border-white/20 text-white/70 hover:text-white hover:bg-white/10 transition"
              >
                Volver
              </button>
              <button
                type="button"
                onClick={handleImport}
                disabled={isLoading}
                className="flex-1 px-4 py-2 rounded-lg bg-linear-to-r from-[#FFD080] to-[#D4A574] text-[#080808] font-semibold hover:opacity-90 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-[#080808]"></div>
                    <span>Importando...</span>
                  </>
                ) : (
                  <>
                    <Icon icon="mdi:upload" width={20} height={20} />
                    <span>Importar {excelData.length} Votante(s)</span>
                  </>
                )}
              </button>
            </div>
          </>
        )}

        {error && (
          <div className="p-4 rounded-lg bg-red-500/20 border border-red-500/30">
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        )}
      </div>
    </Modal>
  );
}

