import { useState, useEffect } from "react";
import { GoogleOAuthProvider } from "@react-oauth/google";
import { supabase } from "./supabaseClient";
import Login from "./Login";
import Dashboard from "./Dashboard";
import NotesImporter from "./NotesImporter";

const hasClientToken = new URLSearchParams(window.location.search).has("token");

function App() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentView, setCurrentView] = useState("dashboard");

  /* -------------------------------------------------------------
     VERIFICAR SESIÓN AL CARGAR
  ------------------------------------------------------------- */
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

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
     SIN SESIÓN Y SIN TOKEN → LOGIN
  ------------------------------------------------------------- */
  if (!session && !hasClientToken) {
    return (
      <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID}>
        <Login />
      </GoogleOAuthProvider>
    );
  }

  /* -------------------------------------------------------------
     DASHBOARD / IMPORTER
  ------------------------------------------------------------- */
  return (
    <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID}>
      <div>
        {!hasClientToken && (
          <nav
            style={{
              background: "#1a1a1c",
              padding: "12px 24px",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              borderBottom: "1px solid #2a2a2c",
            }}
          >
            <div style={{ display: "flex", gap: "16px" }}>
              <button onClick={() => setCurrentView("dashboard")}>
                📊 Dashboard
              </button>
              <button onClick={() => setCurrentView("importer")}>
                📥 Importar Notas
              </button>
            </div>

            {session && (
              <div style={{ display: "flex", gap: "16px", color: "white" }}>
                <span>{session.user.email}</span>
                <button onClick={handleSignOut}>Cerrar sesión</button>
              </div>
            )}
          </nav>
        )}

        {currentView === "dashboard" ? <Dashboard /> : <NotesImporter />}
      </div>
    </GoogleOAuthProvider>
  );
}

export default App;
