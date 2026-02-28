import React, { useState } from 'react';
import { Calendar, Edit, ChevronDown, ChevronUp } from 'lucide-react';
import EditSessionModal from './EditSessionModal';

/**
 * Tarjeta de sesión con opción de expandir y editar
 */
const SessionCard = ({ session, onUpdate }) => {
  const [expanded, setExpanded] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
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

  const fase = getFaseLabel(session.fase_id);

  // Colores para las fases
  const getColorClasses = (color) => {
    const colors = {
      blue: 'bg-blue-100 text-blue-700',
      purple: 'bg-purple-100 text-purple-700',
      orange: 'bg-orange-100 text-orange-700',
      green: 'bg-green-100 text-green-700'
    };
    return colors[color] || colors.blue;
  };

  return (
    <>
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
        <div className="p-6">
          {/* Header con título y botón editar */}
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <Calendar className="w-4 h-4 text-gray-400" />
                <span className="text-sm text-gray-600">{formatDate(session.fecha)}</span>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {session.titulo}
              </h3>
              <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${getColorClasses(fase.color)}`}>
                {fase.emoji} {fase.nombre}
              </span>
            </div>

            {/* Botón Editar */}
            <button
              onClick={() => setShowEditModal(true)}
              className="p-2 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"
              title="Editar sesión"
            >
              <Edit className="w-5 h-5" />
            </button>
          </div>

          {/* Info adicional */}
          {session.responsable_cliente && (
            <p className="text-sm text-gray-600 mb-2">
              <span className="font-medium">Responsable:</span> {session.responsable_cliente}
            </p>
          )}

          {session.estado_cliente && (
            <p className="text-sm text-gray-600 mb-4">
              <span className="font-medium">Estado:</span> {session.estado_cliente}
            </p>
          )}

          {/* Etiqueta si es agendada */}
          {session.etiqueta === 'Agendada' && (
            <div className="mb-4 flex items-center gap-2">
              <span className="inline-block px-3 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700">
                📅 Sesión Agendada
              </span>
            </div>
          )}

          {/* Contenido expandible */}
          <div className="border-t border-gray-200 pt-4">
            {expanded ? (
              <div className="prose prose-sm max-w-none">
                <div className="text-gray-700 whitespace-pre-wrap">
                  {session.contenido}
                </div>
              </div>
            ) : (
              <p className="text-gray-600 text-sm line-clamp-3">
                {session.contenido}
              </p>
            )}

            <button
              onClick={() => setExpanded(!expanded)}
              className="flex items-center gap-1 text-blue-500 hover:text-blue-600 text-sm font-medium mt-3 transition-colors"
            >
              {expanded ? (
                <>
                  <span>Ver menos</span>
                  <ChevronUp className="w-4 h-4" />
                </>
              ) : (
                <>
                  <span>Ver más</span>
                  <ChevronDown className="w-4 h-4" />
                </>
              )}
            </button>
          </div>

          {/* Resumen ejecutivo IA (si existe) */}
          {session.resumen_ejecutivo?.generado_con_ia && (
            <div className="mt-4 p-3 bg-purple-50 border border-purple-200 rounded-lg">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-medium text-purple-700">✨ Generado con IA</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modal de Edición */}
      {showEditModal && (
        <EditSessionModal
          session={session}
          onClose={() => setShowEditModal(false)}
          onSuccess={(updatedSession) => {
            if (onUpdate) {
              onUpdate(updatedSession);
            }
            setShowEditModal(false);
          }}
        />
      )}
    </>
  );
};

export default SessionCard;