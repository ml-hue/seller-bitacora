import React, { useState } from 'react';
import { X, Sparkles } from 'lucide-react';
import { supabase } from '../../supabaseClient';
import { generarResumenEjecutivo } from '../../services/claudeService';

/**
 * Modal para editar sesión existente
 */
const EditSessionModal = ({ session, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    titulo: session.titulo || '',
    fecha: session.fecha || new Date().toISOString().split('T')[0],
    fase_id: session.fase_id || 1,
    responsable_cliente: session.responsable_cliente || '',
    estado_cliente: session.estado_cliente || '',
    contenido: session.contenido || '',
    etiqueta: session.etiqueta || 'Sesión',
    resumen_ejecutivo: session.resumen_ejecutivo || null,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [generatingResumen, setGeneratingResumen] = useState(false);

  const fases = [
    { id: 1, nombre: 'Diagnóstico', emoji: '🔍' },
    { id: 2, nombre: 'Plan Estratégico', emoji: '📋' },
    { id: 3, nombre: 'Implementación', emoji: '⚙️' },
    { id: 4, nombre: 'Seguimiento & Control', emoji: '📊' }
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.titulo.trim()) {
      setError('El título es requerido');
      return;
    }

    if (!formData.contenido.trim()) {
      setError('El contenido es requerido');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const sessionData = {
        titulo: formData.titulo,
        fecha: formData.fecha,
        fase_id: formData.fase_id,
        responsable_cliente: formData.responsable_cliente || null,
        estado_cliente: formData.estado_cliente || null,
        contenido: formData.contenido,
        etiqueta: formData.etiqueta,
        resumen_ejecutivo: formData.resumen_ejecutivo || null,
      };

      const { data, error: updateError } = await supabase
        .from('sesiones')
        .update(sessionData)
        .eq('id', session.id)
        .select()
        .single();

      if (updateError) throw updateError;

      onSuccess(data);
    } catch (err) {
      console.error('Error updating session:', err);
      setError(err.message);
      setLoading(false);
    }
  };

  // Función para generar resumen con Claude API
  const generateResumenWithClaude = async () => {
    if (!formData.contenido.trim()) {
      setError('Escribe el contenido de la sesión primero');
      return;
    }

    setGeneratingResumen(true);
    setError(null);

    try {
      const sessionData = {
        clientName: formData.responsable_cliente || 'Cliente',
        projectName: formData.titulo || 'Proyecto',
        date: formData.fecha,
        duration: 'N/A',
        description: formData.contenido
      };

      const result = await generarResumenEjecutivo(sessionData);
      
      if (result.success) {
        const resumenTexto = result.summary;
        
        setFormData(prev => ({
          ...prev,
          contenido: resumenTexto,
          resumen_ejecutivo: {
            texto: resumenTexto,
            generado_con_ia: true,
            fecha_generacion: new Date().toISOString()
          }
        }));

        alert('✅ Resumen generado exitosamente. El contenido ha sido actualizado.');
      } else {
        throw new Error(result.error || 'Error al generar resumen');
      }
      
    } catch (err) {
      console.error('Error generating resumen:', err);
      setError(err.message || 'Error al generar resumen. Verifica que tu API Key esté configurada correctamente.');
    } finally {
      setGeneratingResumen(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 sticky top-0 bg-white">
          <h2 className="text-xl font-bold text-gray-900">Editar Sesión</h2>
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

          {/* Título */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Título de la sesión *
            </label>
            <input
              type="text"
              value={formData.titulo}
              onChange={(e) => setFormData({ ...formData, titulo: e.target.value })}
              placeholder="Ej: Reunión de kick-off, Presentación de avances..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              autoFocus
            />
          </div>

          {/* Fecha y Fase */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Fecha
              </label>
              <input
                type="date"
                value={formData.fecha}
                onChange={(e) => setFormData({ ...formData, fecha: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Fase del proyecto
              </label>
              <select
                value={formData.fase_id}
                onChange={(e) => setFormData({ ...formData, fase_id: parseInt(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {fases.map(fase => (
                  <option key={fase.id} value={fase.id}>
                    {fase.emoji} {fase.nombre}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Cliente info */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Responsable cliente (opcional)
              </label>
              <input
                type="text"
                value={formData.responsable_cliente}
                onChange={(e) => setFormData({ ...formData, responsable_cliente: e.target.value })}
                placeholder="Nombre del contacto"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Estado cliente (opcional)
              </label>
              <input
                type="text"
                value={formData.estado_cliente}
                onChange={(e) => setFormData({ ...formData, estado_cliente: e.target.value })}
                placeholder="Ej: Satisfecho, Preocupado..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Contenido */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-sm font-medium text-gray-700">
                Contenido de la sesión *
              </label>
              <button
                type="button"
                onClick={generateResumenWithClaude}
                disabled={generatingResumen || !formData.contenido.trim()}
                className="flex items-center gap-1 text-xs text-[#2563eb] hover:text-[#1d4ed8] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Sparkles className="w-3 h-3" />
                <span>{generatingResumen ? 'Generando...' : 'Regenerar resumen con IA'}</span>
              </button>
            </div>
            <textarea
              value={formData.contenido}
              onChange={(e) => setFormData({ ...formData, contenido: e.target.value })}
              placeholder="Describe lo que se discutió en la sesión, decisiones tomadas, problemas identificados, etc."
              rows={8}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            />
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
              {loading ? 'Guardando...' : 'Guardar Cambios'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditSessionModal;
