// ============================================================
// frontend/src/pages/Predicciones.jsx
// ============================================================
// Página de Predicciones ML para admin y director.
// Muestra: KPIs, tabla de estudiantes, cards de cursos, gráficos y filtros.
// ============================================================

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import API from '../api/axiosConfig';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell, RadialBarChart, RadialBar,
} from 'recharts';

// ── Paleta de colores por riesgo ──────────────────────────────
const RIESGO_COLOR = {
  alto:  { bg: '#fef2f2', border: '#fca5a5', text: '#dc2626', badge: '#ef4444', dot: '#dc2626' },
  medio: { bg: '#fffbeb', border: '#fcd34d', text: '#d97706', badge: '#f59e0b', dot: '#d97706' },
  bajo:  { bg: '#f0fdf4', border: '#86efac', text: '#16a34a', badge: '#22c55e', dot: '#16a34a' },
};

const RIESGO_LABEL = { alto: 'Alto', medio: 'Medio', bajo: 'Bajo' };

// ── Componentes auxiliares ────────────────────────────────────

function Spinner() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', gap: '1rem', padding: '4rem' }}>
      <div style={{
        width: 52, height: 52,
        border: '4px solid #e2e8f0',
        borderTop: '4px solid #6366f1',
        borderRadius: '50%',
        animation: 'spin 0.8s linear infinite',
      }} />
      <p style={{ color: '#94a3b8', fontSize: '0.875rem', fontWeight: 600 }}>
        Calculando predicciones...
      </p>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

function EmptyState({ mensaje }) {
  return (
    <div style={{ textAlign: 'center', padding: '3rem 1rem' }}>
      <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🤖</div>
      <h3 style={{ color: '#475569', fontSize: '1.125rem', fontWeight: 700, marginBottom: '0.5rem' }}>
        Sin datos suficientes
      </h3>
      <p style={{ color: '#94a3b8', fontSize: '0.875rem', maxWidth: 400, margin: '0 auto' }}>
        {mensaje || 'Registra evaluaciones y asistencias para activar las predicciones ML.'}
      </p>
    </div>
  );
}

function KPICard({ icon, label, value, sublabel, color = '#6366f1', bg = '#eef2ff' }) {
  return (
    <div style={{
      background: '#fff',
      borderRadius: 16,
      padding: '1.5rem',
      boxShadow: '0 1px 3px rgba(0,0,0,0.08), 0 4px 16px rgba(0,0,0,0.04)',
      display: 'flex',
      alignItems: 'center',
      gap: '1.25rem',
      transition: 'transform 0.15s, box-shadow 0.15s',
      cursor: 'default',
    }}
    onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,0,0,0.1)'; }}
    onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.08), 0 4px 16px rgba(0,0,0,0.04)'; }}
    >
      <div style={{
        width: 56, height: 56,
        borderRadius: 14,
        background: bg,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '1.75rem',
        flexShrink: 0,
      }}>
        {icon}
      </div>
      <div style={{ minWidth: 0 }}>
        <p style={{ fontSize: '0.75rem', fontWeight: 600, color: '#94a3b8',
          textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>
          {label}
        </p>
        <p style={{ fontSize: '1.75rem', fontWeight: 800, color, lineHeight: 1 }}>
          {value}
        </p>
        {sublabel && (
          <p style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: 4 }}>
            {sublabel}
          </p>
        )}
      </div>
    </div>
  );
}

function RiesgoBadge({ riesgo }) {
  const c = RIESGO_COLOR[riesgo] || RIESGO_COLOR.bajo;
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 6,
      background: c.bg, color: c.text,
      border: `1px solid ${c.border}`,
      borderRadius: 20, padding: '3px 10px',
      fontSize: '0.75rem', fontWeight: 700,
    }}>
      <span style={{ width: 7, height: 7, borderRadius: '50%', background: c.dot }} />
      {RIESGO_LABEL[riesgo] || riesgo}
    </span>
  );
}

function AlertaBadge({ texto }) {
  return (
    <span style={{
      display: 'inline-block',
      background: '#fef3c7', color: '#92400e',
      border: '1px solid #fcd34d',
      borderRadius: 12, padding: '2px 8px',
      fontSize: '0.68rem', fontWeight: 600,
      marginRight: 4, marginBottom: 4,
    }}>
      ⚠ {texto}
    </span>
  );
}

