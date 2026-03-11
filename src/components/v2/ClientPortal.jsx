import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Calendar, Lock, ExternalLink } from 'lucide-react';
import { supabase } from '../../supabaseClient';

/**
 * Portal Público del Cliente
 * URL: /shared/:token
 */
const ClientPortal = () => {
  const { token } = useParams();
  const [project, setProject] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchProject();
  }, [token]);

  const fetchProject = async () => {
    try {
      // Verificar token y obtener proyecto
      const { data: projectData, error: projectError } = await supabase
        .from('proyectos')
        .select('*')
        .eq('share_token', token)
        .eq('share_enabled', true)
        .single();

      if (projectError) throw new Error('Proyecto no encontrado o acceso revocado');

      setProject(projectData);

      // Obtener sesiones del proyecto
      const { data: sessionsData, error: sessionsError } = await supabase
        .from('sesiones')
        .select('*')
        .eq('proyecto_id', projectData.id)
        .order('fecha', { ascending: false });

      if (sessionsError) throw sessionsError;

      setSessions(sessionsData || []);
      setLoading(false);
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  const getFaseLabel = (faseId) => {
    const fases = {
      1: { nombre: 'Diagnóstico', emoji: '🔍', color: 'blue' },
      2: { nombre: 'Plan Estratégico', emoji: '📋', color: 'purple' },
      3: { nombre: 'Implementación', emoji: '⚙️', color: 'orange' },
      4: { nombre: 'Seguimiento & Control', emoji: '📊', color: 'green' }
    };
    return fases[faseId] || fases[1];
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando proyecto...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-8">
          <Lock className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Acceso Denegado</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <p className="text-sm text-gray-500">
            Si crees que esto es un error, contacta con tu consultor de Seller Group.
          </p>
        </div>
      </div>
    );
  }

  const agendadas = sessions.filter(s => s.etiqueta === 'Agendada');
  const completadas = sessions.filter(s => s.etiqueta !== 'Agendada');

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center gap-4">
            {project.logo_url ? (
              <img
                src={project.logo_url}
                alt={project.nombre}
                className="w-16 h-16 rounded-lg object-cover"
              />
            ) : (
              <div
                className="w-16 h-16 rounded-lg flex items-center justify-center text-white text-2xl font-bold"
                style={{ backgroundColor: project.color_tema || '#3b82f6' }}
              >
                {project.nombre.charAt(0).toUpperCase()}
              </div>
            )}
            
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-gray-900">{project.nombre}</h1>
              <p className="text-gray-600">{project.descripcion}</p>
            </div>

            <div className="text-right">
             <img src={logoSeller} alt="Seller Group" className="h-10 ..." />
              />
              <p className="text-xs text-gray-500">Portal del Cliente</p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
            <h3 className="text-sm font-medium text-gray-600 mb-2">Sesiones Realizadas</h3>
            <p className="text-3xl font-bold text-gray-900">{completadas.length}</p>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
            <h3 className="text-sm font-medium text-gray-600 mb-2">Próximas Sesiones</h3>
            <p className="text-3xl font-bold text-blue-600">{agendadas.length}</p>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
            <h3 className="text-sm font-medium text-gray-600 mb-2">Estado</h3>
            <span className="inline-block px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-700">
              Activo
            </span>
          </div>
        </div>

        {/* Próximas Sesiones */}
        {agendadas.length > 0 && (
          <div className="mb-8">
            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              📅 Próximas Sesiones
            </h2>
            <div className="space-y-4">
              {agendadas.map(session => (
                <div key={session.id} className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
                  <div className="flex items-start justify-between mb-3">
                    <h3 className="text-lg font-semibold text-gray-900">{session.titulo}</h3>
                    <span className="text-sm text-gray-600">
                      {new Date(session.fecha).toLocaleDateString('es-ES', { 
                        day: 'numeric', 
                        month: 'long', 
                        year: 'numeric' 
                      })}
                    </span>
                  </div>
                  <div className="prose prose-sm max-w-none">
                    <pre className="whitespace-pre-wrap text-gray-700 font-sans">
                      {session.contenido}
                    </pre>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Historial de Sesiones */}
        <div>
          <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            📚 Historial de Sesiones
          </h2>
          
          {completadas.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
              <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-600">Aún no hay sesiones completadas</p>
            </div>
          ) : (
            <div className="space-y-4">
              {completadas.map(session => {
                const fase = getFaseLabel(session.fase_id);
                return (
                  <div key={session.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-1">
                          {session.titulo}
                        </h3>
                        <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium bg-${fase.color}-100 text-${fase.color}-700`}>
                          {fase.emoji} {fase.nombre}
                        </span>
                      </div>
                      <span className="text-sm text-gray-600">
                        {new Date(session.fecha).toLocaleDateString('es-ES', { 
                          day: 'numeric', 
                          month: 'long', 
                          year: 'numeric' 
                        })}
                      </span>
                    </div>
                    
                    {session.responsable_cliente && (
                      <p className="text-sm text-gray-600 mb-2">
                        <span className="font-medium">Participante:</span> {session.responsable_cliente}
                      </p>
                    )}
                    
                    <div className="mt-4 prose prose-sm max-w-none">
                      <pre className="whitespace-pre-wrap text-gray-700 font-sans">
                        {session.contenido}
                      </pre>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-12">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 text-center">
          <p className="text-sm text-gray-600">
            Desarrollado por <span className="font-semibold text-gray-900">Seller Group E.A.S.</span> © 2026
          </p>
          <p className="text-xs text-gray-500 mt-1">
            Portal seguro para clientes • Datos protegidos
          </p>
        </div>
      </footer>
    </div>
  );
};

export default ClientPortal;
