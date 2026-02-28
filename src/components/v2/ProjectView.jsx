import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Calendar, TrendingUp, Share2 } from 'lucide-react';
import { useProjects } from '../../hooks/useProjects';
import { supabase } from '../../supabaseClient';
import SessionCard from './SessionCard';
import AddSessionModal from './AddSessionModal';
import AgendarSiguienteSesionModal from './AgendarSiguienteSesionModal';
import ShareProjectModal from './ShareProjectModal';

/**
 * Vista de Proyecto - Muestra sesiones con resúmenes ejecutivos
 */
const ProjectView = () => {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const { getProjectById } = useProjects();
  
  const [project, setProject] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showAgendarModal, setShowAgendarModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [activeTab, setActiveTab] = useState('timeline');

  // ==================== FETCH PROJECT DATA ====================
  
  React.useEffect(() => {
    const fetchProject = async () => {
      setLoading(true);
      const { data } = await getProjectById(projectId);
      if (data) {
        setProject(data);
      }
      setLoading(false);
    };
    
    fetchProject();
  }, [projectId]);

  // ==================== FETCH SESSIONS ====================
  
  React.useEffect(() => {
    const fetchSessions = async () => {
      if (!projectId) return;
      
      try {
        console.log('📥 Cargando sesiones para proyecto:', projectId);
        
        const { data, error } = await supabase
          .from('sesiones')
          .select('*')
          .eq('proyecto_id', projectId)
          .order('fecha', { ascending: false });

        if (error) {
          console.error('❌ Error al cargar sesiones:', error);
          throw error;
        }

        console.log('✅ Sesiones cargadas:', data?.length || 0);
        setSessions(data || []);
        
      } catch (error) {
        console.error('Error fetching sessions:', error);
      }
    };
    
    fetchSessions();
  }, [projectId]);

  // ==================== HANDLER PARA ACTUALIZAR SESIÓN ====================
  
  const handleUpdateSession = (updatedSession) => {
    setSessions(prevSessions => 
      prevSessions.map(session => 
        session.id === updatedSession.id ? updatedSession : session
      )
    );
  };

  // ==================== LOADING STATE ====================
  
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

  if (!project) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 mb-4">Proyecto no encontrado</p>
          <button
            onClick={() => navigate('/dashboard')}
            className="text-blue-500 hover:text-blue-600"
          >
            Volver al dashboard
          </button>
        </div>
      </div>
    );
  }

  // ==================== RENDER ====================
  
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            {/* Back button + Project info */}
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate('/dashboard')}
                className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Dashboard</span>
              </button>

              <div className="flex items-center gap-3">
                {project.logo_url ? (
                  <img
                    src={project.logo_url}
                    alt={project.nombre}
                    className="w-10 h-10 rounded-lg object-cover"
                  />
                ) : (
                  <div
                    className="w-10 h-10 rounded-lg flex items-center justify-center text-white text-xl font-bold"
                    style={{ backgroundColor: project.color_tema || '#3b82f6' }}
                  >
                    {project.nombre.charAt(0).toUpperCase()}
                  </div>
                )}
                
                <div>
                  <h1 className="text-xl font-bold text-gray-900">{project.nombre}</h1>
                  <p className="text-sm text-gray-500">
                    {sessions.length} sesiones
                    {project.ultima_sesion_fecha && ` · Última: ${new Date(project.ultima_sesion_fecha).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })}`}
                  </p>
                </div>
              </div>
            </div>

            {/* Botones de acción */}
            <div className="flex gap-3">
              {/* Botón Compartir con Cliente */}
              <button
                onClick={() => setShowShareModal(true)}
                className="flex items-center gap-2 px-4 py-2 border-2 border-green-500 text-green-500 rounded-lg hover:bg-green-50 transition-colors shadow-sm"
                title="Compartir proyecto con cliente"
              >
                <Share2 className="w-5 h-5" />
                <span className="hidden sm:inline">Compartir</span>
              </button>

              {/* Botón Agendar Siguiente */}
              <button
                onClick={() => setShowAgendarModal(true)}
                className="flex items-center gap-2 px-4 py-2 border-2 border-blue-500 text-blue-500 rounded-lg hover:bg-blue-50 transition-colors shadow-sm"
              >
                <Calendar className="w-5 h-5" />
                <span className="hidden sm:inline">Agendar Siguiente</span>
                <span className="sm:hidden">Agendar</span>
              </button>

              {/* Botón Nueva Sesión */}
              <button
                onClick={() => setShowAddModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-[#2563eb] text-white rounded-lg hover:bg-[#1d4ed8] transition-colors shadow-sm"
              >
                <Plus className="w-5 h-5" />
                <span>Nueva Sesión</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
            <div className="flex items-center gap-3 mb-2">
              <Calendar className="w-5 h-5 text-gray-400" />
              <h3 className="text-sm font-medium text-gray-600">Total Sesiones</h3>
            </div>
            <p className="text-3xl font-bold text-gray-900">{sessions.length}</p>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
            <div className="flex items-center gap-3 mb-2">
              <TrendingUp className="w-5 h-5 text-gray-400" />
              <h3 className="text-sm font-medium text-gray-600">Fase Actual</h3>
            </div>
            <p className="text-xl font-semibold text-gray-900">
              {project.sesiones_diagnostico > 0 && 'Diagnóstico'}
              {project.sesiones_plan > 0 && 'Plan Estratégico'}
              {project.sesiones_implementacion > 0 && 'Implementación'}
              {project.sesiones_seguimiento > 0 && 'Seguimiento'}
              {sessions.length === 0 && 'Sin sesiones'}
            </p>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-5 h-5 text-gray-400">📊</div>
              <h3 className="text-sm font-medium text-gray-600">Estado</h3>
            </div>
            <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
              project.estado === 'activo' ? 'bg-green-100 text-green-700' :
              project.estado === 'pausado' ? 'bg-yellow-100 text-yellow-700' :
              'bg-gray-100 text-gray-700'
            }`}>
              {project.estado}
            </span>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-4 mb-6 border-b border-gray-200">
          <button
            onClick={() => setActiveTab('timeline')}
            className={`pb-3 px-4 font-medium transition-colors ${
              activeTab === 'timeline'
                ? 'text-[#2563eb] border-b-2 border-[#2563eb]'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Timeline
          </button>
          <button
            onClick={() => setActiveTab('temas')}
            className={`pb-3 px-4 font-medium transition-colors ${
              activeTab === 'temas'
                ? 'text-[#2563eb] border-b-2 border-[#2563eb]'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Por Tema
          </button>
          <button
            onClick={() => setActiveTab('fases')}
            className={`pb-3 px-4 font-medium transition-colors ${
              activeTab === 'fases'
                ? 'text-[#2563eb] border-b-2 border-[#2563eb]'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Por Fase
          </button>
        </div>

        {/* Sessions list */}
        {sessions.length === 0 ? (
          <div className="text-center py-16">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-[#dbeafe] rounded-full mb-4">
              <Calendar className="w-8 h-8 text-[#2563eb]" />
            </div>
            
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Aún no hay sesiones
            </h3>
            
            <p className="text-gray-600 mb-6 max-w-md mx-auto">
              Comienza a documentar tus reuniones y avances con el cliente.
            </p>

            <button
              onClick={() => setShowAddModal(true)}
              className="inline-flex items-center gap-2 px-6 py-3 bg-[#2563eb] text-white rounded-lg hover:bg-[#1d4ed8] transition-colors shadow-sm"
            >
              <Plus className="w-5 h-5" />
              <span>Crear primera sesión</span>
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {sessions.map(session => (
              <SessionCard 
                key={session.id} 
                session={session}
                onUpdate={handleUpdateSession}
              />
            ))}
          </div>
        )}
      </main>

      {/* MODALES */}
      
      {/* Add Session Modal */}
      {showAddModal && (
        <AddSessionModal
          projectId={projectId}
          onClose={() => setShowAddModal(false)}
          onSuccess={(newSession) => {
            setSessions([newSession, ...sessions]);
            setShowAddModal(false);
          }}
        />
      )}

      {/* Agendar Siguiente Sesión Modal */}
      {showAgendarModal && (
        <AgendarSiguienteSesionModal
          projectId={projectId}
          onClose={() => setShowAgendarModal(false)}
          onSuccess={(newAgenda) => {
            setSessions([newAgenda, ...sessions]);
            setShowAgendarModal(false);
          }}
        />
      )}

      {/* Compartir Proyecto Modal */}
      {showShareModal && (
        <ShareProjectModal
          project={project}
          onClose={() => setShowShareModal(false)}
          onUpdate={(updatedProject) => {
            setProject(updatedProject);
            setShowShareModal(false);
          }}
        />
      )}
    </div>
  );
};

export default ProjectView;