// ── Tooltip personalizado para recharts ───────────────────────
function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: '#fff', border: '1px solid #e2e8f0',
      borderRadius: 10, padding: '0.75rem 1rem',
      boxShadow: '0 4px 16px rgba(0,0,0,0.1)',
      fontSize: '0.8rem',
    }}>
      <p style={{ fontWeight: 700, color: '#1e293b', marginBottom: 6 }}>{label}</p>
      {payload.map((entry) => (
        <p key={entry.name} style={{ color: entry.color, margin: '2px 0' }}>
          {entry.name}: <strong>{entry.value}</strong>
        </p>
      ))}
    </div>
  );
}

// ── Componente principal ──────────────────────────────────────
export default function Predicciones() {
  const location = useLocation(); // detectar navegación a esta página
  const [cargando, setCargando]   = useState(true);
  const [error, setError]         = useState(null);
  const [resumen, setResumen]     = useState(null);
  const [estudiantes, setEstudiantes] = useState([]);
  const [cursos, setCursos]       = useState([]);

  // Filtros
  const [filtroCurso,     setFiltroCurso]     = useState('');
  const [filtroMateria,   setFiltroMateria]   = useState('');
  const [filtroTrimestre, setFiltroTrimestre] = useState('');
  const [filtroRiesgo,    setFiltroRiesgo]    = useState('');
  const [busqueda,        setBusqueda]        = useState('');

  // Tabs
  const [tabActiva, setTabActiva] = useState('resumen'); // 'resumen' | 'estudiantes' | 'cursos'

  // Paginación tabla
  const [pagina,    setPagina]    = useState(1);
  const POR_PAGINA = 10;

  // ── Cargar datos ────────────────────────────────────────────
  const cargarDatos = useCallback(async () => {
    setCargando(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (filtroCurso)     params.append('cursoId',   filtroCurso);
      if (filtroMateria)   params.append('materiaId', filtroMateria);
      if (filtroTrimestre) params.append('trimestre', filtroTrimestre);

      const [resRes, estRes, curRes] = await Promise.all([
        API.get(`/ml/resumen?${params}`),
        API.get(`/ml/predicciones/estudiantes?${params}`),
        API.get(`/ml/predicciones/cursos?${params}`),
      ]);

      setResumen(resRes.data.data);
      setEstudiantes(estRes.data.data?.predicciones || []);
      setCursos(curRes.data.data?.cursos || []);
    } catch (e) {
      setError(e.response?.data?.mensaje || 'Error al cargar predicciones');
    } finally {
      setCargando(false);
    }
  }, [filtroCurso, filtroMateria, filtroTrimestre]);

  // Recargar al entrar a la página (soluciona el problema de Ctrl+Shift+R)
  useEffect(() => { cargarDatos(); }, [cargarDatos, location.pathname]);

  // ── Listas únicas para filtros ──────────────────────────────
  const cursosUnicos = useMemo(() =>
    [...new Map(estudiantes.map((e) => [e.curso_id, { id: e.curso_id, nombre: e.curso }]))
      .values()], [estudiantes]);

  const materiasUnicas = useMemo(() =>
    [...new Map(estudiantes.map((e) => [e.materia_id, { id: e.materia_id, nombre: e.materia }]))
      .values()], [estudiantes]);

  // ── Estudiantes filtrados ───────────────────────────────────
  const estudiantesFiltrados = useMemo(() => {
    return estudiantes.filter((e) => {
      if (filtroRiesgo && e.riesgo_academico !== filtroRiesgo) return false;
      if (busqueda) {
        const q = busqueda.toLowerCase();
        const nombre = e.estudiante?.nombre?.toLowerCase() || '';
        if (!nombre.includes(q) && !e.materia?.toLowerCase().includes(q)) return false;
      }
      return true;
    });
  }, [estudiantes, filtroRiesgo, busqueda]);

  const totalPaginas = Math.ceil(estudiantesFiltrados.length / POR_PAGINA);
  const estudiantesPagina = estudiantesFiltrados.slice(
    (pagina - 1) * POR_PAGINA, pagina * POR_PAGINA
  );

  // ── Datos para gráficos ─────────────────────────────────────
  const datosDistribucion = resumen ? [
    { name: 'Riesgo Alto',  value: resumen.riesgo_alto,  fill: '#ef4444' },
    { name: 'Riesgo Medio', value: resumen.riesgo_medio, fill: '#f59e0b' },
    { name: 'Riesgo Bajo',  value: resumen.riesgo_bajo,  fill: '#22c55e' },
  ] : [];

  const datosCursos = cursos.slice(0, 8).map((c) => ({
    name: c.curso.split(' ').slice(0, 2).join(' '),
    Alto:  c.resumen?.riesgo_alto  || 0,
    Medio: c.resumen?.riesgo_medio || 0,
    Bajo:  c.resumen?.riesgo_bajo  || 0,
  }));

  const datosPromediosCurso = cursos.slice(0, 8).map((c) => ({
    name:     c.curso.split(' ').slice(0, 2).join(' '),
    Promedio: c.resumen?.promedio_general || 0,
    Asistencia: c.resumen?.porcentaje_asistencia_promedio || 0,
  }));

  // ── Render ──────────────────────────────────────────────────
  return (
    <div style={{ padding: '1.5rem', maxWidth: 1400, margin: '0 auto' }}>
      {/* Encabezado */}
      <div style={{ marginBottom: '2rem', display: 'flex', alignItems: 'flex-start',
        justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0f172a',
            display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0 }}>
            🤖 Predicciones ML
          </h1>
          <p style={{ color: '#64748b', fontSize: '0.875rem', marginTop: 6 }}>
            Análisis de riesgo académico basado en notas y asistencia real
          </p>
        </div>
        <button
          onClick={cargarDatos}
          disabled={cargando}
          id="btn-actualizar-ml"
          style={{
            display: 'flex', alignItems: 'center', gap: 8,
            background: cargando ? '#e2e8f0' : '#6366f1',
            color: cargando ? '#94a3b8' : '#fff',
            border: 'none', borderRadius: 10,
            padding: '0.625rem 1.25rem',
            fontSize: '0.875rem', fontWeight: 600,
            cursor: cargando ? 'not-allowed' : 'pointer',
            transition: 'background 0.2s',
          }}>
          {cargando ? '⏳ Calculando...' : '🔄 Actualizar'}
        </button>
      </div>

      {/* Filtros */}
      <div style={{
        background: '#fff', borderRadius: 14,
        padding: '1.25rem', marginBottom: '1.5rem',
        boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
        display: 'flex', flexWrap: 'wrap', gap: '0.75rem', alignItems: 'center',
      }}>
        <span style={{ fontWeight: 700, color: '#475569', fontSize: '0.8rem',
          textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          🔍 Filtros:
        </span>

        {/* Búsqueda */}
        <input
          id="filtro-busqueda-ml"
          placeholder="Buscar estudiante o materia..."
          value={busqueda}
          onChange={(e) => { setBusqueda(e.target.value); setPagina(1); }}
          style={{
            border: '1.5px solid #e2e8f0', borderRadius: 8,
            padding: '0.45rem 0.875rem', fontSize: '0.8rem',
            outline: 'none', width: 210, color: '#1e293b',
          }}
        />

        {/* Curso */}
        <select
          id="filtro-curso-ml"
          value={filtroCurso}
          onChange={(e) => { setFiltroCurso(e.target.value); setPagina(1); }}
          style={{
            border: '1.5px solid #e2e8f0', borderRadius: 8,
            padding: '0.45rem 0.875rem', fontSize: '0.8rem',
            outline: 'none', color: '#1e293b', background: '#fff',
          }}>
          <option value="">Todos los cursos</option>
          {cursosUnicos.map((c) => (
            <option key={c.id} value={c.id}>{c.nombre}</option>
          ))}
        </select>

        {/* Materia */}
        <select
          id="filtro-materia-ml"
          value={filtroMateria}
          onChange={(e) => { setFiltroMateria(e.target.value); setPagina(1); }}
          style={{
            border: '1.5px solid #e2e8f0', borderRadius: 8,
            padding: '0.45rem 0.875rem', fontSize: '0.8rem',
            outline: 'none', color: '#1e293b', background: '#fff',
          }}>
          <option value="">Todas las materias</option>
          {materiasUnicas.map((m) => (
            <option key={m.id} value={m.id}>{m.nombre}</option>
          ))}
        </select>

        {/* Trimestre */}
        <select
          id="filtro-trimestre-ml"
          value={filtroTrimestre}
          onChange={(e) => { setFiltroTrimestre(e.target.value); setPagina(1); }}
          style={{
            border: '1.5px solid #e2e8f0', borderRadius: 8,
            padding: '0.45rem 0.875rem', fontSize: '0.8rem',
            outline: 'none', color: '#1e293b', background: '#fff',
          }}>
          <option value="">Todos los trimestres</option>
          <option value="1">Trimestre 1</option>
          <option value="2">Trimestre 2</option>
          <option value="3">Trimestre 3</option>
        </select>

        {/* Riesgo */}
        <select
          id="filtro-riesgo-ml"
          value={filtroRiesgo}
          onChange={(e) => { setFiltroRiesgo(e.target.value); setPagina(1); }}
          style={{
            border: '1.5px solid #e2e8f0', borderRadius: 8,
            padding: '0.45rem 0.875rem', fontSize: '0.8rem',
            outline: 'none', color: '#1e293b', background: '#fff',
          }}>
          <option value="">Todos los riesgos</option>
          <option value="alto">🔴 Alto</option>
          <option value="medio">🟡 Medio</option>
          <option value="bajo">🟢 Bajo</option>
        </select>

        {/* Limpiar */}
        {(filtroCurso || filtroMateria || filtroTrimestre || filtroRiesgo || busqueda) && (
          <button
            onClick={() => {
              setFiltroCurso(''); setFiltroMateria('');
              setFiltroTrimestre(''); setFiltroRiesgo('');
              setBusqueda(''); setPagina(1);
            }}
            style={{
              background: 'none', border: '1.5px solid #e2e8f0',
              borderRadius: 8, padding: '0.45rem 0.875rem',
              fontSize: '0.8rem', color: '#64748b',
              cursor: 'pointer', fontWeight: 600,
            }}>
            ✕ Limpiar
          </button>
        )}
      </div>

      {/* Tabs */}
      <div style={{
        display: 'flex', gap: 4, marginBottom: '1.5rem',
        background: '#f1f5f9', borderRadius: 12, padding: 4,
        width: 'fit-content',
      }}>
        {[
          { key: 'resumen',      label: '📊 Resumen'    },
          { key: 'estudiantes',  label: '👤 Estudiantes' },
          { key: 'cursos',       label: '🏫 Cursos'      },
        ].map((tab) => (
          <button
            key={tab.key}
            id={`tab-ml-${tab.key}`}
            onClick={() => setTabActiva(tab.key)}
            style={{
              padding: '0.5rem 1.25rem',
              borderRadius: 9, border: 'none',
              fontWeight: 700, fontSize: '0.825rem',
              cursor: 'pointer',
              transition: 'all 0.15s',
              background: tabActiva === tab.key ? '#fff' : 'transparent',
              color:      tabActiva === tab.key ? '#6366f1' : '#64748b',
              boxShadow:  tabActiva === tab.key ? '0 1px 4px rgba(0,0,0,0.1)' : 'none',
            }}>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Contenido principal */}
      {cargando ? (
        <Spinner />
      ) : error ? (
        <div style={{
          background: '#fef2f2', border: '1px solid #fca5a5',
          borderRadius: 12, padding: '1.25rem', color: '#dc2626',
          fontWeight: 600, fontSize: '0.875rem',
        }}>
          ❌ {error}
        </div>
      ) : !resumen?.hay_datos ? (
        <div style={{
          background: '#fff', borderRadius: 16,
          padding: '2rem', boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
        }}>
          <EmptyState mensaje={resumen?.mensaje || 'No hay evaluaciones registradas.'} />
        </div>
      ) : (
        <>
          {/* ── TAB RESUMEN ──────────────────────────────────── */}
          {tabActiva === 'resumen' && (
            <div>
              {/* KPI Cards */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                gap: '1rem',
                marginBottom: '2rem',
              }}>
                <KPICard
                  icon="👥" label="Estudiantes analizados"
                  value={resumen.total_analizados}
                  bg="#eef2ff" color="#4f46e5"
                />
                <KPICard
                  icon="🔴" label="Riesgo alto"
                  value={resumen.riesgo_alto}
                  sublabel={resumen.total_analizados > 0
                    ? `${((resumen.riesgo_alto / resumen.total_analizados) * 100).toFixed(1)}% del total`
                    : ''}
                  bg="#fef2f2" color="#dc2626"
                />
                <KPICard
                  icon="🟡" label="Riesgo medio"
                  value={resumen.riesgo_medio}
                  sublabel={resumen.total_analizados > 0
                    ? `${((resumen.riesgo_medio / resumen.total_analizados) * 100).toFixed(1)}% del total`
                    : ''}
                  bg="#fffbeb" color="#d97706"
                />
                <KPICard
                  icon="🟢" label="Riesgo bajo"
                  value={resumen.riesgo_bajo}
                  sublabel={resumen.total_analizados > 0
                    ? `${((resumen.riesgo_bajo / resumen.total_analizados) * 100).toFixed(1)}% del total`
                    : ''}
                  bg="#f0fdf4" color="#16a34a"
                />
                <KPICard
                  icon="📝" label="Promedio general"
                  value={`${resumen.promedio_general}/100`}
                  bg="#f0f9ff" color="#0284c7"
                />
                <KPICard
                  icon="📅" label="Asistencia promedio"
                  value={`${resumen.asistencia_promedio}%`}
                  bg="#fdf4ff" color="#9333ea"
                />
                {resumen.curso_mayor_riesgo && (
                  <KPICard
                    icon="⚠️" label="Curso mayor riesgo"
                    value={resumen.curso_mayor_riesgo.split(' ').slice(0, 2).join(' ')}
                    sublabel={resumen.curso_mayor_riesgo}
                    bg="#fff7ed" color="#ea580c"
                  />
                )}
              </div>

              {/* Gráficos */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
                gap: '1.5rem', marginBottom: '2rem' }}>

                {/* Pie de distribución de riesgo */}
                <div style={{ background: '#fff', borderRadius: 16, padding: '1.5rem',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
                  <h3 style={{ margin: '0 0 1.25rem', fontSize: '0.95rem',
                    fontWeight: 700, color: '#1e293b' }}>
                    Distribución de Riesgo
                  </h3>
                  <ResponsiveContainer width="100%" height={220}>
                    <PieChart>
                      <Pie
                        data={datosDistribucion}
                        cx="50%" cy="50%"
                        innerRadius={60} outerRadius={90}
                        paddingAngle={4}
                        dataKey="value"
                        label={({ name, value }) => `${value}`}
                        labelLine={false}
                      >
                        {datosDistribucion.map((entry, i) => (
                          <Cell key={i} fill={entry.fill} />
                        ))}
                      </Pie>
                      <Tooltip content={<CustomTooltip />} />
                      <Legend iconType="circle" />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                {/* Barras por curso */}
                {datosCursos.length > 0 && (
                  <div style={{ background: '#fff', borderRadius: 16, padding: '1.5rem',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
                    <h3 style={{ margin: '0 0 1.25rem', fontSize: '0.95rem',
                      fontWeight: 700, color: '#1e293b' }}>
                      Riesgo por Curso
                    </h3>
                    <ResponsiveContainer width="100%" height={220}>
                      <BarChart data={datosCursos} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                        <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#64748b' }} />
                        <YAxis tick={{ fontSize: 11, fill: '#64748b' }} />
                        <Tooltip content={<CustomTooltip />} />
                        <Legend iconType="circle" wrapperStyle={{ fontSize: 12 }} />
                        <Bar dataKey="Alto"  stackId="a" fill="#ef4444" radius={[0,0,0,0]} />
                        <Bar dataKey="Medio" stackId="a" fill="#f59e0b" radius={[0,0,0,0]} />
                        <Bar dataKey="Bajo"  stackId="a" fill="#22c55e" radius={[4,4,0,0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}

                {/* Promedios por curso */}
                {datosPromediosCurso.length > 0 && (
                  <div style={{ background: '#fff', borderRadius: 16, padding: '1.5rem',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.06)', gridColumn: 'span 2' }}>
                    <h3 style={{ margin: '0 0 1.25rem', fontSize: '0.95rem',
                      fontWeight: 700, color: '#1e293b' }}>
                      Promedio y Asistencia por Curso
                    </h3>
                    <ResponsiveContainer width="100%" height={200}>
                      <BarChart data={datosPromediosCurso} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                        <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#64748b' }} />
                        <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: '#64748b' }} />
                        <Tooltip content={<CustomTooltip />} />
                        <Legend iconType="circle" wrapperStyle={{ fontSize: 12 }} />
                        <Bar dataKey="Promedio"   fill="#6366f1" radius={[4,4,0,0]} />
                        <Bar dataKey="Asistencia" fill="#0ea5e9" radius={[4,4,0,0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── TAB ESTUDIANTES ───────────────────────────────── */}
          {tabActiva === 'estudiantes' && (
            <div style={{ background: '#fff', borderRadius: 16,
              boxShadow: '0 1px 3px rgba(0,0,0,0.06)', overflow: 'hidden' }}>
              <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid #f1f5f9',
                display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700, color: '#1e293b' }}>
                  Predicciones por Estudiante
                </h3>
                <span style={{ fontSize: '0.8rem', color: '#94a3b8', fontWeight: 600 }}>
                  {estudiantesFiltrados.length} resultados
                </span>
              </div>

              {estudiantesFiltrados.length === 0 ? (
                <EmptyState mensaje="No hay estudiantes que coincidan con los filtros aplicados." />
              ) : (
                <>
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 900 }}>
                      <thead>
                        <tr style={{ background: '#f8fafc' }}>
                          {['Estudiante', 'Curso', 'Materia', 'Trim.', 'Promedio', 'Asistencia',
                            'Nota Estimada', 'Riesgo', 'Alertas'].map((h) => (
                            <th key={h} style={{
                              padding: '0.75rem 1rem', textAlign: 'left',
                              fontSize: '0.75rem', fontWeight: 700,
                              color: '#475569', textTransform: 'uppercase',
                              letterSpacing: '0.04em', whiteSpace: 'nowrap',
                            }}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {estudiantesPagina.map((est, i) => (
                          <tr key={`${est.estudiante_id}-${est.materia_id}-${est.trimestre}`}
                            style={{
                              borderTop: '1px solid #f1f5f9',
                              background: i % 2 === 0 ? '#fff' : '#fafafa',
                              transition: 'background 0.1s',
                            }}
                            onMouseEnter={e => e.currentTarget.style.background = '#f0f9ff'}
                            onMouseLeave={e => e.currentTarget.style.background = i % 2 === 0 ? '#fff' : '#fafafa'}
                          >
                            <td style={{ padding: '0.875rem 1rem' }}>
                              <div style={{ fontWeight: 700, color: '#1e293b', fontSize: '0.875rem' }}>
                                {est.estudiante?.nombre || '—'}
                              </div>
                              {est.estudiante?.rude && (
                                <div style={{ fontSize: '0.7rem', color: '#94a3b8' }}>
                                  RUDE: {est.estudiante.rude}
                                </div>
                              )}
                            </td>
                            <td style={{ padding: '0.875rem 1rem', fontSize: '0.8rem', color: '#475569', whiteSpace: 'nowrap' }}>
                              {est.curso}
                            </td>
                            <td style={{ padding: '0.875rem 1rem', fontSize: '0.8rem', color: '#475569' }}>
                              {est.materia}
                            </td>
                            <td style={{ padding: '0.875rem 1rem', textAlign: 'center' }}>
                              <span style={{
                                background: '#eef2ff', color: '#4f46e5',
                                borderRadius: 20, padding: '2px 10px',
                                fontSize: '0.75rem', fontWeight: 700,
                              }}>
                                T{est.trimestre}
                              </span>
                            </td>
                            <td style={{ padding: '0.875rem 1rem', textAlign: 'center' }}>
                              <span style={{
                                fontWeight: 800, fontSize: '1rem',
                                color: est.total_trimestre < 51 ? '#dc2626'
                                  : est.total_trimestre < 65 ? '#d97706' : '#16a34a',
                              }}>
                                {est.total_trimestre}
                              </span>
                              <span style={{ fontSize: '0.7rem', color: '#94a3b8' }}>/100</span>
                            </td>
                            <td style={{ padding: '0.875rem 1rem', textAlign: 'center' }}>
                              <span style={{
                                fontWeight: 700,
                                color: est.porcentaje_asistencia < 60 ? '#dc2626'
                                  : est.porcentaje_asistencia < 75 ? '#d97706' : '#16a34a',
                              }}>
                                {est.porcentaje_asistencia}%
                              </span>
                            </td>
                            <td style={{ padding: '0.875rem 1rem', textAlign: 'center' }}>
                              <span style={{
                                fontWeight: 800, fontSize: '1rem',
                                color: est.nota_final_estimada < 51 ? '#dc2626'
                                  : est.nota_final_estimada < 65 ? '#d97706' : '#16a34a',
                              }}>
                                {est.nota_final_estimada}
                              </span>
                            </td>
                            <td style={{ padding: '0.875rem 1rem' }}>
                              <RiesgoBadge riesgo={est.riesgo_academico} />
                            </td>
                            <td style={{ padding: '0.875rem 1rem', maxWidth: 200 }}>
                              {est.alertas?.length > 0 ? (
                                est.alertas.map((a, ai) => <AlertaBadge key={ai} texto={a} />)
                              ) : (
                                <span style={{ color: '#94a3b8', fontSize: '0.75rem' }}>—</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Paginación */}
                  {totalPaginas > 1 && (
                    <div style={{
                      display: 'flex', justifyContent: 'center', alignItems: 'center',
                      gap: '0.5rem', padding: '1rem',
                      borderTop: '1px solid #f1f5f9',
                    }}>
                      <button
                        onClick={() => setPagina((p) => Math.max(1, p - 1))}
                        disabled={pagina === 1}
                        style={{
                          padding: '0.4rem 0.875rem', borderRadius: 8,
                          border: '1.5px solid #e2e8f0',
                          background: pagina === 1 ? '#f8fafc' : '#fff',
                          color: pagina === 1 ? '#cbd5e1' : '#475569',
                          cursor: pagina === 1 ? 'not-allowed' : 'pointer',
                          fontWeight: 600, fontSize: '0.8rem',
                        }}>‹ Ant</button>

                      {Array.from({ length: Math.min(5, totalPaginas) }, (_, i) => {
                        const num = pagina <= 3 ? i + 1
                          : pagina >= totalPaginas - 2 ? totalPaginas - 4 + i
                          : pagina - 2 + i;
                        if (num < 1 || num > totalPaginas) return null;
                        return (
                          <button key={num} onClick={() => setPagina(num)}
                            style={{
                              width: 36, height: 36, borderRadius: 8,
                              border: num === pagina ? '2px solid #6366f1' : '1.5px solid #e2e8f0',
                              background: num === pagina ? '#6366f1' : '#fff',
                              color: num === pagina ? '#fff' : '#475569',
                              fontWeight: 700, fontSize: '0.825rem',
                              cursor: 'pointer',
                            }}>
                            {num}
                          </button>
                        );
                      })}

                      <button
                        onClick={() => setPagina((p) => Math.min(totalPaginas, p + 1))}
                        disabled={pagina === totalPaginas}
                        style={{
                          padding: '0.4rem 0.875rem', borderRadius: 8,
                          border: '1.5px solid #e2e8f0',
                          background: pagina === totalPaginas ? '#f8fafc' : '#fff',
                          color: pagina === totalPaginas ? '#cbd5e1' : '#475569',
                          cursor: pagina === totalPaginas ? 'not-allowed' : 'pointer',
                          fontWeight: 600, fontSize: '0.8rem',
                        }}>Sig ›</button>
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {/* ── TAB CURSOS ────────────────────────────────────── */}
          {tabActiva === 'cursos' && (
            <div>
              {cursos.length === 0 ? (
                <div style={{ background: '#fff', borderRadius: 16,
                  padding: '2rem', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
                  <EmptyState mensaje="No hay cursos con datos suficientes." />
                </div>
              ) : (
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))',
                  gap: '1.25rem',
                }}>
                  {cursos.map((c) => {
                    const total = c.resumen?.total_estudiantes || 0;
                    const pctAlto  = total > 0 ? (c.resumen.riesgo_alto  / total * 100).toFixed(0) : 0;
                    const pctMedio = total > 0 ? (c.resumen.riesgo_medio / total * 100).toFixed(0) : 0;
                    const pctBajo  = total > 0 ? (c.resumen.riesgo_bajo  / total * 100).toFixed(0) : 0;
                    const nivelRiesgo = pctAlto > 40 ? 'alto' : pctAlto > 20 ? 'medio' : 'bajo';

                    return (
                      <div key={c.curso_id} style={{
                        background: '#fff', borderRadius: 16,
                        boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
                        border: `2px solid ${RIESGO_COLOR[nivelRiesgo].border}`,
                        overflow: 'hidden',
                        transition: 'transform 0.15s, box-shadow 0.15s',
                      }}
                      onMouseEnter={e => {
                        e.currentTarget.style.transform = 'translateY(-2px)';
                        e.currentTarget.style.boxShadow = '0 6px 24px rgba(0,0,0,0.1)';
                      }}
                      onMouseLeave={e => {
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.06)';
                      }}
                      >
                        {/* Header */}
                        <div style={{
                          background: RIESGO_COLOR[nivelRiesgo].bg,
                          padding: '1rem 1.25rem',
                          display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
                        }}>
                          <div>
                            <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 800, color: '#1e293b' }}>
                              🏫 {c.curso}
                            </h3>
                            <p style={{ margin: '4px 0 0', fontSize: '0.75rem', color: '#64748b' }}>
                              Gestión {c.gestion} · {total} estudiantes
                            </p>
                          </div>
                          <RiesgoBadge riesgo={nivelRiesgo} />
                        </div>

                        {/* Métricas */}
                        <div style={{ padding: '1rem 1.25rem' }}>
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem',
                            marginBottom: '1rem' }}>
                            <div style={{ textAlign: 'center', padding: '0.75rem',
                              background: '#f8fafc', borderRadius: 10 }}>
                              <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#4f46e5' }}>
                                {c.resumen?.promedio_general}
                              </div>
                              <div style={{ fontSize: '0.7rem', color: '#94a3b8', fontWeight: 600,
                                textTransform: 'uppercase' }}>Promedio</div>
                            </div>
                            <div style={{ textAlign: 'center', padding: '0.75rem',
                              background: '#f8fafc', borderRadius: 10 }}>
                              <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0284c7' }}>
                                {c.resumen?.porcentaje_asistencia_promedio}%
                              </div>
                              <div style={{ fontSize: '0.7rem', color: '#94a3b8', fontWeight: 600,
                                textTransform: 'uppercase' }}>Asistencia</div>
                            </div>
                          </div>

                          {/* Barras de riesgo */}
                          <div style={{ marginBottom: '0.75rem' }}>
                            {[
                              { label: 'Alto',  val: c.resumen?.riesgo_alto,  pct: pctAlto,  color: '#ef4444' },
                              { label: 'Medio', val: c.resumen?.riesgo_medio, pct: pctMedio, color: '#f59e0b' },
                              { label: 'Bajo',  val: c.resumen?.riesgo_bajo,  pct: pctBajo,  color: '#22c55e' },
                            ].map(({ label, val, pct, color }) => (
                              <div key={label} style={{ marginBottom: 6 }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between',
                                  fontSize: '0.75rem', marginBottom: 3 }}>
                                  <span style={{ fontWeight: 600, color: '#475569' }}>{label}</span>
                                  <span style={{ fontWeight: 700, color }}>{val} ({pct}%)</span>
                                </div>
                                <div style={{ background: '#f1f5f9', borderRadius: 99, height: 6, overflow: 'hidden' }}>
                                  <div style={{
                                    width: `${pct}%`, height: '100%',
                                    background: color, borderRadius: 99,
                                    transition: 'width 0.5s ease',
                                  }} />
                                </div>
                              </div>
                            ))}
                          </div>

                          {/* Materias con riesgo */}
                          {c.materias_con_mas_riesgo?.length > 0 && (
                            <div style={{ marginTop: '0.75rem', paddingTop: '0.75rem',
                              borderTop: '1px solid #f1f5f9' }}>
                              <p style={{ fontSize: '0.7rem', fontWeight: 700, color: '#64748b',
                                textTransform: 'uppercase', marginBottom: 6 }}>
                                Materias con más riesgo:
                              </p>
                              {c.materias_con_mas_riesgo.map((m, mi) => (
                                <div key={mi} style={{
                                  display: 'flex', justifyContent: 'space-between',
                                  fontSize: '0.75rem', color: '#475569',
                                  padding: '3px 0',
                                }}>
                                  <span>{m.nombre}</span>
                                  <span style={{ fontWeight: 700, color: '#ef4444' }}>
                                    {m.estudiantes_riesgo_alto} en riesgo alto
                                  </span>
                                </div>
                              ))}
                            </div>
                          )}

                          {/* Estudiantes en riesgo */}
                          {c.estudiantes_riesgo?.length > 0 && (
                            <div style={{ marginTop: '0.75rem', paddingTop: '0.75rem',
                              borderTop: '1px solid #f1f5f9' }}>
                              <p style={{ fontSize: '0.7rem', fontWeight: 700, color: '#64748b',
                                textTransform: 'uppercase', marginBottom: 6 }}>
                                Estudiantes en riesgo:
                              </p>
                              {c.estudiantes_riesgo.slice(0, 3).map((e, ei) => (
                                <div key={ei} style={{
                                  display: 'flex', justifyContent: 'space-between',
                                  alignItems: 'center', padding: '4px 0',
                                }}>
                                  <span style={{ fontSize: '0.775rem', color: '#1e293b', fontWeight: 600 }}>
                                    {e.nombre}
                                  </span>
                                  <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                                    <span style={{ fontSize: '0.7rem', color: '#94a3b8' }}>
                                      Est: {e.nota_final_estimada}
                                    </span>
                                    <RiesgoBadge riesgo={e.riesgo_academico} />
                                  </div>
                                </div>
                              ))}
                              {c.estudiantes_riesgo.length > 3 && (
                                <p style={{ fontSize: '0.7rem', color: '#94a3b8', marginTop: 4, textAlign: 'center' }}>
                                  +{c.estudiantes_riesgo.length - 3} más en riesgo
                                </p>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
