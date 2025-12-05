import { useState, useEffect } from "react";
import { supabase } from "./supabaseClient";
import "./index.css";

function App() {
  // Detectar si estamos en el portal de clientes
  const searchParams = new URLSearchParams(window.location.search);
  const mode = searchParams.get("mode");
  const isClientPortal =
    window.location.host.includes("bitacora-client") || mode === "client";

  useEffect(() => {
    const testSupabase = async () => {
      const { data, error } = await supabase.from("projects").select("*");

      console.log("Supabase projects:", data);
      if (error) console.error("Supabase ERROR:", error);
    };

    testSupabase();
  }, []);

  const [selectedProject, setSelectedProject] = useState("Karu");

  const [notes, setNotes] = useState([
    {
      id: 1,
      project: "Karu",
      title: "Kickoff y diagnóstico inicial",
      date: "2025-01-14",
      tag: "Kickoff",
      summary:
        "Revisión de objetivos comerciales, definición de tablero de control y stakeholders clave.",
      clientResponsible: "Dirección Comercial Karu",
      clientStatus: "realizado",
    },
  ]);

  const [activeNoteId, setActiveNoteId] = useState(1);
  const activeNote = notes.find(
    (n) => n.id === activeNoteId && n.project === selectedProject
  );

  const projectNotes = notes
    .filter((n) => n.project === selectedProject)
    .sort((a, b) => (a.date < b.date ? 1 : -1));

  // Draft interno (solo se usará en modo interno)
  const [draft, setDraft] = useState({
    title: "",
    date: new Date().toISOString().slice(0, 10),
    tag: "Sesión",
    summary: "",
    clientResponsible: "",
    clientStatus: "postergado",
  });

  const projects = ["Karu", "Everdem", "Salumax", "Labco"];

  // Estado del cliente (para modo portal cliente)
  const [clientInfo, setClientInfo] = useState(null);
  const [clientLoading, setClientLoading] = useState(isClientPortal);
  const [clientError, setClientError] = useState(null);

  // Leer token desde la URL y buscarlo en Supabase
  useEffect(() => {
    if (!isClientPortal) return;

    const params = new URLSearchParams(window.location.search);
    const token = params.get("token");

    if (!token) {
      setClientError(
        "No encontramos un token en el enlace. Pedí a Seller un nuevo link de acceso."
      );
      setClientLoading(false);
      return;
    }

    const fetchClient = async () => {
      setClientLoading(true);
      const { data, error } = await supabase
        .from("client_tokens")
        .select("*")
        .eq("token", token)
        .eq("active", true)
        .single();

      if (error || !data) {
        console.error("Error buscando token de cliente:", error);
        setClientError(
          "Este enlace no es válido o ya no está activo. Contactá con Seller Consulting para obtener uno nuevo."
        );
        setClientLoading(false);
        return;
      }

      setClientInfo(data);
      setSelectedProject(data.project_name);
      setClientLoading(false);
    };

    fetchClient();
  }, [isClientPortal]);

  const handleCreateNote = () => {
    if (!draft.title.trim()) return;
    const newNote = {
      id: Date.now(),
      project: selectedProject,
      ...draft,
    };
    setNotes([newNote, ...notes]);
    setActiveNoteId(newNote.id);
    setDraft({
      title: "",
      date: new Date().toISOString().slice(0, 10),
      tag: "Sesión",
      summary: "",
      clientResponsible: "",
      clientStatus: "postergado",
    });
  };

  const formatClientStatus = (status) => {
    if (status === "realizado") return "Realizado";
    if (status === "postergado") return "Postergado";
    return "No realizado";
  };

  return (
    <div className="app-root">
      {/* TOP BAR */}
      <header className="topbar">
        <div className="topbar-left">
          <div className="topbar-logo">S</div>
          <div className="topbar-text">
            <span className="topbar-overline">SELLER CONSULTING</span>
            <span className="topbar-title">
              {isClientPortal ? "Bitácora del proyecto" : "Bitácora de proyectos"}
            </span>
          </div>
        </div>
        <div className="topbar-right">
          {!isClientPortal && (
            <>
              <select
                className="project-select"
                value={selectedProject}
                onChange={(e) => {
                  setSelectedProject(e.target.value);
                  const first = notes.find(
                    (n) => n.project === e.target.value
                  );
                  setActiveNoteId(first ? first.id : undefined);
                }}
              >
                {projects.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
              <button className="share-button">Compartir vista pública</button>
            </>
          )}
          {isClientPortal && clientInfo && (
            <div className="client-chip">
              Cliente: <strong>{clientInfo.client_name}</strong>
            </div>
          )}
        </div>
      </header>

      {/* LAYOUT PRINCIPAL */}
      <main className="layout">
        {/* COLUMNA IZQUIERDA - SOLO INTERNO SELLER */}
        {!isClientPortal && (
          <section className="column column-left">
            {/* Nueva nota */}
            <div className="card card-new-note">
              <div className="card-header">
                <div>
                  <div className="card-overline">NUEVA NOTA DE SESIÓN</div>
                  <div className="card-subtitle">
                    Registra acuerdos, próximos pasos y decisiones clave.
                  </div>
                </div>
                <span className="badge-interno">Interno Seller</span>
              </div>

              <div className="card-body">
                <input
                  className="field-input"
                  placeholder="Título de la sesión (ej: Revisión pipeline mensual)"
                  value={draft.title}
                  onChange={(e) =>
                    setDraft({ ...draft, title: e.target.value })
                  }
                />

                <div className="field-row">
                  <div className="field-group">
                    <label className="field-label">Fecha</label>
                    <input
                      type="date"
                      className="field-input"
                      value={draft.date}
                      onChange={(e) =>
                        setDraft({ ...draft, date: e.target.value })
                      }
                    />
                  </div>
                  <div className="field-group">
                    <label className="field-label">Etiqueta</label>
                    <input
                      className="field-input"
                      value={draft.tag}
                      onChange={(e) =>
                        setDraft({ ...draft, tag: e.target.value })
                      }
                    />
                  </div>
                </div>

                {/* Responsable + estado cliente (interno, para registrar compromisos) */}
                <div className="field-row">
                  <div className="field-group">
                    <label className="field-label">
                      Responsable del lado cliente
                    </label>
                    <input
                      className="field-input"
                      placeholder="Ej: Gerente Comercial, Dirección, etc."
                      value={draft.clientResponsible}
                      onChange={(e) =>
                        setDraft({
                          ...draft,
                          clientResponsible: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div className="field-group">
                    <label className="field-label">
                      Estado compromiso cliente
                    </label>
                    <select
                      className="field-input"
                      value={draft.clientStatus}
                      onChange={(e) =>
                        setDraft({ ...draft, clientStatus: e.target.value })
                      }
                    >
                      <option value="realizado">Realizado</option>
                      <option value="postergado">Postergado</option>
                      <option value="no_realizado">No realizado</option>
                    </select>
                  </div>
                </div>

                <textarea
                  className="field-textarea"
                  rows={3}
                  placeholder="Resumen rápido: acuerdos, próximos pasos, decisiones clave, riesgos, compromisos del cliente..."
                  value={draft.summary}
                  onChange={(e) =>
                    setDraft({ ...draft, summary: e.target.value })
                  }
                />

                <button
                  className={`primary-button ${
                    !draft.title.trim() ? "primary-button--disabled" : ""
                  }`}
                  disabled={!draft.title.trim()}
                  onClick={handleCreateNote}
                >
                  + Guardar nota y actualizar bitácora
                </button>
              </div>
            </div>

            {/* Lista de notas */}
            <div className="card card-notes-list">
              <div className="card-header card-header--small">
                <div className="card-overline">NOTAS DE SESIÓN</div>
                <div className="card-counter">
                  {projectNotes.length} entradas
                </div>
              </div>

              <div className="notes-list">
                {projectNotes.length === 0 ? (
                  <div className="notes-empty">
                    Todavía no hay notas para este proyecto.
                  </div>
                ) : (
                  projectNotes.map((note) => (
                    <div
                      key={note.id}
                      className={`note-item ${
                        note.id === activeNoteId ? "note-item--active" : ""
                      }`}
                      onClick={() => setActiveNoteId(note.id)}
                    >
                      <div className="note-item-top">
                        <div className="note-title">{note.title}</div>
                        <div className="note-date">
                          {new Date(note.date).toLocaleDateString("es-PY", {
                            day: "2-digit",
                            month: "short",
                          })}
                        </div>
                      </div>
                      <div className="note-tags">
                        <span className="tag">{note.tag}</span>
                        {note.clientStatus && (
                          <span className="tag tag--status">
                            {formatClientStatus(note.clientStatus)}
                          </span>
                        )}
                      </div>
                      <div className="note-summary">
                        {note.summary || "Sin resumen registrado."}
                      </div>
                    </div>
                  ))
                )}
              </div>

              {activeNote && (
                <div className="notes-footer">
                  Última nota seleccionada:{" "}
                  <span className="notes-footer-title">
                    {activeNote.title}
                  </span>
                </div>
              )}
            </div>
          </section>
        )}

        {/* COLUMNA DERECHA - VISTA CLIENTE */}
        <section className="column column-right">
          {/* Resumen proyecto */}
          <div className="card card-project-summary">
            <div className="summary-header">
              <div>
                <div className="card-overline">
                  {isClientPortal ? "RESUMEN DEL PROYECTO" : "VISTA DEL PROYECTO"}
                </div>
                <h1 className="project-title">
                  Bitácora de {selectedProject}
                </h1>
                <p className="project-description">
                  {isClientPortal
                    ? "Esta es la vista ejecutiva de la bitácora de consultoría para tu empresa. Aquí verás los principales hitos, acuerdos y avances del proyecto."
                    : "Línea de tiempo viva con los hitos, acuerdos y avances de consultoría. Esta vista es la que podrías compartir con el cliente como resumen ejecutivo del proyecto."}
                </p>
              </div>
              <div className="summary-metrics">
                <div className="metric-card">
                  <div className="metric-label">Última actualización</div>
                  <div className="metric-value">
                    {new Date().toLocaleDateString("es-PY")}
                  </div>
                </div>
                <div className="metric-card metric-card--green">
                  <div className="metric-label">Sesiones registradas</div>
                  <div className="metric-value">{projectNotes.length}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Timeline */}
          <div className="card card-timeline">
            {isClientPortal && clientLoading && (
              <div className="timeline-empty">
                Validando tu acceso como cliente...
              </div>
            )}

            {isClientPortal && !clientLoading && clientError && (
              <div className="timeline-empty">
                {clientError}
                <br />
                <br />
                <span className="timeline-help">
                  Si el problema persiste, escribinos a{" "}
                  <strong>ml@seller.consulting</strong>.
                </span>
              </div>
            )}

            {(!isClientPortal || (!clientLoading && !clientError)) && (
              <>
                {projectNotes.length === 0 ? (
                  <div className="timeline-empty">
                    Todavía no hay eventos en la bitácora de este proyecto.
                  </div>
                ) : (
                  <ol className="timeline">
                    {projectNotes.map((note, index) => (
                      <li key={note.id} className="timeline-item">
                        <div className="timeline-point" />
                        <div className="timeline-content">
                          <div className="timeline-header">
                            <div className="timeline-date">
                              {new Date(note.date).toLocaleDateString("es-PY", {
                                weekday: "short",
                                day: "2-digit",
                                month: "short",
                                year: "numeric",
                              })}
                            </div>
                            <div className="timeline-badges">
                              <span className="timeline-badge">
                                Sesión #{projectNotes.length - index}
                              </span>
                              <span className="timeline-badge timeline-badge--blue">
                                {note.tag}
                              </span>
                            </div>
                          </div>
                          <div className="timeline-card">
                            <div className="timeline-title">
                              {note.title}
                            </div>
                            <div className="timeline-summary">
                              {note.summary}
                            </div>
                            <div className="timeline-meta">
                              <span>
                                • Responsable cliente:{" "}
                                <strong>
                                  {note.clientResponsible || "Sin asignar"}
                                </strong>
                              </span>
                              <span>
                                • Estado cliente:{" "}
                                <strong className="status-pill">
                                  {formatClientStatus(note.clientStatus)}
                                </strong>
                              </span>
                            </div>
                          </div>
                        </div>
                      </li>
                    ))}
                  </ol>
                )}
              </>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}

export default App;
