import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, FileText, TrendingUp } from 'lucide-react';

/**
 * Card de proyecto para el Dashboard
 * Muestra logo, nombre, stats y última actividad
 */
const ProjectCard = ({ project }) => {
  const navigate = useNavigate();

  // Calcular días desde última sesión
  const getDaysSinceLastSession = () => {
    if (!project.ultima_sesion_fecha) return null;
    
    const lastSession = new Date(project.ultima_sesion_fecha);
    const today = new Date();
    const diffTime = Math.abs(today - lastSession);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Hoy';
    if (diffDays === 1) return 'Ayer';
    if (diffDays < 7) return `Hace ${diffDays}d`;
    if (diffDays < 30) return `Hace ${Math.floor(diffDays / 7)}sem`;
    return `Hace ${Math.floor(diffDays / 30)}m`;
  };

  // Determinar fase actual (la que tiene más sesiones)
  const getCurrentPhase = () => {
    const phases = [
      { id: 1, name: 'Diagnóstico', count: project.sesiones_diagnostico },
      { id: 2, name: 'Plan', count: project.sesiones_plan },
      { id: 3, name: 'Implementación', count: project.sesiones_implementacion },
      { id: 4, name: 'Seguimiento', count: project.sesiones_seguimiento },
    ];
    
    const current = phases.reduce((max, phase) => 
      phase.count > max.count ? phase : max
    );
    
    return current.count > 0 ? current.name : 'Sin sesiones';
  };

  // Estilos del card con el color del proyecto
  const cardStyle = {
    borderTop: `4px solid ${project.color_tema || '#3b82f6'}`,
  };

  return (
    <div
      onClick={() => navigate(`/project/${project.id}`)}
      className="project-card bg-white rounded-lg shadow-md hover:shadow-xl transition-all duration-300 cursor-pointer overflow-hidden"
      style={cardStyle}
    >
      {/* Header con logo */}
      <div className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            {project.logo_url ? (
              <img
                src={project.logo_url}
                alt={project.nombre}
                className="w-12 h-12 rounded-lg object-cover"
              />
            ) : (
              <div
                className="w-12 h-12 rounded-lg flex items-center justify-center text-white text-xl font-bold"
                style={{ backgroundColor: project.color_tema || '#3b82f6' }}
              >
                {project.nombre.charAt(0).toUpperCase()}
              </div>
            )}
            
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                {project.nombre}
              </h3>
              {project.descripcion && (
                <p className="text-sm text-gray-500 line-clamp-1">
                  {project.descripcion}
                </p>
              )}
            </div>
          </div>

          {/* Badge de estado */}
          <span
            className={`px-2 py-1 rounded-full text-xs font-medium ${
              project.estado === 'activo'
                ? 'bg-green-100 text-green-700'
                : project.estado === 'pausado'
                ? 'bg-yellow-100 text-yellow-700'
                : 'bg-gray-100 text-gray-700'
            }`}
          >
            {project.estado}
          </span>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 mb-4">
          <div className="bg-gray-50 rounded-lg p-3">
            <div className="flex items-center gap-2 text-gray-600 mb-1">
              <FileText className="w-4 h-4" />
              <span className="text-xs">Sesiones</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">
              {project.total_sesiones || 0}
            </p>
          </div>

          <div className="bg-gray-50 rounded-lg p-3 col-span-2">
            <div className="flex items-center gap-2 text-gray-600 mb-1">
              <TrendingUp className="w-4 h-4" />
              <span className="text-xs">Fase actual</span>
            </div>
            <p className="text-sm font-semibold text-gray-900 truncate">
              {getCurrentPhase()}
            </p>
          </div>
        </div>

        {/* Última actividad */}
        {project.ultima_sesion_fecha && (
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <Calendar className="w-4 h-4" />
            <span>Última sesión {getDaysSinceLastSession()}</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProjectCard;
