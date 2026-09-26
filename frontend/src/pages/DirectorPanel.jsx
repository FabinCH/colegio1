// ============================================
// pages/DirectorPanel.jsx — Panel del Director
// ============================================

import { useState, useEffect } from 'react';
import API from '../api/axiosConfig';
import { useAuth } from '../context/AuthContext';

const DirectorPanel = () => {
  const { usuario } = useAuth();
  const [seccion, setSeccion] = useState('reportes');

  // Verificar que es director o admin
  if (usuario?.rol !== 'director' && usuario?.rol !== 'admin') {
    return (
      <div className="page-container flex items-center justify-center min-h-[60vh]">
        <div className="text-center bg-red-50 border border-red-200 rounded-2xl p-12">
          <div className="text-5xl mb-4">🚫</div>
          <h2 className="text-xl font-bold text-red-800 mb-2">Acceso Denegado</h2>
          <p className="text-red-600">Solo el Director tiene acceso a este panel.</p>
        </div>
      </div>
    );
  }

  const secciones = [
    { id: 'reportes',   icon: '📊', label: 'Reportes por Curso',   color: 'blue' },
    { id: 'rendimiento',icon: '👨‍🏫', label: 'Rendimiento Docente',   color: 'violet' },
    { id: 'asistencia', icon: '📅', label: 'Estadísticas Asistencia',color: 'emerald' },
    { id: 'ranking',    icon: '🏆', label: 'Ranking de Notas',      color: 'amber' },
    { id: 'cuadernos',  icon: '📚', label: 'Supervisar Cuadernos',  color: 'cyan' },
    { id: 'exportar',   icon: '📤', label: 'Exportación SIGED',     color: 'slate' },
  ];

  const colorActiveMap = {
    blue:   'bg-blue-50 text-blue-700 border-l-4 border-blue-600',
    violet: 'bg-violet-50 text-violet-700 border-l-4 border-violet-600',
    emerald:'bg-emerald-50 text-emerald-700 border-l-4 border-emerald-600',
    amber:  'bg-amber-50 text-amber-700 border-l-4 border-amber-500',
    cyan:   'bg-cyan-50 text-cyan-700 border-l-4 border-cyan-600',
    slate:  'bg-slate-100 text-slate-800 border-l-4 border-slate-700',
  };

  return (
    <div className="page-container">
      <div className="page-header mb-6">
        <div>
          <h1 className="page-title flex items-center gap-3">
            <span className="text-3xl">🎩</span> Panel del Director
          </h1>
          <p className="page-subtitle">Supervisión académica y administrativa</p>
        </div>
      </div>

      <div className="flex gap-6">
        {/* Menú Lateral */}
        <aside className="w-64 flex-shrink-0">
          <nav className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
            {secciones.map(s => (
              <button
                key={s.id}
                onClick={() => setSeccion(s.id)}
                className={`w-full flex items-center gap-3 px-4 py-3.5 text-left text-sm font-semibold transition-all ${
                  seccion === s.id ? colorActiveMap[s.color] : 'text-slate-600 hover:bg-slate-50 border-l-4 border-transparent'
                }`}
              >
                <span className="text-lg">{s.icon}</span>
                <span>{s.label}</span>
              </button>
            ))}
          </nav>
        </aside>

        {/* Contenido Principal */}
        <main className="flex-1 min-w-0">
          {seccion === 'reportes'    && <SeccionReportes />}
          {seccion === 'rendimiento' && <SeccionRendimiento />}
          {seccion === 'asistencia'  && <SeccionAsistencia />}
          {seccion === 'ranking'     && <SeccionRanking />}
          {seccion === 'cuadernos'   && <SeccionCuadernos />}
          {seccion === 'exportar'    && <SeccionExportar />}
        </main>
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════
// SECCIONES
// ═══════════════════════════════════════════════════════════

const SeccionReportes = () => {
  const [data, setData] = useState([]);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    API.get('/director/reportes-curso').then(r => setData(r.data.data)).finally(() => setCargando(false));
  }, []);

  if (cargando) return <CargandoCard />;

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-black text-slate-800 border-b border-slate-100 pb-2">📊 Reportes por Curso</h2>
      <div className="grid grid-cols-2 gap-4">
        {data.map(c => (
          <div key={c._id} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex justify-between items-center">
            <div>
              <div className="font-bold text-lg text-slate-800">{c.grado} {c.paralelo}</div>
              <div className="text-xs font-semibold text-slate-500 capitalize">{c.nivel}</div>
            </div>
            <div className="text-right">
              <div className="text-2xl font-black text-blue-600">{c.totalEstudiantes}</div>
              <div className="text-xs text-slate-400">Estudiantes</div>
            </div>
          </div>
        ))}
        {data.length === 0 && <p className="col-span-2 text-slate-400 text-center py-8">No hay cursos registrados.</p>}
      </div>
    </div>
  );
};

