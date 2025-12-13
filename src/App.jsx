import { useState, useEffect } from "react";
import { GoogleOAuthProvider } from "@react-oauth/google";
import { supabase } from "./supabaseClient";
import Login from "./Login";
import Dashboard from "./Dashboard";
import NotesImporter from "./NotesImporter";

function App() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentView, setCurrentView] = useState("dashboard"); // dashboard, importer

  /* -------------------------------------------------------------
     VERIFICAR SESIÓN AL CARGAR
  ------------------------------------------------------------- */
  useEffect(() => {
    // Obtener sesión actual
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    // Escuchar cambios de autenticación
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  /* -------------------------------------------------------------
     CERRAR SESIÓN
  ------------------------------------------------------------- */
  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setSession(null);
  };

  /* -------------------------------------------------------------
     LOADING
  ------------------------------------------------------------- */
  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0c] flex items-center justify-center">
        <div className="text-white text-xl">Cargando...</div>
      </div>
    );
  }

  /* -------------------------------------------------------------
     SI NO HAY SESIÓN → MOSTRAR LOGIN
  ------------------------------------------------------------- */
  if (!session) {
    return (
      <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID}>
        <div className="min-h-screen bg-[#0a0a0c]">
          <Login />
        </div>
      </GoogleOAuthProvider>
    );
  }

  /* -------------------------------------------------------------
     SI HAY SESIÓN → MOSTRAR DASHBOARD O IMPORTER
  ------------------------------------------------------------- */
  return (
    <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID}>
      <div>
        {/* Barra de navegación (opcional) */}
        <nav style={{
          background: "#1a1a1c",
          padding: "12px 24px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          borderBottom: "1px solid #2a2a2c"
        }}>
          <div style={{ display: "flex", gap: "16px" }}>
            <button
              onClick={() => setCurrentView("dashboard")}
              style={{
                background: currentView === "dashboard" ? "#667eea" : "transparent",
                color: "white",
                border: "none",
                padding: "8px 16px",
                borderRadius: "6px",
                cursor: "pointer",
                fontSize: "14px",
                fontWeight: "500"
              }}
            >
              📊 Dashboard
            </button>
            <button
              onClick={() => setCurrentView("importer")}
              style={{
                background: currentView === "importer" ? "#667eea" : "transparent",
                color: "white",
                border: "none",
                padding: "8px 16px",
                borderRadius: "6px",
                cursor: "pointer",
                fontSize: "14px",
                fontWeight: "500"
              }}
            >
              📥 Importar Notas
            </button>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
            <span style={{ color: "#94a3b8", fontSize: "14px" }}>
              {session.user.email}
            </span>
            <button
              onClick={handleSignOut}
              style={{
                background: "#ef4444",
                color: "white",
                border: "none",
                padding: "8px 16px",
                borderRadius: "6px",
                cursor: "pointer",
                fontSize: "14px",
                fontWeight: "500"
              }}
            >
              Cerrar sesión
            </button>
          </div>
        </nav>

        {/* Contenido principal */}
        {currentView === "dashboard" ? <Dashboard /> : <NotesImporter />}
      </div>
    </GoogleOAuthProvider>
  );
}

export default App;