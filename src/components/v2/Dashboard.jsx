import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, LogOut, Upload } from 'lucide-react';
import { supabase } from '../../supabaseClient';
import { useProjects } from '../../hooks/useProjects';
import ProjectCard from './ProjectCard';
import CreateProjectModal from './CreateProjectModal';
import ImportSessionsModal from './ImportSessionsModal';
import Footer from './Footer';

const Dashboard = () => {
  const navigate = useNavigate();
  const { projects, loading, createProject, getProjects } = useProjects();
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    };
    getUser();
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate('/login');
  };

  const handleCreateProject = async (projectData) => {
    await createProject(projectData);
    setShowCreateModal(false);
    getProjects();
  };

  const filteredProjects = projects.filter(project =>
    project.nombre.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const activeProjects = filteredProjects.filter(p => p.estado === 'activo');
  const totalSessions = projects.reduce((sum, p) => sum + (p.total_sesiones || 0), 0);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando proyectos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            {/* Logo y título */}
            <div className="flex items-center gap-3">
              <<img src={logoSeller} alt="Seller Bitácora" className="h-10" />
              <div>
                <h1 className="text-xl font-bold text-gray-900">Seller Bitácora</h1>
                <p className="text-xs text-gray-500">v2.0</p>
              </div>
            </div>

            {/* Usuario y salir */}
            <div className="flex items-center gap-4">
              {user && (
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white font-medium">
                    {user.email?.charAt(0).toUpperCase()}
                  </div>
                  <span className="text-sm text-gray-700 hidden sm:inline">
                    {user.email?.split('@')[0]}
                  </span>
                </div>
              )}
              <button
                onClick={handleSignOut}
                className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <LogOut className="w-4 h-4" />
                <span>Salir</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
        {/* Header con título y botones */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Mis Proyectos</h2>
            <p className="text-gray-600">{projects.length} proyectos</p>
          </div>

          {/* Botones de acción */}
          <div className="flex gap-3">
            {/* Botón Importar Sesiones */}
            <button
              onClick={() => setShowImportModal(true)}
              className="flex items-center gap-2 px-4 py-2 border-2 border-purple-500 text-purple-500 rounded-lg hover:bg-purple-50 transition-colors shadow-sm"
              title="Importar sesiones masivamente"
            >
              <Upload className="w-5 h-5" />
              <span className="hidden sm:inline">Importar Sesiones</span>
            </button>

            {/* Botón Nuevo Proyecto */}
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-[#2563eb] text-white rounded-lg hover:bg-[#1d4ed8] transition-colors shadow-sm"
            >
              <Plus className="w-5 h-5" />
              <span>Nuevo Proyecto</span>
            </button>
          </div>
        </div>

        {/* Buscador */}
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Buscar proyectos..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Grid de proyectos */}
        {filteredProjects.length === 0 ? (
          <div className="text-center py-16">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
              <Plus className="w-8 h-8 text-blue-500" />
            </div>
            
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              {searchTerm ? 'No se encontraron proyectos' : 'Aún no tienes proyectos'}
            </h3>
            
            <p className="text-gray-600 mb-6">
              {searchTerm 
                ? 'Intenta con otro término de búsqueda'
                : 'Crea tu primer proyecto para comenzar a documentar tus sesiones'
              }
            </p>

            {!searchTerm && (
              <button
                onClick={() => setShowCreateModal(true)}
                className="inline-flex items-center gap-2 px-6 py-3 bg-[#2563eb] text-white rounded-lg hover:bg-[#1d4ed8] transition-colors shadow-sm"
              >
                <Plus className="w-5 h-5" />
                <span>Crear primer proyecto</span>
              </button>
            )}
          </div>
        ) : (
          <>
            {/* Grid de tarjetas */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              {filteredProjects.map(project => (
                <ProjectCard
                  key={project.id}
                  project={project}
                  onClick={() => navigate(`/project/${project.id}`)}
                />
              ))}
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h3 className="text-sm font-medium text-gray-600 mb-2">Total Proyectos</h3>
                <p className="text-3xl font-bold text-gray-900">{projects.length}</p>
              </div>

              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h3 className="text-sm font-medium text-gray-600 mb-2">Total Sesiones</h3>
                <p className="text-3xl font-bold text-gray-900">{totalSessions}</p>
              </div>

              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h3 className="text-sm font-medium text-gray-600 mb-2">Proyectos Activos</h3>
                <p className="text-3xl font-bold text-gray-900">{activeProjects.length}</p>
              </div>
            </div>
          </>
        )}
      </main>

      {/* Footer */}
      <Footer />

      {/* MODALES */}
      
      {/* Create Project Modal */}
      {showCreateModal && (
        <CreateProjectModal
          onClose={() => setShowCreateModal(false)}
          onCreate={handleCreateProject}
        />
      )}

      {/* Import Sessions Modal */}
      {showImportModal && (
        <ImportSessionsModal
          onClose={() => setShowImportModal(false)}
          onSuccess={() => {
            setShowImportModal(false);
            window.location.reload(); // Recargar para ver las nuevas sesiones
          }}
        />
      )}
    </div>
  );
};

export default Dashboard;