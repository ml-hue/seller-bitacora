import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase' // Ajusta esta ruta según tu proyecto

export const useFinanzas = () => {
  const [config, setConfig] = useState(null)
  const [movimientos, setMovimientos] = useState([])
  const [movimientosAgendados, setMovimientosAgendados] = useState([])
  const [loading, setLoading] = useState(true)
  const [saldoRealBanco, setSaldoRealBanco] = useState(0)

  // ==================== CONFIGURACIÓN ====================
  
  // Obtener configuración del usuario
  const fetchConfig = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return null

      const { data, error } = await supabase
        .from('configuracion_finanzas')
        .select('*')
        .eq('user_id', user.id)
        .single()

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching config:', error)
        return null
      }

      if (data) {
        setConfig(data)
        setSaldoRealBanco(data.saldo_inicial || 0)
      }
      
      return data
    } catch (error) {
      console.error('Error in fetchConfig:', error)
      return null
    }
  }

  // Guardar o actualizar configuración
  const saveConfig = async (configData) => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return { data: null, error: 'No user' }

      const { data, error } = await supabase
        .from('configuracion_finanzas')
        .upsert({
          user_id: user.id,
          saldo_inicial: configData.saldo_inicial,
          fecha_inicio: configData.fecha_inicio,
          cuenta_bancaria: configData.cuenta_bancaria,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'user_id'
        })
        .select()
        .single()

      if (data) {
        setConfig(data)
        setSaldoRealBanco(data.saldo_inicial)
      }
      
      return { data, error }
    } catch (error) {
      console.error('Error saving config:', error)
      return { data: null, error }
    }
  }

  // ==================== MOVIMIENTOS REALIZADOS ====================

  // Obtener movimientos realizados (no agendados)
  const fetchMovimientos = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return { data: [], error: 'No user' }

      const { data, error } = await supabase
        .from('movimientos_financieros')
        .select('*')
        .eq('user_id', user.id)
        .eq('agendado', false)
        .order('fecha', { ascending: false })

      if (error) {
        console.error('Error fetching movimientos:', error)
        return { data: [], error }
      }

      if (data) {
        setMovimientos(data)
      }
      
      return { data: data || [], error: null }
    } catch (error) {
      console.error('Error in fetchMovimientos:', error)
      return { data: [], error }
    }
  }

  // ==================== MOVIMIENTOS AGENDADOS ====================

  // Obtener movimientos agendados (futuros)
  const fetchMovimientosAgendados = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return { data: [], error: 'No user' }

      const { data, error } = await supabase
        .from('movimientos_financieros')
        .select('*')
        .eq('user_id', user.id)
        .eq('agendado', true)
        .order('fecha', { ascending: true })

      if (error) {
        console.error('Error fetching agendados:', error)
        return { data: [], error }
      }

      if (data) {
        setMovimientosAgendados(data)
      }
      
      return { data: data || [], error: null }
    } catch (error) {
      console.error('Error in fetchMovimientosAgendados:', error)
      return { data: [], error }
    }
  }

  // ==================== CREAR MOVIMIENTO ====================

  const crearMovimiento = async (movimiento) => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return { data: null, error: 'No user' }

      const { data, error } = await supabase
        .from('movimientos_financieros')
        .insert({
          user_id: user.id,
          tipo: movimiento.tipo,
          monto: parseFloat(movimiento.monto),
          categoria: movimiento.categoria,
          proveedor: movimiento.proveedor || null,
          cliente: movimiento.cliente || null,
          fecha: movimiento.fecha,
          agendado: movimiento.agendado || false,
          estado: movimiento.agendado ? 'pendiente' : 'realizado',
          confirmado: movimiento.confirmado || false,
          conciliado: false,
          recordar: movimiento.recordar || false,
          dias_antes: movimiento.diasAntes || 3,
          notas: movimiento.notas || null
        })
        .select()
        .single()

      if (error) {
        console.error('Error creating movimiento:', error)
        return { data: null, error }
      }

      if (data) {
        // Actualizar estado local
        if (data.agendado) {
          setMovimientosAgendados(prev => [...prev, data].sort((a, b) => 
            new Date(a.fecha) - new Date(b.fecha)
          ))
        } else {
          setMovimientos(prev => [data, ...prev])
        }
      }
      
      return { data, error: null }
    } catch (error) {
      console.error('Error in crearMovimiento:', error)
      return { data: null, error }
    }
  }

  // ==================== ACTUALIZAR MOVIMIENTO ====================

  const actualizarMovimiento = async (id, updates) => {
    try {
      const { data, error } = await supabase
        .from('movimientos_financieros')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single()

      if (error) {
        console.error('Error updating movimiento:', error)
        return { data: null, error }
      }

      if (data) {
        // Actualizar estado local
        if (data.agendado) {
          setMovimientosAgendados(prev =>
            prev.map(m => m.id === id ? data : m)
          )
        } else {
          setMovimientos(prev =>
            prev.map(m => m.id === id ? data : m)
          )
        }
      }
      
      return { data, error: null }
    } catch (error) {
      console.error('Error in actualizarMovimiento:', error)
      return { data: null, error }
    }
  }

  // ==================== CONFIRMAR PAGO AGENDADO ====================

  const confirmarPago = async (id) => {
    try {
      const { data, error } = await supabase
        .from('movimientos_financieros')
        .update({
          agendado: false,
          estado: 'realizado',
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single()

      if (error) {
        console.error('Error confirming pago:', error)
        return { data: null, error }
      }

      if (data) {
        // Mover de agendados a movimientos
        setMovimientosAgendados(prev => prev.filter(m => m.id !== id))
        setMovimientos(prev => [data, ...prev])
      }
      
      return { data, error: null }
    } catch (error) {
      console.error('Error in confirmarPago:', error)
      return { data: null, error }
    }
  }

  // ==================== CONCILIAR MOVIMIENTO ====================

  const conciliarMovimiento = async (id, conciliado = true) => {
    return await actualizarMovimiento(id, { conciliado })
  }

  // ==================== ELIMINAR MOVIMIENTO ====================

  const eliminarMovimiento = async (id) => {
    try {
      const { error } = await supabase
        .from('movimientos_financieros')
        .delete()
        .eq('id', id)

      if (error) {
        console.error('Error deleting movimiento:', error)
        return { error }
      }

      // Actualizar estado local
      setMovimientos(prev => prev.filter(m => m.id !== id))
      setMovimientosAgendados(prev => prev.filter(m => m.id !== id))
      
      return { error: null }
    } catch (error) {
      console.error('Error in eliminarMovimiento:', error)
      return { error }
    }
  }

  // ==================== CÁLCULOS ====================

  // Calcular saldo actual basado en configuración + movimientos
  const calcularSaldoActual = () => {
    if (!config) return 0

    const totalMovimientos = movimientos.reduce((acc, mov) => {
      return mov.tipo === 'ingreso' ? acc + parseFloat(mov.monto) : acc - parseFloat(mov.monto)
    }, parseFloat(config.saldo_inicial))

    return totalMovimientos
  }

  // Calcular proyección de saldo con movimientos agendados
  const calcularProyeccion = (soloConfirmados = false) => {
    const saldoBase = calcularSaldoActual()
    const proyecciones = []
    
    const movimientosParaProyectar = soloConfirmados 
      ? movimientosAgendados.filter(m => m.confirmado)
      : movimientosAgendados
    
    let saldoAcumulado = saldoBase

    movimientosParaProyectar.forEach(mov => {
      saldoAcumulado = mov.tipo === 'ingreso' 
        ? saldoAcumulado + parseFloat(mov.monto) 
        : saldoAcumulado - parseFloat(mov.monto)
      
      proyecciones.push({
        fecha: mov.fecha,
        movimiento: mov,
        saldoProyectado: saldoAcumulado
      })
    })
    
    return proyecciones
  }

  // Calcular recordatorios activos
  const calcularRecordatoriosActivos = () => {
    const hoy = new Date()
    hoy.setHours(0, 0, 0, 0)
    const recordatorios = []
    
    movimientosAgendados.forEach(mov => {
      if (mov.recordar) {
        const fechaPago = new Date(mov.fecha + 'T00:00:00')
        const diasRestantes = Math.ceil((fechaPago - hoy) / (1000 * 60 * 60 * 24))
        
        // Si estamos dentro del rango de días antes configurado
        if (diasRestantes <= mov.dias_antes && diasRestantes >= 0) {
          recordatorios.push({
            ...mov,
            diasRestantes,
            urgente: diasRestantes <= 2
          })
        }
      }
    })
    
    return recordatorios.sort((a, b) => a.diasRestantes - b.diasRestantes)
  }

  // ==================== REFRESH ====================

  const refresh = async () => {
    setLoading(true)
    await Promise.all([
      fetchConfig(),
      fetchMovimientos(),
      fetchMovimientosAgendados()
    ])
    setLoading(false)
  }

  // ==================== CARGAR DATOS AL INICIO ====================

  useEffect(() => {
    const loadData = async () => {
      setLoading(true)
      await Promise.all([
        fetchConfig(),
        fetchMovimientos(),
        fetchMovimientosAgendados()
      ])
      setLoading(false)
    }
    loadData()
  }, [])

  // ==================== SUSCRIPCIÓN TIEMPO REAL (OPCIONAL) ====================

  useEffect(() => {
    const setupRealtimeSubscription = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const subscription = supabase
        .channel('movimientos_changes')
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'movimientos_financieros',
          filter: `user_id=eq.${user.id}`
        }, (payload) => {
          console.log('Realtime change:', payload)
          
          if (payload.eventType === 'INSERT') {
            const nuevo = payload.new
            if (nuevo.agendado) {
              setMovimientosAgendados(prev => [...prev, nuevo].sort((a, b) => 
                new Date(a.fecha) - new Date(b.fecha)
              ))
            } else {
              setMovimientos(prev => [nuevo, ...prev])
            }
          } else if (payload.eventType === 'UPDATE') {
            const actualizado = payload.new
            if (actualizado.agendado) {
              setMovimientosAgendados(prev =>
                prev.map(m => m.id === actualizado.id ? actualizado : m)
              )
            } else {
              setMovimientos(prev =>
                prev.map(m => m.id === actualizado.id ? actualizado : m)
              )
              // Si cambió de agendado a no agendado, quitarlo de agendados
              setMovimientosAgendados(prev => prev.filter(m => m.id !== actualizado.id))
            }
          } else if (payload.eventType === 'DELETE') {
            const id = payload.old.id
            setMovimientos(prev => prev.filter(m => m.id !== id))
            setMovimientosAgendados(prev => prev.filter(m => m.id !== id))
          }
        })
        .subscribe()

      return () => {
        subscription.unsubscribe()
      }
    }

    setupRealtimeSubscription()
  }, [])

  // ==================== RETURN ====================

  return {
    // Estado
    config,
    movimientos,
    movimientosAgendados,
    loading,
    saldoRealBanco,
    setSaldoRealBanco,

    // Funciones de configuración
    saveConfig,

    // Funciones de movimientos
    crearMovimiento,
    actualizarMovimiento,
    confirmarPago,
    conciliarMovimiento,
    eliminarMovimiento,

    // Funciones de cálculo
    calcularSaldoActual,
    calcularProyeccion,
    calcularRecordatoriosActivos,

    // Utilidades
    refresh
  }
}
