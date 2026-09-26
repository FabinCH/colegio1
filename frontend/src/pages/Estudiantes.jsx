// ============================================
// pages/Estudiantes.jsx — Gestión de Estudiantes
// ============================================
// Incluye: tabla con búsqueda por CI/RUDE, formulario completo
// con subformulario de Apoderado (filiación)

import { useState, useEffect } from 'react';
import API from '../api/axiosConfig';
import { useAuth } from '../context/AuthContext';

const Estudiantes = () => {
  const { usuario } = useAuth();
  const [estudiantes, setEstudiantes] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [busqueda, setBusqueda] = useState('');
  const [pagina, setPagina] = useState(1);
  const [totalPaginas, setTotalPaginas] = useState(1);
  const [totalEstudiantes, setTotalEstudiantes] = useState(0);
  const LIMITE = 20;
  
  // Estado para el modal de formulario
  const [mostrarModal, setMostrarModal] = useState(false);
  const [estudianteActual, setEstudianteActual] = useState(null);
  const [formData, setFormData] = useState({
    nombres: '',
    apellidos: '',
    rude: '',
    ci: '',
    sexo: 'M',
    fechaNacimiento: '',
    lugarNacimiento: '',
    direccion: '',
    // Subformulario Apoderado
    apoderado: {
      nombreCompleto: '',
      ci: '',
      telefono: '',
      parentesco: '',
    },
  });

  // Cargar estudiantes
  const cargarEstudiantes = async (textoBusqueda = '', pag = 1) => {
    try {
      setCargando(true);
      const params = new URLSearchParams({ page: pag, limit: LIMITE });
      if (textoBusqueda) params.append('buscar', textoBusqueda);
      const { data } = await API.get(`/estudiantes?${params.toString()}`);
      setEstudiantes(data.data);
      setTotalPaginas(data.totalPaginas || 1);
      setTotalEstudiantes(data.total || data.cantidad || 0);
      setPagina(pag);
      setError('');
    } catch (err) {
      setError('Error al cargar la lista de estudiantes');
      console.error(err);
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarEstudiantes();
  }, []);

  // Búsqueda con debounce — resetea a página 1
  useEffect(() => {
    const timer = setTimeout(() => {
      cargarEstudiantes(busqueda, 1);
    }, 400);
    return () => clearTimeout(timer);
  }, [busqueda]);

  // Manejar formulario
  const handleChange = (e) => {
    const { name, value } = e.target;
    // Si el campo pertenece al apoderado (formato: apoderado.campo)
    if (name.startsWith('apoderado.')) {
      const campo = name.split('.')[1];
      setFormData(prev => ({
        ...prev,
        apoderado: { ...prev.apoderado, [campo]: value },
      }));
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const resetForm = () => ({
    nombres: '', apellidos: '', rude: '', ci: '', sexo: 'M',
    fechaNacimiento: '', lugarNacimiento: '', direccion: '',
    apoderado: { nombreCompleto: '', ci: '', telefono: '', parentesco: '' },
  });

  const abrirModalNuevo = () => {
    setEstudianteActual(null);
    setFormData(resetForm());
    setMostrarModal(true);
  };

  const abrirModalEditar = (est) => {
    setEstudianteActual(est);
    setFormData({
      nombres: est.nombres,
      apellidos: est.apellidos,
      rude: est.rude,
      ci: est.ci || '',
      sexo: est.sexo,
      fechaNacimiento: est.fechaNacimiento ? est.fechaNacimiento.split('T')[0] : '',
      lugarNacimiento: est.lugarNacimiento || '',
      direccion: est.direccion || '',
      apoderado: {
        nombreCompleto: est.apoderado?.nombreCompleto || '',
        ci: est.apoderado?.ci || '',
        telefono: est.apoderado?.telefono || '',
        parentesco: est.apoderado?.parentesco || '',
      },
    });
    setMostrarModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (estudianteActual) {
        await API.put(`/estudiantes/${estudianteActual._id}`, formData);
      } else {
        await API.post('/estudiantes', formData);
      }
      setMostrarModal(false);
      cargarEstudiantes(busqueda, pagina);
    } catch (err) {
      alert(err.response?.data?.mensaje || 'Error al guardar el estudiante');
    }
  };

  const eliminarEstudiante = async (id) => {
    if (window.confirm('¿Estás seguro de eliminar este estudiante?')) {
      try {
        await API.delete(`/estudiantes/${id}`);
        // Si era el último de la página actual, volver a la anterior
        const nuevaPag = estudiantes.length === 1 && pagina > 1 ? pagina - 1 : pagina;
        cargarEstudiantes(busqueda, nuevaPag);
      } catch (err) {
        alert(err.response?.data?.mensaje || 'Error al eliminar');
      }
    }
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">Estudiantes</h1>
          <p className="page-subtitle">Gestión del registro de estudiantes (RUDE)</p>
        </div>
        {usuario?.rol !== 'docente' && (
          <button onClick={abrirModalNuevo} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium shadow-sm flex items-center gap-2">
            <span>➕</span> Nuevo Estudiante
          </button>
        )}
      </div>

      {/* Barra de búsqueda por CI o RUDE */}
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200">
        <div className="flex items-center gap-3">
          <span className="text-xl">🔍</span>
          <input
            type="text"
            placeholder="Buscar por CI, RUDE, nombre o apellido..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="flex-1 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-colors text-slate-800 placeholder:text-slate-400"
          />
          {busqueda && (
            <button
              onClick={() => setBusqueda('')}
              className="text-slate-400 hover:text-slate-600 px-3 py-2 rounded-lg hover:bg-slate-100 transition-colors"
            >
              ✕ Limpiar
            </button>
          )}
        </div>
        {busqueda && (
          <p className="text-xs text-slate-500 mt-2 ml-9">
            Mostrando {estudiantes.length} resultado(s) para "{busqueda}"
          </p>
        )}
      </div>

      {error && (
        <div className="bg-red-50 text-red-700 p-4 rounded-lg mb-6 border border-red-100">
          {error}
        </div>
      )}

      {/* Tabla de Estudiantes */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 text-sm">
                <th className="p-4 font-semibold">Apellidos y Nombres</th>
                <th className="p-4 font-semibold">RUDE</th>
                <th className="p-4 font-semibold">CI</th>
                <th className="p-4 font-semibold">Sexo</th>
                <th className="p-4 font-semibold">Apoderado</th>
                {usuario?.rol !== 'docente' && (
                  <th className="p-4 font-semibold text-right">Acciones</th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {cargando ? (
                <tr><td colSpan={usuario?.rol !== 'docente' ? "6" : "5"} className="p-8 text-center text-slate-500">Cargando datos...</td></tr>
              ) : estudiantes.length === 0 ? (
                <tr><td colSpan={usuario?.rol !== 'docente' ? "6" : "5"} className="p-8 text-center text-slate-500">
                  {busqueda ? 'No se encontraron estudiantes con ese criterio' : 'No hay estudiantes registrados'}
                </td></tr>
              ) : (
                estudiantes.map((est) => (
                  <tr key={est._id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="p-4 font-medium text-slate-800">
                      {est.apellidos}, {est.nombres}
                    </td>
                    <td className="p-4 text-slate-600 font-mono text-sm">{est.rude}</td>
                    <td className="p-4 text-slate-600">{est.ci || '-'}</td>
                    <td className="p-4">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${est.sexo === 'M' ? 'bg-blue-100 text-blue-700' : 'bg-pink-100 text-pink-700'}`}>
                        {est.sexo}
                      </span>
                    </td>
                    <td className="p-4 text-slate-600 text-sm">
                      {est.apoderado?.nombreCompleto || <span className="text-slate-400 italic">Sin apoderado</span>}
                    </td>
                    {usuario?.rol !== 'docente' && (
                      <td className="p-4 text-right">
                        <button onClick={() => abrirModalEditar(est)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg mr-2" title="Editar">✏️</button>
                        <button onClick={() => eliminarEstudiante(est._id)} className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg" title="Eliminar">🗑️</button>
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ─── CONTROLES DE PAGINACIÓN ─── */}
      {totalPaginas > 1 && (
        <div className="bg-white px-6 py-4 rounded-2xl shadow-sm border border-slate-200 flex items-center justify-between">
          <p className="text-sm text-slate-500">
            Mostrando <span className="font-semibold text-slate-700">{(pagina - 1) * LIMITE + 1}–{Math.min(pagina * LIMITE, totalEstudiantes)}</span> de <span className="font-semibold text-slate-700">{totalEstudiantes}</span> estudiantes
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => cargarEstudiantes(busqueda, pagina - 1)}
              disabled={pagina === 1}
              className="px-3 py-1.5 text-sm font-medium rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              ← Anterior
            </button>
            {Array.from({ length: totalPaginas }, (_, i) => i + 1)
              .filter(p => p === 1 || p === totalPaginas || Math.abs(p - pagina) <= 1)
              .reduce((acc, p, idx, arr) => {
                if (idx > 0 && p - arr[idx - 1] > 1) acc.push('...');
                acc.push(p);
                return acc;
              }, [])
              .map((item, idx) =>
                item === '...' ? (
                  <span key={`ellipsis-${idx}`} className="px-2 text-slate-400 text-sm">…</span>
                ) : (
                  <button
                    key={item}
                    onClick={() => cargarEstudiantes(busqueda, item)}
                    className={`w-9 h-9 text-sm font-bold rounded-lg transition-colors ${
                      pagina === item
                        ? 'bg-blue-600 text-white shadow-sm'
                        : 'border border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    {item}
                  </button>
                )
              )
            }
            <button
              onClick={() => cargarEstudiantes(busqueda, pagina + 1)}
              disabled={pagina === totalPaginas}
              className="px-3 py-1.5 text-sm font-medium rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              Siguiente →
            </button>
          </div>
        </div>
      )}

      {/* Modal Formulario */}
      {mostrarModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden max-h-[90vh] flex flex-col">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h2 className="text-xl font-bold text-slate-800">
                {estudianteActual ? 'Editar Estudiante' : 'Nuevo Estudiante'}
              </h2>
              <button onClick={() => setMostrarModal(false)} className="text-slate-400 hover:text-slate-600 text-xl">✕</button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-5 overflow-y-auto flex-1">
              {/* ─── DATOS DEL ESTUDIANTE ─── */}
              <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider border-b border-slate-100 pb-2">
                👨‍🎓 Datos del Estudiante
              </h3>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1">
                  <label className="text-sm font-medium text-slate-700">Nombres *</label>
                  <input type="text" name="nombres" value={formData.nombres} onChange={handleChange} required className="px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-sm font-medium text-slate-700">Apellidos *</label>
                  <input type="text" name="apellidos" value={formData.apellidos} onChange={handleChange} required className="px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1">
                  <label className="text-sm font-medium text-slate-700">RUDE *</label>
                  <input type="text" name="rude" value={formData.rude} onChange={handleChange} required className="px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-sm font-medium text-slate-700">CI</label>
                  <input type="text" name="ci" value={formData.ci} onChange={handleChange} className="px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="flex flex-col gap-1">
                  <label className="text-sm font-medium text-slate-700">Sexo *</label>
                  <select name="sexo" value={formData.sexo} onChange={handleChange} className="px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                    <option value="M">Masculino</option>
                    <option value="F">Femenino</option>
                  </select>
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-sm font-medium text-slate-700">Fecha de Nacimiento</label>
                  <input type="date" name="fechaNacimiento" value={formData.fechaNacimiento} onChange={handleChange} className="px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-sm font-medium text-slate-700">Lugar de Nacimiento</label>
                  <input type="text" name="lugarNacimiento" value={formData.lugarNacimiento} onChange={handleChange} className="px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" placeholder="Ej: La Paz" />
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium text-slate-700">Dirección</label>
                <input type="text" name="direccion" value={formData.direccion} onChange={handleChange} className="px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" placeholder="Ej: Calle Bolívar #123, Zona Central" />
              </div>

              {/* ─── DATOS DEL APODERADO (Subformulario) ─── */}
              <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider border-b border-slate-100 pb-2 mt-6">
                👨‍👧 Datos del Apoderado (Filiación)
              </h3>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1">
                  <label className="text-sm font-medium text-slate-700">Nombre Completo del Apoderado</label>
                  <input type="text" name="apoderado.nombreCompleto" value={formData.apoderado.nombreCompleto} onChange={handleChange} className="px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" placeholder="Ej: María Condori Mamani" />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-sm font-medium text-slate-700">CI del Apoderado</label>
                  <input type="text" name="apoderado.ci" value={formData.apoderado.ci} onChange={handleChange} className="px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" placeholder="Ej: 1234567 LP" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1">
                  <label className="text-sm font-medium text-slate-700">Teléfono del Apoderado</label>
                  <input type="text" name="apoderado.telefono" value={formData.apoderado.telefono} onChange={handleChange} className="px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" placeholder="Ej: 70012345" />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-sm font-medium text-slate-700">Parentesco</label>
                  <select name="apoderado.parentesco" value={formData.apoderado.parentesco} onChange={handleChange} className="px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                    <option value="">Seleccione...</option>
                    <option value="Padre">Padre</option>
                    <option value="Madre">Madre</option>
                    <option value="Tutor/a">Tutor/a</option>
                    <option value="Abuelo/a">Abuelo/a</option>
                    <option value="Hermano/a">Hermano/a</option>
                    <option value="Tío/a">Tío/a</option>
                    <option value="Otro">Otro</option>
                  </select>
                </div>
              </div>

              <div className="mt-8 pt-4 border-t border-slate-100 flex justify-end gap-3">
                <button type="button" onClick={() => setMostrarModal(false)} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg font-medium transition-colors">
                  Cancelar
                </button>
                <button type="submit" className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium shadow-sm transition-colors">
                  {estudianteActual ? 'Guardar Cambios' : 'Registrar Estudiante'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Estudiantes;
