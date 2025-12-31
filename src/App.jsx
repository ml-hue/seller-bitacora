import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useSearchParams } from 'react-router-dom';
import { supabase } from './supabaseClient';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import Footer from './components/Footer';

// Componente wrapper para detectar el token
function DashboardWrapper() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  
  // Si hay token, modo cliente. Si no, verificar sesión
  if (token) {
    return <Dashboard clientMode={true} token={token} />;
  }
  
  // Modo interno - verificar autenticación
  return <ProtectedDashboard />;
}

// Componente para proteger el dashboard interno
function ProtectedDashboard() {
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
    return <div style={{ 
      minHeight: '100vh', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center',
      background: '#0A0E27',
      color: 'white'
    }}>Cargando...</div>;
  }

  if (!session) {
    return <Navigate to="/login" replace />;
  }

  return <Dashboard clientMode={false} token={null} />;
}

function App() {
  return (
    <BrowserRouter>
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<DashboardWrapper />} />
        </Routes>
        <Footer />
      </div>
    </BrowserRouter>
  );
}

export default App;
