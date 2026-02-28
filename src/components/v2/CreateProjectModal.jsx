import React, { useState } from 'react';
import { X, Upload } from 'lucide-react';
import { supabase } from '../../supabaseClient';

const CreateProjectModal = ({ onClose, onCreate }) => {
  const [formData, setFormData] = useState({
    nombre: '',
    descripcion: '',
    color_tema: '#FF6B35',
  });
  const [logoFile, setLogoFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const colors = [
    '#3B82F6', '#8B5CF6', '#EC4899', '#F59E0B', 
    '#10B981', '#06B6D4', '#FF6B35', '#6366F1'
  ];

  const handleLogoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        setError('El logo debe ser menor a 2MB');
        return;
      }
      setLogoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setLogoPreview(reader.result);
      reader.readAsDataURL(file);
      setError(null);
    }
  };

  const uploadLogo = async (projectId) => {
    if (!logoFile) return null;

    const fileExt = logoFile.name.split('.').pop();
    const fileName = `${projectId}-${Date.now()}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from('project-logos')
      .upload(fileName, logoFile);

    if (uploadError) throw uploadError;

    const { data } = supabase.storage
      .from('project-logos')
      .getPublicUrl(fileName);

    return data.publicUrl;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.nombre.trim()) {
      setError('El nombre es requerido');
      return;
    }

    // Prevenir doble submit
    if (loading) return;

    setLoading(true);
    setError(null);

    try {
      // PASO 1: Obtener usuario actual
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('Usuario no autenticado');
      }

      console.log('✅ Usuario obtenido:', user.id);

      // PASO 2: Verificar que no exista un proyecto con el mismo nombre
      const { data: existing } = await supabase
        .from('proyectos')
        .select('id')
        .eq('user_id', user.id)
        .eq('nombre', formData.nombre.trim())
        .maybeSingle();

      if (existing) {
        throw new Error('Ya existe un proyecto con ese nombre');
      }

      console.log('✅ Nombre único verificado');

      // PASO 3: Crear proyecto con user_id
      const { data: project, error: projectError } = await supabase
        .from('proyectos')
        .insert([{
          nombre: formData.nombre.trim(),
          descripcion: formData.descripcion?.trim() || null,
          color_tema: formData.color_tema,
          estado: 'activo',
          user_id: user.id
        }])
        .select()
        .single();

      if (projectError) {
        console.error('❌ Error al crear proyecto:', projectError);
        throw projectError;
      }

      console.log('✅ Proyecto creado:', project.id);

      // PASO 4: Subir logo si existe
      let logoUrl = null;
      if (logoFile) {
        console.log('📤 Subiendo logo...');
        logoUrl = await uploadLogo(project.id);
        
        await supabase
          .from('proyectos')
          .update({ logo_url: logoUrl })
          .eq('id', project.id);
        
        console.log('✅ Logo subido:', logoUrl);
      }

      // PASO 5: Notificar éxito
      onCreate({ ...project, logo_url: logoUrl });
      onClose();
    } catch (err) {
      console.error('❌ Error completo:', err);
      setError(err.message);
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-bold">Nuevo Proyecto</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nombre del proyecto *
            </label>
            <input
              type="text"
              value={formData.nombre}
              onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              autoFocus
              disabled={loading}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Descripción (opcional)
            </label>
            <input
              type="text"
              value={formData.descripcion}
              onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              disabled={loading}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Color del proyecto
            </label>
            <div className="flex gap-2 flex-wrap">
              {colors.map(color => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setFormData({ ...formData, color_tema: color })}
                  className={`w-10 h-10 rounded-lg ${formData.color_tema === color ? 'ring-2 ring-offset-2 ring-blue-500' : ''}`}
                  style={{ backgroundColor: color }}
                  disabled={loading}
                />
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Logo (opcional)
            </label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-blue-500 transition-colors cursor-pointer">
              <input
                type="file"
                accept="image/*"
                onChange={handleLogoChange}
                className="hidden"
                id="logo-upload"
                disabled={loading}
              />
              <label htmlFor="logo-upload" className={`cursor-pointer ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}>
                {logoPreview ? (
                  <img src={logoPreview} alt="Preview" className="w-20 h-20 mx-auto object-contain mb-2" />
                ) : (
                  <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                )}
                <p className="text-sm text-gray-500">
                  {logoPreview ? 'Cambiar logo' : 'Subir logo'}
                </p>
                <p className="text-xs text-gray-400 mt-1">PNG, JPG hasta 2MB</p>
              </label>
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border rounded-lg hover:bg-gray-50"
              disabled={loading}
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Creando...' : 'Crear Proyecto'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateProjectModal;