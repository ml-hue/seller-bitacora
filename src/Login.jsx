import { useState } from "react";
import { GoogleLogin } from "@react-oauth/google";
import { supabase } from "./supabaseClient";

export default function Login() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleGoogleLogin = async (credentialResponse) => {
    try {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase.auth.signInWithIdToken({
        provider: 'google',
        token: credentialResponse.credential,
      });

      if (error) throw error;

    } catch (err) {
      console.error("Error en login:", err);
      setError("No pudimos iniciar sesión. Intentá de nuevo.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%)',
      padding: '20px'
    }}>
      {/* Animated Background Effects */}
      <div style={{
        position: 'fixed',
        inset: 0,
        overflow: 'hidden',
        pointerEvents: 'none'
      }}>
        <div style={{
          position: 'absolute',
          width: '500px',
          height: '500px',
          top: '-10%',
          left: '-5%',
          background: 'radial-gradient(circle, rgba(56, 189, 248, 0.15), transparent 70%)',
          borderRadius: '50%',
          filter: 'blur(60px)'
        }} />
        <div style={{
          position: 'absolute',
          width: '400px',
          height: '400px',
          bottom: '-10%',
          right: '-5%',
          background: 'radial-gradient(circle, rgba(168, 85, 247, 0.15), transparent 70%)',
          borderRadius: '50%',
          filter: 'blur(60px)'
        }} />
      </div>

      {/* Login Container */}
      <div style={{
        position: 'relative',
        zIndex: 10,
        width: '100%',
        maxWidth: '400px'
      }}>
        {/* Logo */}
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          marginBottom: '24px'
        }}>
          <div style={{
            width: '80px',
            height: '80px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #38bdf8, #a78bfa)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 10px 40px rgba(56, 189, 248, 0.3)'
          }}>
            <span style={{
              color: 'white',
              fontSize: '40px',
              fontWeight: 'bold'
            }}>S</span>
          </div>
        </div>

        {/* Title */}
        <h1 style={{
          color: 'white',
          fontSize: '36px',
          fontWeight: 'bold',
          textAlign: 'center',
          marginBottom: '32px'
        }}>
          Welcome to Seller
        </h1>

        {/* Login Card */}
        <div style={{
          background: 'rgba(30, 41, 59, 0.8)',
          backdropFilter: 'blur(20px)',
          borderRadius: '16px',
          padding: '32px',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.4)'
        }}>
          {error && (
            <div style={{
              background: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              borderRadius: '8px',
              padding: '12px',
              marginBottom: '20px',
              textAlign: 'center'
            }}>
              <p style={{ color: '#f87171', fontSize: '14px', margin: 0 }}>{error}</p>
            </div>
          )}

          {loading ? (
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              padding: '40px 0'
            }}>
              <div style={{
                width: '40px',
                height: '40px',
                border: '3px solid rgba(100, 116, 139, 0.3)',
                borderTop: '3px solid #38bdf8',
                borderRadius: '50%',
                animation: 'spin 1s linear infinite'
              }} />
              <p style={{ color: '#94a3b8', marginTop: '16px', fontSize: '14px' }}>
                Iniciando sesión...
              </p>
            </div>
          ) : (
            <>
              <GoogleLogin
                onSuccess={handleGoogleLogin}
                onError={() => setError("Error al iniciar sesión con Google")}
                width="100%"
                theme="filled_black"
                size="large"
                text="continue_with"
              />

              <div style={{
                display: 'flex',
                alignItems: 'center',
                margin: '24px 0',
                gap: '12px'
              }}>
                <div style={{ flex: 1, height: '1px', background: 'rgba(255, 255, 255, 0.1)' }} />
                <span style={{ color: '#64748b', fontSize: '14px' }}>o</span>
                <div style={{ flex: 1, height: '1px', background: 'rgba(255, 255, 255, 0.1)' }} />
              </div>

              <button disabled style={{
                width: '100%',
                padding: '12px',
                background: 'rgba(30, 41, 59, 0.5)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '8px',
                color: '#64748b',
                fontSize: '14px',
                cursor: 'not-allowed',
                opacity: 0.6
              }}>
                Email (Próximamente)
              </button>

              <p style={{
                color: '#94a3b8',
                fontSize: '14px',
                textAlign: 'center',
                marginTop: '20px'
              }}>
                ¿No tenés cuenta?{' '}
                <span style={{ color: '#38bdf8', fontWeight: '600', cursor: 'pointer' }}>
                  Solicitar acceso
                </span>
              </p>
            </>
          )}
        </div>

        {/* Footer */}
        <div style={{
          marginTop: '32px',
          textAlign: 'center'
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            gap: '16px',
            fontSize: '12px',
            color: '#64748b',
            marginBottom: '12px'
          }}>
            <a href="#" style={{ color: '#64748b', textDecoration: 'none' }}>Términos</a>
            <span>·</span>
            <a href="#" style={{ color: '#64748b', textDecoration: 'none' }}>Privacidad</a>
            <span>·</span>
            <a href="#" style={{ color: '#64748b', textDecoration: 'none' }}>Ayuda</a>
          </div>
          <p style={{ color: '#475569', fontSize: '12px', margin: 0 }}>
            © 2025 Seller Consulting
          </p>
        </div>
      </div>

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}