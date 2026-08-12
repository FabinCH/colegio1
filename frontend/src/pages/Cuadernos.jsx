// ============================================
// pages/Cuadernos.jsx — Gestión de Cuadernos Pedagógicos
// ============================================
// Incluye: CaratulaForm con selectores dinámicos (departamento→distrito)
// y vista previa (preview) de la carátula en tiempo real

import { useState, useEffect } from 'react';
import API from '../api/axiosConfig';
import { useAuth } from '../context/AuthContext';

// Datos jerárquicos de Bolivia para selectores dinámicos
const DEPARTAMENTOS_DATA = {
  'La Paz': ['La Paz 1', 'La Paz 2', 'La Paz 3', 'El Alto 1', 'El Alto 2', 'El Alto 3', 'Caranavi', 'Guanay', 'Achacachi', 'Viacha', 'Pucarani', 'Batallas'],
  'Cochabamba': ['Cochabamba 1', 'Cochabamba 2', 'Cochabamba 3', 'Quillacollo', 'Sacaba', 'Tiquipaya', 'Punata', 'Cliza'],
  'Santa Cruz': ['Santa Cruz 1', 'Santa Cruz 2', 'Santa Cruz 3', 'Montero', 'Warnes', 'La Guardia', 'Cotoca', 'Camiri'],
  'Oruro': ['Oruro 1', 'Oruro 2', 'Challapata', 'Huanuni'],
  'Potosí': ['Potosí 1', 'Potosí 2', 'Villazón', 'Tupiza', 'Uyuni', 'Llallagua'],
  'Chuquisaca': ['Sucre 1', 'Sucre 2', 'Sucre 3', 'Camargo', 'Monteagudo'],
  'Tarija': ['Tarija 1', 'Tarija 2', 'Yacuiba', 'Bermejo', 'Villamontes'],
  'Beni': ['Trinidad 1', 'Trinidad 2', 'Riberalta', 'Guayaramerín', 'San Borja'],
  'Pando': ['Cobija 1', 'Cobija 2', 'Porvenir'],
};

