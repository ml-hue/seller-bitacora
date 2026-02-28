import { useState } from "react";
import { supabase } from "../supabaseClient"; // ajusta la ruta si es diferente
import logo from "../assets/logo_principal.png";

export default function Login() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError(null);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: window.location.origin,
        },
      });
      if (error) {
        console.error("Error en login:", error);
        setError("Error al iniciar sesión: " + error.message);
        setLoading(false);
      }
    } catch (err) {
      console.error("Error inesperado:", err);
      setError("Error inesperado al iniciar sesión.");
      setLoading(false);
    }
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@300;400;600;700;800&display=swap');

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        .login-page {
          display: grid;
          grid-template-columns: 1fr 1fr;
          height: 100vh;
          width: 100vw;
          font-family: 'Sora', sans-serif;
          overflow: hidden;
        }

        /* ── LEFT ── */
        .login-left {
          position: relative;
          background: linear-gradient(145deg, #0f2d6b 0%, #1a4fba 45%, #0d3ba8 70%, #0a2472 100%);
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          padding: 3rem 3.5rem;
          overflow: hidden;
          animation: slideInLeft 0.7s cubic-bezier(0.22,1,0.36,1) both;
        }

        .grid-lines {
          position: absolute; inset: 0;
          background-image:
            linear-gradient(rgba(255,255,255,0.04) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.04) 1px, transparent 1px);
          background-size: 50px 50px;
        }

        .wave {
          position: absolute; left: -10%; right: -10%;
          border-radius: 40%; opacity: 0.18;
          animation: drift linear infinite;
        }
        .wave-1 { width:120%; height:55%; bottom:-8%;  background:#1d6fd8; animation-duration:14s; }
        .wave-2 { width:130%; height:50%; bottom:-14%; background:#0b4fc4; animation-duration:18s; animation-direction:reverse; }
        .wave-3 { width:140%; height:40%; bottom:-20%; background:#083caa; animation-duration:22s; }

        .circle {
          position: absolute; border-radius: 50%;
          border: 1.5px solid rgba(255,255,255,0.15);
          animation: float ease-in-out infinite alternate;
        }
        .c1 { width:80px;  height:80px;  top:12%; right:10%; animation-duration:6s; }
        .c2 { width:14px;  height:14px;  top:35%; right:22%; background:rgba(255,255,255,0.25); border:none; animation-duration:4s; }
        .c3 { width:50px;  height:50px;  top:55%; left:8%;   animation-duration:7s; }
        .c4 { width:10px;  height:10px;  bottom:30%; right:15%; background:rgba(96,165,250,0.5); border:none; animation-duration:5s; }
        .c5 { width:28px;  height:28px;  bottom:18%; left:20%; border-color:rgba(96,165,250,0.3); animation-duration:8s; }

        .brand {
          position: relative; z-index: 2;
          display: flex; align-items: center; gap: 0.75rem;
        }
        .brand img {
          width: 44px; height: 44px;
          border-radius: 12px; object-fit: contain;
        }
        .brand span {
          color: white; font-size: 1rem; font-weight: 600; letter-spacing: 0.01em;
        }

        .hero {
          position: relative; z-index: 2;
          flex: 1; display: flex; flex-direction: column; justify-content: center; padding-bottom: 2rem;
        }
        .hero-sub {
          color: rgba(255,255,255,0.7); font-size: 0.95rem; font-weight: 300;
          letter-spacing: 0.08em; text-transform: uppercase; margin-bottom: 0.75rem;
        }
        .hero-title {
          color: white; font-size: clamp(1.8rem, 3vw, 2.8rem);
          font-weight: 800; line-height: 1.1; letter-spacing: -0.02em; margin-bottom: 1.25rem;
        }
        .hero-divider {
          width: 40px; height: 3px; background: white; border-radius: 2px; margin-bottom: 1.5rem;
        }
        .hero-desc {
          color: rgba(255,255,255,0.55); font-size: 0.875rem;
          line-height: 1.7; max-width: 30ch; font-weight: 300;
        }

        .left-footer {
          position: relative; z-index: 2;
          color: rgba(255,255,255,0.35); font-size: 0.78rem;
        }

        /* ── RIGHT ── */
        .login-right {
          background: #f8faff;
          display: flex; flex-direction: column;
          align-items: center; justify-content: center;
          padding: 3rem 4rem; position: relative;
          animation: slideInRight 0.7s cubic-bezier(0.22,1,0.36,1) 0.15s both;
        }
        .login-right::before {
          content: ''; position: absolute; inset: 0;
          background: radial-gradient(circle at 80% 20%, rgba(37,99,235,0.04) 0%, transparent 60%);
          pointer-events: none;
        }

        .form-wrap {
          width: 100%; max-width: 380px; position: relative; z-index: 1;
          animation: fadeUp 0.5s ease 0.35s both;
        }

        .form-heading {
          font-size: 1.75rem; font-weight: 700; color: #0f172a;
          letter-spacing: -0.03em; margin-bottom: 0.5rem;
        }
        .form-sub {
          color: #94a3b8; font-size: 0.875rem; font-weight: 300;
          margin-bottom: 2.5rem; line-height: 1.6;
        }

        .btn {
          width: 100%; padding: 0.9rem 1.5rem; border-radius: 10px;
          font-family: 'Sora', sans-serif; font-size: 0.9rem; font-weight: 600;
          cursor: pointer; letter-spacing: 0.03em; border: none;
          transition: all 0.2s ease;
          display: flex; align-items: center; justify-content: center; gap: 0.75rem;
        }
        .btn:disabled { opacity: 0.6; cursor: not-allowed; transform: none !important; }

        .btn-google {
          background: white; color: #1e293b;
          border: 1.5px solid #e2e8f0;
          box-shadow: 0 2px 8px rgba(0,0,0,0.05);
          margin-bottom: 1.5rem;
        }
        .btn-google:hover:not(:disabled) {
          border-color: #94a3b8;
          box-shadow: 0 4px 16px rgba(0,0,0,0.1);
          transform: translateY(-1px);
        }

        .google-icon { width: 20px; height: 20px; flex-shrink: 0; }

        .error-msg {
          background: #fef2f2; border: 1px solid #fecaca;
          color: #dc2626; font-size: 0.82rem; border-radius: 8px;
          padding: 0.75rem 1rem; margin-bottom: 1rem;
        }

        .badge {
          display: inline-flex; align-items: center; gap: 0.4rem;
          margin-top: 1.5rem; padding: 0.5rem 1rem; border-radius: 100px;
          background: rgba(37,99,235,0.08); color: #2563eb;
          font-size: 0.78rem; font-weight: 600; letter-spacing: 0.04em;
          border: 1px solid rgba(37,99,235,0.15);
        }

        .right-footer {
          position: absolute; bottom: 1.5rem;
          color: #94a3b8; font-size: 0.75rem; text-align: center;
        }

        /* Animations */
        @keyframes slideInLeft  { from { opacity:0; transform:translateX(-30px); } to { opacity:1; transform:translateX(0); } }
        @keyframes slideInRight { from { opacity:0; transform:translateX(30px);  } to { opacity:1; transform:translateX(0); } }
        @keyframes fadeUp       { from { opacity:0; transform:translateY(16px);  } to { opacity:1; transform:translateY(0); } }
        @keyframes drift        { from { transform:rotate(0deg); } to { transform:rotate(360deg); } }
        @keyframes float        { from { transform:translateY(0); } to { transform:translateY(-16px); } }
      `}</style>

      <div className="login-page">

        {/* LEFT */}
        <div className="login-left">
          <div className="grid-lines" />
          <div className="wave wave-1" />
          <div className="wave wave-2" />
          <div className="wave wave-3" />
          <div className="circle c1" />
          <div className="circle c2" />
          <div className="circle c3" />
          <div className="circle c4" />
          <div className="circle c5" />

          <div className="brand">
            <img src={logo} alt="Seller Consulting" />
            <span>Seller Consulting</span>
          </div>

          <div className="hero">
            <p className="hero-sub">Portal de Proyectos</p>
            <h1 className="hero-title">BIENVENIDOS A<br />SELLER BITÁCORA SW</h1>
            <div className="hero-divider" />
            <p className="hero-desc">
              Accede a la información completa de tu proyecto con los contenidos
              de cada sesión y la agenda para la próxima.
            </p>
          </div>

          <p className="left-footer">Propiedad de Seller Group E.A.S. — Todos los derechos reservados.</p>
        </div>

        {/* RIGHT */}
        <div className="login-right">
          <div className="form-wrap">
            <h2 className="form-heading">Iniciar sesión</h2>
            <p className="form-sub">Ingresa tus credenciales para acceder.</p>

            {error && <div className="error-msg">⚠️ {error}</div>}

            <button
              className="btn btn-google"
              onClick={handleGoogleLogin}
              disabled={loading}
            >
              <svg className="google-icon" viewBox="0 0 48 48">
                <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
                <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
                <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
                <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.18 1.48-4.97 2.31-8.16 2.31-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
              </svg>
              {loading ? "Redirigiendo..." : "Continuar con Google"}
            </button>

            <div style={{ textAlign: "center" }}>
              <span className="badge">🔒 Solo usuarios autorizados</span>
            </div>
          </div>

          <p className="right-footer">Propiedad de Seller Group E.A.S. — Todos los derechos reservados.</p>
        </div>

      </div>
    </>
  );
}
