import { useState, useEffect, useMemo, useCallback } from "react";
import { supabase } from "./supabaseClient";
import "./index.css";

/* -------------------------------------------------------------
   FASES Y POSICIONES DEL ROADMAP CURVO
------------------------------------------------------------- */
const PHASES = [
  { id: 1, label: "Diagnóstico" },
  { id: 2, label: "Plan estratégico" },
  { id: 3, label: "Implementación" },
  { id: 4, label: "Seguimiento & control" },
];

const PHASE_MARKERS = [
  { id: 1, x: 80, y: 150 },
  { id: 2, x: 320, y: 110 },
  { id: 3, x: 620, y: 160 },
  { id: 4, x: 880, y: 120 },
];

function Dashboard() {
  /* -------------------------------------------------------------
     MODO CLIENTE / MODO INTERNO
  ------------------------------------------------------------- */
  const searchParams = new URLSearchParams(window.location.search);
  const mode = searchParams.get("mode");
  const isClientPortal =
    window.location.host.includes("bitacora-client") || mode === "client";

  /* -------------------------------------------------------------
     ESTADOS PRINCIPALES
  ------------------------------------------------------------- */
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState(null);
  const [selectedProjectId, setSelectedProjectId] = useState(null);
  const [projectPhase, setProjectPhase] = useState(null);
  const [phaseLoading, setPhaseLoading] = useState(true);

  const [sessions, setSessions] = useState([]);
  const [sessionsLoading, setSessionsLoading] = useState(true);
  const [sessionsError, setSessionsError] = useState(null);

  const [activeSessionId, setActiveSessionId] = useState(null);

  /* BORRADOR NUEVA SESIÓN */
  const [draft, setDraft] = useState({
    title: "",
    date: new Date().toISOString().slice(0, 10),
    tag: "Sesión",
    summary: "",
    clientResponsible: "",
    clientStatus: "postergado",
  });

  const [savingSession, setSavingSession] = useState(false);
  const [saveError, setSaveError] = useState(null);

  /* PORTAL CLIENTE */
  const [clientInfo, setClientInfo] = useState(null);
  const [clientLoading, setClientLoading] = useState(isClientPortal);
  const [clientError, setClientError] = useState(null);

  /* CONTROL MANUAL DE FASE */
  const [manualPhase, setManualPhase] = useState(null);
  const [savingPhase, setSavingPhase] = useState(false);
  const [phaseError, setPhaseError] = useState(null);

  /* -------------------------------------------------------------
     ESTADO DERIVADO CON USEMEMO (PERFORMANCE)
  ------------------------------------------------------------- */
 const projectSessions = useMemo(() => {
  return [...sessions].sort((a, b) => (a.date < b.date ? 1 : -1));
}, [sessions]);

  const activeSession = useMemo(() => {
    return sessions.find((s) => s.id === activeSessionId);
  }, [sessions, activeSessionId]);

  /* -------------------------------------------------------------
     CARGAR PROYECTOS
  ------------------------------------------------------------- */
  const loadProjects = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from("projects")
        .select("id, name, client_name")
        .order("name");

      if (error) throw error;

      setProjects(data || []);
      
      // Seleccionar primer proyecto por defecto
      if (data && data.length > 0 && !selectedProject) {
        setSelectedProject(data[0].name);
        setSelectedProjectId(data[0].id);
      }
    } catch (error) {
      console.error("Error cargando proyectos:", error);
    }
  }, [selectedProject]);

  /* -------------------------------------------------------------
     CARGAR SESIONES DESDE SUPABASE
  ------------------------------------------------------------- */
  const loadSessions = useCallback(async (projectId) => {
    if (!projectId) return;

    try {
      setSessionsLoading(true);
      setSessionsError(null);

      const { data, error } = await supabase
        .from("sessions")
        .select("*")
        .eq("project_id", projectId)
        .order("date", { ascending: false });

      if (error) throw error;

      setSessions(data || []);
      if (data && data.length > 0) {
        setActiveSessionId(data[0].id);
      } else {
        setActiveSessionId(null);
      }
    } catch (error) {
      console.error("Error cargando sesiones:", error);
      setSessionsError("No pudimos cargar las sesiones. Intentá de nuevo.");
    } finally {
      setSessionsLoading(false);
    }
  }, []);

  /* -------------------------------------------------------------
     CARGAR FASE ACTUAL
  ------------------------------------------------------------- */
  const loadPhase = useCallback(async (projectName) => {
    if (!projectName) return;

    try {
      setPhaseLoading(true);
      setPhaseError(null);

      const { data, error } = await supabase
        .from("project_phase")
        .select("current_phase")
        .eq("project_name", projectName)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      if (data) {
        setProjectPhase(data.current_phase ?? 1);
        setManualPhase(data.current_phase ?? 1);
      } else {
        // Si no existe, crear registro con fase 1
        const { data: newPhase, error: insertError } = await supabase
          .from("project_phase")
          .insert([{ 
            project_name: projectName, 
            current_phase: 1 
          }])
          .select()
          .single();

        if (insertError) throw insertError;

        setProjectPhase(1);
        setManualPhase(1);
      }
    } catch (error) {
      console.error("Error cargando fase:", error);
      setPhaseError("Error cargando la fase del proyecto");
      setProjectPhase(1);
      setManualPhase(1);
    } finally {
      setPhaseLoading(false);
    }
  }, []);

  /* -------------------------------------------------------------
     EFECTOS Y CARGA INICIAL
  ------------------------------------------------------------- */

  // Cargar proyectos al inicio (solo modo interno)
  useEffect(() => {
    if (!isClientPortal) {
      loadProjects();
    }
  }, [isClientPortal, loadProjects]);

  // Cargar sesiones y fase cuando cambia el proyecto
  useEffect(() => {
    if (selectedProjectId && selectedProject) {
      loadSessions(selectedProjectId);
      loadPhase(selectedProject);
    }
  }, [selectedProjectId, selectedProject, loadSessions, loadPhase]);

  // Validar token cliente con seguridad mejorada
  useEffect(() => {
    if (!isClientPortal) return;

    const params = new URLSearchParams(window.location.search);
    const token = params.get("token");

    if (!token) {
      setClientError("No encontramos un token válido.");
      setClientLoading(false);
      return;
    }

    const fetchClient = async () => {
      try {
        setClientLoading(true);

        const { data, error } = await supabase
          .from("client_tokens")
          .select("*")
          .eq("token", token)
          .eq("active", true)
          .single();

        if (!data || error) {
          setClientError(
            "El enlace expiró o no es válido. Solicitá un nuevo acceso."
          );
          setClientLoading(false);
          return;
        }

        // Verificar expiración del token
        if (data.expires_at) {
          const expiresAt = new Date(data.expires_at);
          if (expiresAt < new Date()) {
            setClientError("Este enlace ha expirado. Solicitá uno nuevo.");
            setClientLoading(false);
            return;
          }
        }

        setClientInfo(data);
        setSelectedProject(data.project_name);

        // Obtener el project_id del nombre
        const { data: projectData } = await supabase
          .from("projects")
          .select("id")
          .eq("name", data.project_name)
          .single();

        if (projectData) {
          setSelectedProjectId(projectData.id);
        }

        setClientLoading(false);
      } catch (error) {
        console.error("Error validando token:", error);
        setClientError("Hubo un problema validando tu acceso.");
        setClientLoading(false);
      }
    };

    fetchClient();
  }, [isClientPortal]);

  /* -------------------------------------------------------------
     HELPERS
  ------------------------------------------------------------- */
  const getPhaseStatus = (phaseId) => {
    if (!projectPhase) return "pending";
    if (phaseId < projectPhase) return "done";
    if (phaseId === projectPhase) return "current";
    return "upcoming";
  };

  const getPhaseStatusLabel = (status) => {
    switch (status) {
      case "done":
        return "Completada";
      case "current":
        return "En curso";
      case "upcoming":
        return "Próxima fase";
      default:
        return "Pendiente";
    }
  };

  const formatClientStatus = (s) =>
    s === "realizado"
      ? "Realizado"
      : s === "postergado"
      ? "Postergado"
      : "No realizado";

  /* -------------------------------------------------------------
     VALIDACIÓN DE FORMULARIO
  ------------------------------------------------------------- */
  const validateSession = (sessionData) => {
    const errors = [];

    if (!sessionData.title || sessionData.title.trim().length < 3) {
      errors.push("El título debe tener al menos 3 caracteres");
    }

    if (sessionData.title.length > 200) {
      errors.push("El título no puede exceder 200 caracteres");
    }

    if (!sessionData.summary || sessionData.summary.trim().length < 10) {
      errors.push("El resumen debe tener al menos 10 caracteres");
    }

    if (!sessionData.date) {
      errors.push("La fecha es obligatoria");
    }

    return errors;
  };

  /* -------------------------------------------------------------
     GUARDAR FASE MANUAL
  ------------------------------------------------------------- */
  const saveManualPhase = async () => {
    if (!manualPhase || !selectedProject) return;

    try {
      setSavingPhase(true);
      setPhaseError(null);

      const { error } = await supabase
        .from("project_phase")
        .update({
          current_phase: manualPhase,
          updated_at: new Date().toISOString(),
        })
        .eq("project_name", selectedProject);

      if (error) throw error;

      setProjectPhase(manualPhase);
    } catch (error) {
      console.error("Error actualizando fase:", error);
      setPhaseError("No pudimos guardar la fase. Intentá de nuevo.");
    } finally {
      setSavingPhase(false);
    }
  };

  /* -------------------------------------------------------------
     CREAR SESIÓN CON PERSISTENCIA EN SUPABASE
  ------------------------------------------------------------- */
  const handleCreateSession = async () => {
    if (!selectedProjectId) {
      setSaveError("No hay un proyecto seleccionado");
      return;
    }

    // Validación
    const errors = validateSession(draft);
    if (errors.length > 0) {
      setSaveError(errors.join(". "));
      return;
    }

    try {
      setSavingSession(true);
      setSaveError(null);

      const newSession = {
        project_id: selectedProjectId,
        title: draft.title.trim(),
        date: draft.date,
        tag: draft.tag,
        summary: draft.summary.trim(),
        client_responsible: draft.clientResponsible || null,
        client_status: draft.clientStatus,
      };

      // Guardar en Supabase
      const { data, error } = await supabase
        .from("sessions")
        .insert([newSession])
        .select()
        .single();

      if (error) throw error;

      // Actualizar estado local
      setSessions([data, ...sessions]);
      setActiveSessionId(data.id);

      // Limpiar formulario
      setDraft({
        title: "",
        date: new Date().toISOString().slice(0, 10),
        tag: "Sesión",
        summary: "",
        clientResponsible: "",
        clientStatus: "postergado",
      });
    } catch (error) {
      console.error("Error guardando sesión:", error);
      setSaveError("No pudimos guardar la sesión. Verificá tu conexión.");
    } finally {
      setSavingSession(false);
    }
  };
