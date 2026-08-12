// ============================================
// pages/Cursos.jsx — Gestión de Cursos y Paralelos
// ============================================

import { useState, useEffect } from 'react';
import API from '../api/axiosConfig';

const Cursos = () => {
  const [cursos, setCursos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [mostrarModal, setMostrarModal] = useState(false);
  const [cursoActual, setCursoActual] = useState(null);
  
  const [formData, setFormData] = useState({
    grado: '1ro',
    paralelo: 'A',
    nivel: 'secundaria',
    turno: 'mañana',
    gestion: new Date().getFullYear()
  });

  const cargarCursos = async () => {
    try {
      setCargando(true);
      const { data } = await API.get('/cursos');
      setCursos(data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarCursos();
  }, []);

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const abrirModal = (curso = null) => {
    if (curso) {
      setCursoActual(curso);
      setFormData({
        grado: curso.grado, paralelo: curso.paralelo, nivel: curso.nivel, turno: curso.turno, gestion: curso.gestion
      });
    } else {
      setCursoActual(null);
      setFormData({ grado: '1ro', paralelo: 'A', nivel: 'secundaria', turno: 'mañana', gestion: new Date().getFullYear() });
    }
    setMostrarModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (cursoActual) {
        await API.put(`/cursos/${cursoActual._id}`, formData);
      } else {
        await API.post('/cursos', formData);
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
        <button onClick={() => abrirModal()} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium">
          ➕ Nuevo Curso
        </button>
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
              <th className="p-4 font-semibold text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {cargando ? (
              <tr><td colSpan="6" className="p-8 text-center text-slate-500">Cargando...</td></tr>
            ) : cursos.map(curso => (
              <tr key={curso._id} className="hover:bg-slate-50/50">
                <td className="p-4">
                  <div className="font-bold text-slate-800 text-lg">{curso.grado} "{curso.paralelo}"</div>
                  <div className="text-xs text-slate-500 capitalize">{curso.nivel}</div>
                </td>
                <td className="p-4 capitalize">{curso.turno}</td>
                <td className="p-4">{curso.gestion}</td>
                <td className="p-4">{curso.docente?.nombre || 'No asignado'}</td>
                <td className="p-4 text-center font-semibold text-blue-600">{curso.estudiantes?.length || 0}</td>
                <td className="p-4 text-right">
                  <button onClick={() => abrirModal(curso)} className="text-blue-600 p-1.5 hover:bg-blue-50 rounded">✏️</button>
                  <button onClick={() => eliminarCurso(curso._id)} className="text-red-600 p-1.5 hover:bg-red-50 rounded ml-1">🗑️</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {mostrarModal && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">{cursoActual ? 'Editar' : 'Nuevo'} Curso</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Grado</label>
                  <input required name="grado" value={formData.grado} onChange={handleChange} className="w-full border p-2 rounded" placeholder="Ej: 4to" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Paralelo</label>
                  <input required name="paralelo" value={formData.paralelo} onChange={handleChange} className="w-full border p-2 rounded" placeholder="Ej: A" maxLength={1} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Nivel</label>
                  <select name="nivel" value={formData.nivel} onChange={handleChange} className="w-full border p-2 rounded">
                    <option value="inicial">Inicial</option>
                    <option value="primaria">Primaria</option>
                    <option value="secundaria">Secundaria</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Turno</label>
                  <select name="turno" value={formData.turno} onChange={handleChange} className="w-full border p-2 rounded">
                    <option value="mañana">Mañana</option>
                    <option value="tarde">Tarde</option>
                    <option value="noche">Noche</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Gestión</label>
                <input type="number" required name="gestion" value={formData.gestion} onChange={handleChange} className="w-full border p-2 rounded" />
              </div>
              <div className="flex justify-end gap-2 mt-6">
                <button type="button" onClick={() => setMostrarModal(false)} className="px-4 py-2 bg-slate-100 rounded">Cancelar</button>
                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded">Guardar</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Cursos;
