// src/services/claudeService.js
const PROXY_URL = import.meta.env.VITE_PROXY_URL || 'http://localhost:3001';

export const generateExecutiveSummary = async (sessionData) => {
  try {
    const prompt = `
Eres un asistente especializado en crear resúmenes ejecutivos de sesiones comerciales.

A continuación, te proporciono los datos de una sesión con un cliente:

INFORMACIÓN DE LA SESIÓN:
- Cliente: ${sessionData.clientName || 'No especificado'}
- Proyecto: ${sessionData.projectName || 'No especificado'}
- Fecha: ${sessionData.date || 'No especificada'}
- Duración: ${sessionData.duration || 'No especificada'}

DESCRIPCIÓN/NOTAS:
${sessionData.description || 'Sin descripción'}

TAREA:
Genera un resumen ejecutivo profesional y conciso de esta sesión. El resumen debe incluir:

1. **Objetivo principal** de la sesión
2. **Puntos clave** discutidos (máximo 3-4 puntos)
3. **Acuerdos o decisiones** tomadas
4. **Próximos pasos** o acciones a seguir

Formato: Usa markdown para dar estructura. Sé conciso y directo (máximo 200 palabras).
`;

    console.log('📤 Enviando solicitud al proxy local...');

    const response = await fetch(`${PROXY_URL}/api/claude`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        prompt,
        sessionData
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Error al generar resumen');
    }

    const data = await response.json();
    console.log('✅ Resumen generado exitosamente');

    return {
      success: true,
      summary: data.summary
    };

  } catch (error) {
    console.error('❌ Error al generar resumen:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

// Alias en español para compatibilidad
export const generarResumenEjecutivo = generateExecutiveSummary;

export const checkProxyHealth = async () => {
  try {
    const response = await fetch(`${PROXY_URL}/health`);
    const data = await response.json();
    return data.status === 'ok';
  } catch (error) {
    console.error('❌ Proxy no disponible:', error);
    return false;
  }
};