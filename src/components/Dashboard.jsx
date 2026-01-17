import { useState, useEffect, useMemo, useCallback } from "react";
import logoSeller from "../assets/logo-seller.png";
import { supabase as sb } from "../supabaseClient";
import { getSupabasePublic } from "../supabaseClientPublic";
import NotesImporter from "../NotesImporter";
import BitacoraFinanzas from "./BitacoraFinanzas";
import "../index.css";

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

function Dashboard({ clientMode = false, token = null }) {
  const db = clientMode ? getSupabasePublic() : sb;

  // Nuevo estado para tabs
  const [activeTab, setActiveTab] = useState('bitacora'); // 'bitacora' o 'finanzas'

  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState(null);
  const [selectedProjectId, setSelectedProjectId] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [sessionsLoading, setSessionsLoading] = useState(true);
  const [sessionsError, setSessionsError] = useState(null);
  const [activeSessionId, setActiveSessionId] = useState(null);
  const [projectPhase, setProjectPhase] = useState(null);
  const [manualPhase, setManualPhase] = useState(null);
  const [phaseLoading, setPhaseLoading] = useState(true);
  const [savingPhase, setSavingPhase] = useState(false);
  const [phaseError, setPhaseError] = useState(null);
  const [clientInfo, setClientInfo] = useState(null);
  const [clientLoading, setClientLoading] = useState(clientMode);
  const [clientError, setClientError] = useState(null);
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
  const [showImporter, setShowImporter] = useState(false);
  const [authUser, setAuthUser] = useState(null);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [clientLoaded, setClientLoaded] = useState(false);
  const [nextSession, setNextSession] = useState({
    date: "",
    topic1: "",
    topic2: "",
    topic3: "",
  });
  const [savingNextSession, setSavingNextSession] = useState(false);

  const projectSessions = useMemo(() => {
    return [...sessions].sort((a, b) => (a.date < b.date ? 1 : -1));
  }, [sessions]);

  const activeSession = useMemo(() => {
    return sessions.find((s) => s.id === activeSessionId) || null;
  }, [sessions, activeSessionId]);

  const loadProjects = useCallback(async () => {
    try {
      const { data, error } = await sb.from("projects").select("id, name, client_name").order("name");
      if (error) {
        console.error("Error cargando proyectos:", error);
        return;
      }
      setProjects(data || []);
      if (data?.length && !selectedProject) {
        setSelectedProject(data[0].name);
        setSelectedProjectId(data[0].id);
      }
    } catch (err) {
      console.error("Error loadProjects:", err);
    }
  }, [selectedProject]);

  const loadSessions = useCallback(async (projectId) => {
    if (!projectId) return;
    setSessionsLoading(true);
    setSessionsError(null);
    try {
      const { data, error } = await db.from("sessions").select("*").eq("project_id", projectId).order("date", { ascending: false });
      if (error) {
        console.error("Error cargando sesiones:", error);
        setSessionsError("Error cargando sesiones");
      } else {
        setSessions(data || []);
        setActiveSessionId(data?.[0]?.id || null);
      }
    } catch (err) {
      console.error("loadSessions err:", err);
      setSessionsError("Error cargando sesiones");
    } finally {
      setSessionsLoading(false);
    }
  }, [db]);

  const loadPhase = useCallback(async (projectName) => {
    if (!projectName) return;
    setPhaseLoading(true);
    setPhaseError(null);
    try {
      const { data, error } = await db.from("project_phase").select("current_phase").eq("project_name", projectName).maybeSingle();
      if (error) {
        console.error("Error loadPhase:", error);
        setPhaseError("Error cargando fase");
        setProjectPhase(1);
        setManualPhase(1);
      } else {
        const phase = data?.current_phase ?? 1;
        setProjectPhase(phase);
        setManualPhase(phase);
      }
    } catch (err) {
      console.error("loadPhase catch:", err);
      setPhaseError("Error cargando fase");
    } finally {
      setPhaseLoading(false);
    }
  }, [db]);

  const loadNextSession = useCallback(async (projectId) => {
    if (!projectId) return;

    try {
      const { data, error } = await db
        .from("next_session")
        .select("*")
        .eq("project_id", projectId)
        .maybeSingle();

      if (!error && data) {
        setNextSession({
          date: data.session_date || "",
          topic1: data.topic_1 || "",
          topic2: data.topic_2 || "",
          topic3: data.topic_3 || "",
        });
      }
    } catch (err) {
      console.error("Error cargando próxima sesión:", err);
    }
  }, [db]);

  useEffect(() => {
    if (!clientMode) loadProjects();
  }, [clientMode, loadProjects]);

  useEffect(() => {
    setUserMenuOpen(false);
  }, [selectedProject]);

  useEffect(() => {
    if (clientMode || clientLoaded) return;
    if (selectedProjectId && selectedProject) {
      loadSessions(selectedProjectId);
      loadPhase(selectedProject);
      loadNextSession(selectedProjectId);
    }
  }, [selectedProjectId, selectedProject, loadSessions, loadPhase, loadNextSession, clientMode, clientLoaded]);

  useEffect(() => {
    if (!clientMode || !token) return;
    const loadClient = async () => {
      try {
        setClientLoading(true);
        setClientError(null);
        const { data, error } = await db.rpc("get_project_for_token", { p_token: token });
        if (error || !data) {
          setClientError("El enlace no es válido o expiró.");
          setClientLoading(false);
          return;
        }
        const project = data.project || null;
        const rpcSessions = Array.isArray(data.sessions) ? data.sessions : [];
        const phase = data.phase?.current_phase ?? 1;
        if (!project || !project.name) {
          setClientError("El enlace no es válido o expiró.");
          setClientLoading(false);
          return;
        }
        setClientInfo(project);
        setSessions(rpcSessions);
        setSelectedProject(project.name);
        setSelectedProjectId(project.id);
        setActiveSessionId(rpcSessions[0]?.id || null);
        setProjectPhase(phase);
        setClientLoading(false);
        setClientLoaded(true);
      } catch (err) {
        console.error("Error loadClient:", err);
        setClientError("Hubo un error al cargar el proyecto.");
        setClientLoading(false);
      }
    };
    loadClient();
  }, [clientMode, token, db]);

  useEffect(() => {
    if (clientMode) return;
    const getAuth = async () => {
      const { data, error } = await sb.auth.getSession();
      if (!error && data?.session) {
        setAuthUser(data.session.user);
      }
    };
    getAuth();
    const { data: listener } = sb.auth.onAuthStateChange((_event, session) => {
      if (session) setAuthUser(session.user);
      else setAuthUser(null);
    });
    return () => listener?.subscription?.unsubscribe?.();
  }, [clientMode]);

  const getPhaseStatus = (phaseId) => {
    if (!projectPhase) return "pending";
    if (phaseId < projectPhase) return "completed";
    if (phaseId === projectPhase) return "current";
    return "pending";
  };

  const getPhaseStatusLabel = (status) => {
    if (status === "completed") return "Completada";
    if (status === "current") return "En progreso";
    return "Pendiente";
  };

  const formatClientStatus = (status) => {
    if (status === "realizado") return "Realizado";
    if (status === "postergado") return "Postergado";
    return status;
  };

  const saveSession = async () => {
    if (!draft.title?.trim()) {
      setSaveError("El título es obligatorio.");
      return;
    }
    if (!draft.summary?.trim()) {
      setSaveError("El resumen es obligatorio.");
      return;
    }
    setSavingSession(true);
    setSaveError(null);
    try {
      const { error } = await sb.from("sessions").insert({
        project_id: selectedProjectId,
        title: draft.title,
        date: draft.date,
        tag: draft.tag,
        summary: draft.summary,
        client_responsible: draft.clientResponsible || null,
        client_status: draft.clientStatus,
      });
      if (error) {
        console.error("Error guardando sesión:", error);
        setSaveError("No se pudo guardar la nota de sesión.");
      } else {
        setDraft({ title: "", date: new Date().toISOString().slice(0, 10), tag: "Sesión", summary: "", clientResponsible: "", clientStatus: "postergado" });
        loadSessions(selectedProjectId);
      }
    } catch (err) {
      console.error("Error saveSession:", err);
      setSaveError("No se pudo guardar la nota de sesión.");
    } finally {
      setSavingSession(false);
    }
  };

  const saveManualPhase = async () => {
    if (!manualPhase || !selectedProject) return;
    setSavingPhase(true);
    setPhaseError(null);
    try {
      const { error } = await sb.from("project_phase").upsert({ project_name: selectedProject, current_phase: manualPhase }, { onConflict: "project_name" });
      if (error) {
        console.error("Error saveManualPhase:", error);
        setPhaseError("No se pudo guardar la fase.");
      } else {
        setProjectPhase(manualPhase);
      }
    } catch (err) {
      console.error("saveManualPhase catch:", err);
      setPhaseError("No se pudo guardar la fase.");
    } finally {
      setSavingPhase(false);
    }
  };

  const handleLogout = async () => {
    if (clientMode) return;
    setUserMenuOpen(false);
    await sb.auth.signOut();
    window.location.reload();
  };

  const handleSaveNextSession = async () => {
    if (!selectedProjectId) return;
    setSavingNextSession(true);
    try {
      const { error } = await sb.from("next_session").upsert({
        project_id: selectedProjectId,
        session_date: nextSession.date || null,
        topic_1: nextSession.topic1 || null,
        topic_2: nextSession.topic2 || null,
        topic_3: nextSession.topic3 || null,
      }, { onConflict: "project_id" });

      if (error) {
        console.error("Error guardando próxima sesión:", error);
        alert("No se pudo guardar la próxima sesión.");
      }
    } catch (err) {
      console.error("Error handleSaveNextSession:", err);
      alert("Error al guardar próxima sesión.");
    } finally {
      setSavingNextSession(false);
    }
  };

  return (
    <div className="app-wrapper">
      <header className="app-header">
        <div className="header-left">
          <img src={logoSeller} alt="Logo" className="app-logo" />
          {!clientMode && projects.length > 0 && (
            <select 
              className="project-selector" 
              value={selectedProject || ""} 
              onChange={(e) => {
                const val = e.target.value;
                setSelectedProject(val);
                const proj = projects.find((p) => p.name === val);
                if (proj) setSelectedProjectId(proj.id);
              }}
            >
              {projects.map((p) => <option key={p.id} value={p.name}>{p.name}</option>)}
            </select>
          )}
          {clientMode && clientInfo && <div className="client-project-name">{clientInfo.name}</div>}
        </div>

        <div className="header-right">
          {/* Tabs de navegación - SOLO VISIBLE PARA ADMINS */}
          {!clientMode && (
            <div className="dashboard-tabs">
              <button 
                className={`dashboard-tab ${activeTab === 'bitacora' ? 'active' : ''}`}
                onClick={() => setActiveTab('bitacora')}
              >
                📋 Bitácora
              </button>
              <button 
                className={`dashboard-tab ${activeTab === 'finanzas' ? 'active' : ''}`}
                onClick={() => setActiveTab('finanzas')}
              >
                💰 Finanzas
              </button>
            </div>
          )}

          {!clientMode && (
            <>
              <button className="header-button" onClick={() => setShowImporter(!showImporter)}>📥 Importar notas</button>
              <button className="header-button" onClick={() => window.open(`${window.location.origin}/client/${selectedProjectId}`, "_blank")}>🔗 Compartir con cliente</button>
              <div className="user-menu-container">
                <button className="user-menu-button" onClick={() => setUserMenuOpen(!userMenuOpen)}>
                  <div className="user-avatar">{authUser?.email?.[0]?.toUpperCase() || "U"}</div>
                  <span className="user-email-label">{authUser?.email || "Usuario"}</span>
                </button>
                {userMenuOpen && (
                  <div className="user-menu-dropdown">
                    <button className="user-menu-item" onClick={handleLogout}>Cerrar sesión</button>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </header>

      {showImporter && <NotesImporter projectId={selectedProjectId} onClose={() => setShowImporter(false)} onImport={() => loadSessions(selectedProjectId)} />}

      <main className="main-content">
        {/* Renderizar Bitácora o Finanzas según el tab activo */}
        {activeTab === 'finanzas' && !clientMode ? (
          <BitacoraFinanzas />
        ) : (
          <section className="dashboard-layout">
            {/* Todo el contenido original de Bitácora */}
            <aside className="sidebar">
              <div className="card card-new-note">
                <div className="card-header">
                  <div><div className="card-overline">NUEVA NOTA DE SESIÓN</div><h2 className="card-title">Acuerdos, próximos pasos y decisiones.</h2></div>
                  {!clientMode && <span className="badge-interno">Interno Seller</span>}
                </div>
                <div className="card-body">
                  <div className="field-group">
                    <label htmlFor="title" className="field-label">Título</label>
                    <input id="title" type="text" className="field-input" placeholder="Reunión de planificación Q1" value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} />
                  </div>
                  <div className="field-row">
                    <div className="field-group">
                      <label htmlFor="date" className="field-label">Fecha</label>
                      <input id="date" type="date" className="field-input" value={draft.date} onChange={(e) => setDraft({ ...draft, date: e.target.value })} />
                    </div>
                    <div className="field-group">
                      <label htmlFor="tag" className="field-label">Etiqueta</label>
                      <select id="tag" className="field-input" value={draft.tag} onChange={(e) => setDraft({ ...draft, tag: e.target.value })}>
                        <option value="Sesión">Sesión</option>
                        <option value="Realizado">Realizado</option>
                      </select>
                    </div>
                  </div>
                  <div className="field-group">
                    <label htmlFor="summary" className="field-label">Resumen...</label>
                    <textarea id="summary" className="field-input field-textarea" rows="6" placeholder="Resumen de lo discutido en la sesión..." value={draft.summary} onChange={(e) => setDraft({ ...draft, summary: e.target.value })} />
                  </div>
                  <div className="field-group">
                    <label htmlFor="clientResponsible" className="field-label">Responsable cliente</label>
                    <input id="clientResponsible" type="text" className="field-input" placeholder="Nombre del responsable" value={draft.clientResponsible} onChange={(e) => setDraft({ ...draft, clientResponsible: e.target.value })} />
                  </div>
                  <div className="field-group">
                    <label htmlFor="clientStatus" className="field-label">Estado cliente</label>
                    <select id="clientStatus" className="field-input" value={draft.clientStatus} onChange={(e) => setDraft({ ...draft, clientStatus: e.target.value })}>
                      <option value="realizado">Realizado</option>
                      <option value="postergado">Postergado</option>
                    </select>
                  </div>
                  {saveError && <div className="error-message" role="alert">{saveError}</div>}
                  <button className="primary-button" disabled={savingSession} onClick={saveSession}>{savingSession ? "Guardando..." : "+ Guardar nota"}</button>
                </div>
              </div>
            </aside>

            <div className="main-cards">
              <div className="card card-next-session">
                <div className="card-header">
                  <div>
                    <div className="card-overline">PRÓXIMA SESIÓN</div>
                    <h2 className="card-title">
                      {clientMode 
                        ? "Temas programados para el próximo encuentro." 
                        : "Planificá los temas a tratar en el próximo encuentro."}
                    </h2>
                  </div>
                  {!clientMode && (
                    <span className="badge-interno">Interno Seller</span>
                  )}
                </div>

                <div className="card-body">
                  {clientMode ? (
                    <>
                      {nextSession.date && (
                        <div className="next-session-info">
                          <div className="next-session-date-display">
                            📅 {new Date(nextSession.date).toLocaleDateString("es-PY", {
                              weekday: "long",
                              day: "numeric",
                              month: "long",
                              year: "numeric"
                            })}
                          </div>
                        </div>
                      )}

                      {(nextSession.topic1 || nextSession.topic2 || nextSession.topic3) && (
                        <div className="next-session-topics-display">
                          <div className="field-label">Temas a tratar:</div>
                          {nextSession.topic1 && (
                            <div className="topic-display-item">
                              <span className="topic-number">1.</span>
                              <span className="topic-text">{nextSession.topic1}</span>
                            </div>
                          )}
                          {nextSession.topic2 && (
                            <div className="topic-display-item">
                              <span className="topic-number">2.</span>
                              <span className="topic-text">{nextSession.topic2}</span>
                            </div>
                          )}
                          {nextSession.topic3 && (
                            <div className="topic-display-item">
                              <span className="topic-number">3.</span>
                              <span className="topic-text">{nextSession.topic3}</span>
                            </div>
                          )}
                        </div>
                      )}

                      {!nextSession.date && !nextSession.topic1 && (
                        <div className="next-session-empty">
                          No hay una próxima sesión programada aún.
                        </div>
                      )}
                    </>
                  ) : (
                    <>
                      <div className="field-group">
                        <label htmlFor="next-session-date" className="field-label">Fecha programada</label>
                        <input 
                          id="next-session-date"
                          type="date" 
                          className="field-input"
                          value={nextSession.date}
                          onChange={(e) => setNextSession({ ...nextSession, date: e.target.value })}
                        />
                      </div>

                      <div className="field-group" style={{ marginTop: '16px' }}>
                        <label className="field-label">Temas a tratar</label>
                        <div className="next-session-topics">
                          <div className="topic-item">
                            <span className="topic-number">1.</span>
                            <input 
                              type="text" 
                              className="field-input" 
                              placeholder="Primer tema a discutir..."
                              value={nextSession.topic1}
                              onChange={(e) => setNextSession({ ...nextSession, topic1: e.target.value })}
                            />
                          </div>
                          <div className="topic-item">
                            <span className="topic-number">2.</span>
                            <input 
                              type="text" 
                              className="field-input" 
                              placeholder="Segundo tema a discutir..."
                              value={nextSession.topic2}
                              onChange={(e) => setNextSession({ ...nextSession, topic2: e.target.value })}
                            />
                          </div>
                          <div className="topic-item">
                            <span className="topic-number">3.</span>
                            <input 
                              type="text" 
                              className="field-input" 
                              placeholder="Tercer tema a discutir..."
                              value={nextSession.topic3}
                              onChange={(e) => setNextSession({ ...nextSession, topic3: e.target.value })}
                            />
                          </div>
                        </div>
                      </div>

                      <button 
                        className="primary-button" 
                        style={{ marginTop: '16px' }}
                        onClick={handleSaveNextSession}
                        disabled={savingNextSession}
                      >
                        {savingNextSession ? "Guardando..." : "Guardar próxima sesión"}
                      </button>
                    </>
                  )}
                </div>
              </div>

              <div className="card card-phase-roadmap card-phase-roadmap--curved">
                <div className="phase-header phase-header--curved">
                  <div><div className="card-overline">AVANCE DEL PROYECTO</div><h2 className="phase-title">Fase actual: <span>{PHASES.find((p) => p.id === projectPhase)?.label || "Configurando..."}</span></h2><p className="phase-subtitle">Visualizá en qué etapa se encuentra tu proyecto.</p></div>
                  <div className="phase-meta"><div className="phase-pill">{phaseLoading ? "Cargando..." : (<><span className="phase-pill-number">{projectPhase ?? "-"}</span><span className="phase-pill-text">de {PHASES.length} fases</span></>)}</div></div>
                </div>
                {!clientMode && (
                  <div className="manual-phase-control">
                    <h3 className="manual-phase-title">Control manual de fase</h3>
                    <p className="manual-phase-description">Seleccioná la fase actual del proyecto. Esto actualiza el roadmap del cliente.</p>
                    {phaseError && <div className="error-message" role="alert">{phaseError}</div>}
                    <div className="manual-phase-grid">
                      {PHASES.map((p) => (<div key={p.id} className={`manual-phase-card ${manualPhase === p.id ? "selected" : ""}`} onClick={() => setManualPhase(p.id)} role="button" tabIndex={0}><div className="manual-phase-number">{p.id}</div><div className="manual-phase-label">{p.label}</div></div>))}
                    </div>
                    <button className="manual-phase-save" disabled={!manualPhase || savingPhase} onClick={saveManualPhase}>{savingPhase ? "Guardando..." : "Guardar fase actual"}</button>
                  </div>
                )}
                <div className="phase-curve-wrapper">
                  <svg viewBox="0 0 960 220" className="phase-curve-svg"><path className="phase-curve-path" d="M40 180 C 180 120, 260 80, 360 110 S 560 200, 720 150 S 880 80, 920 110" fill="none" />
                    {PHASE_MARKERS.map((marker) => {
                      const status = getPhaseStatus(marker.id);
                      const phase = PHASES.find((p) => p.id === marker.id);
                      return (<g key={marker.id} className={`phase-marker phase-marker--${status}`}><circle cx={marker.x} cy={marker.y} r="20" className="phase-marker-ring" /><circle cx={marker.x} cy={marker.y} r="9" className="phase-marker-dot" /><text x={marker.x} y={marker.y + 4} textAnchor="middle" className="phase-marker-index">{marker.id}</text><text x={marker.x} y={marker.y - 26} textAnchor="middle" className="phase-marker-label">{phase.label}</text></g>);
                    })}
                  </svg>
                </div>
                <div className="phase-legend">
                  {PHASES.map((phase) => {
                    const status = getPhaseStatus(phase.id);
                    return (<div key={phase.id} className={`phase-legend-item phase-legend-item--${status}`}><div className="phase-legend-pill"><span className="phase-legend-index">{phase.id.toString().padStart(2, "0")}</span><span className="phase-legend-title">{phase.label}</span></div><span className="phase-legend-status">{getPhaseStatusLabel(status)}</span></div>);
                  })}
                </div>
              </div>
              <div className="card card-timeline">
                {clientMode && clientLoading && <div className="timeline-empty">Validando tu acceso como cliente...</div>}
                {clientMode && !clientLoading && clientError && (<div className="timeline-empty" role="alert">{clientError}<br /><br /><small>Si el problema persiste, escribinos a <strong>ml@seller.consulting</strong>.</small></div>)}
                {(!clientMode || (!clientLoading && !clientError)) && (<>{sessionsLoading ? (<div className="timeline-empty">Cargando bitácora...</div>) : projectSessions.length === 0 ? (<div className="timeline-empty">Todavía no hay eventos en la bitácora.</div>) : (
                  <ol className="timeline">
                    {projectSessions.map((session, index) => (
                      <li key={session.id} className="timeline-item">
                        <div className="timeline-point" />
                        <div className="timeline-content">
                          <div className="timeline-header">
                            <div className="timeline-date">{new Date(session.date).toLocaleDateString("es-PY", { weekday: "short", day: "2-digit", month: "short", year: "numeric" })}</div>
                            <div className="timeline-badges"><span className="timeline-badge">Sesión #{projectSessions.length - index}</span><span className="timeline-badge timeline-badge--blue">{session.tag}</span></div>
                          </div>
                          <div className="timeline-card">
                            <div className="timeline-title">{session.title}</div>
                            <div className="timeline-summary">{session.summary}</div>
                            <div className="timeline-meta"><span>• Responsable cliente: <strong>{session.client_responsible || "Sin asignar"}</strong></span><span>• Estado cliente: <strong className="status-pill">{formatClientStatus(session.client_status)}</strong></span></div>
                          </div>
                        </div>
                      </li>
                    ))}
                  </ol>
                )}</>)}
              </div>
            </div>
          </section>
        )}
      </main>
    </div>
  );
}

export default Dashboard;
