import { useState, useEffect } from "react";
import { supabase } from "./supabaseClient";
import Dashboard from "./Dashboard";
import Login from "./Login";

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

  if (loading) {
    return <div style={{ color: "white", padding: 40 }}>Cargando…</div>;
  }

  // 👉 CLIENT MODE (más adelante)
  if (clientMode) {
    return <Dashboard clientMode token={clientToken} />;
  }

  // 👉 SIN SESIÓN → LOGIN
  if (!session) {
    return <Login />;
  }

  // 👉 CON SESIÓN → DASHBOARD INTERNO
  return <Dashboard />;
}

export default App;
