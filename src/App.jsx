import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { supabase } from './supabaseClient';  // ← Corregido
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import Footer from './components/Footer';

function App() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

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

  if (loading) {
    return <div>Cargando...</div>;
  }

  return (
    <BrowserRouter>
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
        <Routes>
          <Route
            path="/login"
            element={!session ? <Login /> : <Navigate to="/login" replace />}
          />
          <Route
            path="/"
            element={
              session ? (
                <Dashboard clientMode={false} token={null} />
              ) : (
                <Navigate to="/login" replace />
              )
            }
          />
        </Routes>
        <Footer />
      </div>
    </BrowserRouter>
  );
}

export default App;