const SeccionRendimiento = () => {
  const [data, setData] = useState([]);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    API.get('/director/rendimiento-docente').then(r => setData(r.data.data)).finally(() => setCargando(false));
  }, []);

  if (cargando) return <CargandoCard />;

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-black text-slate-800 border-b border-slate-100 pb-2">👨‍🏫 Rendimiento por Docente</h2>
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
        <table className="w-full text-sm text-left">
          <thead className="bg-slate-800 text-white">
            <tr>
              <th className="p-4">Docente</th>
              <th className="p-4 text-center">Cuadernos Asignados</th>
              <th className="p-4 text-center">Aprobados</th>
              <th className="p-4 text-center">Rendimiento (Progreso)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {data.map(d => (
              <tr key={d._id} className="hover:bg-slate-50">
                <td className="p-4 font-semibold text-slate-800">{d.nombre}</td>
                <td className="p-4 text-center font-bold text-slate-600">{d.cuadernosAsignados}</td>
                <td className="p-4 text-center font-bold text-emerald-600">{d.cuadernosAprobados}</td>
                <td className="p-4">
                  <div className="flex items-center gap-3 justify-center">
                    <div className="w-24 bg-slate-200 rounded-full h-2 overflow-hidden">
                      <div className="bg-blue-600 h-2 rounded-full" style={{ width: `${d.rendimiento}%` }}></div>
                    </div>
                    <span className="font-bold text-xs">{d.rendimiento}%</span>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const SeccionAsistencia = () => {
  const [data, setData] = useState({});
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    API.get('/director/asistencia').then(r => setData(r.data.data)).finally(() => setCargando(false));
  }, []);

  if (cargando) return <CargandoCard />;

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-black text-slate-800 border-b border-slate-100 pb-2">📅 Estadísticas Globales de Asistencia</h2>
      <div className="grid grid-cols-4 gap-4">
        <StatCard title="Presentes" value={data.presente} color="emerald" icon="✅" />
        <StatCard title="Faltas" value={data.falta} color="red" icon="❌" />
        <StatCard title="Atrasos" value={data.atraso} color="amber" icon="⏱️" />
        <StatCard title="Licencias" value={data.licencia} color="blue" icon="📝" />
      </div>
    </div>
  );
};

