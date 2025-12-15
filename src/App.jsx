import { useState, useEffect } from "react";
import { supabase } from "./supabaseClient";
import Dashboard from "./Dashboard";

const hasClientToken = new URLSearchParams(window.location.search).has("token");
const clientToken = new URLSearchParams(window.location.search).get("token");
const clientMode = Boolean(clientToken);

function App() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  // ⏳ Loading
  if (loading) {
    return (
      <div style={{ color: "white", padding: 40 }}>
        Cargando aplicación…
      </div>
    );
  }

  // 👤 CLIENT MODE (SIN LOGIN)
  if (clientMode) {
    return <Dashboard clientMode token={clientToken} />;
  }

  // 🔐 INTERNAL MODE (requiere login)
  if (!session) {
    return (
      <div style={{ color: "white", padding: 40 }}>
        No hay sesión activa
      </div>
    );
  }

  return <Dashboard />;
}

export default App;
