import React from 'react';
import { FolderPlus, Sparkles } from 'lucide-react';

/**
 * Estado vacío cuando no hay proyectos
 */
const EmptyState = ({ onCreateProject }) => {
  return (
    <div className="text-center py-16">
      <div className="inline-flex items-center justify-center w-16 h-16 bg-[#dbeafe] rounded-full mb-4">
        <FolderPlus className="w-8 h-8 text-[#2563eb]" />
      </div>
      
      <h3 className="text-xl font-semibold text-gray-900 mb-2">
        Aún no tienes proyectos
      </h3>
      
      <p className="text-gray-600 mb-6 max-w-md mx-auto">
        Crea tu primer proyecto para comenzar a llevar registro de tus sesiones,
        decisiones y avances con tus clientes.
      </p>

      <button
        onClick={onCreateProject}
        className="inline-flex items-center gap-2 px-6 py-3 bg-[#2563eb] text-white rounded-lg hover:bg-[#1d4ed8] transition-colors shadow-sm"
      >
        <Sparkles className="w-5 h-5" />
        <span>Crear mi primer proyecto</span>
      </button>

      {/* Ilustración decorativa */}
      <div className="mt-12 text-gray-300">
        <svg
          className="w-64 h-64 mx-auto"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1}
            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
          />
        </svg>
      </div>
    </div>
  );
};

export default EmptyState;
