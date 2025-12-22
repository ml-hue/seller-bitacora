import { useState, useEffect, useMemo, useCallback } from "react";
import logoSeller from "./assets/logo-seller.png"; 
import { supabase as sb } from "./supabaseClient";
import { getSupabasePublic } from "./supabaseClientPublic";
import NotesImporter from "./NotesImporter";
import "./index.css";

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
        setClientInfo({ client_name: project.client_name || "" });
        setSelectedProject(project.name);
        if (project.id) {
          setSelectedProjectId(project.id);
        }
        setSessions(rpcSessions.map((s) => ({ ...s, date: s.date ? s.date : null })));
        setProjectPhase(phase);
        setManualPhase(phase);
        const nextSessionData = data.next_session || null;
        if (nextSessionData) {
          setNextSession({
            date: nextSessionData.session_date || "",
            topic1: nextSessionData.topic_1 || "",
            topic2: nextSessionData.topic_2 || "",
            topic3: nextSessionData.topic_3 || "",
          });
        }
        setClientLoaded(true);
        setClientLoading(false);
      } catch (err) {
        console.error("Error cliente (RPC):", err);
        setClientError("Error validando acceso.");
        setClientLoading(false);
      }
    };
    loadClient();
  }, [clientMode, token, db]);

  useEffect(() => {
    if (clientMode) return;
    let sub = null;
    const initAuth = async () => {
      try {
        const { data: { user } } = await sb.auth.getUser();
        if (user) {
          setAuthUser(user);
          return;
        }
        const keys = Object.keys(localStorage).filter((k) => k.startsWith('sb-') && k.endsWith('-auth-token'));
        const key = keys[0];
        if (key) {
          try {
            const tokenObj = JSON.parse(localStorage.getItem(key));
            const fallbackUser = tokenObj?.currentSession?.user || tokenObj?.user || null;
            if (fallbackUser) {
              setAuthUser(fallbackUser);
              return;
            }
          } catch (err) {
            console.warn('AUTH fallback parse error', err);
          }
        }
        setAuthUser(null);
      } catch (err) {
        console.warn('Error al obtener usuario supabase:', err);
        setAuthUser(null);
      }
      const { data: { subscription } } = sb.auth.onAuthStateChange((_event, session) => {
        setAuthUser(session?.user || null);
      });
      sub = subscription;
    };
    initAuth();
    return () => {
      if (sub && sub.unsubscribe) sub.unsubscribe();
    };
  }, [clientMode]);

  const getPhaseStatus = (phaseId) => {
    if (!projectPhase) return "pending";
    if (phaseId < projectPhase) return "done";
    if (phaseId === projectPhase) return "current";
    return "upcoming";
  };

  const getPhaseStatusLabel = (status) => {
    switch (status) {
      case "done": return "Completada";
      case "current": return "En curso";
      case "upcoming": return "Próxima fase";
      default: return "Pendiente";
    }
  };

  const formatClientStatus = (s) =>
    s === "realizado" ? "Realizado" : s === "postergado" ? "Postergado" : "No realizado";

  const handleLogout = async () => {
    try {
      setUserMenuOpen(false);
      await sb.auth.signOut();
    } catch (err) {
      console.error("Error cerrando sesión:", err);
    } finally {
      window.location.href = "/";
    }
  };

  const saveManualPhase = async () => {
    if (!manualPhase || !selectedProject) return;
    try {
      setSavingPhase(true);
      setPhaseError(null);
      const { error } = await sb.from("project_phase").update({ current_phase: manualPhase }).eq("project_name", selectedProject);
      if (error) throw error;
      setProjectPhase(manualPhase);
    } catch (err) {
      console.error(err);
      setPhaseError("No se pudo guardar la fase.");
    } finally {
      setSavingPhase(false);
    }
  };

  const validateSession = (s) => {
    if (!s.title || s.title.trim().length < 3) return false;
    if (!s.summary || s.summary.trim().length < 10) return false;
    if (!s.date) return false;
    return true;
  };

  const handleCreateSession = async () => {
  if (clientMode) return;
  if (!selectedProjectId) return;
  if (!validateSession(draft)) {
    setSaveError("Completá correctamente los campos.");
    return;
  }
  try {
    setSavingSession(true);
    setSaveError(null);
    const { data, error } = await sb.from("sessions").insert([{
      project_id: selectedProjectId,
      title: draft.title.trim(),
      date: draft.date,
      tag: draft.tag,
      summary: draft.summary.trim(),
      client_responsible: draft.clientResponsible || null,
      client_status: draft.clientStatus,
    }]).select().single();
    if (error) throw error;
    setSessions((prev) => [data, ...prev]);
    setActiveSessionId(data.id);
    setDraft({
      title: "",
      date: new Date().toISOString().slice(0, 10),
      tag: "Sesión",
      summary: "",
      clientResponsible: "",
      clientStatus: "postergado",
    });
  } catch (err) {
    console.error(err);
    setSaveError("Error guardando sesión.");
  } finally {
    setSavingSession(false);
  }
}; // ← Cierre de handleCreateSession

