import { useEffect, useState } from "react";
import { supabase } from "./supabaseClient";
import Login from "./Login";
import Dashboard from "./Dashboard";

function App() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  const urlParams = new URLSearchParams(window.location.search);
  const clientToken = urlParams.get('token');

  useEffect(() => {
    if (clientToken) {
      setLoading(false);
      return;
    }

    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
      }
    );

    return () => listener.subscription.unsubscribe();
  }, [clientToken]);

  if (loading) {
    return <div style={{ color: "white", padding: 40 }}>Cargando…</div>;
  }

  if (clientToken) {
    return <Dashboard clientMode={true} token={clientToken} />;
  }

  if (!session) {
    return <Login />;
  }

  return <Dashboard clientMode={false} token={null} />;
}

export default App;