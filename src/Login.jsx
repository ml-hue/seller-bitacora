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

      console.log("LOGIN OK:", credentialResponse);

      // Autenticar con Supabase usando el token de Google
      const { data, error } = await supabase.auth.signInWithIdToken({
        provider: 'google',
        token: credentialResponse.credential,
      });

      if (error) throw error;

      console.log("Supabase auth success:", data);
      
      // El App.jsx detectará automáticamente la sesión
      // No hace falta redirigir manualmente

    } catch (err) {
      console.error("Error en login:", err);
      setError("No pudimos iniciar sesión. Intentá de nuevo.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleError = () => {
    console.log("LOGIN ERROR");
    setError("Hubo un problema con Google. Intentá de nuevo.");
  };

  return (
    <div className="min-h-screen bg-[#020617] flex items-center justify-center px-4">
      {/* CARD CONTENEDOR */}
      <div className="relative w-full max-w-md bg-white/[0.04] backdrop-blur-xl p-8 rounded-3xl shadow-2xl border border-white/10">
        {/* Glow Superior */}
        <div className="absolute -top-10 left-1/2 -translate-x-1/2 w-40 h-40 bg-emerald-400 blur-[90px] opacity-50"></div>

        {/* Logo Seller */}
        <div className="flex justify-center mb-6">
          <img
            src="/logo-seller.svg"
            alt="Seller Consulting"
            className="w-20 h-20 object-contain drop-shadow-lg"
          />
        </div>

        {/* Welcome Text */}
        <h2 className="text-white text-3xl font-semibold text-center">
          Welcome back
        </h2>
        <p className="text-gray-400 text-center text-sm mt-1">
          Sign in to your account
        </p>

        {/* SEPARADOR */}
        <div className="h-6" />

        {/* Error Message */}
        {error && (
          <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
            <p className="text-red-400 text-sm text-center">{error}</p>
          </div>
        )}

        {/* Loading State */}
        {loading ? (
          <div className="flex justify-center items-center py-6">
            <div className="w-8 h-8 border-4 border-emerald-400 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : (
          /* Botón Google */
          <GoogleLogin
            onSuccess={handleGoogleLogin}
            onError={handleGoogleError}
            width="330"
            theme="outline"
            size="large"
            shape="pill"
            text="continue_with"
            useOneTap={false}
          />
        )}

        {/* Footer */}
        <p className="text-gray-500 text-center text-xs mt-6">
          Don't have an account?{" "}
          <span className="text-emerald-400 cursor-pointer">Sign up</span>
        </p>
      </div>
    </div>
  );
}