const handleSaveNextSession = async () => {
  if (!selectedProjectId) return;

  try {
    setSavingNextSession(true);

    const { error } = await sb
      .from("next_session")
      .upsert({
        project_id: selectedProjectId,
        session_date: nextSession.date || null,
        topic_1: nextSession.topic1 || null,
        topic_2: nextSession.topic2 || null,
        topic_3: nextSession.topic3 || null,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'project_id'
      });

    if (error) throw error;

    alert("✅ Próxima sesión guardada correctamente");
  } catch (err) {
    console.error(err);
    alert("❌ Error guardando próxima sesión");
  } finally {
    setSavingNextSession(false);
  }
};
  const handleSharePublicView = async () => {
    if (!selectedProject) return;
    try {
      const newToken = crypto?.randomUUID ? crypto.randomUUID() : (Math.random().toString(36).slice(2) + Date.now().toString(36));
      const project = projects.find((p) => p.name === selectedProject);
      const expires = new Date();
      expires.setDate(expires.getDate() + 7);
      const { error } = await sb.from("client_tokens").insert([{
        token: newToken,
        project_name: selectedProject,
        client_name: project?.client_name || "",
        active: true,
        expires_at: expires.toISOString(),
      }]);
      if (error) {
        alert("No se pudo generar el enlace público.");
        return;
      }
      const url = `${window.location.origin}/?token=${newToken}`;
      try {
        await navigator.clipboard.writeText(url);
        alert("Link copiado:\n" + url);
      } catch (err) {
        prompt("Copia este enlace:", url);
      }
    } catch (err) {
      alert("Ocurrió un error generando el enlace público.");
    }
  };

  const handleProjectChange = (name) => {
    const p = projects.find((x) => x.name === name);
    if (p) {
      setSelectedProject(p.name);
      setSelectedProjectId(p.id);
    }
  };

  const avatarUrl = authUser?.user_metadata?.avatar_url || authUser?.user_metadata?.picture || null;
  const initials = (() => {
    const email = authUser?.email || "";
    if (!email) return "";
    const namePart = email.split("@")[0];
    const parts = namePart.split(/[\.\-_]/).filter(Boolean);
    const letters = parts.length ? parts.map((p) => p[0]).slice(0, 2).join("") : namePart.slice(0, 2);
    return letters.toUpperCase();
  })();

  if (showImporter) {
    return (
      <div className="importer-screen">
        <header className="topbar">
          <button className="primary-button" onClick={() => setShowImporter(false)}>← Volver</button>
        </header>
        <main style={{ padding: 16 }}><NotesImporter /></main>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      {!clientMode && (
        <header className="topbar">
          <div className="topbar-left">
            {/* Logo */}
            <img
              src={logoSeller}
              alt="Seller Consulting"
              className="topbar-logo-img"
            />
            {/* Selector de proyecto */}
            <select
              className="project-selector"
              value={selectedProject || ""}
              onChange={(e) => handleProjectChange(e.target.value)}
            >
              {projects.map((p) => (
                <option key={p.id} value={p.name}>{p.name}</option>
              ))}
            </select>
          </div>
          <div className="topbar-right">
            <button className="secondary-button" onClick={() => setShowImporter(true)}>📝 Importar notas</button>
            <button className="secondary-button" onClick={handleSharePublicView}>🔗 Compartir con cliente</button>
            <div className="user-menu-container">
              <button className="user-avatar-button" onClick={() => setUserMenuOpen(!userMenuOpen)}>
                {avatarUrl ? (<img src={avatarUrl} alt="Avatar" className="user-avatar-img" />) : (<div className="user-avatar-initials">{initials || "?"}</div>)}
              </button>
              {userMenuOpen && (
                <div className="user-dropdown">
                  <div className="user-dropdown-header"><div className="user-dropdown-email">{authUser?.email || "Usuario"}</div></div>
                  <button className="user-dropdown-item" onClick={handleLogout}>Cerrar sesión</button>
                </div>
              )}
            </div>
          </div>
        </header>
      )}
      <main className="layout">
        {!clientMode && (
          <section className="column column-left">
            <div className="card card-new-note">
              <div className="card-header">
                <div><div className="card-overline">NUEVA NOTA DE SESIÓN</div><div className="card-subtitle">Acuerdos, próximos pasos y decisiones.</div></div>
                <span className="badge-interno">Interno Seller</span>
              </div>
              <div className="card-body">
                {saveError && <div className="error-message">{saveError}</div>}
                <input className="field-input" placeholder="Título" value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} />
                <div className="field-row">
                  <div className="field-group"><label htmlFor="session-date">Fecha</label><input id="session-date" type="date" className="field-input" value={draft.date} onChange={(e) => setDraft({ ...draft, date: e.target.value })} /></div>
                  <div className="field-group"><label htmlFor="session-tag">Etiqueta</label><input id="session-tag" className="field-input" value={draft.tag} onChange={(e) => setDraft({ ...draft, tag: e.target.value })} /></div>
                </div>
                <div className="field-row">
                  <div className="field-group"><label htmlFor="client-responsible">Responsable cliente</label><input id="client-responsible" className="field-input" value={draft.clientResponsible} onChange={(e) => setDraft({ ...draft, clientResponsible: e.target.value })} /></div>
                  <div className="field-group"><label htmlFor="client-status">Estado cliente</label><select id="client-status" className="field-input" value={draft.clientStatus} onChange={(e) => setDraft({ ...draft, clientStatus: e.target.value })}><option value="realizado">Realizado</option><option value="postergado">Postergado</option><option value="no_realizado">No realizado</option></select></div>
                </div>
                <textarea className="field-textarea" rows={3} placeholder="Resumen..." value={draft.summary} onChange={(e) => setDraft({ ...draft, summary: e.target.value })} />
                <button className="primary-button" onClick={handleCreateSession} disabled={savingSession}>{savingSession ? "Guardando..." : "+ Guardar nota"}</button>
              </div>
            </div>
            <div className="card card-notes-list">
              <div className="card-header card-header--small"><div className="card-overline">NOTAS DE SESIÓN</div><div className="card-counter">{projectSessions.length} entradas</div></div>
              {sessionsLoading ? (<div className="notes-loading">Cargando sesiones...</div>) : sessionsError ? (<div className="notes-error">{sessionsError}</div>) : (
                <div className="notes-list">
                  {projectSessions.map((s) => (
                    <div key={s.id} className={`note-item ${s.id === activeSessionId ? "note-item--active" : ""}`} onClick={() => setActiveSessionId(s.id)} role="button" tabIndex={0}>
                      <div className="note-item-top">
                        <div className="note-title">{s.title}</div>
                        <div className="note-date">{new Date(s.date).toLocaleDateString("es-PY", { day: "2-digit", month: "short" })}</div>
                      </div>
                      <div className="note-tags"><span className="tag">{s.tag}</span><span className="tag tag--status">{formatClientStatus(s.client_status)}</span></div>
                      <div className="note-summary">{s.summary}</div>
                    </div>
                  ))}
                </div>
              )}
              {activeSession && !sessionsLoading && (<div className="notes-footer">Última sesión seleccionada: <strong>{activeSession.title}</strong></div>)}
            </div>
          </section>
        )}
        <section className="column column-right">
          <div className="card card-project-summary">
            <div className="summary-header">
              <div><div className="card-overline">{clientMode ? "RESUMEN DEL PROYECTO" : "VISTA DEL PROYECTO"}</div><h1 className="project-title">Bitácora de {selectedProject || "..."}</h1><p className="project-description">{clientMode ? "Aquí verás los principales hitos, acuerdos y avances del proyecto." : "Resumen ejecutivo del avance del proyecto para cliente."}</p></div>
              <div className="summary-metrics"><div className="metric-card"><div className="metric-label">Última actualización</div><div className="metric-value">{new Date().toLocaleDateString("es-PY")}</div></div><div className="metric-card metric-card--green"><div className="metric-label">Sesiones registradas</div><div className="metric-value">{projectSessions.length}</div></div></div>
            </div>
            {/* PRÓXIMA SESIÓN */}
            <div className="card card-next-session">
  <div className="card-header">
    <div>
      <div className="card-overline">PRÓXIMA SESIÓN</div>
      <div className="card-subtitle">
        {clientMode 
          ? "Temas programados para el próximo encuentro." 
          : "Planificá los temas a tratar en el próximo encuentro."}
      </div>
    </div>
    {!clientMode && (
      <span className="badge-interno">Interno Seller</span>
    )}
  </div>

  <div className="card-body">
    {clientMode ? (
      // VISTA CLIENTE (solo lectura)
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
      // VISTA INTERNA (editable)
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
        </section>
      </main>
    </div>
  );
}

export default Dashboard;