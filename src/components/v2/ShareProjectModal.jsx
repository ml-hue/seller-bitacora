import React, { useState } from 'react';
import { Share2, Copy, Check, X, ExternalLink } from 'lucide-react';
import { supabase } from '../../supabaseClient';

/**
 * Modal para compartir proyecto con cliente
 */
const ShareProjectModal = ({ project, onClose, onUpdate }) => {
  const [shareEnabled, setShareEnabled] = useState(project.share_enabled || false);
  const [shareToken, setShareToken] = useState(project.share_token || null);
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);

  // Obtener token actualizado de la BD
  React.useEffect(() => {
    const fetchToken = async () => {
      const { data } = await supabase
        .from('proyectos')
        .select('share_token, share_enabled')
        .eq('id', project.id)
        .single();
      
      if (data) {
        setShareToken(data.share_token);
        setShareEnabled(data.share_enabled);
      }
    };
    fetchToken();
  }, [project.id]);

  const shareUrl = `${window.location.origin}/shared/${shareToken}`;

  const handleToggleShare = async () => {
    setLoading(true);
    
    const { error } = await supabase
      .from('proyectos')
      .update({ share_enabled: !shareEnabled })
      .eq('id', project.id);

    if (!error) {
      setShareEnabled(!shareEnabled);
      onUpdate({ ...project, share_enabled: !shareEnabled });
    }
    
    setLoading(false);
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleOpenPreview = () => {
    window.open(shareUrl, '_blank');
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-lg w-full">
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center gap-3">
            <Share2 className="w-6 h-6 text-blue-500" />
            <h2 className="text-xl font-bold">Compartir Proyecto</h2>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Toggle compartir */}
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div>
              <p className="font-medium text-gray-900">Acceso del Cliente</p>
              <p className="text-sm text-gray-600">
                Permitir que el cliente vea este proyecto
              </p>
            </div>
            <button
              onClick={handleToggleShare}
              disabled={loading}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                shareEnabled ? 'bg-blue-500' : 'bg-gray-300'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  shareEnabled ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          {shareEnabled && (
            <>
              {/* Link compartido */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Link Compartido
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={shareUrl}
                    readOnly
                    className="flex-1 px-3 py-2 border rounded-lg bg-gray-50 text-sm"
                  />
                  <button
                    onClick={handleCopyLink}
                    className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 flex items-center gap-2"
                  >
                    {copied ? (
                      <>
                        <Check className="w-4 h-4" />
                        <span>Copiado</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4" />
                        <span>Copiar</span>
                      </>
                    )}
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  Comparte este link con tu cliente para que pueda ver el progreso del proyecto
                </p>
              </div>

              {/* Preview */}
              <button
                onClick={handleOpenPreview}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 border-2 border-blue-500 text-blue-500 rounded-lg hover:bg-blue-50"
              >
                <ExternalLink className="w-5 h-5" />
                <span>Vista Previa del Portal</span>
              </button>

              {/* Info de seguridad */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-medium text-blue-900 mb-2">🔒 Información de Seguridad</h4>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• El cliente solo verá las sesiones de este proyecto</li>
                  <li>• No puede editar ni eliminar información</li>
                  <li>• Puedes revocar el acceso en cualquier momento</li>
                  <li>• El link es único y seguro</li>
                </ul>
              </div>
            </>
          )}

          {!shareEnabled && (
            <div className="text-center py-8">
              <p className="text-gray-600">
                Activa el acceso para generar un link compartido
              </p>
            </div>
          )}
        </div>

        <div className="flex gap-3 p-6 border-t">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 border rounded-lg hover:bg-gray-50"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};

export default ShareProjectModal;