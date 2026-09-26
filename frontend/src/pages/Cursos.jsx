// ============================================
// pages/Cursos.jsx — Gestión de Cursos y Paralelos
// ============================================

import { useState, useEffect } from 'react';
import API from '../api/axiosConfig';
import { useAuth } from '../context/AuthContext';

const Cursos = () => {
  const { usuario } = useAuth();
  const [cursos, setCursos] = useState([]);
  const [docentes, setDocentes] = useState([]);
  const [cargando, setCargando] = useState(false);
  const [mostrarModal, setMostrarModal] = useState(false);
  const [cursoActual, setCursoActual] = useState(null);
  
  const [formData, setFormData] = useState({
    grado: '1ro',
    paralelo: 'A',
    nivel: 'secundaria',
    turno: 'mañana',
    gestion: new Date().getFullYear(),
    docente: ''
  });

  const cargarCursos = async () => {
    try {
      setCargando(true);
      const { data } = await API.get('/cursos');
      setCursos(data.data || []);
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
    cargarCursos();
    cargarDocentes();
  }, [usuario]);

  // Backend /cursos ya filtra según el rol; cursosVisibles usa el estado cargado directamente
  const cursosVisibles = cursos;

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const abrirModal = (curso = null) => {
    if (curso) {
      setCursoActual(curso);
      setFormData({
        grado: curso.grado, 
        paralelo: curso.paralelo, 
        nivel: curso.nivel, 
        turno: curso.turno, 
        gestion: curso.gestion,
        docente: curso.docente?._id || ''
      });
    } else {
      setCursoActual(null);
      setFormData({ grado: '1ro', paralelo: 'A', nivel: 'secundaria', turno: 'mañana', gestion: new Date().getFullYear(), docente: '' });
    }
    setMostrarModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // Enviar docente solo si no es docente (admin asigna)
      const payload = { ...formData };
      if (usuario?.rol === 'docente') {
        delete payload.docente;
      }
      if (cursoActual) {
        await API.put(`/cursos/${cursoActual._id}`, payload);
      } else {
        await API.post('/cursos', payload);
      }
      setMostrarModal(false);
      cargarCursos();
    } catch (err) {
      alert(err.response?.data?.mensaje || 'Error al guardar');
    }
  };

  const eliminarCurso = async (id) => {
    if (window.confirm('¿Eliminar este curso?')) {
      try {
        await API.delete(`/cursos/${id}`);
        cargarCursos();
      } catch (err) {
        alert('Error al eliminar');
      }
    }
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">Cursos</h1>
          <p className="page-subtitle">Paralelos y turnos de la gestión</p>
        </div>
        {usuario?.rol !== 'docente' && (
          <button onClick={() => abrirModal()} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium">
            ➕ Nuevo Curso
          </button>
        )}
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 text-sm">
              <th className="p-4 font-semibold">Curso y Nivel</th>
              <th className="p-4 font-semibold">Turno</th>
              <th className="p-4 font-semibold">Gestión</th>
              <th className="p-4 font-semibold">Docente Titular</th>
              <th className="p-4 font-semibold text-center">Estudiantes</th>
              {usuario?.rol !== 'docente' && (
                <th className="p-4 font-semibold text-right">Acciones</th>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
          {cursosVisibles.map(curso => (
            <tr key={curso._id} className="hover:bg-slate-50/50">
              <td className="p-4">
                <div className="font-bold text-slate-800 text-lg">{curso.grado} "{curso.paralelo}"</div>
                <div className="text-xs text-slate-500 capitalize">{curso.nivel}</div>
              </td>
              <td className="p-4 capitalize">{curso.turno}</td>
              <td className="p-4">{curso.gestion}</td>
              <td className="p-4">{curso.docente?.nombre || 'No asignado'}</td>
              <td className="p-4 text-center font-semibold text-blue-600">{curso.estudiantes?.length || 0}</td>
              {usuario?.rol !== 'docente' && (
                <td className="p-4 text-right">
                  <button onClick={() => abrirModal(curso)} className="text-blue-600 p-1.5 hover:bg-blue-50 rounded">✏️</button>
                  <button onClick={() => eliminarCurso(curso._id)} className="text-red-600 p-1.5 hover:bg-red-50 rounded ml-1">🗑️</button>
                </td>
              )}
            </tr>
          ))}
          </tbody>
        </table>
      </div>

      {mostrarModal && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-lg shadow-2xl">
            <div className="flex items-center gap-3 mb-5 pb-4 border-b border-slate-100">
              <span className="text-2xl">🏫</span>
              <h2 className="text-xl font-bold text-slate-800">{cursoActual ? 'Editar' : 'Nuevo'} Curso</h2>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">

              {/* ── Selector de Docente (solo admin/director, ancho completo) ── */}
              {usuario?.rol !== 'docente' && (
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">
                    👨‍🏫 Docente Titular <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="docente"
                    value={formData.docente}
                    onChange={handleChange}
                    required
                    className="w-full border border-slate-200 p-2.5 rounded-lg bg-slate-50 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none text-slate-800"
                  >
                    <option value="">— Seleccione un docente —</option>
                    {docentes.length === 0 && (
                      <option disabled>Cargando docentes...</option>
                    )}
                    {docentes.map(d => (
                      <option key={d._id} value={d._id}>{d.nombre} ({d.email})</option>
                    ))}
                  </select>
                  <p className="text-xs text-slate-400 mt-1">El docente podrá ver este curso al crear su cuaderno pedagógico.</p>
                </div>
              )}

              {/* ── Grado y Paralelo ── */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Grado <span className="text-red-500">*</span></label>
                  <input
                    required
                    name="grado"
                    value={formData.grado}
                    onChange={handleChange}
                    className="w-full border border-slate-200 p-2.5 rounded-lg bg-slate-50 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                    placeholder="Ej: 4to"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Paralelo <span className="text-red-500">*</span></label>
                  <input
                    required
                    name="paralelo"
                    value={formData.paralelo}
                    onChange={handleChange}
                    className="w-full border border-slate-200 p-2.5 rounded-lg bg-slate-50 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                    placeholder="Ej: A"
                    maxLength={1}
                  />
                </div>
              </div>

              {/* ── Nivel y Turno ── */}
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
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Turno</label>
                  <select name="turno" value={formData.turno} onChange={handleChange} className="w-full border border-slate-200 p-2.5 rounded-lg bg-slate-50 outline-none">
                    <option value="mañana">Mañana</option>
                    <option value="tarde">Tarde</option>
                    <option value="noche">Noche</option>
                  </select>
                </div>
              </div>

              {/* ── Gestión ── */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Gestión (año) <span className="text-red-500">*</span></label>
                <input
                  type="number"
                  required
                  name="gestion"
                  value={formData.gestion}
                  onChange={handleChange}
                  className="w-full border border-slate-200 p-2.5 rounded-lg bg-slate-50 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button type="button" onClick={() => setMostrarModal(false)} className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 rounded-lg font-medium transition-colors">Cancelar</button>
                <button type="submit" className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium shadow-sm transition-colors">
                  {cursoActual ? '💾 Guardar Cambios' : '➕ Crear Curso'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Cursos;
