// ============================================
// pages/Materias.jsx — Gestión de Materias + Inscripción de Estudiantes
// ============================================

import { useState, useEffect, useRef } from 'react';
import API from '../api/axiosConfig';
import { useAuth } from '../context/AuthContext';

const Materias = () => {
  const { usuario } = useAuth();
  const [materias, setMaterias] = useState([]);
  const [docentes, setDocentes] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [mostrarModal, setMostrarModal] = useState(false);
  const [materiaActual, setMateriaActual] = useState(null);

  const [formData, setFormData] = useState({
    nombre: '',
    area: '',
    nivel: 'secundaria',
    grado: '1ro',
    docenteAsignado: '',
  });

  // ─── Estado para el modal de inscripción ───
  const [mostrarModalInscripcion, setMostrarModalInscripcion] = useState(false);
  const [materiaParaInscribir, setMateriaParaInscribir] = useState(null);

  // Cuadernos filtrados para esa materia
  const [cuadernosDeMateria, setCuadernosDeMateria] = useState([]);
  const [cuadernoElegido, setCuadernoElegido] = useState('');

  // Búsqueda de estudiantes
  const [todosEstudiantes, setTodosEstudiantes] = useState([]);
  const [busqueda, setBusqueda] = useState('');
  const [estudiantesFiltrados, setEstudiantesFiltrados] = useState([]);
  const [mostrarDropdown, setMostrarDropdown] = useState(false);
  const [estudianteSeleccionado, setEstudianteSeleccionado] = useState(null);

  // Lista de ya-inscritos en el cuaderno elegido
  const [inscritos, setInscritos] = useState([]);
  const [cargandoInscritos, setCargandoInscritos] = useState(false);
  const [inscribiendo, setInscribiendo] = useState(false);

  const busquedaRef = useRef(null);

  // ────────────────────────────────────────
  const cargarMaterias = async () => {
    try {
      setCargando(true);
      const { data } = await API.get('/materias');
      setMaterias(data.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setCargando(false);
    }
  };

  const cargarDocentes = async () => {
    if (usuario?.rol === 'docente') return;
    try {
      const { data } = await API.get('/admin/usuarios?rol=docente');
      setDocentes(data.data || []);
    } catch (err) {
      console.error('Error al cargar docentes', err);
    }
  };

  useEffect(() => {
    cargarMaterias();
    cargarDocentes();
  }, [usuario]);

  // Filtrar estudiantes por búsqueda
  useEffect(() => {
    if (busqueda.trim().length < 2) {
      setEstudiantesFiltrados([]);
      setMostrarDropdown(false);
      return;
    }
    const lower = busqueda.toLowerCase();
    const filtrados = todosEstudiantes.filter(e =>
      `${e.nombres} ${e.apellidos}`.toLowerCase().includes(lower) ||
      e.rude?.toLowerCase().includes(lower)
    ).slice(0, 8);
    setEstudiantesFiltrados(filtrados);
    setMostrarDropdown(filtrados.length > 0);
  }, [busqueda, todosEstudiantes]);

  // Cargar inscritos cuando cambia el cuaderno elegido
  useEffect(() => {
    if (!cuadernoElegido) { setInscritos([]); return; }
    const fetchInscritos = async () => {
      setCargandoInscritos(true);
      try {
        const { data } = await API.get(`/inscripciones?cuaderno=${cuadernoElegido}`);
        setInscritos(data.data || []);
      } catch (err) {
        console.error(err);
      } finally {
        setCargandoInscritos(false);
      }
    };
    fetchInscritos();
  }, [cuadernoElegido]);

  // ─── Handlers Materia CRUD ───
  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const abrirModal = (materia = null) => {
    if (materia) {
      setMateriaActual(materia);
      setFormData({
        nombre: materia.nombre,
        area: materia.area || '',
        nivel: materia.nivel,
        grado: materia.grado,
        docenteAsignado: materia.docenteAsignado?._id || '',
      });
    } else {
      setMateriaActual(null);
      setFormData({ nombre: '', area: '', nivel: 'secundaria', grado: '1ro', docenteAsignado: '' });
    }
    setMostrarModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (materiaActual) {
        await API.put(`/materias/${materiaActual._id}`, formData);
      } else {
        await API.post('/materias', formData);
      }
      setMostrarModal(false);
      cargarMaterias();
    } catch (err) {
      alert(err.response?.data?.mensaje || 'Error al guardar');
    }
  };

  const eliminarMateria = async (id) => {
    if (window.confirm('¿Eliminar esta materia?')) {
      try {
        await API.delete(`/materias/${id}`);
        cargarMaterias();
      } catch (err) {
        alert('Error al eliminar');
      }
    }
  };

  // ─── Handlers Inscripción ───
  const abrirModalInscripcion = async (materia) => {
    setMateriaParaInscribir(materia);
    setCuadernoElegido('');
    setInscritos([]);
    setBusqueda('');
    setEstudianteSeleccionado(null);
    setMostrarDropdown(false);

    try {
      // Cargar cuadernos que correspondan a esta materia
      const { data: cuadData } = await API.get('/cuadernos');
      const filtrados = (cuadData.data || []).filter(c => c.materia?._id === materia._id);
      setCuadernosDeMateria(filtrados);

      // Cargar todos los estudiantes para el buscador
      const { data: estData } = await API.get('/estudiantes');
      setTodosEstudiantes(estData.data || []);
    } catch (err) {
      console.error(err);
    }

    setMostrarModalInscripcion(true);
  };

  const seleccionarEstudiante = (est) => {
    setEstudianteSeleccionado(est);
    setBusqueda(`${est.apellidos}, ${est.nombres}`);
    setMostrarDropdown(false);
  };

  const inscribirEstudiante = async () => {
    if (!cuadernoElegido) return alert('Seleccione un cuaderno/curso primero');
    if (!estudianteSeleccionado) return alert('Seleccione un estudiante');

    // Verificar si ya está inscrito
    const yaInscrito = inscritos.some(i => i.estudiante?._id === estudianteSeleccionado._id);
    if (yaInscrito) return alert('Este estudiante ya está inscrito en este cuaderno');

    try {
      setInscribiendo(true);
      await API.post('/inscripciones', {
        cuaderno: cuadernoElegido,
        estudiante: estudianteSeleccionado._id,
      });
      // Recargar inscritos
      const { data } = await API.get(`/inscripciones?cuaderno=${cuadernoElegido}`);
      setInscritos(data.data || []);
      setBusqueda('');
      setEstudianteSeleccionado(null);
    } catch (err) {
      alert(err.response?.data?.mensaje || 'Error al inscribir');
    } finally {
      setInscribiendo(false);
    }
  };

  const eliminarInscripcion = async (inscripcionId) => {
    if (!window.confirm('¿Eliminar esta inscripción?')) return;
    try {
      await API.delete(`/inscripciones/${inscripcionId}`);
      setInscritos(prev => prev.filter(i => i._id !== inscripcionId));
    } catch (err) {
      alert('Error al eliminar inscripción');
    }
  };

  // ─── UI ───
  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">Materias</h1>
          <p className="page-subtitle">Catálogo de asignaturas por nivel y grado</p>
        </div>
        {usuario?.rol !== 'docente' && (
          <button onClick={() => abrirModal()} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2">
            ➕ Nueva Materia
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {cargando ? (
          <p className="text-slate-500">Cargando...</p>
        ) : materias.map(materia => (
          <div key={materia._id} className="bg-white p-5 rounded-xl shadow-sm border border-slate-200 hover:border-blue-300 transition-colors group flex flex-col">
            <div className="flex justify-between items-start mb-2">
              <h3 className="font-bold text-lg text-slate-800">{materia.nombre}</h3>
              {usuario?.rol !== 'docente' && (
                <div className="flex opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => abrirModal(materia)} className="text-slate-400 hover:text-blue-600 p-1">✏️</button>
                  <button onClick={() => eliminarMateria(materia._id)} className="text-slate-400 hover:text-red-600 p-1">🗑️</button>
                </div>
              )}
            </div>
            <p className="text-sm text-slate-500 mb-1">{materia.area || 'Sin área asignada'}</p>
            {materia.docenteAsignado && (
              <p className="text-xs text-blue-600 font-semibold mb-2">👨‍🏫 {materia.docenteAsignado.nombre}</p>
            )}
            <div className="flex gap-2 mb-4">
              <span className="bg-indigo-50 text-indigo-700 px-2.5 py-1 rounded text-xs font-semibold capitalize">{materia.nivel}</span>
              <span className="bg-slate-100 text-slate-700 px-2.5 py-1 rounded text-xs font-semibold">{materia.grado}</span>
            </div>
            {/* Botón de Inscripción */}
            <button
              onClick={() => abrirModalInscripcion(materia)}
              className="mt-auto w-full flex items-center justify-center gap-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 px-3 py-2 rounded-lg text-sm font-semibold transition-colors"
            >
              👥 Inscribir Estudiantes
            </button>
          </div>
        ))}
      </div>

      {/* ─── Modal Nueva/Editar Materia ─── */}
      {mostrarModal && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-lg shadow-2xl">
            <div className="flex items-center gap-3 mb-5 pb-4 border-b border-slate-100">
              <span className="text-2xl">📚</span>
              <h2 className="text-xl font-bold text-slate-800">{materiaActual ? 'Editar' : 'Nueva'} Materia</h2>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">

              {/* ── Docente (solo admin/director) ── */}
              {usuario?.rol !== 'docente' && (
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">
                    👨‍🏫 Docente Asignado
                  </label>
                  <select
                    name="docenteAsignado"
                    value={formData.docenteAsignado}
                    onChange={handleChange}
                    className="w-full border border-slate-200 p-2.5 rounded-lg bg-slate-50 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none text-slate-800"
                  >
                    <option value="">— Sin docente asignado —</option>
                    {docentes.map(d => (
                      <option key={d._id} value={d._id}>{d.nombre} ({d.email})</option>
                    ))}
                  </select>
                  <p className="text-xs text-slate-400 mt-1">El docente verá esta materia al crear su cuaderno pedagógico.</p>
                </div>
              )}

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Nombre <span className="text-red-500">*</span></label>
                <input required name="nombre" value={formData.nombre} onChange={handleChange} className="w-full border border-slate-200 p-2.5 rounded-lg bg-slate-50 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none" placeholder="Ej: Matemáticas" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Área</label>
                <input name="area" value={formData.area} onChange={handleChange} className="w-full border border-slate-200 p-2.5 rounded-lg bg-slate-50 outline-none" placeholder="Ej: Ciencia y Tecnología" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Nivel</label>
                  <select name="nivel" value={formData.nivel} onChange={handleChange} className="w-full border border-slate-200 p-2.5 rounded-lg bg-slate-50 outline-none">
                    <option value="inicial">Inicial</option>
                    <option value="primaria">Primaria</option>
                    <option value="secundaria">Secundaria</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Grado <span className="text-red-500">*</span></label>
                  <input required name="grado" value={formData.grado} onChange={handleChange} className="w-full border border-slate-200 p-2.5 rounded-lg bg-slate-50 outline-none" placeholder="Ej: 4to" />
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button type="button" onClick={() => setMostrarModal(false)} className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 rounded-lg font-medium transition-colors">Cancelar</button>
                <button type="submit" className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium shadow-sm transition-colors">
                  {materiaActual ? '💾 Guardar Cambios' : '➕ Crear Materia'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── Modal de Inscripción de Estudiantes ─── */}
      {mostrarModalInscripcion && (
        <div className="fixed inset-0 bg-slate-900/60 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl flex flex-col max-h-[90vh]">
            {/* Header */}
            <div className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white p-6 rounded-t-2xl flex justify-between items-start">
              <div>
                <h2 className="text-xl font-bold">👥 Inscripción de Estudiantes</h2>
                <p className="text-emerald-100 text-sm mt-1">
                  Materia: <span className="font-semibold">{materiaParaInscribir?.nombre}</span>
                  {' — '}{materiaParaInscribir?.grado} ({materiaParaInscribir?.nivel})
                </p>
              </div>
              <button onClick={() => setMostrarModalInscripcion(false)} className="text-white/70 hover:text-white text-2xl leading-none">×</button>
            </div>

            <div className="overflow-y-auto flex-1 p-6 space-y-5">
              {/* Selección de Cuaderno/Curso */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  1. Seleccione el Curso / Cuaderno
                </label>
                {cuadernosDeMateria.length === 0 ? (
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm text-amber-700">
                    ⚠️ No hay cuadernos registrados para esta materia. Primero cree un Cuaderno Pedagógico que la incluya.
                  </div>
                ) : (
                  <select
                    value={cuadernoElegido}
                    onChange={(e) => { setCuadernoElegido(e.target.value); setInscritos([]); }}
                    className="w-full border border-slate-300 p-2.5 rounded-lg bg-white text-slate-700 focus:ring-2 focus:ring-emerald-400 focus:border-transparent outline-none"
                  >
                    <option value="">-- Seleccione un cuaderno/curso --</option>
                    {cuadernosDeMateria.map(c => (
                      <option key={c._id} value={c._id}>
                        {c.curso?.grado} "{c.curso?.paralelo}" — {c.curso?.turno} (Gestión {c.gestion})
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {/* Buscador de Estudiantes */}
              {cuadernoElegido && (
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    2. Buscar y Agregar Estudiante
                  </label>
                  <div className="relative">
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">🔍</span>
                        <input
                          ref={busquedaRef}
                          type="text"
                          value={busqueda}
                          onChange={(e) => {
                            setBusqueda(e.target.value);
                            setEstudianteSeleccionado(null);
                          }}
                          placeholder="Escriba el nombre o RUDE del estudiante..."
                          className="w-full pl-9 pr-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-400 focus:border-transparent outline-none text-slate-700"
                        />
                        {/* Dropdown sugerencias */}
                        {mostrarDropdown && (
                          <div className="absolute top-full left-0 right-0 z-50 mt-1 bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden">
                            {estudiantesFiltrados.map(est => (
                              <button
                                key={est._id}
                                type="button"
                                onClick={() => seleccionarEstudiante(est)}
                                className="w-full text-left px-4 py-3 hover:bg-emerald-50 transition-colors border-b border-slate-100 last:border-0"
                              >
                                <div className="font-semibold text-slate-800 text-sm">{est.apellidos}, {est.nombres}</div>
                                <div className="text-xs text-slate-500">RUDE: {est.rude} {est.ci ? `• CI: ${est.ci}` : ''}</div>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                      <button
                        onClick={inscribirEstudiante}
                        disabled={!estudianteSeleccionado || inscribiendo}
                        className="bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white px-5 py-2.5 rounded-lg font-semibold transition-colors flex items-center gap-2 whitespace-nowrap"
                      >
                        {inscribiendo ? '...' : '✅ Inscribir'}
                      </button>
                    </div>
                    {estudianteSeleccionado && (
                      <div className="mt-2 flex items-center gap-2 text-sm text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2">
                        <span>✓</span>
                        <span className="font-semibold">{estudianteSeleccionado.apellidos}, {estudianteSeleccionado.nombres}</span>
                        <span className="text-emerald-500">— RUDE: {estudianteSeleccionado.rude}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Lista de Inscritos */}
              {cuadernoElegido && (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-sm font-semibold text-slate-700">
                      3. Estudiantes Inscritos
                    </label>
                    <span className="bg-emerald-100 text-emerald-700 text-xs font-bold px-2.5 py-1 rounded-full">
                      {inscritos.length} inscritos
                    </span>
                  </div>

                  {cargandoInscritos ? (
                    <div className="text-center py-8 text-slate-400">Cargando...</div>
                  ) : inscritos.length === 0 ? (
                    <div className="text-center py-8 bg-slate-50 rounded-xl border-2 border-dashed border-slate-200">
                      <div className="text-3xl mb-2">📋</div>
                      <p className="text-slate-500 text-sm">No hay estudiantes inscritos aún</p>
                    </div>
                  ) : (
                    <div className="border border-slate-200 rounded-xl overflow-hidden">
                      <table className="w-full text-sm">
                        <thead className="bg-slate-800 text-white">
                          <tr>
                            <th className="p-3 text-left">#</th>
                            <th className="p-3 text-left">Apellidos y Nombres</th>
                            <th className="p-3 text-left">RUDE</th>
                            <th className="p-3 text-center">Acción</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {inscritos.map((ins, idx) => (
                            <tr key={ins._id} className="hover:bg-slate-50 transition-colors">
                              <td className="p-3 text-slate-400">{idx + 1}</td>
                              <td className="p-3 font-medium text-slate-800">
                                {ins.estudiante?.apellidos}, {ins.estudiante?.nombres}
                              </td>
                              <td className="p-3 text-slate-500 font-mono text-xs">{ins.estudiante?.rude}</td>
                              <td className="p-3 text-center">
                                <button
                                  onClick={() => eliminarInscripcion(ins._id)}
                                  className="text-red-400 hover:text-red-600 hover:bg-red-50 px-2 py-1 rounded transition-colors text-xs"
                                  title="Eliminar inscripción"
                                >
                                  🗑️ Quitar
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => setMostrarModalInscripcion(false)}
                className="bg-slate-700 hover:bg-slate-800 text-white px-6 py-2 rounded-lg font-medium transition-colors"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Materias;