const Cuadernos = () => {
  const { usuario } = useAuth();
  const [cuadernos, setCuadernos] = useState([]);
  const [cursos, setCursos] = useState([]);
  const [materias, setMaterias] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [mostrarModal, setMostrarModal] = useState(false);
  const [mostrarPreview, setMostrarPreview] = useState(null); // ID del cuaderno para preview
  
  const [formData, setFormData] = useState({
    departamento: 'La Paz',
    distritoEducativo: '',
    unidadEducativa: '',
    director: '',
    curso: '',
    materia: '',
    nivel: 'secundaria',
    gestion: new Date().getFullYear(),
  });

  const cargarDatos = async () => {
    try {
      setCargando(true);
      const [resCuadernos, resCursos, resMaterias] = await Promise.all([
        API.get('/cuadernos'),
        API.get('/cursos'),
        API.get('/materias'),
      ]);
      setCuadernos(resCuadernos.data.data);
      setCursos(resCursos.data.data);
      setMaterias(resMaterias.data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarDatos();
  }, []);

  // Obtener distritos según el departamento seleccionado
  const distritosDisponibles = DEPARTAMENTOS_DATA[formData.departamento] || [];

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === 'departamento') {
      // Al cambiar departamento, resetear distrito
      setFormData({ ...formData, departamento: value, distritoEducativo: '' });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const abrirModal = () => {
    setFormData({
      departamento: 'La Paz',
      distritoEducativo: '',
      unidadEducativa: '',
      director: '',
      curso: '',
      materia: '',
      nivel: 'secundaria',
      gestion: new Date().getFullYear(),
    });
    setMostrarModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await API.post('/cuadernos', formData);
      setMostrarModal(false);
      cargarDatos();
    } catch (err) {
      alert(err.response?.data?.mensaje || 'Error al guardar');
    }
  };

  const eliminarCuaderno = async (id) => {
    if (window.confirm('¿Eliminar este cuaderno pedagógico?')) {
      try {
        await API.delete(`/cuadernos/${id}`);
        cargarDatos();
      } catch (err) {
        alert('Error al eliminar');
      }
    }
  };

  // Obtener datos de un cuaderno para el preview
  const getCursoLabel = (cuad) => {
    return `${cuad.curso?.grado || ''} "${cuad.curso?.paralelo || ''}" — Turno ${cuad.curso?.turno || ''}`;
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">Mis Cuadernos</h1>
          <p className="page-subtitle">Gestión de Cuadernos Pedagógicos — Carátulas Institucionales</p>
        </div>
        <button onClick={abrirModal} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium">
          ➕ Nuevo Cuaderno
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {cargando ? (
          <p className="text-slate-500">Cargando...</p>
        ) : cuadernos.length === 0 ? (
          <div className="col-span-2 bg-slate-50 border border-dashed border-slate-300 rounded-2xl p-12 text-center">
            <span className="text-5xl mb-4 block">📋</span>
            <p className="font-bold text-lg text-slate-700">No tienes cuadernos pedagógicos</p>
            <p className="text-sm text-slate-500 mt-1">Crea tu primer cuaderno para empezar a registrar asistencia y notas.</p>
          </div>
        ) : cuadernos.map(cuad => (
          <div key={cuad._id} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start border-b border-slate-100 pb-4 mb-4">
              <div>
                <h3 className="font-bold text-xl text-slate-800">{cuad.materia?.nombre || 'Materia'}</h3>
                <p className="text-blue-600 font-medium">{getCursoLabel(cuad)}</p>
              </div>
              <div className="flex gap-1">
                <button onClick={() => setMostrarPreview(mostrarPreview === cuad._id ? null : cuad._id)} className="text-indigo-500 hover:bg-indigo-50 p-2 rounded-lg" title="Vista previa de carátula">👁️</button>
                <button onClick={() => eliminarCuaderno(cuad._id)} className="text-red-500 hover:bg-red-50 p-2 rounded-lg" title="Eliminar">🗑️</button>
              </div>
            </div>
            
            <div className="space-y-2 text-sm text-slate-600">
              <p><span className="font-semibold text-slate-700">U.E.:</span> {cuad.unidadEducativa}</p>
              <p><span className="font-semibold text-slate-700">Distrito:</span> {cuad.distritoEducativo}</p>
              <p><span className="font-semibold text-slate-700">Departamento:</span> {cuad.departamento}</p>
              <p><span className="font-semibold text-slate-700">Gestión:</span> {cuad.gestion}</p>
            </div>

            {/* ──── VISTA PREVIA DE CARÁTULA ──── */}
            {mostrarPreview === cuad._id && (
              <div className="mt-5 border-2 border-dashed border-blue-200 rounded-xl bg-gradient-to-b from-blue-50 to-white p-6 transition-all">
                <div className="text-center space-y-2">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">ESTADO PLURINACIONAL DE BOLIVIA</p>
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">MINISTERIO DE EDUCACIÓN</p>
                  <div className="border-b border-slate-200 my-3"></div>
                  <p className="text-sm font-bold text-slate-700 uppercase">{cuad.departamento}</p>
                  <p className="text-sm text-slate-600">Distrito Educativo: <span className="font-semibold">{cuad.distritoEducativo}</span></p>
                  <div className="border-b border-slate-200 my-3"></div>
                  
                  <div className="bg-blue-600 text-white py-3 px-6 rounded-xl my-4 shadow-md">
                    <p className="text-xs font-medium text-blue-200 uppercase tracking-wider">Cuaderno Pedagógico</p>
                    <p className="text-lg font-extrabold tracking-wide">GESTIÓN {cuad.gestion}</p>
                  </div>

                  <div className="space-y-1.5 text-sm text-left bg-white p-4 rounded-lg border border-slate-100">
                    <p><span className="text-slate-500 font-medium">Unidad Educativa:</span> <span className="font-bold text-slate-800">{cuad.unidadEducativa}</span></p>
                    <p><span className="text-slate-500 font-medium">Director/a:</span> <span className="font-bold text-slate-800">{cuad.director || 'N/A'}</span></p>
                    <p><span className="text-slate-500 font-medium">Docente:</span> <span className="font-bold text-slate-800">{cuad.docente?.nombre || usuario?.nombre || 'N/A'}</span></p>
                    <p><span className="text-slate-500 font-medium">Materia:</span> <span className="font-bold text-slate-800">{cuad.materia?.nombre || 'N/A'} ({cuad.materia?.area || ''})</span></p>
                    <p><span className="text-slate-500 font-medium">Curso:</span> <span className="font-bold text-slate-800">{getCursoLabel(cuad)}</span></p>
                    <p><span className="text-slate-500 font-medium">Nivel:</span> <span className="font-bold text-slate-800 capitalize">{cuad.nivel || 'N/A'}</span></p>
                  </div>

                  <p className="text-[10px] text-slate-400 mt-4 tracking-wide">RM 01/2026 — SISTEMA EDUCATIVO PLURINACIONAL</p>
                </div>
              </div>
            )}

            <div className="mt-6 flex gap-3">
              <a href={`/asistencia?cuaderno=${cuad._id}`} className="flex-1 text-center bg-emerald-50 text-emerald-700 hover:bg-emerald-100 py-2 rounded-lg font-medium transition-colors">
                ✅ Asistencia
              </a>
              <a href={`/evaluaciones?cuaderno=${cuad._id}`} className="flex-1 text-center bg-indigo-50 text-indigo-700 hover:bg-indigo-100 py-2 rounded-lg font-medium transition-colors">
                📝 Notas
              </a>
            </div>
          </div>
        ))}
      </div>

      {/* ──── MODAL: CaratulaForm con selectores dinámicos ──── */}
      {mostrarModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-4xl overflow-hidden max-h-[90vh] flex flex-col">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h2 className="text-xl font-bold text-slate-800">Crear Cuaderno Pedagógico</h2>
              <button onClick={() => setMostrarModal(false)} className="text-slate-400 hover:text-slate-600 text-xl">✕</button>
            </div>

            <div className="flex flex-col md:flex-row flex-1 overflow-hidden">
              {/* ──── FORMULARIO (izquierda) ──── */}
              <form onSubmit={handleSubmit} className="p-6 space-y-4 flex-1 overflow-y-auto">
                <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider border-b border-slate-100 pb-2">
                  📚 Asignación Académica
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Curso *</label>
                    <select required name="curso" value={formData.curso} onChange={handleChange} className="w-full border border-slate-200 p-2.5 rounded-lg bg-slate-50 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none">
                      <option value="">Seleccione un curso</option>
                      {cursos.map(c => <option key={c._id} value={c._id}>{c.grado} "{c.paralelo}" — {c.turno}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Materia *</label>
                    <select required name="materia" value={formData.materia} onChange={handleChange} className="w-full border border-slate-200 p-2.5 rounded-lg bg-slate-50 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none">
                      <option value="">Seleccione una materia</option>
                      {materias.map(m => <option key={m._id} value={m._id}>{m.nombre} ({m.grado})</option>)}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Nivel *</label>
                    <select name="nivel" value={formData.nivel} onChange={handleChange} className="w-full border border-slate-200 p-2.5 rounded-lg bg-slate-50">
                      <option value="inicial">Inicial</option>
                      <option value="primaria">Primaria</option>
                      <option value="secundaria">Secundaria</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Gestión *</label>
                    <input type="number" required name="gestion" value={formData.gestion} onChange={handleChange} className="w-full border border-slate-200 p-2.5 rounded-lg bg-slate-50" />
                  </div>
                </div>

                <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider border-b border-slate-100 pb-2 mt-4">
                  🏛️ Datos Institucionales (Carátula)
                </h3>

                {/* Selectores Dinámicos en Cascada */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Departamento *</label>
                    <select required name="departamento" value={formData.departamento} onChange={handleChange} className="w-full border border-slate-200 p-2.5 rounded-lg bg-slate-50 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none">
                      {Object.keys(DEPARTAMENTOS_DATA).map(dep => (
                        <option key={dep} value={dep}>{dep}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Distrito Educativo *</label>
                    <select required name="distritoEducativo" value={formData.distritoEducativo} onChange={handleChange} className="w-full border border-slate-200 p-2.5 rounded-lg bg-slate-50 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none">
                      <option value="">Seleccione un distrito</option>
                      {distritosDisponibles.map(dist => (
                        <option key={dist} value={dist}>{dist}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Unidad Educativa *</label>
                  <input required name="unidadEducativa" value={formData.unidadEducativa} onChange={handleChange} className="w-full border border-slate-200 p-2.5 rounded-lg bg-slate-50" placeholder="Ej: Colegio Nacional Bolívar" />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Director(a)</label>
                  <input name="director" value={formData.director} onChange={handleChange} className="w-full border border-slate-200 p-2.5 rounded-lg bg-slate-50" placeholder="Ej: Lic. María Flores" />
                </div>

                <div className="flex justify-end gap-2 mt-6 pt-4 border-t border-slate-100">
                  <button type="button" onClick={() => setMostrarModal(false)} className="px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-lg font-medium transition-colors">Cancelar</button>
                  <button type="submit" className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium shadow-sm transition-colors">Crear Cuaderno</button>
                </div>
              </form>

              {/* ──── PREVIEW EN TIEMPO REAL (derecha) ──── */}
              <div className="w-full md:w-80 bg-gradient-to-b from-slate-50 to-slate-100 border-l border-slate-200 p-6 overflow-y-auto flex flex-col">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4 text-center">Vista Previa de Carátula</h3>
                
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 text-center space-y-2 flex-1">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Estado Plurinacional de Bolivia</p>
                  <p className="text-[10px] font-semibold text-slate-400 uppercase">Ministerio de Educación</p>
                  <div className="border-b border-slate-200 my-2"></div>
                  
                  <p className="text-xs font-bold text-slate-700 uppercase">{formData.departamento || '___________'}</p>
                  <p className="text-[10px] text-slate-500">Distrito: <span className="font-semibold">{formData.distritoEducativo || '___________'}</span></p>
                  
                  <div className="bg-blue-600 text-white py-2 px-4 rounded-lg my-3 shadow-md">
                    <p className="text-[9px] font-medium text-blue-200 uppercase">Cuaderno Pedagógico</p>
                    <p className="text-sm font-extrabold">GESTIÓN {formData.gestion}</p>
                  </div>

                  <div className="space-y-1.5 text-[11px] text-left">
                    <p className="text-slate-500">U.E.: <span className="font-bold text-slate-800">{formData.unidadEducativa || '___________'}</span></p>
                    <p className="text-slate-500">Director/a: <span className="font-bold text-slate-800">{formData.director || '___________'}</span></p>
                    <p className="text-slate-500">Docente: <span className="font-bold text-slate-800">{usuario?.nombre || '___________'}</span></p>
                    <p className="text-slate-500">Materia: <span className="font-bold text-slate-800">
                      {formData.materia ? materias.find(m => m._id === formData.materia)?.nombre || '...' : '___________'}
                    </span></p>
                    <p className="text-slate-500">Curso: <span className="font-bold text-slate-800">
                      {formData.curso ? (() => { const c = cursos.find(c => c._id === formData.curso); return c ? `${c.grado} "${c.paralelo}"` : '...'; })() : '___________'}
                    </span></p>
                    <p className="text-slate-500">Nivel: <span className="font-bold text-slate-800 capitalize">{formData.nivel}</span></p>
                  </div>

                  <p className="text-[8px] text-slate-300 mt-4">RM 01/2026</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Cuadernos;
