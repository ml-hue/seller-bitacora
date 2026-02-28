import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';

/**
 * Hook para gestionar proyectos en Bitácora 2.0
 * Incluye estadísticas y última sesión
 */
export const useProjects = () => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // ==================== FETCH PROJECTS ====================
  
  const fetchProjects = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No authenticated user');

      // Usar la vista con stats
      const { data, error: fetchError } = await supabase
        .from('proyectos_con_stats')
        .select('*')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false });

      if (fetchError) throw fetchError;

      setProjects(data || []);
    } catch (err) {
      console.error('Error fetching projects:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // ==================== CREATE PROJECT ====================
  
  const createProject = async (projectData) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No authenticated user');

      const { data, error: createError } = await supabase
        .from('proyectos')
        .insert([
          {
            user_id: user.id,
            nombre: projectData.nombre,
            descripcion: projectData.descripcion || null,
            logo_url: projectData.logo_url || null,
            color_tema: projectData.color_tema || '#3b82f6',
          }
        ])
        .select()
        .single();

      if (createError) throw createError;

      // Refrescar lista
      await fetchProjects();
      
      return { data, error: null };
    } catch (err) {
      console.error('Error creating project:', err);
      return { data: null, error: err.message };
    }
  };

  // ==================== UPDATE PROJECT ====================
  
  const updateProject = async (projectId, updates) => {
    try {
      const { data, error: updateError } = await supabase
        .from('proyectos')
        .update(updates)
        .eq('id', projectId)
        .select()
        .single();

      if (updateError) throw updateError;

      // Actualizar en el estado local
      setProjects(prev => 
        prev.map(p => p.id === projectId ? { ...p, ...data } : p)
      );

      return { data, error: null };
    } catch (err) {
      console.error('Error updating project:', err);
      return { data: null, error: err.message };
    }
  };

  // ==================== DELETE PROJECT ====================
  
  const deleteProject = async (projectId) => {
    try {
      const { error: deleteError } = await supabase
        .from('proyectos')
        .delete()
        .eq('id', projectId);

      if (deleteError) throw deleteError;

      // Remover del estado local
      setProjects(prev => prev.filter(p => p.id !== projectId));

      return { error: null };
    } catch (err) {
      console.error('Error deleting project:', err);
      return { error: err.message };
    }
  };

  // ==================== UPLOAD LOGO ====================
  
  const uploadLogo = async (projectId, file) => {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${projectId}-${Date.now()}.${fileExt}`;
      const filePath = `project-logos/${fileName}`;

      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('public')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('public')
        .getPublicUrl(filePath);

      // Update project with logo URL
      await updateProject(projectId, { logo_url: publicUrl });

      return { url: publicUrl, error: null };
    } catch (err) {
      console.error('Error uploading logo:', err);
      return { url: null, error: err.message };
    }
  };

  // ==================== GET PROJECT BY ID ====================
  
  const getProjectById = async (projectId) => {
    try {
      const { data, error: fetchError } = await supabase
        .from('proyectos_con_stats')
        .select('*')
        .eq('id', projectId)
        .single();

      if (fetchError) throw fetchError;

      return { data, error: null };
    } catch (err) {
      console.error('Error fetching project:', err);
      return { data: null, error: err.message };
    }
  };

  // ==================== REALTIME SUBSCRIPTION ====================
  
  useEffect(() => {
    // Initial fetch
    fetchProjects();

    // Subscribe to realtime changes
    const subscription = supabase
      .channel('proyectos_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'proyectos'
        },
        () => {
          fetchProjects(); // Refetch on any change
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // ==================== RETURN ====================
  
  return {
    projects,
    loading,
    error,
    createProject,
    updateProject,
    deleteProject,
    uploadLogo,
    getProjectById,
    refetch: fetchProjects,
  };
};