/* -------------------------------------------------------------
   COMPARTIR VISTA PÚBLICA (CLIENT PORTAL)
------------------------------------------------------------- */
const handleSharePublicView = async () => {
  if (!selectedProject) {
    alert("Seleccioná un proyecto primero");
    return;
  }

  try {
    const token = crypto.randomUUID();

    const project = projects.find(p => p.name === selectedProject);

    const { error } = await supabase
      .from("client_tokens")
      .insert([
        {
          token,
          project_name: selectedProject,
          client_name: project?.client_name || "",
          active: true,
          expires_at: null, // opcional
        },
      ]);

    if (error) throw error;

    const publicUrl = `${window.location.origin.replace(
      "bitacora",
      "bitacora-client"
    )}/?mode=client&token=${token}`;

    await navigator.clipboard.writeText(publicUrl);

    alert(
      "✅ Vista pública generada y copiada al portapapeles:\n\n" +
        publicUrl
    );
  } catch (error) {
    console.error("Error generando vista pública:", error);
    alert("No se pudo generar el enlace público");
  }
};

  /* -------------------------------------------------------------
     CAMBIAR PROYECTO
  ------------------------------------------------------------- */
  const handleProjectChange = (projectName) => {
    const project = projects.find(p => p.name === projectName);
    if (project) {
      setSelectedProject(project.name);
      setSelectedProjectId(project.id);
    }
  };

  /* -------------------------------------------------------------
     RENDER PRINCIPAL
  ------------------------------------------------------------- */
  return (
    <div className="app-root">
      {/* -------------------------------- TOP BAR ------------------------------- */}
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
                value={selectedProject || ""}
                onChange={(e) => handleProjectChange(e.target.value)}
                aria-label="Seleccionar proyecto"
              >
                {projects.map((p) => (
                  <option key={p.id} value={p.name}>
                    {p.name}
                  </option>
                ))}
              </select>

<button
  className="share-button"
  onClick={handleSharePublicView}
>
  Compartir vista pública
</button>
            </>
          )}

          {isClientPortal && clientInfo && (
            <div className="client-chip">
              Cliente: <strong>{clientInfo.client_name}</strong>
            </div>
          )}
        </div>
      </header>

      {/* -------------------------------- LAYOUT -------------------------------- */}
      <main className="layout">
        {/* --------------------- COLUMNA IZQUIERDA (INTERNAL) -------------------- */}
        {!isClientPortal && (
          <section className="column column-left">
            {/* --------------------- NUEVA SESIÓN --------------------- */}
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
                {saveError && (
                  <div className="error-message" role="alert">
                    {saveError}
                  </div>
                )}

                <input
                  className="field-input"
                  placeholder="Título de la sesión"
                  value={draft.title}
                  onChange={(e) =>
                    setDraft({ ...draft, title: e.target.value })
                  }
                  maxLength={200}
                  aria-label="Título de la sesión"
                  disabled={savingSession}
                />

                <div className="field-row">
                  <div className="field-group">
                    <label htmlFor="session-date">Fecha</label>
                    <input
                      id="session-date"
                      type="date"
                      className="field-input"
                      value={draft.date}
                      onChange={(e) =>
                        setDraft({ ...draft, date: e.target.value })
                      }
                      disabled={savingSession}
                    />
                  </div>

                  <div className="field-group">
                    <label htmlFor="session-tag">Etiqueta</label>
                    <input
                      id="session-tag"
                      className="field-input"
                      value={draft.tag}
                      onChange={(e) =>
                        setDraft({ ...draft, tag: e.target.value })
                      }
                      disabled={savingSession}
                    />
                  </div>
                </div>

                <div className="field-row">
                  <div className="field-group">
                    <label htmlFor="client-responsible">Responsable cliente</label>
                    <input
                      id="client-responsible"
                      className="field-input"
                      value={draft.clientResponsible}
                      onChange={(e) =>
                        setDraft({
                          ...draft,
                          clientResponsible: e.target.value,
                        })
                      }
                      disabled={savingSession}
                    />
                  </div>

                  <div className="field-group">
                    <label htmlFor="client-status">Estado cliente</label>
                    <select
                      id="client-status"
                      className="field-input"
                      value={draft.clientStatus}
                      onChange={(e) =>
                        setDraft({ ...draft, clientStatus: e.target.value })
                      }
                      disabled={savingSession}
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
                  placeholder="Resumen (mínimo 10 caracteres)..."
                  value={draft.summary}
                  onChange={(e) =>
                    setDraft({ ...draft, summary: e.target.value })
                  }
                  aria-label="Resumen de la sesión"
                  disabled={savingSession}
                />

                <button
                  className={`primary-button ${
                    !draft.title.trim() || savingSession ? "primary-button--disabled" : ""
                  }`}
                  disabled={!draft.title.trim() || savingSession}
                  onClick={handleCreateSession}
                >
                  {savingSession ? "Guardando..." : "+ Guardar nota"}
                </button>
              </div>
            </div>

            {/* --------------------- LISTA DE SESIONES --------------------- */}
            <div className="card card-notes-list">
              <div className="card-header card-header--small">
                <div className="card-overline">NOTAS DE SESIÓN</div>
                <div className="card-counter">{projectSessions.length} entradas</div>
              </div>

              {sessionsLoading ? (
                <div className="notes-loading">Cargando sesiones...</div>
              ) : sessionsError ? (
                <div className="notes-error" role="alert">
                  {sessionsError}
                </div>
              ) : (
                <div className="notes-list">
                  {projectSessions.map((session) => (
                    <div
                      key={session.id}
                      className={`note-item ${
                        session.id === activeSessionId ? "note-item--active" : ""
                      }`}
                      onClick={() => setActiveSessionId(session.id)}
                      role="button"
                      tabIndex={0}
                      onKeyPress={(e) => {
                        if (e.key === "Enter") setActiveSessionId(session.id);
                      }}
                    >
                      <div className="note-item-top">
                        <div className="note-title">{session.title}</div>
                        <div className="note-date">
                          {new Date(session.date).toLocaleDateString("es-PY", {
                            day: "2-digit",
                            month: "short",
                          })}
                        </div>
                      </div>

                      <div className="note-tags">
                        <span className="tag">{session.tag}</span>
                        <span className="tag tag--status">
                          {formatClientStatus(session.client_status)}
                        </span>
                      </div>

                      <div className="note-summary">{session.summary}</div>
                    </div>
                  ))}
                </div>
              )}

              {activeSession && !sessionsLoading && (
                <div className="notes-footer">
                  Última sesión seleccionada:{" "}
                  <strong>{activeSession.title}</strong>
                </div>
              )}
            </div>
          </section>
        )}

        {/* ---------------------- COLUMNA DERECHA ---------------------- */}
        <section className="column column-right">
          {/* ------------------- RESUMEN DEL PROYECTO ------------------- */}
          <div className="card card-project-summary">
            <div className="summary-header">
              <div>
                <div className="card-overline">
                  {isClientPortal ? "RESUMEN DEL PROYECTO" : "VISTA DEL PROYECTO"}
                </div>

                <h1 className="project-title">
                  Bitácora de {selectedProject || "..."}
                </h1>

                <p className="project-description">
                  {isClientPortal
                    ? "Aquí verás los principales hitos, acuerdos y avances del proyecto."
                    : "Resumen ejecutivo del avance del proyecto para cliente."}
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
                  <div className="metric-value">{projectSessions.length}</div>
                </div>
              </div>
            </div>
          </div>

          {/* ---------------- ROADMAP CURVO + CONTROL MANUAL ---------------- */}
          <div className="card card-phase-roadmap card-phase-roadmap--curved">
            {/* ----- TITULO ----- */}
            <div className="phase-header phase-header--curved">
              <div>
                <div className="card-overline">AVANCE DEL PROYECTO</div>

                <h2 className="phase-title">
                  Fase actual:{" "}
                  <span>
                    {PHASES.find((p) => p.id === projectPhase)?.label ||
                      "Configurando..."}
                  </span>
                </h2>

                <p className="phase-subtitle">
                  Visualizá en qué etapa se encuentra tu proyecto.
                </p>
              </div>

              <div className="phase-meta">
                <div className="phase-pill">
                  {phaseLoading ? (
                    "Cargando..."
                  ) : (
                    <>
                      <span className="phase-pill-number">
                        {projectPhase ?? "-"}
                      </span>
                      <span className="phase-pill-text">
                        de {PHASES.length} fases
                      </span>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* ----- CONTROL MANUAL (SOLO INTERNO) ----- */}
            {!isClientPortal && (
              <div className="manual-phase-control">
                <h3 className="manual-phase-title">Control manual de fase</h3>
                <p className="manual-phase-description">
                  Seleccioná la fase actual del proyecto. Esto actualiza el
                  roadmap del cliente.
                </p>

                {phaseError && (
                  <div className="error-message" role="alert">
                    {phaseError}
                  </div>
                )}

                <div className="manual-phase-grid">
                  {PHASES.map((p) => (
                    <div
                      key={p.id}
                      className={`manual-phase-card ${
                        manualPhase === p.id ? "selected" : ""
                      }`}
                      onClick={() => setManualPhase(p.id)}
                      role="button"
                      tabIndex={0}
                      aria-label={`Seleccionar fase ${p.id}: ${p.label}`}
                      onKeyPress={(e) => {
                        if (e.key === "Enter") setManualPhase(p.id);
                      }}
                    >
                      <div className="manual-phase-number">{p.id}</div>
                      <div className="manual-phase-label">{p.label}</div>
                    </div>
                  ))}
                </div>

                <button
                  className="manual-phase-save"
                  disabled={!manualPhase || savingPhase}
                  onClick={saveManualPhase}
                >
                  {savingPhase ? "Guardando..." : "Guardar fase actual"}
                </button>
              </div>
            )}

            {/* ----- ROADMAP CURVO SVG ----- */}
            <div className="phase-curve-wrapper">
              <svg
                viewBox="0 0 960 220"
                className="phase-curve-svg"
                role="img"
                aria-label="Roadmap del proyecto con 4 fases"
              >
                <title>Progreso del proyecto a través de 4 fases</title>
                <path
                  className="phase-curve-path"
                  d="M40 180
                     C 180 120, 260 80, 360 110
                     S 560 200, 720 150
                     S 880 80, 920 110"
                  fill="none"
                />

                {PHASE_MARKERS.map((marker) => {
                  const status = getPhaseStatus(marker.id);
                  const phase = PHASES.find((p) => p.id === marker.id);

                  return (
                    <g
                      key={marker.id}
                      className={`phase-marker phase-marker--${status}`}
                      role="img"
                      aria-label={`Fase ${marker.id}: ${phase.label} - ${getPhaseStatusLabel(status)}`}
                    >
                      <circle
                        cx={marker.x}
                        cy={marker.y}
                        r="20"
                        className="phase-marker-ring"
                      />

                      <circle
                        cx={marker.x}
                        cy={marker.y}
                        r="9"
                        className="phase-marker-dot"
                      />

                      <text
                        x={marker.x}
                        y={marker.y + 4}
                        textAnchor="middle"
                        className="phase-marker-index"
                      >
                        {marker.id}
                      </text>

                      <text
                        x={marker.x}
                        y={marker.y - 26}
                        textAnchor="middle"
                        className="phase-marker-label"
                      >
                        {phase.label}
                      </text>
                    </g>
                  );
                })}
              </svg>
            </div>

            {/* LEYENDA */}
            <div className="phase-legend">
              {PHASES.map((phase) => {
                const status = getPhaseStatus(phase.id);
                return (
                  <div
                    key={phase.id}
                    className={`phase-legend-item phase-legend-item--${status}`}
                  >
                    <div className="phase-legend-pill">
                      <span className="phase-legend-index">
                        {phase.id.toString().padStart(2, "0")}
                      </span>
                      <span className="phase-legend-title">
                        {phase.label}
                      </span>
                    </div>
                    <span className="phase-legend-status">
                      {getPhaseStatusLabel(status)}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* ---------------------------- TIMELINE ---------------------------- */}
          <div className="card card-timeline">
            {isClientPortal && clientLoading && (
              <div className="timeline-empty">
                Validando tu acceso como cliente...
              </div>
            )}

            {isClientPortal && !clientLoading && clientError && (
              <div className="timeline-empty" role="alert">
                {clientError}
                <br />
                <br />
                <small>
                  Si el problema persiste, escribinos a{" "}
                  <strong>ml@seller.consulting</strong>.
                </small>
              </div>
            )}

            {(!isClientPortal || (!clientLoading && !clientError)) && (
              <>
                {sessionsLoading ? (
                  <div className="timeline-empty">Cargando bitácora...</div>
                ) : projectSessions.length === 0 ? (
                  <div className="timeline-empty">
                    Todavía no hay eventos en la bitácora.
                  </div>
                ) : (
                  <ol className="timeline">
                    {projectSessions.map((session, index) => (
                      <li key={session.id} className="timeline-item">
                        <div className="timeline-point" />

                        <div className="timeline-content">
                          <div className="timeline-header">
                            <div className="timeline-date">
                              {new Date(session.date).toLocaleDateString("es-PY", {
                                weekday: "short",
                                day: "2-digit",
                                month: "short",
                                year: "numeric",
                              })}
                            </div>

                            <div className="timeline-badges">
                              <span className="timeline-badge">
                                Sesión #{projectSessions.length - index}
                              </span>
                              <span className="timeline-badge timeline-badge--blue">
                                {session.tag}
                              </span>
                            </div>
                          </div>

                          <div className="timeline-card">
                            <div className="timeline-title">{session.title}</div>

                            <div className="timeline-summary">
                              {session.summary}
                            </div>

                            <div className="timeline-meta">
                              <span>
                                • Responsable cliente:{" "}
                                <strong>
                                  {session.client_responsible || "Sin asignar"}
                                </strong>
                              </span>

                              <span>
                                • Estado cliente:{" "}
                                <strong className="status-pill">
                                  {formatClientStatus(session.client_status)}
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

export default Dashboard;
