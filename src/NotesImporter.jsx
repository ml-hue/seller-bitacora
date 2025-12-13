import { useState } from "react";
import { supabase } from "./supabaseClient";

function NotesImporter() {
  const [notesText, setNotesText] = useState("");
  const [selectedProject, setSelectedProject] = useState("Karu");
  const [importing, setImporting] = useState(false);
  const [results, setResults] = useState(null);
  const [previewNotes, setPreviewNotes] = useState([]);

  const projects = [
    { id: "karu", name: "Karu" },
    { id: "everdem", name: "Everdem" },
    { id: "salumax", name: "Salumax" },
    { id: "labco", name: "Labco" },
    { id: "forbes", name: "Forbes" },
    { id: "gbb", name: "GBB" },
    { id: "kove", name: "Kove" },
  ];

  /* ===============================================
     PARSEAR NOTAS DESDE TEXTO
  =============================================== */
  const parseNotes = (text) => {
    if (!text.trim()) return [];

    const notes = [];
    
    // Dividir por separadores comunes
    const blocks = text.split(/\n\n---\n\n|\n\n===\n\n|\n\n\n/);

    blocks.forEach((block) => {
      const lines = block.trim().split("\n");
      if (lines.length === 0) return;

      let title = "";
      let date = "";
      let content = "";
      let tag = "Sesión";
      let clientResponsible = "";
      let clientStatus = "postergado";

      // Buscar patrones comunes
      lines.forEach((line, index) => {
        const lowerLine = line.toLowerCase();

        // Título (primera línea o línea con "título:")
        if (index === 0 && !line.includes(":")) {
          title = line.trim();
        } else if (lowerLine.includes("título:") || lowerLine.includes("title:")) {
          title = line.split(":")[1]?.trim() || "";
        }

        // Fecha
        else if (
          lowerLine.includes("fecha:") ||
          lowerLine.includes("date:") ||
          lowerLine.match(/\d{1,2}[\/-]\d{1,2}[\/-]\d{2,4}/)
        ) {
          const dateMatch = line.match(/(\d{1,2})[\/-](\d{1,2})[\/-](\d{2,4})/);
          if (dateMatch) {
            let [_, day, month, year] = dateMatch;
            if (year.length === 2) year = "20" + year;
            date = `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
          }
        }

        // Etiqueta
        else if (lowerLine.includes("etiqueta:") || lowerLine.includes("tag:")) {
          tag = line.split(":")[1]?.trim() || "Sesión";
        }

        // Responsable
        else if (
          lowerLine.includes("responsable:") ||
          lowerLine.includes("responsible:")
        ) {
          clientResponsible = line.split(":")[1]?.trim() || "";
        }

        // Estado
        else if (lowerLine.includes("estado:") || lowerLine.includes("status:")) {
          const statusText = line.split(":")[1]?.trim().toLowerCase() || "";
          if (statusText.includes("realizado") || statusText.includes("done")) {
            clientStatus = "realizado";
          } else if (
            statusText.includes("no realizado") ||
            statusText.includes("not done")
          ) {
            clientStatus = "no_realizado";
          }
        }

        // Contenido (resto)
        else if (
          !lowerLine.includes("título:") &&
          !lowerLine.includes("fecha:") &&
          !lowerLine.includes("etiqueta:") &&
          line.trim()
        ) {
          content += line + " ";
        }
      });

      // Si no hay título, usar primera línea
      if (!title && lines.length > 0) {
        title = lines[0].substring(0, 100);
      }

      // Si no hay fecha, usar hoy
      if (!date) {
        date = new Date().toISOString().slice(0, 10);
      }

      // Si no hay contenido, usar el bloque completo
      if (!content.trim()) {
        content = block.trim();
      }

      if (title) {
        notes.push({
          title: title.trim(),
          date,
          tag,
          summary: content.trim().substring(0, 1000),
          clientResponsible,
          clientStatus,
        });
      }
    });

    return notes;
  };

  /* ===============================================
     PREVISUALIZAR NOTAS
  =============================================== */
  const handlePreview = () => {
    const parsed = parseNotes(notesText);
    setPreviewNotes(parsed);
  };

  /* ===============================================
     IMPORTAR A SUPABASE
  =============================================== */
  const handleImport = async () => {
    if (previewNotes.length === 0) {
      alert("Primero previsualizá las notas antes de importar");
      return;
    }

    try {
      setImporting(true);
      setResults(null);

      // Obtener project_id
      const { data: projectData, error: projectError } = await supabase
        .from("projects")
        .select("id")
        .eq("name", selectedProject)
        .single();

      if (projectError || !projectData) {
        throw new Error(`No se encontró el proyecto ${selectedProject}`);
      }

      const projectId = projectData.id;

      // Preparar sesiones para insertar
      const sessionsToInsert = previewNotes.map((note) => ({
        project_id: projectId,
        title: note.title,
        date: note.date,
        tag: note.tag,
        summary: note.summary,
        client_responsible: note.clientResponsible || null,
        client_status: note.clientStatus,
      }));

      // Insertar en batch
      const { data, error } = await supabase
        .from("sessions")
        .insert(sessionsToInsert)
        .select();

      if (error) throw error;

      setResults({
        success: true,
        count: data.length,
        message: `¡${data.length} sesiones importadas exitosamente!`,
      });

      // Limpiar formulario
      setNotesText("");
      setPreviewNotes([]);
    } catch (error) {
      console.error("Error importando:", error);
      setResults({
        success: false,
        message: `Error: ${error.message}`,
      });
    } finally {
      setImporting(false);
    }
  };

  /* ===============================================
     EJEMPLO DE FORMATO
  =============================================== */
  const exampleText = `Título: Reunión inicial con cliente
Fecha: 15/01/2025
Etiqueta: Kickoff
Responsable: Juan Pérez
Estado: Realizado

Discutimos los objetivos principales del proyecto y establecimos un plan de acción para las próximas semanas.

---

Título: Sesión de seguimiento
Fecha: 22/01/2025
Etiqueta: Seguimiento

Revisamos el progreso del primer sprint y ajustamos prioridades según feedback del cliente.`;

  const loadExample = () => {
    setNotesText(exampleText);
    setPreviewNotes([]);
  };

  /* ===============================================
     RENDER
  =============================================== */
  return (
    <div style={{ 
      minHeight: "100vh", 
      background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
      padding: "40px 20px"
    }}>
      <div style={{ 
        maxWidth: "1200px", 
        margin: "0 auto",
        background: "white",
        borderRadius: "16px",
        boxShadow: "0 20px 60px rgba(0,0,0,0.3)",
        overflow: "hidden"
      }}>
        {/* Header */}
        <div style={{
          background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
          padding: "32px",
          color: "white"
        }}>
          <h1 style={{ margin: 0, fontSize: "32px", fontWeight: "700" }}>
            📥 Importador de Notas
          </h1>
          <p style={{ margin: "8px 0 0", opacity: 0.9, fontSize: "16px" }}>
            Migrá tus notas de macOS a la bitácora de Seller Consulting
          </p>
        </div>

        <div style={{ padding: "32px" }}>
          {/* Selector de proyecto */}
          <div style={{ marginBottom: "24px" }}>
            <label style={{ 
              display: "block", 
              marginBottom: "8px",
              fontWeight: "600",
              color: "#334155"
            }}>
              Proyecto destino:
            </label>
            <select
              value={selectedProject}
              onChange={(e) => setSelectedProject(e.target.value)}
              style={{
                width: "100%",
                padding: "12px 16px",
                fontSize: "16px",
                border: "2px solid #e2e8f0",
                borderRadius: "8px",
                background: "white",
                cursor: "pointer"
              }}
            >
              {projects.map((p) => (
                <option key={p.id} value={p.name}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          {/* Área de texto */}
          <div style={{ marginBottom: "16px" }}>
            <div style={{ 
              display: "flex", 
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "8px"
            }}>
              <label style={{ fontWeight: "600", color: "#334155" }}>
                Pegá tus notas aquí:
              </label>
              <button
                onClick={loadExample}
                style={{
                  padding: "6px 12px",
                  fontSize: "14px",
                  background: "#f1f5f9",
                  border: "none",
                  borderRadius: "6px",
                  cursor: "pointer",
                  color: "#475569"
                }}
              >
                📋 Cargar ejemplo
              </button>
            </div>
            <textarea
              value={notesText}
              onChange={(e) => setNotesText(e.target.value)}
              placeholder={`Pegá tus notas aquí. Podés usar este formato:

Título: Nombre de la sesión
Fecha: 15/01/2025
Etiqueta: Kickoff
Responsable: Nombre del responsable
Estado: Realizado

Contenido de la nota...

---

(Separá múltiples notas con ---)`}
              rows={12}
              style={{
                width: "100%",
                padding: "16px",
                fontSize: "14px",
                border: "2px solid #e2e8f0",
                borderRadius: "8px",
                fontFamily: "monospace",
                resize: "vertical"
              }}
            />
            <p style={{ 
              fontSize: "14px", 
              color: "#64748b",
              margin: "8px 0 0"
            }}>
              💡 <strong>Tip:</strong> Separá múltiples notas con <code>---</code> o líneas en blanco
            </p>
          </div>

          {/* Botón previsualizar */}
          <button
            onClick={handlePreview}
            disabled={!notesText.trim()}
            style={{
              width: "100%",
              padding: "14px",
              fontSize: "16px",
              fontWeight: "600",
              background: notesText.trim() ? "#3b82f6" : "#cbd5e1",
              color: "white",
              border: "none",
              borderRadius: "8px",
              cursor: notesText.trim() ? "pointer" : "not-allowed",
              marginBottom: "24px"
            }}
          >
            👀 Previsualizar notas
          </button>

          {/* Preview */}
          {previewNotes.length > 0 && (
            <div style={{
              border: "2px solid #e2e8f0",
              borderRadius: "8px",
              padding: "24px",
              marginBottom: "24px",
              background: "#f8fafc"
            }}>
              <h3 style={{ 
                margin: "0 0 16px",
                fontSize: "18px",
                color: "#334155"
              }}>
                ✅ {previewNotes.length} nota{previewNotes.length !== 1 ? "s" : ""} detectada{previewNotes.length !== 1 ? "s" : ""}
              </h3>

              <div style={{ 
                display: "grid", 
                gap: "16px",
                maxHeight: "400px",
                overflowY: "auto"
              }}>
                {previewNotes.map((note, index) => (
                  <div
                    key={index}
                    style={{
                      background: "white",
                      padding: "16px",
                      borderRadius: "8px",
                      border: "1px solid #e2e8f0"
                    }}
                  >
                    <div style={{ 
                      fontWeight: "600", 
                      marginBottom: "8px",
                      fontSize: "16px",
                      color: "#1e293b"
                    }}>
                      {note.title}
                    </div>
                    <div style={{ 
                      fontSize: "14px", 
                      color: "#64748b",
                      marginBottom: "8px"
                    }}>
                      📅 {new Date(note.date).toLocaleDateString("es-PY")} • 
                      🏷️ {note.tag} •
                      ✓ {note.clientStatus === "realizado" ? "Realizado" : note.clientStatus === "no_realizado" ? "No realizado" : "Postergado"}
                    </div>
                    {note.clientResponsible && (
                      <div style={{ 
                        fontSize: "14px", 
                        color: "#64748b",
                        marginBottom: "8px"
                      }}>
                        👤 {note.clientResponsible}
                      </div>
                    )}
                    <div style={{ 
                      fontSize: "14px", 
                      color: "#475569",
                      lineHeight: "1.6"
                    }}>
                      {note.summary.substring(0, 200)}
                      {note.summary.length > 200 ? "..." : ""}
                    </div>
                  </div>
                ))}
              </div>

              {/* Botón importar */}
              <button
                onClick={handleImport}
                disabled={importing}
                style={{
                  width: "100%",
                  padding: "14px",
                  fontSize: "16px",
                  fontWeight: "600",
                  background: importing ? "#cbd5e1" : "#10b981",
                  color: "white",
                  border: "none",
                  borderRadius: "8px",
                  cursor: importing ? "not-allowed" : "pointer",
                  marginTop: "16px"
                }}
              >
                {importing ? "⏳ Importando..." : `🚀 Importar ${previewNotes.length} sesión${previewNotes.length !== 1 ? "es" : ""} a ${selectedProject}`}
              </button>
            </div>
          )}

          {/* Resultados */}
          {results && (
            <div style={{
              padding: "16px",
              borderRadius: "8px",
              background: results.success ? "#d1fae5" : "#fee2e2",
              border: `2px solid ${results.success ? "#10b981" : "#ef4444"}`,
              color: results.success ? "#065f46" : "#991b1b"
            }}>
              <div style={{ fontWeight: "600", marginBottom: "4px" }}>
                {results.success ? "✅ Éxito" : "❌ Error"}
              </div>
              <div>{results.message}</div>
            </div>
          )}

          {/* Instrucciones */}
          <div style={{
            marginTop: "32px",
            padding: "20px",
            background: "#f1f5f9",
            borderRadius: "8px",
            fontSize: "14px",
            color: "#475569"
          }}>
            <h4 style={{ margin: "0 0 12px", color: "#1e293b" }}>
              📖 Cómo usar el importador:
            </h4>
            <ol style={{ margin: 0, paddingLeft: "20px" }}>
              <li style={{ marginBottom: "8px" }}>
                Copiá tus notas desde la app Notas de macOS
              </li>
              <li style={{ marginBottom: "8px" }}>
                Pegá el texto en el área de arriba (separá múltiples notas con <code>---</code>)
              </li>
              <li style={{ marginBottom: "8px" }}>
                Click en <strong>"Previsualizar notas"</strong> para verificar que se detectaron correctamente
              </li>
              <li style={{ marginBottom: "8px" }}>
                Revisá la previsualización y ajustá si es necesario
              </li>
              <li>
                Click en <strong>"Importar"</strong> para guardar en la bitácora
              </li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
}

export default NotesImporter;