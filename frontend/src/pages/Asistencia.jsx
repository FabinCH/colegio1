// ============================================
// pages/Asistencia.jsx — Control de Asistencia Completo
// ============================================

import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import API from '../api/axiosConfig';
import { registrarAsistenciaConOffline } from '../api/syncManager';
import { guardarAsistenciaCache, obtenerAsistenciaCache } from '../api/offlineDB';
import { useOffline } from '../context/OfflineContext';

const Asistencia = () => {
  const [searchParams] = useSearchParams();
  const cuadernoIdInicial = searchParams.get('cuaderno') || '';
  const { isOnline, pendientes, syncCompletadoAt } = useOffline();
  const [guardadoOffline, setGuardadoOffline] = useState(false);

  const [cuadernos, setCuadernos] = useState([]);
  const [cuadernoSeleccionado, setCuadernoSeleccionado] = useState(cuadernoIdInicial);
  const [trimestre, setTrimestre] = useState('1');
  
  // Pestaña activa: 'registrar', 'historial', 'resumen'
  const [activeTab, setActiveTab] = useState('registrar');

  // Registrar / Editar Asistencia
  const [fecha, setFecha] = useState(new Date().toISOString().split('T')[0]);
  const [estudiantes, setEstudiantes] = useState([]);
  const [registros, setRegistros] = useState({}); // { estId: 'A'|'R'|'L'|'F' }
  const [asistenciaId, setAsistenciaId] = useState(null); // ID del registro si ya existe
  const [guardando, setGuardando] = useState(false);
  const [cargandoEstudiantes, setCargandoEstudiantes] = useState(false);

  // Historial y Resumen
  const [historial, setHistorial] = useState([]);
  const [cargandoHistorial, setCargandoHistorial] = useState(false);
  const [resumen, setResumen] = useState([]);
  const [cargandoResumen, setCargandoResumen] = useState(false);

  // Cargar cuadernos al inicio
  useEffect(() => {
    const fetchCuadernos = async () => {
      try {
        const { data } = await API.get('/cuadernos');
        setCuadernos(data.data || []);
      } catch (err) {
        console.error('Error al cargar cuadernos:', err);
      }
    };
    fetchCuadernos();
  }, []);

  // Cargar historial y resumen del trimestre
  const fetchHistorialYResumen = useCallback(async () => {
    if (!cuadernoSeleccionado) return;

    // ── Historial ──
    setCargandoHistorial(true);
    if (isOnline) {
      try {
        const { data } = await API.get(`/asistencia?cuaderno=${cuadernoSeleccionado}&trimestre=${trimestre}`);
        const lista = data.data || [];
        setHistorial(lista);
        // Guardar en caché para uso offline
        if (lista.length > 0) await guardarAsistenciaCache(lista);
      } catch (err) {
        console.error('Error al cargar historial:', err);
        // Fallback a caché
        const cached = await obtenerAsistenciaCache(cuadernoSeleccionado, Number(trimestre));
        setHistorial(cached);
      }
    } else {
      // Sin internet: cargar desde IndexedDB
      const cached = await obtenerAsistenciaCache(cuadernoSeleccionado, Number(trimestre));
      setHistorial(cached);
    }
    setCargandoHistorial(false);

    // ── Resumen ── (solo si hay internet)
    if (isOnline) {
      try {
        setCargandoResumen(true);
        const { data } = await API.get(`/asistencia/resumen?cuaderno=${cuadernoSeleccionado}&trimestre=${trimestre}`);
        setResumen(data.data || []);
      } catch (err) {
        console.error('Error al cargar resumen:', err);
      } finally {
        setCargandoResumen(false);
      }
    }
  }, [cuadernoSeleccionado, trimestre, isOnline]);

  // Recargar historial desde el servidor cuando la sincronización se completa
  useEffect(() => {
    if (syncCompletadoAt && cuadernoSeleccionado && navigator.onLine) {
      // Pequeño delay para que el servidor procese antes de consultar
      const timer = setTimeout(() => {
        fetchHistorialYResumen();
      }, 1000);
      return () => clearTimeout(timer);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [syncCompletadoAt]);

  // Ejecutar carga de historial/resumen al cambiar cuaderno o trimestre
  useEffect(() => {
    fetchHistorialYResumen();
  }, [fetchHistorialYResumen]);

  // Cargar estudiantes INSCRITOS en el cuaderno (materia)
  useEffect(() => {
    if (cuadernoSeleccionado) {
      const fetchEstudiantes = async () => {
        try {
          setCargandoEstudiantes(true);
          // Obtener solo los estudiantes inscritos en esta materia
          const { data } = await API.get(`/inscripciones?cuaderno=${cuadernoSeleccionado}`);
          const inscripciones = data.data || [];
          // Extraer el objeto estudiante de cada inscripción
          const listaEst = inscripciones.map(ins => ins.estudiante).filter(Boolean);
          setEstudiantes(listaEst);
        } catch (err) {
          console.error('Error al cargar estudiantes inscritos:', err);
        } finally {
          setCargandoEstudiantes(false);
        }
      };
      fetchEstudiantes();
    } else {
      setEstudiantes([]);
      setRegistros({});
      setAsistenciaId(null);
    }
  }, [cuadernoSeleccionado]);

  // Buscar y sincronizar asistencia existente para la fecha seleccionada
  useEffect(() => {
    if (cuadernoSeleccionado && estudiantes.length > 0) {
      const targetFechaStr = fecha; // 'YYYY-MM-DD'
      
      const registroExistente = historial.find(h => {
        const hFechaStr = new Date(h.fecha).toISOString().split('T')[0];
        return hFechaStr === targetFechaStr;
      });

      if (registroExistente) {
        // Asistencia ya registrada -> cargar valores existentes
        const nuevosRegistros = {};
        // Inicializar con 'A' por defecto
        estudiantes.forEach(est => {
          nuevosRegistros[est._id] = 'A';
        });
        // Rellenar con los de la base de datos
        registroExistente.registros.forEach(reg => {
          const estId = reg.estudiante?._id || reg.estudiante;
          if (estId) {
            nuevosRegistros[estId] = reg.valor;
          }
        });
        setRegistros(nuevosRegistros);
        setAsistenciaId(registroExistente._id);
      } else {
        // Asistencia nueva -> inicializar todo con 'A'
        const nuevosRegistros = {};
        estudiantes.forEach(est => {
          nuevosRegistros[est._id] = 'A';
        });
        setRegistros(nuevosRegistros);
        setAsistenciaId(null);
      }
    }
  }, [fecha, historial, estudiantes, cuadernoSeleccionado]);

  const handleEstadoChange = (estId, estado) => {
    setRegistros(prev => ({ ...prev, [estId]: estado }));
  };

  const guardarAsistencia = async () => {
    if (!cuadernoSeleccionado) return alert('Seleccione un cuaderno');

    const registrosArray = estudiantes.map(est => ({
      estudiante: est._id,
      valor: registros[est._id] || 'A',
    }));

    setGuardando(true);
    setGuardadoOffline(false);

    try {
      if (asistenciaId && !asistenciaId.startsWith('temp_')) {
        // ── PUT: actualizar existente ──
        if (isOnline) {
          await API.put(`/asistencia/${asistenciaId}`, { registros: registrosArray });
        } else {
          // Guardar en cola offline
          const { agregarALaCola } = await import('../api/offlineDB');
          await agregarALaCola(
            'asistencia', 'PUT', `/asistencia/${asistenciaId}`,
            { registros: registrosArray }
          );
          setGuardadoOffline(true);
        }
      } else {
        // ── POST: registrar nuevo ──
        const payload = {
          cuaderno: cuadernoSeleccionado,
          trimestre: Number(trimestre),
          fecha,
          registros: registrosArray,
        };
        const { data, offline } = await registrarAsistenciaConOffline(payload);
        if (offline) {
          // Agregar al historial local inmediatamente para que aparezca en la UI
          setHistorial(prev => {
            const existe = prev.find(h => {
              const hf = new Date(h.fecha).toISOString().split('T')[0];
              return hf === fecha;
            });
            if (existe) return prev;
            return [{ ...data, registros: registrosArray.map(r => ({ ...r, _offline: true })) }, ...prev];
          });
          setAsistenciaId(data._id);
          setGuardadoOffline(true);
        }
      }

      if (!guardadoOffline) {
        await fetchHistorialYResumen();
      }
    } catch (err) {
      alert(err.response?.data?.mensaje || 'Error al guardar la asistencia');
    } finally {
      setGuardando(false);
    }
  };

  const eliminarRegistroAsistencia = async (id) => {
    if (window.confirm('¿Está seguro de eliminar permanentemente el registro de asistencia de este día?')) {
      try {
        await API.delete(`/asistencia/${id}`);
        alert('Registro de asistencia eliminado exitosamente');
        await fetchHistorialYResumen();
        // Si el día eliminado coincide con la fecha seleccionada en pantalla, resetear
        const registroEliminado = historial.find(h => h._id === id);
        if (registroEliminado) {
          const reFechaStr = new Date(registroEliminado.fecha).toISOString().split('T')[0];
          if (reFechaStr === fecha) {
            setAsistenciaId(null);
          }
        }
      } catch (err) {
        alert(err.response?.data?.mensaje || 'Error al eliminar el registro');
      }
    }
  };

  const formatearFecha = (fechaStr) => {
    if (!fechaStr) return '';
    const datePart = fechaStr.includes('T') ? fechaStr.split('T')[0] : fechaStr;
    const [year, month, day] = datePart.split('-');
    const fechaObj = new Date(Number(year), Number(month) - 1, Number(day));
    return fechaObj.toLocaleDateString('es-BO', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const obtenerResumenCounts = (regs) => {
    let A = 0, R = 0, L = 0, F = 0;
    regs.forEach(r => {
      if (r.valor === 'A') A++;
      else if (r.valor === 'R') R++;
      else if (r.valor === 'L') L++;
      else if (r.valor === 'F') F++;
    });
    return { A, R, L, F };
  };

  const getBtnClass = (estId, valorActual, valorBoton, colorClase) => {
    const seleccionado = valorActual === valorBoton;
    return `w-10 h-10 rounded-full font-bold transition-all transform hover:scale-105 ${
      seleccionado ? `${colorClase} text-white shadow-md` : 'bg-slate-100 text-slate-400 hover:bg-slate-200'
    }`;
  };

  return (
    <div className="page-container">
      {/* Modal de guardado offline */}
      {guardadoOffline && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
          backdropFilter: 'blur(4px)', zIndex: 300,
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem',
          animation: 'fadeIn 0.2s ease',
        }}>
          <div style={{
            background: 'var(--bg-secondary)', border: '2px solid var(--yellow-500)',
            borderRadius: '20px', padding: '2rem', maxWidth: '420px', width: '100%',
            textAlign: 'center', boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
            animation: 'slideInUp 0.3s ease',
          }}>
            <div style={{ fontSize: '3rem', marginBottom: '0.75rem' }}>📴</div>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
              Asistencia guardada localmente
            </h3>
            <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', marginBottom: '1.25rem' }}>
              No hay conexión a internet. Los datos se sincronizarán automáticamente
              con el servidor cuando recuperes la conexión.
            </p>
            <div style={{
              background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.3)',
              borderRadius: '10px', padding: '0.75rem 1rem', marginBottom: '1.25rem',
              fontSize: '0.8rem', color: 'var(--yellow-600)', fontWeight: 600,
            }}>
              ⏳ Total pendiente de sincronizar: {pendientes} registro(s)
            </div>
            <button
              onClick={() => setGuardadoOffline(false)}
              className="btn btn-secondary"
              style={{ width: '100%' }}
            >
              Entendido ✓
            </button>
          </div>
        </div>
      )}

      <div className="page-header">
        <div>
          <h1 className="page-title">Control de Asistencia</h1>
          <p className="page-subtitle">Gestión y estadísticas de asistencia escolar diaria</p>
        </div>
        {/* Indicador de estado */}
        {!isOnline && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: '0.5rem',
            background: 'rgba(239,68,68,0.1)', border: '1.5px solid rgba(239,68,68,0.3)',
            color: '#dc2626', padding: '0.5rem 1rem', borderRadius: '9999px',
            fontSize: '0.8rem', fontWeight: 700,
          }}>
            📵 Modo offline — los registros se guardan localmente
          </div>
        )}
      </div>

      {/* Controles Principales de Selección */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-2">📚 Cuaderno / Materia</label>
          <select 
            value={cuadernoSeleccionado} 
            onChange={(e) => setCuadernoSeleccionado(e.target.value)}
            className="w-full border border-slate-200 p-3 rounded-xl bg-slate-50 font-medium text-slate-800 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-colors"
          >
            <option value="">-- Seleccione un cuaderno pedagógico --</option>
            {cuadernos.map(c => (
              <option key={c._id} value={c._id}>
                {c.materia?.nombre} - {c.curso?.grado} "{c.curso?.paralelo}" ({c.curso?.turno})
              </option>
            ))}
          </select>
        </div>
        
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-2">⏳ Trimestre de Gestión</label>
          <select 
            value={trimestre} 
            onChange={(e) => setTrimestre(e.target.value)}
            className="w-full border border-slate-200 p-3 rounded-xl bg-slate-50 font-medium text-slate-800 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-colors"
          >
            <option value="1">Primer Trimestre</option>
            <option value="2">Segundo Trimestre</option>
            <option value="3">Tercer Trimestre</option>
          </select>
        </div>
      </div>

      {cuadernoSeleccionado ? (
        <div className="space-y-6">
          {/* Navegación por pestañas (Tabs) */}
          <div className="flex border-b border-slate-200 bg-white p-1 rounded-xl shadow-sm">
            <button
              onClick={() => setActiveTab('registrar')}
              className={`flex-1 py-3 px-4 font-bold text-sm rounded-lg transition-all flex items-center justify-center gap-2 ${
                activeTab === 'registrar'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
              }`}
            >
              📅 Registrar / Editar
            </button>
            <button
              onClick={() => setActiveTab('historial')}
              className={`flex-1 py-3 px-4 font-bold text-sm rounded-lg transition-all flex items-center justify-center gap-2 ${
                activeTab === 'historial'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
              }`}
            >
              📜 Historial de Fechas ({historial.length})
            </button>
            <button
              onClick={() => setActiveTab('resumen')}
              className={`flex-1 py-3 px-4 font-bold text-sm rounded-lg transition-all flex items-center justify-center gap-2 ${
                activeTab === 'resumen'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
              }`}
            >
              📊 Resumen Estadístico
            </button>
          </div>

          {/* CONTENIDO DE PESTAÑAS */}

          {/* 1. REGISTRAR / EDITAR */}
          {activeTab === 'registrar' && (
            <div className="space-y-4">
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex-1">
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Seleccionar Fecha</label>
                  <input 
                    type="date" 
                    value={fecha} 
                    onChange={(e) => setFecha(e.target.value)}
                    className="border border-slate-200 p-2.5 rounded-xl bg-slate-50 font-semibold text-slate-800 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all w-full md:w-64"
                  />
                </div>
                <div className="flex flex-col md:items-end justify-center">
                  <span className="text-sm font-bold text-slate-400 uppercase tracking-wider">Fecha Seleccionada</span>
                  <span className="text-lg font-extrabold text-blue-700">{formatearFecha(fecha)}</span>
                </div>
              </div>

              {/* Banner de Estado (Edición vs Registro Nuevo) */}
              {asistenciaId ? (
                <div className="bg-amber-50 border border-amber-200 text-amber-900 px-6 py-4 rounded-2xl flex items-center gap-3 shadow-inner">
                  <span className="text-2xl">✏️</span>
                  <div>
                    <p className="font-bold text-sm">Modo Edición Activo</p>
                    <p className="text-xs text-amber-700">Ya existe asistencia para esta fecha. Los cambios se guardarán modificando el registro original.</p>
                  </div>
                </div>
              ) : (
                <div className="bg-emerald-50 border border-emerald-200 text-emerald-900 px-6 py-4 rounded-2xl flex items-center gap-3 shadow-inner">
                  <span className="text-2xl">➕</span>
                  <div>
                    <p className="font-bold text-sm">Nuevo Registro Diario</p>
                    <p className="text-xs text-emerald-700">No hay asistencia guardada para esta fecha. Se creará un nuevo registro al guardar.</p>
                  </div>
                </div>
              )}

              {/* Tabla de Estudiantes */}
              {cargandoEstudiantes ? (
                <div className="bg-white p-12 rounded-2xl border text-center text-slate-500">Cargando lista de estudiantes...</div>
              ) : estudiantes.length > 0 ? (
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 text-sm font-semibold">
                          <th className="p-4 w-16 text-center">Nº</th>
                          <th className="p-4">Apellidos y Nombres</th>
                          <th className="p-4 text-center w-64">Estado de Asistencia</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {estudiantes.map((est, idx) => (
                          <tr key={est._id} className="hover:bg-slate-50 transition-colors">
                            <td className="p-4 text-center font-semibold text-slate-400">{idx + 1}</td>
                            <td className="p-4 font-bold text-slate-800">
                              {est.apellidos}, {est.nombres}
                            </td>
                            <td className="p-4">
                              <div className="flex justify-center gap-2">
                                <button 
                                  onClick={() => handleEstadoChange(est._id, 'A')}
                                  className={getBtnClass(est._id, registros[est._id], 'A', 'bg-emerald-500 shadow-emerald-200')}
                                  title="Asiste (A)"
                                >A</button>
                                <button 
                                  onClick={() => handleEstadoChange(est._id, 'R')}
                                  className={getBtnClass(est._id, registros[est._id], 'R', 'bg-amber-500 shadow-amber-200')}
                                  title="Retraso (R)"
                                >R</button>
                                <button 
                                  onClick={() => handleEstadoChange(est._id, 'L')}
                                  className={getBtnClass(est._id, registros[est._id], 'L', 'bg-blue-500 shadow-blue-200')}
                                  title="Licencia / Permiso (L)"
                                >L</button>
                                <button 
                                  onClick={() => handleEstadoChange(est._id, 'F')}
                                  className={getBtnClass(est._id, registros[est._id], 'F', 'bg-red-500 shadow-red-200')}
                                  title="Falta (F)"
                                >F</button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <div className="p-6 bg-slate-50 border-t border-slate-200 flex justify-end">
                    <button 
                      onClick={guardarAsistencia} 
                      disabled={guardando}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-xl font-bold shadow-md hover:shadow-lg transition-all disabled:opacity-50 flex items-center gap-2"
                    >
                      {guardando ? 'Guardando...' : '💾 Guardar Asistencia'}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="bg-amber-50 text-amber-800 p-8 rounded-2xl border border-amber-200 text-center">
                  <div className="text-3xl mb-2">📋</div>
                  <p className="font-bold">No hay estudiantes inscritos en esta materia</p>
                  <p className="text-sm text-amber-700 mt-1">Vaya al módulo de <strong>Materias</strong> y use el botón <strong>"👥 Inscribir Estudiantes"</strong> para agregar alumnos a esta materia.</p>
                </div>
              )}
            </div>
          )}

          {/* 2. HISTORIAL DE FECHAS */}
          {activeTab === 'historial' && (
            <div className="space-y-4">
              {cargandoHistorial ? (
                <div className="bg-white p-12 rounded-2xl border text-center text-slate-500">Cargando historial de asistencia...</div>
              ) : historial.length > 0 ? (
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 text-sm font-semibold">
                          <th className="p-4">Fecha</th>
                          <th className="p-4 text-center">Asiste (A)</th>
                          <th className="p-4 text-center">Retraso (R)</th>
                          <th className="p-4 text-center">Licencia (L)</th>
                          <th className="p-4 text-center">Falta (F)</th>
                          <th className="p-4 text-center">Acciones</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {historial.map(h => {
                          const counts = obtenerResumenCounts(h.registros);
                          const hFechaStr = new Date(h.fecha).toISOString().split('T')[0];
                          
                          return (
                            <tr key={h._id} className="hover:bg-slate-50 transition-colors">
                              <td className="p-4 font-bold text-slate-800">
                                {formatearFecha(hFechaStr)}
                              </td>
                              <td className="p-4 text-center font-bold text-emerald-600 bg-emerald-50/20">{counts.A}</td>
                              <td className="p-4 text-center font-bold text-amber-600 bg-amber-50/20">{counts.R}</td>
                              <td className="p-4 text-center font-bold text-blue-600 bg-blue-50/20">{counts.L}</td>
                              <td className="p-4 text-center font-bold text-red-600 bg-red-50/20">{counts.F}</td>
                              <td className="p-4">
                                <div className="flex justify-center gap-3">
                                  <button
                                    onClick={() => {
                                      setFecha(hFechaStr);
                                      setActiveTab('registrar');
                                    }}
                                    className="bg-blue-50 text-blue-700 hover:bg-blue-100 px-3 py-1.5 rounded-lg font-bold text-xs transition-colors"
                                    title="Cargar esta fecha en el editor"
                                  >
                                    ✏️ Editar
                                  </button>
                                  <button
                                    onClick={() => eliminarRegistroAsistencia(h._id)}
                                    className="bg-red-50 text-red-700 hover:bg-red-100 px-3 py-1.5 rounded-lg font-bold text-xs transition-colors"
                                    title="Eliminar este día de asistencia"
                                  >
                                    🗑️ Eliminar
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : (
                <div className="bg-slate-50 text-slate-600 p-12 rounded-2xl border border-dashed border-slate-300 text-center">
                  <span className="text-4xl mb-3 block">📭</span>
                  <p className="font-bold text-lg">No hay asistencias registradas</p>
                  <p className="text-sm text-slate-500 mt-1">Aún no se ha guardado asistencia para esta materia en este trimestre.</p>
                </div>
              )}
            </div>
          )}

          {/* 3. RESUMEN ESTADÍSTICO */}
          {activeTab === 'resumen' && (
            <div className="space-y-4">
              {cargandoResumen ? (
                <div className="bg-white p-12 rounded-2xl border text-center text-slate-500">Cargando resumen de asistencia...</div>
              ) : resumen.length > 0 ? (
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-slate-800 text-white text-sm font-semibold">
                          <th className="p-4 w-12 text-center border-r border-slate-700">Nº</th>
                          <th className="p-4 border-r border-slate-700">Estudiante</th>
                          <th className="p-4 border-r border-slate-700 text-center w-36">RUDE</th>
                          <th className="p-4 border-r border-slate-700 text-center w-24">Asiste (A)</th>
                          <th className="p-4 border-r border-slate-700 text-center w-24">Retraso (R)</th>
                          <th className="p-4 border-r border-slate-700 text-center w-24">Licencia (L)</th>
                          <th className="p-4 border-r border-slate-700 text-center w-24">Falta (F)</th>
                          <th className="p-4 border-r border-slate-700 text-center w-24 bg-slate-700">Total Días</th>
                          <th className="p-4 text-center w-32 bg-blue-700">Asistencia %</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200">
                        {resumen.map((r, idx) => {
                          // Calcular asistencia % (Asiste + Retraso) / totalDias * 100
                          const total = r.totalDias || 0;
                          const porcentaje = total > 0 
                            ? Math.round(((r.A + r.R) / total) * 100) 
                            : 0;

                          // Color del porcentaje
                          let badgeColor = 'bg-red-50 text-red-700 border-red-200';
                          if (porcentaje >= 90) badgeColor = 'bg-emerald-50 text-emerald-700 border-emerald-200';
                          else if (porcentaje >= 75) badgeColor = 'bg-amber-50 text-amber-700 border-amber-200';

                          return (
                            <tr key={r.estudiante?._id || idx} className="hover:bg-slate-50 transition-colors">
                              <td className="p-4 text-center font-semibold text-slate-400 border-r border-slate-100">{idx + 1}</td>
                              <td className="p-4 font-bold text-slate-800 border-r border-slate-100">
                                {r.estudiante?.apellidos}, {r.estudiante?.nombres}
                              </td>
                              <td className="p-4 text-center font-medium text-slate-500 border-r border-slate-100 text-xs">
                                {r.estudiante?.rude || '-'}
                              </td>
                              <td className="p-4 text-center font-bold text-emerald-600 border-r border-slate-100">{r.A}</td>
                              <td className="p-4 text-center font-bold text-amber-600 border-r border-slate-100">{r.R}</td>
                              <td className="p-4 text-center font-bold text-blue-600 border-r border-slate-100">{r.L}</td>
                              <td className="p-4 text-center font-bold text-red-600 border-r border-slate-100">{r.F}</td>
                              <td className="p-4 text-center font-bold text-slate-600 bg-slate-50/50 border-r border-slate-100">{total}</td>
                              <td className="p-4 bg-blue-50/20">
                                <div className="flex justify-center">
                                  <span className={`px-2.5 py-1 rounded-full text-xs font-extrabold border ${badgeColor}`}>
                                    {porcentaje}%
                                  </span>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : (
                <div className="bg-slate-50 text-slate-600 p-12 rounded-2xl border border-dashed border-slate-300 text-center">
                  <span className="text-4xl mb-3 block">📊</span>
                  <p className="font-bold text-lg">Sin datos estadísticas suficientes</p>
                  <p className="text-sm text-slate-500 mt-1">Registra al menos un día de asistencia para visualizar el resumen trimestral.</p>
                </div>
              )}
            </div>
          )}
        </div>
      ) : (
        <div className="bg-blue-50 border border-blue-200 text-blue-900 p-12 rounded-2xl text-center shadow-sm">
          <span className="text-5xl mb-4 block">📋</span>
          <h2 className="text-xl font-bold mb-1">Módulo de Asistencia Educativa</h2>
          <p className="text-sm text-blue-700 max-w-md mx-auto">Selecciona un cuaderno pedagógico y materia en la parte superior para comenzar a registrar o visualizar el historial de asistencia de tu curso.</p>
        </div>
      )}
    </div>
  );
};

export default Asistencia;
