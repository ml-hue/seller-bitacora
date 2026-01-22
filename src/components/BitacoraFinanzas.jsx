import React, { useState, useEffect } from 'react';
import { Calendar, TrendingUp, TrendingDown, AlertCircle, Plus, DollarSign, Check, Clock, Filter } from 'lucide-react';
import { useFinanzas } from '../hooks/useFinanzas';

const BitacoraFinanzas = () => {
  // No need to force global styles - inherit from parent Dashboard

  const [activeTab, setActiveTab] = useState('dashboard');
  const [showMovimientoForm, setShowMovimientoForm] = useState(false);
  const [showConfigForm, setShowConfigForm] = useState(false);
  const [filtroVista, setFiltroVista] = useState('todos');
  
  // Hook de Supabase
  const {
    config,
    movimientos,
    movimientosAgendados,
    loading,
    saldoRealBanco,
    setSaldoRealBanco,
    saveConfig,
    crearMovimiento,
    actualizarMovimiento,
    confirmarPago,
    calcularSaldoActual,
    calcularProyeccion,
    calcularRecordatoriosActivos
  } = useFinanzas();

  // Formulario configuración inicial
  const [configForm, setConfigForm] = useState({
    saldo_inicial: '',
    fecha_inicio: new Date().toISOString().split('T')[0],
    cuenta_bancaria: ''
  });

  // Formulario nuevo movimiento
  const [nuevoMovimiento, setNuevoMovimiento] = useState({
    tipo: 'egreso',
    monto: '',
    categoria: '',
    proveedor: '',
    cliente: '',
    fecha: new Date().toISOString().split('T')[0],
    agendado: false,
    recordar: false,
    diasAntes: 3
  });

  const formatearMonto = (monto) => {
    return new Intl.NumberFormat('es-PY', {
      style: 'currency',
      currency: 'PYG',
      minimumFractionDigits: 0
    }).format(monto);
  };

  const formatearFecha = (fecha) => {
    return new Date(fecha + 'T00:00:00').toLocaleDateString('es-PY', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  const handleSaveConfig = async () => {
    const { data, error } = await saveConfig(configForm);
    if (!error) {
      setShowConfigForm(false);
      setConfigForm({
        saldo_inicial: '',
        fecha_inicio: new Date().toISOString().split('T')[0],
        cuenta_bancaria: ''
      });
    } else {
      alert('Error al guardar configuración: ' + error.message);
    }
  };

  const handleAgregarMovimiento = async () => {
    if (!nuevoMovimiento.monto || !nuevoMovimiento.categoria) {
      alert('Por favor completa los campos requeridos');
      return;
    }

    const { data, error } = await crearMovimiento(nuevoMovimiento);
    
    if (!error) {
      setNuevoMovimiento({
        tipo: 'egreso',
        monto: '',
        categoria: '',
        proveedor: '',
        cliente: '',
        fecha: new Date().toISOString().split('T')[0],
        agendado: false,
        recordar: false,
        diasAntes: 3
      });
      setShowMovimientoForm(false);
    } else {
      alert('Error al crear movimiento: ' + error.message);
    }
  };

  const handleConfirmarPago = async (id) => {
    const { error } = await confirmarPago(id);
    if (error) {
      alert('Error al confirmar pago: ' + error.message);
    }
  };

  // Si no hay configuración, mostrar setup inicial
  if (!loading && !config) {
    return (
      <div className="p-6 flex items-center justify-center">
        <div className="bg-[#1a2942] rounded-lg shadow-xl max-w-md w-full p-8 border border-gray-700">
          <h2 className="text-2xl font-bold text-white mb-6">Configuración Inicial</h2>
          <p className="text-gray-400 mb-6">Antes de empezar, configura tu cuenta bancaria:</p>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Saldo Inicial (₲)</label>
              <input
                type="number"
                value={configForm.saldo_inicial}
                onChange={(e) => setConfigForm({ ...configForm, saldo_inicial: e.target.value })}
                className="w-full px-3 py-2 bg-[#0f1a2e] border border-gray-700 rounded-lg text-white focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                placeholder="50000000"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Fecha de Inicio</label>
              <input
                type="date"
                value={configForm.fecha_inicio}
                onChange={(e) => setConfigForm({ ...configForm, fecha_inicio: e.target.value })}
                className="w-full px-3 py-2 bg-[#0f1a2e] border border-gray-700 rounded-lg text-white focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Nombre de Cuenta Bancaria</label>
              <input
                type="text"
                value={configForm.cuenta_bancaria}
                onChange={(e) => setConfigForm({ ...configForm, cuenta_bancaria: e.target.value })}
                className="w-full px-3 py-2 bg-[#0f1a2e] border border-gray-700 rounded-lg text-white focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                placeholder="Banco Regional - Cuenta Corriente"
              />
            </div>
          </div>

          <button
            onClick={handleSaveConfig}
            disabled={!configForm.saldo_inicial || !configForm.cuenta_bancaria}
            className="w-full mt-6 px-4 py-3 bg-cyan-500 text-white rounded-lg hover:bg-cyan-400 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Guardar y Comenzar
          </button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="p-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-white text-xl">Cargando...</div>
        </div>
      </div>
    );
  }

  const saldoActual = calcularSaldoActual();
  const diferenciaBanco = saldoActual - saldoRealBanco;
  const proyecciones = calcularProyeccion(filtroVista === 'confirmados');
  const saldoProyectado30Dias = proyecciones.length > 0 ? proyecciones[proyecciones.length - 1].saldoProyectado : saldoActual;
  const recordatoriosActivos = calcularRecordatoriosActivos();
  const alertasSaldo = proyecciones.filter(p => p.saldoProyectado < 10000000);

  return (
      <div className="finanzas-module">
       <div className="p-6">
         <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Módulo de Finanzas</h1>
          <p className="text-gray-400">Control de Cashflow - {config?.cuenta_bancaria}</p>
        </div>

        {/* Tabs */}
        <div className="flex gap-4 mb-6 border-b border-gray-700">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`pb-3 px-4 font-medium transition-colors ${
              activeTab === 'dashboard'
                ? 'border-b-2 border-cyan-400 text-cyan-400'
                : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            Dashboard
          </button>
          <button
            onClick={() => setActiveTab('movimientos')}
            className={`pb-3 px-4 font-medium transition-colors ${
              activeTab === 'movimientos'
                ? 'border-b-2 border-cyan-400 text-cyan-400'
                : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            Movimientos
          </button>
          <button
            onClick={() => setActiveTab('agendados')}
            className={`pb-3 px-4 font-medium transition-colors ${
              activeTab === 'agendados'
                ? 'border-b-2 border-cyan-400 text-cyan-400'
                : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            Pagos Agendados
          </button>
        </div>

        {/* Dashboard Tab */}
        {activeTab === 'dashboard' && (
          <div className="space-y-6">
            {/* Resumen Principal */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Saldo Actual */}
              <div className="bg-[#1a2942] rounded-lg shadow-lg p-6 border border-gray-800">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-gray-400 text-sm">Saldo según Bitácora</span>
                  <DollarSign className="text-cyan-400 w-5 h-5" />
                </div>
                <div className="text-3xl font-bold text-white mb-1">
                  {formatearMonto(saldoActual)}
                </div>
                <div className="text-sm text-gray-500">Actualizado hoy</div>
              </div>

              {/* Saldo Real Banco */}
              <div className="bg-[#1a2942] rounded-lg shadow-lg p-6 border border-gray-800">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-gray-400 text-sm">Saldo real en banco</span>
                  <input
                    type="number"
                    value={saldoRealBanco}
                    onChange={(e) => setSaldoRealBanco(parseFloat(e.target.value) || 0)}
                    className="w-24 text-right bg-transparent border-b border-gray-600 focus:border-cyan-400 outline-none text-xs text-white"
                  />
                </div>
                <div className="text-3xl font-bold text-white mb-1">
                  {formatearMonto(saldoRealBanco)}
                </div>
                <div className={`text-sm flex items-center gap-1 ${Math.abs(diferenciaBanco) < 1000 ? 'text-green-400' : 'text-orange-400'}`}>
                  {Math.abs(diferenciaBanco) < 1000 ? (
                    <>
                      <Check className="w-4 h-4" />
                      Conciliado
                    </>
                  ) : (
                    <>
                      <AlertCircle className="w-4 h-4" />
                      Diferencia: {formatearMonto(Math.abs(diferenciaBanco))}
                    </>
                  )}
                </div>
              </div>

              {/* Proyección 30 días */}
              <div className="bg-[#1a2942] rounded-lg shadow-lg p-6 border border-gray-800">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-gray-400 text-sm">Proyección 30 días</span>
                  <TrendingUp className={`w-5 h-5 ${saldoProyectado30Dias >= saldoActual ? 'text-green-400' : 'text-red-400'}`} />
                </div>
                <div className={`text-3xl font-bold mb-1 ${saldoProyectado30Dias < 10000000 ? 'text-red-400' : 'text-white'}`}>
                  {formatearMonto(saldoProyectado30Dias)}
                </div>
                <div className="text-sm text-gray-500">
                  {saldoProyectado30Dias >= saldoActual ? '+' : ''}{formatearMonto(saldoProyectado30Dias - saldoActual)} vs hoy
                </div>
              </div>
            </div>

            {/* Filtro de Vista */}
            <div className="bg-[#1a2942] rounded-lg shadow-lg p-4 border border-gray-800">
              <div className="flex items-center gap-4">
                <Filter className="w-5 h-5 text-gray-400" />
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    checked={filtroVista === 'todos'}
                    onChange={() => setFiltroVista('todos')}
                    className="w-4 h-4 text-cyan-400"
                  />
                  <span className="text-sm text-gray-300">Todos los pagos agendados</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    checked={filtroVista === 'confirmados'}
                    onChange={() => setFiltroVista('confirmados')}
                    className="w-4 h-4 text-cyan-400"
                  />
                  <span className="text-sm text-gray-300">Solo pagos confirmados</span>
                </label>
              </div>
            </div>

            {/* Alertas */}
            {alertasSaldo.length > 0 && (
              <div className="bg-red-900/20 border border-red-800/50 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-red-400 mt-0.5" />
                  <div>
                    <h3 className="font-semibold text-red-300 mb-1">⚠️ Alerta de Saldo Bajo</h3>
                    <p className="text-sm text-red-200">
                      Tu saldo proyectado caerá por debajo de ₲10.000.000 en {alertasSaldo.length} fecha(s). Revisa tus pagos agendados.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Recordatorios Activos */}
            {recordatoriosActivos.length > 0 && (
              <div className="bg-[#1a2942] rounded-lg shadow-lg p-6 border border-gray-800">
                <div className="flex items-center gap-2 mb-4">
                  <AlertCircle className="w-5 h-5 text-cyan-400" />
                  <h3 className="font-semibold text-white">🔔 Recordatorios Activos</h3>
                  <span className="bg-cyan-900/30 text-cyan-400 px-2 py-0.5 rounded text-xs font-medium border border-cyan-800/50">
                    {recordatoriosActivos.length}
                  </span>
                </div>
                <div className="space-y-3">
                  {recordatoriosActivos.map(rec => (
                    <div 
                      key={rec.id} 
                      className={`flex items-center justify-between p-4 rounded-lg border ${
                        rec.urgente 
                          ? 'bg-orange-900/20 border-orange-800/50' 
                          : 'bg-blue-900/20 border-blue-800/50'
                      }`}
                    >
                      <div className="flex items-start gap-3 flex-1">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                          rec.urgente ? 'bg-orange-500/20' : 'bg-blue-500/20'
                        }`}>
                          <Calendar className={`w-5 h-5 ${rec.urgente ? 'text-orange-400' : 'text-blue-400'}`} />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium text-white">
                              {rec.tipo === 'ingreso' ? 'Facturar a' : 'Pagar'} {rec.proveedor || rec.cliente}
                            </span>
                            {rec.urgente && (
                              <span className="text-xs bg-orange-900/30 text-orange-400 px-2 py-0.5 rounded border border-orange-800/50">
                                Urgente
                              </span>
                            )}
                          </div>
                          <div className="text-sm text-gray-400 mb-1">{rec.categoria}</div>
                          <div className="flex items-center gap-3 text-sm">
                            <span className={rec.tipo === 'ingreso' ? 'text-green-400 font-semibold' : 'text-red-400 font-semibold'}>
                              {rec.tipo === 'ingreso' ? '+' : '-'}{formatearMonto(rec.monto)}
                            </span>
                            <span className="text-gray-500">•</span>
                            <span className="text-gray-400">{formatearFecha(rec.fecha)}</span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right ml-4">
                        <div className={`text-2xl font-bold ${rec.urgente ? 'text-orange-400' : 'text-blue-400'}`}>
                          {rec.diasRestantes}
                        </div>
                        <div className="text-xs text-gray-400">
                          {rec.diasRestantes === 0 ? 'Hoy' : rec.diasRestantes === 1 ? 'día' : 'días'}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Proyección Timeline */}
            <div className="bg-[#1a2942] rounded-lg shadow-lg border border-gray-800">
              <div className="p-6 border-b border-gray-700">
                <h2 className="text-xl font-semibold text-white">Proyección de Saldo</h2>
                <p className="text-sm text-gray-400 mt-1">
                  Mostrando: {filtroVista === 'confirmados' ? 'Solo pagos confirmados' : 'Todos los pagos agendados'}
                </p>
              </div>
              <div className="p-6">
                {/* Saldo Actual */}
                <div className="flex items-center gap-4 pb-4">
                  <div className="w-24 text-sm text-gray-400 font-medium">Hoy</div>
                  <div className="flex-1 flex items-center gap-4">
                    <div className="w-3 h-3 rounded-full bg-cyan-400"></div>
                    <div className="flex-1">
                      <div className="font-semibold text-gray-300">Saldo Actual</div>
                      <div className="text-2xl font-bold text-cyan-400">{formatearMonto(saldoActual)}</div>
                    </div>
                  </div>
                </div>

                {/* Proyecciones */}
                {proyecciones.length > 0 ? (
                  <div className="border-l-2 border-gray-700 ml-12 pl-8 space-y-6">
                    {proyecciones.map((proj, index) => (
                      <div key={index} className="relative">
                        <div className={`absolute -left-9 w-4 h-4 rounded-full border-2 border-[#1a2942] ${
                          proj.movimiento.tipo === 'ingreso' ? 'bg-green-400' : 'bg-red-400'
                        }`}></div>
                        
                        <div className="flex items-start gap-4">
                          <div className="w-24 text-sm text-gray-400 font-medium">
                            {formatearFecha(proj.fecha)}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              {proj.movimiento.tipo === 'ingreso' ? (
                                <TrendingUp className="w-4 h-4 text-green-400" />
                              ) : (
                                <TrendingDown className="w-4 h-4 text-red-400" />
                              )}
                              <span className="font-medium text-white">
                                {proj.movimiento.categoria}
                              </span>
                              {!proj.movimiento.confirmado && (
                                <span className="text-xs bg-yellow-900/30 text-yellow-400 px-2 py-0.5 rounded border border-yellow-800/50">
                                  No confirmado
                                </span>
                              )}
                            </div>
                            <div className="text-sm text-gray-400 mb-1">
                              {proj.movimiento.proveedor || proj.movimiento.cliente}
                            </div>
                            <div className="flex items-baseline gap-3">
                              <span className={`text-lg font-semibold ${
                                proj.movimiento.tipo === 'ingreso' ? 'text-green-400' : 'text-red-400'
                              }`}>
                                {proj.movimiento.tipo === 'ingreso' ? '+' : '-'}{formatearMonto(proj.movimiento.monto)}
                              </span>
                              <span className="text-sm text-gray-500">→</span>
                              <span className={`text-xl font-bold ${
                                proj.saldoProyectado < 10000000 ? 'text-red-400' : 'text-white'
                              }`}>
                                {formatearMonto(proj.saldoProyectado)}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center text-gray-500 py-8">
                    No hay pagos agendados
                  </div>
                )}
              </div>
            </div>

            {/* Resumen de la Semana */}
            {movimientosAgendados.filter(m => {
              const diff = (new Date(m.fecha) - new Date()) / (1000 * 60 * 60 * 24);
              return diff <= 7 && diff >= 0;
            }).length > 0 && (
              <div className="bg-[#1a2942] rounded-lg shadow-lg p-6 border border-gray-800">
                <h3 className="font-semibold text-white mb-4">⚠️ Pendiente esta semana</h3>
                <div className="space-y-3">
                  {movimientosAgendados
                    .filter(m => {
                      const diff = (new Date(m.fecha) - new Date()) / (1000 * 60 * 60 * 24);
                      return diff <= 7 && diff >= 0;
                    })
                    .map(mov => (
                      <div key={mov.id} className="flex items-center justify-between p-3 bg-[#0f1a2e] rounded border border-gray-700">
                        <div className="flex items-center gap-3">
                          <Clock className="w-4 h-4 text-gray-400" />
                          <div>
                            <div className="font-medium text-white">{mov.categoria}</div>
                            <div className="text-sm text-gray-400">{mov.proveedor || mov.cliente}</div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className={`font-semibold ${mov.tipo === 'ingreso' ? 'text-green-400' : 'text-red-400'}`}>
                            {mov.tipo === 'ingreso' ? '+' : '-'}{formatearMonto(mov.monto)}
                          </div>
                          <div className="text-xs text-gray-500">{formatearFecha(mov.fecha)}</div>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Movimientos Tab */}
        {activeTab === 'movimientos' && (
          <div className="bg-[#1a2942] rounded-lg shadow-lg border border-gray-800">
            <div className="p-6 border-b border-gray-700">
              <h2 className="text-xl font-semibold text-white">Movimientos Registrados</h2>
            </div>
            {movimientos.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-[#0f1a2e]">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Fecha</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Tipo</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Categoría</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Proveedor/Cliente</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-400 uppercase">Monto</th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-gray-400 uppercase">Estado</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-700">
                    {movimientos.map(mov => (
                      <tr key={mov.id} className="hover:bg-[#0f1a2e] transition-colors">
                        <td className="px-6 py-4 text-sm text-gray-300">{formatearFecha(mov.fecha)}</td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium ${
                            mov.tipo === 'ingreso' ? 'bg-green-900/30 text-green-400 border border-green-800/50' : 'bg-red-900/30 text-red-400 border border-red-800/50'
                          }`}>
                            {mov.tipo === 'ingreso' ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                            {mov.tipo === 'ingreso' ? 'Ingreso' : 'Egreso'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-300">{mov.categoria}</td>
                        <td className="px-6 py-4 text-sm text-gray-400">{mov.proveedor || mov.cliente}</td>
                        <td className="px-6 py-4 text-sm text-right font-semibold">
                          <span className={mov.tipo === 'ingreso' ? 'text-green-400' : 'text-red-400'}>
                            {mov.tipo === 'ingreso' ? '+' : '-'}{formatearMonto(mov.monto)}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          {mov.conciliado ? (
                            <span className="inline-flex items-center gap-1 text-xs text-green-400">
                              <Check className="w-3 h-3" />
                              Conciliado
                            </span>
                          ) : (
                            <span className="text-xs text-gray-500">Pendiente</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-12 text-center text-gray-500">
                No hay movimientos registrados
              </div>
            )}
          </div>
        )}

        {/* Agendados Tab */}
        {activeTab === 'agendados' && (
          <div className="bg-[#1a2942] rounded-lg shadow-lg border border-gray-800">
            <div className="p-6 border-b border-gray-700">
              <h2 className="text-xl font-semibold text-white">Pagos Agendados</h2>
            </div>
            {movimientosAgendados.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-[#0f1a2e]">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Fecha</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Tipo</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Categoría</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Proveedor/Cliente</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-400 uppercase">Monto</th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-gray-400 uppercase">Recordatorio</th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-gray-400 uppercase">Estado</th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-gray-400 uppercase">Acción</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-700">
                    {movimientosAgendados.map(mov => (
                      <tr key={mov.id} className="hover:bg-[#0f1a2e] transition-colors">
                        <td className="px-6 py-4 text-sm text-gray-300">{formatearFecha(mov.fecha)}</td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium ${
                            mov.tipo === 'ingreso' ? 'bg-green-900/30 text-green-400 border border-green-800/50' : 'bg-red-900/30 text-red-400 border border-red-800/50'
                          }`}>
                            {mov.tipo === 'ingreso' ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                            {mov.tipo === 'ingreso' ? 'Ingreso' : 'Egreso'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-300">{mov.categoria}</td>
                        <td className="px-6 py-4 text-sm text-gray-400">{mov.proveedor || mov.cliente}</td>
                        <td className="px-6 py-4 text-sm text-right font-semibold">
                          <span className={mov.tipo === 'ingreso' ? 'text-green-400' : 'text-red-400'}>
                            {mov.tipo === 'ingreso' ? '+' : '-'}{formatearMonto(mov.monto)}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          {mov.recordar ? (
                            <div className="inline-flex items-center gap-1 text-xs bg-cyan-900/30 text-cyan-400 px-2 py-1 rounded border border-cyan-800/50">
                              <AlertCircle className="w-3 h-3" />
                              {mov.dias_antes}d antes
                            </div>
                          ) : (
                            <span className="text-xs text-gray-600">-</span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-center">
                          {mov.confirmado ? (
                            <span className="inline-flex items-center gap-1 text-xs bg-blue-900/30 text-blue-400 px-2 py-1 rounded border border-blue-800/50">
                              Confirmado
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-xs bg-yellow-900/30 text-yellow-400 px-2 py-1 rounded border border-yellow-800/50">
                              <Clock className="w-3 h-3" />
                              Pendiente
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-center">
                          <button 
                            onClick={() => handleConfirmarPago(mov.id)}
                            className="text-sm text-cyan-400 hover:text-cyan-300 font-medium"
                          >
                            Confirmar pago
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-12 text-center text-gray-500">
                No hay pagos agendados
              </div>
            )}
          </div>
        )}

        {/* Botón Flotante */}
        <button
          onClick={() => setShowMovimientoForm(true)}
          className="fixed bottom-8 right-8 bg-cyan-500 text-white p-4 rounded-full shadow-lg hover:bg-cyan-400 transition-colors"
        >
          <Plus className="w-6 h-6" />
        </button>

        {/* Modal Formulario */}
        {showMovimientoForm && (
          <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center p-4 z-50">
            <div className="bg-[#1a2942] rounded-lg shadow-xl max-w-md w-full p-6 border border-gray-700 max-h-[90vh] overflow-y-auto">
              <h3 className="text-xl font-semibold text-white mb-4">Nuevo Movimiento</h3>
              
              <div className="space-y-4">
                {/* Tipo */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Tipo</label>
                  <div className="flex gap-3">
                    <button
                      onClick={() => setNuevoMovimiento({ ...nuevoMovimiento, tipo: 'ingreso' })}
                      className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors ${
                        nuevoMovimiento.tipo === 'ingreso'
                          ? 'bg-green-600 text-white'
                          : 'bg-[#0f1a2e] text-gray-300 hover:bg-[#0a1220] border border-gray-700'
                      }`}
                    >
                      Ingreso
                    </button>
                    <button
                      onClick={() => setNuevoMovimiento({ ...nuevoMovimiento, tipo: 'egreso' })}
                      className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors ${
                        nuevoMovimiento.tipo === 'egreso'
                          ? 'bg-red-600 text-white'
                          : 'bg-[#0f1a2e] text-gray-300 hover:bg-[#0a1220] border border-gray-700'
                      }`}
                    >
                      Egreso
                    </button>
                  </div>
                </div>

                {/* Monto */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Monto (₲) *</label>
                  <input
                    type="number"
                    value={nuevoMovimiento.monto}
                    onChange={(e) => setNuevoMovimiento({ ...nuevoMovimiento, monto: e.target.value })}
                    className="w-full px-3 py-2 bg-[#0f1a2e] border border-gray-700 rounded-lg text-white focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                    placeholder="0"
                  />
                </div>

                {/* Categoría */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Categoría *</label>
                  <select
                    value={nuevoMovimiento.categoria}
                    onChange={(e) => setNuevoMovimiento({ ...nuevoMovimiento, categoria: e.target.value })}
                    className="w-full px-3 py-2 bg-[#0f1a2e] border border-gray-700 rounded-lg text-white focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                    style={{ backgroundColor: '#0f1a2e', color: 'white' }}
                  >
                    <option value="" style={{ backgroundColor: '#0f1a2e', color: 'white' }}>Seleccionar...</option>
                    {nuevoMovimiento.tipo === 'ingreso' ? (
                      <>
                        <option value="Ventas" style={{ backgroundColor: '#0f1a2e', color: 'white' }}>Ventas</option>
                        <option value="Servicios" style={{ backgroundColor: '#0f1a2e', color: 'white' }}>Servicios</option>
                        <option value="Otros Ingresos" style={{ backgroundColor: '#0f1a2e', color: 'white' }}>Otros Ingresos</option>
                      </>
                    ) : (
                      <>
                        <option value="Proveedores" style={{ backgroundColor: '#0f1a2e', color: 'white' }}>Proveedores</option>
                        <option value="Salarios" style={{ backgroundColor: '#0f1a2e', color: 'white' }}>Salarios</option>
                        <option value="Servicios" style={{ backgroundColor: '#0f1a2e', color: 'white' }}>Servicios</option>
                        <option value="Impuestos" style={{ backgroundColor: '#0f1a2e', color: 'white' }}>Impuestos</option>
                        <option value="Otros Gastos" style={{ backgroundColor: '#0f1a2e', color: 'white' }}>Otros Gastos</option>
                      </>
                    )}
                  </select>
                </div>

                {/* Proveedor/Cliente */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    {nuevoMovimiento.tipo === 'ingreso' ? 'Cliente' : 'Proveedor'}
                  </label>
                  <input
                    type="text"
                    value={nuevoMovimiento.tipo === 'ingreso' ? nuevoMovimiento.cliente : nuevoMovimiento.proveedor}
                    onChange={(e) => setNuevoMovimiento({
                      ...nuevoMovimiento,
                      [nuevoMovimiento.tipo === 'ingreso' ? 'cliente' : 'proveedor']: e.target.value
                    })}
                    className="w-full px-3 py-2 bg-[#0f1a2e] border border-gray-700 rounded-lg text-white focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                  />
                </div>

                {/* Fecha */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Fecha</label>
                  <input
                    type="date"
                    value={nuevoMovimiento.fecha}
                    onChange={(e) => setNuevoMovimiento({ ...nuevoMovimiento, fecha: e.target.value })}
                    className="w-full px-3 py-2 bg-[#0f1a2e] border border-gray-700 rounded-lg text-white focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                  />
                </div>

                {/* Agendado */}
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="agendado"
                    checked={nuevoMovimiento.agendado}
                    onChange={(e) => setNuevoMovimiento({ ...nuevoMovimiento, agendado: e.target.checked })}
                    className="w-4 h-4 text-cyan-500 rounded bg-[#0f1a2e] border-gray-700"
                  />
                  <label htmlFor="agendado" className="text-sm text-gray-300">
                    Agendar para fecha futura
                  </label>
                </div>

                {/* Recordatorio - Solo si está agendado */}
                {nuevoMovimiento.agendado && (
                  <div className="bg-[#0f1a2e] border border-gray-700 rounded-lg p-4 space-y-3">
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="recordar"
                        checked={nuevoMovimiento.recordar}
                        onChange={(e) => setNuevoMovimiento({ ...nuevoMovimiento, recordar: e.target.checked })}
                        className="w-4 h-4 text-cyan-500 rounded bg-[#0a1220] border-gray-600"
                      />
                      <label htmlFor="recordar" className="text-sm text-gray-300 flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 text-cyan-400" />
                        Activar recordatorio
                      </label>
                    </div>
                    
                    {nuevoMovimiento.recordar && (
                      <div>
                        <label className="block text-xs text-gray-400 mb-2">Recordar con cuántos días de anticipación</label>
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            min="1"
                            max="30"
                            value={nuevoMovimiento.diasAntes}
                            onChange={(e) => setNuevoMovimiento({ ...nuevoMovimiento, diasAntes: parseInt(e.target.value) || 1 })}
                            className="w-20 px-3 py-2 bg-[#0a1220] border border-gray-600 rounded-lg text-white text-center focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                          />
                          <span className="text-sm text-gray-400">días antes</span>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div> 

              {/* Botones */}
              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setShowMovimientoForm(false)}
                  className="flex-1 px-4 py-2 border border-gray-600 rounded-lg text-gray-300 hover:bg-[#0f1a2e] font-medium"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleAgregarMovimiento}
                  disabled={!nuevoMovimiento.monto || !nuevoMovimiento.categoria}
                  className="flex-1 px-4 py-2 bg-cyan-500 text-white rounded-lg hover:bg-cyan-400 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Guardar
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default BitacoraFinanzas;
