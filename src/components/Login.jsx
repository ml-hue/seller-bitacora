import { supabase } from "../supabaseClient";

export default function Login() {
  const handleGoogleLogin = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin,
        },
      });
      
      if (error) {
        console.error('Error en login:', error);
        alert('Error al iniciar sesión: ' + error.message);
      }
    } catch (err) {
      console.error('Error inesperado:', err);
      alert('Error inesperado al iniciar sesión');
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: '#0A0E27',
      position: 'relative',
      overflow: 'hidden',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
    }}>
      {/* Background animado */}
      <div style={{
        position: 'fixed',
        width: '100%',
        height: '100%',
        top: 0,
        left: 0,
        zIndex: 0,
        background: `
          radial-gradient(circle at 20% 30%, rgba(30, 64, 255, 0.15) 0%, transparent 50%),
          radial-gradient(circle at 80% 70%, rgba(0, 217, 255, 0.12) 0%, transparent 50%),
          radial-gradient(circle at 50% 50%, rgba(30, 64, 255, 0.05) 0%, transparent 70%)
        `,
      }} />

      {/* Formas flotantes */}
      <div style={{
        position: 'absolute',
        width: '300px',
        height: '300px',
        background: 'linear-gradient(135deg, #1E40FF, #00D9FF)',
        borderRadius: '50%',
        filter: 'blur(60px)',
        opacity: 0.3,
        top: '10%',
        left: '10%',
        animation: 'float 20s infinite ease-in-out',
      }} />
      
      <div style={{
        position: 'absolute',
        width: '200px',
        height: '200px',
        background: 'linear-gradient(135deg, #00D9FF, #1E40FF)',
        borderRadius: '50%',
        filter: 'blur(60px)',
        opacity: 0.3,
        bottom: '15%',
        right: '15%',
        animation: 'float 20s infinite ease-in-out 5s',
      }} />

      {/* Card principal */}
      <div style={{
        position: 'relative',
        zIndex: 1,
        background: 'rgba(255, 255, 255, 0.03)',
        backdropFilter: 'blur(20px) saturate(180%)',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        borderRadius: '24px',
        padding: '48px 40px',
        textAlign: 'center',
        maxWidth: '480px',
        width: '100%',
        margin: '20px',
        boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
        transition: 'all 0.3s ease',
      }}>
        {/* Logo y título */}
        <div style={{ marginBottom: '32px' }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '12px',
            fontSize: '32px',
            fontWeight: '700',
            color: '#FFFFFF',
            marginBottom: '8px',
          }}>
            <div style={{
              width: '56px',
              height: '56px',
              background: 'linear-gradient(135deg, #1E40FF, #4169FF)',
              borderRadius: '16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '32px',
              fontWeight: '800',
              color: 'white',
              flexShrink: 0,
              boxShadow: '0 4px 12px rgba(30, 64, 255, 0.3)',
            }}>
              S
            </div>
            <span>Seller Bitácora</span>
          </div>
          
          <p style={{ 
            color: '#94A3B8', 
            fontSize: '15px',
            marginTop: '8px',
          }}>
            Inicia sesión para acceder al dashboard
          </p>
        </div>

        {/* Botón de Google */}
        <button
          onClick={handleGoogleLogin}
          style={{
            width: '100%',
            padding: '16px 24px',
            background: 'white',
            color: '#1F2937',
            border: 'none',
            borderRadius: '12px',
            fontSize: '16px',
            fontWeight: '600',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '12px',
            transition: 'all 0.3s ease',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
            marginBottom: '32px',
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.transform = 'translateY(-2px)';
            e.currentTarget.style.boxShadow = '0 6px 20px rgba(0, 0, 0, 0.15)';
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.1)';
          }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          Continuar con Google
        </button>

        {/* Badge de seguridad */}
        <div style={{
          textAlign: 'center',
          marginTop: '32px',
          paddingTop: '24px',
          borderTop: '1px solid rgba(255, 255, 255, 0.08)',
        }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            padding: '8px 16px',
            background: 'rgba(30, 64, 255, 0.1)',
            border: '1px solid rgba(30, 64, 255, 0.3)',
            borderRadius: '20px',
            color: '#00D9FF',
            fontSize: '13px',
            fontWeight: '500',
          }}>
            🔒 Solo usuarios autorizados
          </div>
        </div>
      </div>

      {/* Footer */}
      <div style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        padding: '20px',
        textAlign: 'center',
        color: 'rgba(255, 255, 255, 0.4)',
        fontSize: '13px',
        zIndex: 2,
        background: 'linear-gradient(to top, rgba(10, 14, 39, 0.8), transparent)',
        backdropFilter: 'blur(10px)',
      }}>
        Propiedad de Seller Group E.A.S. - Todos los derechos reservados.
      </div>

      {/* CSS para animaciones */}
      <style>{`
        @keyframes float {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(30px, -30px) scale(1.1); }
          66% { transform: translate(-30px, 30px) scale(0.9); }
        }
      `}</style>
    </div>
  );
}