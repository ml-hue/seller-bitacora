import React, { useState } from 'react';
import { Upload, X, Check, AlertCircle } from 'lucide-react';
import { supabase } from '../../supabaseClient';
import { generarResumenEjecutivo } from '../../services/claudeService';

/**
 * Modal para importar sesiones masivamente
 */
const ImportSessionsModal = ({ onClose, onSuccess }) => {
  const [step, setStep] = useState(1);
  const [sessions, setSessions] = useState([]);
  const [importing, setImporting] = useState(false);
  const [results, setResults] = useState({ success: 0, errors: 0 });

  const handlePaste = (e) => {
    const text = e.target.value;
    // Espera formato:
    // Proyecto | Título | Fecha | Fase | Responsable | Contenido
    const lines = text.split('\n').filter(l => l.trim());
    
    const parsed = lines.map((line, idx) => {
      const [proyecto, titulo, fecha, fase, responsable, ...contenidoParts] = line.split('|').map(s => s.trim());
      return {
        id: idx,
        proyecto_nombre: proyecto,
        titulo: titulo,
        fecha: fecha,
        fase_id: parseInt(fase) || 1,
        responsable_cliente: responsable,
        contenido: contenidoParts.join('|').trim()
      };
    });

    setSessions(parsed);
    setStep(2);
  };

  const handleImport = async () => {
    setImporting(true);
    let success = 0;
    let errors = 0;

    for (const session of sessions) {
      try {
        // 1. Buscar proyecto
        const { data: proyecto } = await supabase
          .from('proyectos')
          .select('id')
          .eq('nombre', session.proyecto_nombre)
          .single();

        if (!proyecto) {
          console.error(`Proyecto no encontrado: ${session.proyecto_nombre}`);
          errors++;
          continue;
        }

        // 2. Generar resumen con IA (opcional)
        let resumen = null;
        try {
          const result = await generarResumenEjecutivo({
            clientName: session.responsable_cliente,
            projectName: session.titulo,
            date: session.fecha,
            duration: 'N/A',
            description: session.contenido
          });
          
          if (result.success) {
            resumen = {
              texto: result.summary,
              generado_con_ia: true,
              fecha_generacion: new Date().toISOString()
            };
          }
        } catch (err) {
          console.log('No se pudo generar resumen IA para:', session.titulo);
        }

        // 3. Insertar sesión
        const { error } = await supabase
          .from('sesiones')
          .insert({
            proyecto_id: proyecto.id,
            titulo: session.titulo,
            fecha: session.fecha,
            fase_id: session.fase_id,
            responsable_cliente: session.responsable_cliente,
            contenido: session.contenido,
            resumen_ejecutivo: resumen,
            etiqueta: 'Sesión'
          });

        if (error) throw error;
        success++;
      } catch (err) {
        console.error('Error importando:', session.titulo, err);
        errors++;
      }
    }

    setResults({ success, errors });
    setImporting(false);
    setStep(3);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b sticky top-0 bg-white">
          <h2 className="text-xl font-bold">Importar Sesiones</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6">
          {/* STEP 1: Pegar datos */}
          {step === 1 && (
            <div>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                <h3 className="font-medium text-blue-900 mb-2">📋 Formato de importación</h3>
                <p className="text-sm text-blue-800 mb-2">Pega tus sesiones con este formato (una por línea):</p>
                <code className="text-xs bg-white p-2 block rounded border border-blue-200">
                  Nombre Proyecto | Título Sesión | YYYY-MM-DD | Fase (1-4) | Responsable | Contenido completo...
                </code>
                <p className="text-xs text-blue-700 mt-2">
                  Ejemplo:<br/>
                  <code>Everdem | Kick-off | 2024-01-15 | 1 | Juan Pérez | Discutimos objetivos y alcance del proyecto...</code>
                </p>
              </div>

              <textarea
                onPaste={handlePaste}
                onChange={handlePaste}
                placeholder="Pega aquí tus sesiones (una por línea)..."
                rows={15}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 font-mono text-sm"
              />
            </div>
          )}

          {/* STEP 2: Revisar y confirmar */}
          {step === 2 && (
            <div>
              <div className="mb-4">
                <h3 className="font-medium mb-2">
                  Se importarán {sessions.length} sesiones:
                </h3>
              </div>

              <div className="max-h-96 overflow-y-auto space-y-2 mb-6">
                {sessions.map(session => (
                  <div key={session.id} className="bg-gray-50 p-3 rounded border">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium">{session.titulo}</span>
                      <span className="text-xs text-gray-500">{session.proyecto_nombre}</span>
                    </div>
                    <div className="text-xs text-gray-600">
                      📅 {session.fecha} · Fase {session.fase_id} · {session.responsable_cliente}
                    </div>
                    <p className="text-xs text-gray-500 mt-1 truncate">{session.contenido}</p>
                  </div>
                ))}
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setStep(1)}
                  className="flex-1 px-4 py-2 border rounded-lg hover:bg-gray-50"
                >
                  ← Atrás
                </button>
                <button
                  onClick={handleImport}
                  disabled={importing}
                  className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50"
                >
                  {importing ? 'Importando...' : 'Importar Sesiones'}
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: Resultados */}
          {step === 3 && (
            <div className="text-center py-8">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
                <Check className="w-8 h-8 text-green-600" />
              </div>
              
              <h3 className="text-xl font-bold mb-2">Importación Completada</h3>
              
              <div className="space-y-2 mb-6">
                <p className="text-green-600">✅ {results.success} sesiones importadas correctamente</p>
                {results.errors > 0 && (
                  <p className="text-red-600">❌ {results.errors} errores encontrados</p>
                )}
              </div>

              <button
                onClick={() => {
                  onSuccess();
                  onClose();
                }}
                className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
              >
                Cerrar
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ImportSessionsModal;