const SeccionRanking = () => {
  const [data, setData] = useState([]);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    API.get('/director/ranking-notas').then(r => setData(r.data.data)).finally(() => setCargando(false));
  }, []);

  if (cargando) return <CargandoCard />;

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-black text-slate-800 border-b border-slate-100 pb-2">🏆 Ranking de Notas (Top 10)</h2>
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        {data.map((est, i) => (
          <div key={est._id} className="flex items-center gap-4 p-4 border-b border-slate-100 hover:bg-slate-50 last:border-0">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-black text-sm ${
              i === 0 ? 'bg-yellow-400 text-white' : i === 1 ? 'bg-slate-300 text-white' : i === 2 ? 'bg-amber-600 text-white' : 'bg-slate-100 text-slate-500'
            }`}>
              {i + 1}
            </div>
            <div className="flex-1">
              <div className="font-bold text-slate-800">{est.nombre}</div>
              <div className="text-xs text-slate-500">{est.curso}</div>
            </div>
            <div className="text-2xl font-black text-emerald-600">{est.promedio}</div>
          </div>
        ))}
      </div>
    </div>
  );
};

const SeccionCuadernos = () => {
  const [cuadernos, setCuadernos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [modal, setModal] = useState(null);
  const [comentario, setComentario] = useState('');

  const cargar = () => {
    setCargando(true);
    API.get('/director/cuadernos').then(r => setCuadernos(r.data.data)).finally(() => setCargando(false));
  };

  useEffect(() => { cargar(); }, []);

  const handleSupervisar = async (estado) => {
    try {
      await API.put(`/director/cuadernos/${modal._id}/supervisar`, { estado, comentario });
      setModal(null);
      cargar();
    } catch (e) {
      alert('Error al actualizar');
    }
  };

  const badgeColor = {
    pendiente: 'bg-amber-100 text-amber-700',
    aprobado:  'bg-emerald-100 text-emerald-700',
    rechazado: 'bg-red-100 text-red-700'
  };

  if (cargando) return <CargandoCard />;

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-black text-slate-800 border-b border-slate-100 pb-2">📚 Supervisar Cuadernos Pedagógicos</h2>
      <div className="space-y-3">
        {cuadernos.map(c => (
          <div key={c._id} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
            <div>
              <div className="font-bold text-slate-800">{c.materia?.nombre} — {c.curso?.grado} {c.curso?.nivel}</div>
              <div className="text-sm text-slate-500">Docente: {c.docente?.nombre}</div>
              {c.comentarioSupervision && (
                <div className="text-xs text-slate-500 mt-1 italic">📝 "{c.comentarioSupervision}"</div>
              )}
            </div>
            <div className="flex items-center gap-3">
              <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${badgeColor[c.estadoSupervision] || 'bg-slate-100'}`}>
                {c.estadoSupervision}
              </span>
              <button onClick={() => { setModal(c); setComentario(c.comentarioSupervision || ''); }}
                className="bg-blue-50 text-blue-700 px-3 py-1.5 rounded-lg text-sm font-semibold hover:bg-blue-100">
                Evaluar
              </button>
            </div>
          </div>
        ))}
      </div>

      {modal && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl w-full max-w-md p-6">
            <h3 className="font-bold text-lg mb-4">Evaluar Cuaderno</h3>
            <p className="text-sm text-slate-600 mb-4">Docente: <b>{modal.docente?.nombre}</b></p>
            <textarea
              className="w-full border border-slate-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-blue-300 outline-none mb-4"
              rows="3" placeholder="Comentarios de revisión (opcional)..."
              value={comentario} onChange={e => setComentario(e.target.value)}
            ></textarea>
            <div className="flex gap-3 justify-end">
              <button onClick={() => setModal(null)} className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl font-bold">Cancelar</button>
              <button onClick={() => handleSupervisar('rechazado')} className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold">Rechazar</button>
              <button onClick={() => handleSupervisar('aprobado')} className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold">Aprobar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const SeccionExportar = () => {
  const handleDownload = async (tipo) => {
    try {
      const res = await API.get(`/director/exportar/${tipo}`);
      // Crear archivo JSON simulando CSV/Excel
      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(res.data.data, null, 2));
      const downloadAnchorNode = document.createElement('a');
      downloadAnchorNode.setAttribute("href", dataStr);
      downloadAnchorNode.setAttribute("download", `SIGED_${tipo}_${new Date().getTime()}.json`);
      document.body.appendChild(downloadAnchorNode);
      downloadAnchorNode.click();
      downloadAnchorNode.remove();
    } catch (e) { alert('Error al exportar'); }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-black text-slate-800 border-b border-slate-100 pb-2">📤 Exportación SIGED</h2>
      <p className="text-slate-600">Genera los archivos requeridos para la plataforma oficial del Ministerio de Educación (SIGED).</p>
      
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-slate-50 border border-slate-200 p-6 rounded-2xl text-center">
          <div className="text-4xl mb-3">📄</div>
          <h3 className="font-bold text-slate-800 mb-2">Exportar Centralizador</h3>
          <p className="text-xs text-slate-500 mb-4">Notas finales de todos los estudiantes listos para importar al sistema SIGED.</p>
          <button onClick={() => handleDownload('centralizador')}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-xl font-bold text-sm shadow-sm">
            Descargar Centralizador
          </button>
        </div>
        
        <div className="bg-slate-50 border border-slate-200 p-6 rounded-2xl text-center">
          <div className="text-4xl mb-3">📈</div>
          <h3 className="font-bold text-slate-800 mb-2">Reporte Ministerial</h3>
          <p className="text-xs text-slate-500 mb-4">Datos estadísticos consolidados (aprobados, reprobados, género).</p>
          <button onClick={() => handleDownload('ministerial')}
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-2 rounded-xl font-bold text-sm shadow-sm">
            Descargar Reporte
          </button>
        </div>
      </div>
    </div>
  );
};

const StatCard = ({ title, value, color, icon }) => {
  const bg = { emerald: 'bg-emerald-50', red: 'bg-red-50', amber: 'bg-amber-50', blue: 'bg-blue-50' }[color];
  const text = { emerald: 'text-emerald-700', red: 'text-red-700', amber: 'text-amber-700', blue: 'text-blue-700' }[color];
  return (
    <div className={`${bg} ${text} p-5 rounded-2xl border flex flex-col items-center justify-center text-center`}>
      <div className="text-2xl mb-1">{icon}</div>
      <div className="text-3xl font-black">{value || 0}</div>
      <div className="text-xs font-bold uppercase mt-1 opacity-80">{title}</div>
    </div>
  );
};

const CargandoCard = () => <div className="text-center p-12 text-slate-400 font-bold">⏳ Cargando datos...</div>;

export default DirectorPanel;
