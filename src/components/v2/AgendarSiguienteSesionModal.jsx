import React, { useState } from 'react';
import { X, Calendar, Users, FileText } from 'lucide-react';
import { supabase } from '../../supabaseClient';

/**
 * Modal para agendar siguiente sesión
 */
const AgendarSiguienteSesionModal = ({ projectId, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    fecha: '',
    hora: '',
    asistentes: '',
    informacion_soporte: '',
    notas: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.fecha) {
      setError('La fecha es requerida');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Guardamos como una sesión con estado "agendada"
      const agendaData = {
        proyecto_id: projectId,
        titulo: `Sesión agendada - ${formData.fecha}`,
        fecha: formData.fecha,
        fase_id: 1, // Por defecto
        contenido: `
**⏰ Hora:** ${formData.hora || 'Por definir'}

**👥 Asistentes:**
${formData.asistentes || 'Por definir'}

**📄 Información de soporte necesaria:**
${formData.informacion_soporte || 'Ninguna'}

**📝 Notas adicionales:**
${formData.notas || 'Ninguna'}
        `.trim(),
        etiqueta: 'Agendada',
        estado_cliente: 'agendada',
        resumen_ejecutivo: null,
      };

      const { data, error: insertError } = await supabase
        .from('sesiones')
        .insert([agendaData])
        .select()
        .single();

      if (insertError) throw insertError;

      onSuccess(data);
    } catch (err) {
      console.error('Error creating agenda:', err);
      setError(err.message);
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 sticky top-0 bg-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <Calendar className="w-5 h-5 text-blue-600" />
            </div>
            <h2 className="text-xl font-bold text-gray-900">Agendar Siguiente Sesión</h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          {/* Fecha y Hora */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                📅 Fecha *
              </label>
              <input
                type="date"
                value={formData.fecha}
                onChange={(e) => setFormData({ ...formData, fecha: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                ⏰ Hora (opcional)
              </label>
              <input
                type="time"
                value={formData.hora}
                onChange={(e) => setFormData({ ...formData, hora: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Asistentes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              👥 Asistentes
            </label>
            <textarea
              value={formData.asistentes}
              onChange={(e) => setFormData({ ...formData, asistentes: e.target.value })}
              placeholder="Ej:&#10;- Juan Pérez (Cliente - CEO)&#10;- María González (Seller Group - Consultora)&#10;- Carlos Ruiz (Cliente - CTO)"
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none font-mono text-sm"
            />
            <p className="text-xs text-gray-500 mt-1">
              💡 Lista los asistentes, uno por línea
            </p>
          </div>

          {/* Información de soporte */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              📄 Información de soporte necesaria
            </label>
            <textarea
              value={formData.informacion_soporte}
              onChange={(e) => setFormData({ ...formData, informacion_soporte: e.target.value })}
              placeholder="Ej:&#10;- Reportes de ventas Q4&#10;- Propuesta técnica actualizada&#10;- Dashboard de métricas"
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none font-mono text-sm"
            />
            <p className="text-xs text-gray-500 mt-1">
              📎 Documentos, reportes o materiales necesarios para la sesión
            </p>
          </div>

          {/* Notas adicionales */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              📝 Notas adicionales (opcional)
            </label>
            <textarea
              value={formData.notas}
              onChange={(e) => setFormData({ ...formData, notas: e.target.value })}
              placeholder="Ej: Confirmar con Juan si puede asistir virtualmente..."
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            />
          </div>

          {/* Preview */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm font-medium text-blue-900 mb-2">Vista previa:</p>
            <p className="text-sm text-blue-800">
              📅 {formData.fecha || '(Selecciona una fecha)'} 
              {formData.hora && ` a las ${formData.hora}`}
            </p>
            {formData.asistentes && (
              <p className="text-sm text-blue-800 mt-1">
                👥 {formData.asistentes.split('\n').length} asistente(s)
              </p>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 bg-[#2563eb] text-white rounded-lg hover:bg-[#1d4ed8] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Agendando...' : 'Agendar Sesión'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AgendarSiguienteSesionModal;
