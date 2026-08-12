// ============================================
// pages/Evaluaciones.jsx — Registro de Notas por Materia
// ============================================
//
// Criterios de evaluación (RM 01/2026):
//   Saber         → máx 45 pts (conocimiento teórico)
//   Hacer         → máx 40 pts (práctica, aplicación)
//   SER           → máx 10 pts (actitudes, valores)
//   Autoevaluación → máx  5 pts (el estudiante se evalúa)
//   TOTAL         → 100 pts

import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import API from '../api/axiosConfig';

const Evaluaciones = () => {
  const [searchParams] = useSearchParams();
  const cuadernoIdInicial = searchParams.get('cuaderno') || '';

  const [cuadernos, setCuadernos] = useState([]);
  const [cuadernoSeleccionado, setCuadernoSeleccionado] = useState(cuadernoIdInicial);
  const [trimestre, setTrimestre] = useState('1');

  const [estudiantes, setEstudiantes] = useState([]);
  const [cargandoEstudiantes, setCargandoEstudiantes] = useState(false);
  const [notas, setNotas] = useState({}); // { estId: { ser, saber, hacer, autoevaluacion } }
  const [guardando, setGuardando] = useState(false);
  const [guardadoOk, setGuardadoOk] = useState(false);

  // Cargar cuadernos al inicio
  useEffect(() => {
    const fetchCuadernos = async () => {
      try {
        const { data } = await API.get('/cuadernos');
        setCuadernos(data.data || []);
      } catch (err) {
        console.error(err);
      }
    };
    fetchCuadernos();
  }, []);

  // Cargar estudiantes INSCRITOS y notas existentes al cambiar cuaderno o trimestre
  useEffect(() => {
    if (!cuadernoSeleccionado || !trimestre) {
      setEstudiantes([]);
      setNotas({});
      return;
    }

    const fetchDatos = async () => {
      try {
        setCargandoEstudiantes(true);

        // 1. Obtener estudiantes inscritos en esta materia/cuaderno
        const { data: insData } = await API.get(`/inscripciones?cuaderno=${cuadernoSeleccionado}`);
        const inscripciones = insData.data || [];
        const listaEst = inscripciones.map(ins => ins.estudiante).filter(Boolean);
        setEstudiantes(listaEst);

        // 2. Obtener notas existentes para este cuaderno+trimestre
        const { data: notasData } = await API.get(`/evaluaciones?cuaderno=${cuadernoSeleccionado}&trimestre=${trimestre}`);
        const evaluacionesExistentes = notasData.data || [];

        // 3. Combinar: si existe nota, cargarla; si no, inicializar vacío
        const estadoNotas = {};
        listaEst.forEach(est => {
          const notaExistente = evaluacionesExistentes.find(
            e => e.estudiante?._id === est._id || e.estudiante === est._id
          );
          if (notaExistente) {
            estadoNotas[est._id] = {
              ser: notaExistente.ser,
              saber: notaExistente.saber,
              hacer: notaExistente.hacer,
              autoevaluacion: notaExistente.autoevaluacion,
            };
          } else {
            estadoNotas[est._id] = { ser: '', saber: '', hacer: '', autoevaluacion: '' };
          }
        });

        setNotas(estadoNotas);
      } catch (err) {
        console.error('Error al cargar evaluaciones:', err);
      } finally {
        setCargandoEstudiantes(false);
      }
    };

    fetchDatos();
  }, [cuadernoSeleccionado, trimestre]);

  const handleNotaChange = (estId, dimension, value) => {
    let val = value === '' ? '' : Number(value);

    // Aplicar límites
    const limites = { ser: 10, saber: 45, hacer: 40, autoevaluacion: 5 };
    if (val !== '' && val > limites[dimension]) val = limites[dimension];
    if (val !== '' && val < 0) val = 0;

    setNotas(prev => ({
      ...prev,
      [estId]: { ...prev[estId], [dimension]: val },
    }));
  };

  const calcularTotal = (estId) => {
    const n = notas[estId];
    if (!n) return 0;
    return (Number(n.ser) || 0) + (Number(n.saber) || 0) + (Number(n.hacer) || 0) + (Number(n.autoevaluacion) || 0);
  };

  const guardarNotas = async () => {
    if (!cuadernoSeleccionado) return alert('Seleccione un cuaderno');
    if (estudiantes.length === 0) return alert('No hay estudiantes inscritos en esta materia');

    const evaluaciones = estudiantes.map(est => ({
      estudiante: est._id,
      ser: Number(notas[est._id]?.ser) || 0,
      saber: Number(notas[est._id]?.saber) || 0,
      hacer: Number(notas[est._id]?.hacer) || 0,
      autoevaluacion: Number(notas[est._id]?.autoevaluacion) || 0,
    }));

    try {
      setGuardando(true);
      await API.post('/evaluaciones/lote', {
        cuaderno: cuadernoSeleccionado,
        trimestre: Number(trimestre),
        evaluaciones,
      });
      setGuardadoOk(true);
      setTimeout(() => setGuardadoOk(false), 3000);
    } catch (err) {
      alert(err.response?.data?.mensaje || 'Error al guardar notas');
    } finally {
      setGuardando(false);
    }
  };

  const cuadernoInfo = cuadernos.find(c => c._id === cuadernoSeleccionado);

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">Registro de Evaluaciones</h1>
          <p className="page-subtitle">Notas trimestrales por dimensiones — Total: 100 pts</p>
        </div>
      </div>

      {/* Controles de Selección */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-2">📚 Cuaderno / Materia</label>
          <select
            value={cuadernoSeleccionado}
            onChange={(e) => setCuadernoSeleccionado(e.target.value)}
            className="w-full border border-slate-200 p-3 rounded-xl bg-slate-50 font-medium text-slate-800 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-colors"
          >
            <option value="">-- Seleccione una materia --</option>
            {cuadernos.map(c => (
              <option key={c._id} value={c._id}>
                {c.materia?.nombre} — {c.curso?.grado} &quot;{c.curso?.paralelo}&quot; ({c.curso?.turno})
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-2">⏳ Trimestre</label>
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

      {/* Leyenda de criterios */}
      {cuadernoSeleccionado && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: 'Saber', max: 45, color: 'bg-blue-600', light: 'bg-blue-50 border-blue-200 text-blue-800', desc: 'Conocimiento teórico' },
            { label: 'Hacer', max: 40, color: 'bg-emerald-600', light: 'bg-emerald-50 border-emerald-200 text-emerald-800', desc: 'Práctica y aplicación' },
            { label: 'SER', max: 10, color: 'bg-amber-500', light: 'bg-amber-50 border-amber-200 text-amber-800', desc: 'Actitudes y valores' },
            { label: 'Autoevaluación', max: 5, color: 'bg-purple-600', light: 'bg-purple-50 border-purple-200 text-purple-800', desc: 'Autovaloración' },
          ].map(c => (
            <div key={c.label} className={`border rounded-xl p-4 ${c.light}`}>
              <div className="flex items-center justify-between mb-1">
                <span className="font-bold text-sm">{c.label}</span>
                <span className={`text-white text-xs font-extrabold px-2 py-0.5 rounded-full ${c.color}`}>/{c.max} pts</span>
              </div>
              <p className="text-xs opacity-75">{c.desc}</p>
            </div>
          ))}
        </div>
      )}

      {/* Tabla de Notas */}
      {cuadernoSeleccionado && (
        cargandoEstudiantes ? (
          <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center text-slate-500">
            Cargando estudiantes inscritos...
          </div>
        ) : estudiantes.length > 0 ? (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            {/* Encabezado de tabla */}
            <div className="overflow-x-auto">
              <table className="w-full text-center border-collapse min-w-[800px]">
                <thead>
                  <tr className="bg-slate-800 text-white text-sm">
                    <th className="p-3 text-left w-12 border-r border-slate-700">Nº</th>
                    <th className="p-3 text-left border-r border-slate-700">Apellidos y Nombres</th>
                    {/* Saber /45 */}
                    <th className="p-3 border-r border-slate-700 w-24 bg-blue-800">
                      <div className="text-xs text-blue-300 font-normal">SABER</div>
                      <div className="text-lg font-bold">/45</div>
                    </th>
                    {/* Hacer /40 */}
                    <th className="p-3 border-r border-slate-700 w-24 bg-emerald-800">
                      <div className="text-xs text-emerald-300 font-normal">HACER</div>
                      <div className="text-lg font-bold">/40</div>
                    </th>
                    {/* SER /10 */}
                    <th className="p-3 border-r border-slate-700 w-24 bg-amber-700">
                      <div className="text-xs text-amber-200 font-normal">SER</div>
                      <div className="text-lg font-bold">/10</div>
                    </th>
                    {/* Autoevaluación /5 */}
                    <th className="p-3 border-r border-slate-700 w-28 bg-purple-800">
                      <div className="text-xs text-purple-300 font-normal">AUTOEVALUACIÓN</div>
                      <div className="text-lg font-bold">/5</div>
                    </th>
                    {/* Total /100 */}
                    <th className="p-3 w-28 bg-slate-600">
                      <div className="text-xs text-slate-300 font-normal">TOTAL FINAL</div>
                      <div className="text-lg font-bold">/100</div>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {estudiantes.map((est, idx) => {
                    const total = calcularTotal(est._id);
                    const aprobado = total >= 51;
                    const hayNota = total > 0;

                    return (
                      <tr key={est._id} className="hover:bg-slate-50 transition-colors group">
                        <td className="p-3 border-r border-slate-200 text-slate-400 text-left">{idx + 1}</td>
                        <td className="p-3 border-r border-slate-200 font-semibold text-slate-800 text-left">
                          {est.apellidos}, {est.nombres}
                          <div className="text-xs text-slate-400 font-normal">{est.rude}</div>
                        </td>
                        {/* SABER */}
                        <td className="p-2 border-r border-slate-200 bg-blue-50/40">
                          <input
                            type="number" min="0" max="45"
                            value={notas[est._id]?.saber ?? ''}
                            onChange={(e) => handleNotaChange(est._id, 'saber', e.target.value)}
                            className="w-full text-center p-2 bg-transparent focus:bg-white focus:ring-2 focus:ring-blue-400 rounded outline-none font-bold text-blue-700 text-lg"
                            placeholder="—"
                          />
                        </td>
                        {/* HACER */}
                        <td className="p-2 border-r border-slate-200 bg-emerald-50/40">
                          <input
                            type="number" min="0" max="40"
                            value={notas[est._id]?.hacer ?? ''}
                            onChange={(e) => handleNotaChange(est._id, 'hacer', e.target.value)}
                            className="w-full text-center p-2 bg-transparent focus:bg-white focus:ring-2 focus:ring-emerald-400 rounded outline-none font-bold text-emerald-700 text-lg"
                            placeholder="—"
                          />
                        </td>
                        {/* SER */}
                        <td className="p-2 border-r border-slate-200 bg-amber-50/40">
                          <input
                            type="number" min="0" max="10"
                            value={notas[est._id]?.ser ?? ''}
                            onChange={(e) => handleNotaChange(est._id, 'ser', e.target.value)}
                            className="w-full text-center p-2 bg-transparent focus:bg-white focus:ring-2 focus:ring-amber-400 rounded outline-none font-bold text-amber-700 text-lg"
                            placeholder="—"
                          />
                        </td>
                        {/* AUTOEVALUACIÓN */}
                        <td className="p-2 border-r border-slate-200 bg-purple-50/40">
                          <input
                            type="number" min="0" max="5"
                            value={notas[est._id]?.autoevaluacion ?? ''}
                            onChange={(e) => handleNotaChange(est._id, 'autoevaluacion', e.target.value)}
                            className="w-full text-center p-2 bg-transparent focus:bg-white focus:ring-2 focus:ring-purple-400 rounded outline-none font-bold text-purple-700 text-lg"
                            placeholder="—"
                          />
                        </td>
                        {/* TOTAL */}
                        <td className={`p-3 font-extrabold text-xl transition-colors ${
                          !hayNota
                            ? 'text-slate-300'
                            : aprobado
                              ? 'text-emerald-700 bg-emerald-50'
                              : 'text-red-600 bg-red-50'
                        }`}>
                          {hayNota ? (
                            <div>
                              <div>{total}</div>
                              <div className={`text-xs font-semibold ${aprobado ? 'text-emerald-500' : 'text-red-400'}`}>
                                {aprobado ? '✓ Aprobado' : '✗ Reprobado'}
                              </div>
                            </div>
                          ) : '—'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pie de tabla */}
            <div className="p-6 bg-slate-50 border-t border-slate-200 flex flex-col md:flex-row justify-between items-center gap-4">
              <div className="text-sm text-slate-500 space-y-1">
                <p>* Nota mínima de aprobación: <strong className="text-slate-700">51 puntos</strong></p>
                <p>* Orden: <strong className="text-blue-600">Saber/45</strong> + <strong className="text-emerald-600">Hacer/40</strong> + <strong className="text-amber-600">SER/10</strong> + <strong className="text-purple-600">Autoevaluación/5</strong></p>
                <p>* Total estudiantes inscritos: <strong className="text-slate-700">{estudiantes.length}</strong></p>
              </div>

              <div className="flex items-center gap-3">
                {guardadoOk && (
                  <span className="bg-emerald-100 text-emerald-700 border border-emerald-200 px-4 py-2 rounded-xl text-sm font-bold animate-pulse">
                    ✅ Notas guardadas exitosamente
                  </span>
                )}
                <button
                  onClick={guardarNotas}
                  disabled={guardando}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-xl font-bold shadow-sm transition-colors disabled:opacity-50 flex items-center gap-2"
                >
                  {guardando ? (
                    <><span className="animate-spin">⏳</span> Guardando...</>
                  ) : (
                    <>💾 Guardar Notas</>
                  )}
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-amber-50 text-amber-800 p-8 rounded-2xl border border-amber-200 text-center">
            <div className="text-3xl mb-2">📋</div>
            <p className="font-bold text-lg">No hay estudiantes inscritos en esta materia</p>
            <p className="text-sm text-amber-700 mt-1">
              Vaya al módulo de <strong>Materias</strong> y use el botón <strong>&quot;👥 Inscribir Estudiantes&quot;</strong> para agregar alumnos a esta materia.
            </p>
          </div>
        )
      )}

      {/* Estado inicial: ningún cuaderno seleccionado */}
      {!cuadernoSeleccionado && (
        <div className="bg-blue-50 border border-blue-200 text-blue-900 p-12 rounded-2xl text-center shadow-sm">
          <span className="text-5xl mb-4 block">📝</span>
          <h2 className="text-xl font-bold mb-1">Registro de Evaluaciones</h2>
          <p className="text-sm text-blue-700 max-w-md mx-auto">
            Selecciona un cuaderno / materia en la parte superior para ver y registrar las notas de los estudiantes inscritos.
          </p>
        </div>
      )}
    </div>
  );
};

export default Evaluaciones;
