// ============================================
// pages/AdminPanel.jsx — Panel de Administración
// ============================================
//
// Implementa TODAS las funcionalidades del diagrama UML:
//   ✅ Gestionar Usuarios → Asignar Roles, Crear Docente, Eliminar Usuario
//   ✅ Gestionar Unidades Educativas
//   ✅ Configurar Año Escolar
//   ✅ Gestionar Materias → Asignar Materia a Docente, Crear Materia
//   ✅ Ver Reportes Globales
//   ✅ Auditoría del Sistema

import { useState, useEffect } from 'react';
import API from '../api/axiosConfig';
import { useAuth } from '../context/AuthContext';

// ─── Constantes ─────────────────────────────────────────────
const ROLES = ['docente', 'director', 'admin'];
const NIVELES = ['inicial', 'primaria', 'secundaria'];

// ─── Componente principal ────────────────────────────────────
const AdminPanel = () => {
  const { usuario } = useAuth();
  const [seccion, setSeccion] = useState('dashboard');

  // Verificar que es admin
  if (usuario?.rol !== 'admin') {
    return (
      <div className="page-container flex items-center justify-center min-h-[60vh]">
        <div className="text-center bg-red-50 border border-red-200 rounded-2xl p-12">
          <div className="text-5xl mb-4">🚫</div>
          <h2 className="text-xl font-bold text-red-800 mb-2">Acceso Denegado</h2>
          <p className="text-red-600">Solo los administradores pueden acceder a este panel.</p>
        </div>
      </div>
    );
  }

  const secciones = [
    { id: 'dashboard',    icon: '📊', label: 'Panel General',          color: 'blue' },
    { id: 'usuarios',     icon: '👥', label: 'Gestionar Usuarios',      color: 'violet' },
    { id: 'materias',     icon: '📚', label: 'Gestionar Materias',      color: 'amber' },
    { id: 'unidades',     icon: '🏫', label: 'Unidades Educativas',     color: 'emerald' },
    { id: 'anio',         icon: '📅', label: 'Año Escolar',             color: 'cyan' },
    { id: 'reportes',     icon: '📈', label: 'Reportes Globales',       color: 'rose' },
    { id: 'auditoria',    icon: '🔍', label: 'Auditoría del Sistema',   color: 'slate' },
  ];

  const colorMap = {
    blue:   'bg-blue-600 hover:bg-blue-700 border-blue-500',
    violet: 'bg-violet-600 hover:bg-violet-700 border-violet-500',
    amber:  'bg-amber-500 hover:bg-amber-600 border-amber-400',
    emerald:'bg-emerald-600 hover:bg-emerald-700 border-emerald-500',
    cyan:   'bg-cyan-600 hover:bg-cyan-700 border-cyan-500',
    rose:   'bg-rose-600 hover:bg-rose-700 border-rose-500',
    slate:  'bg-slate-700 hover:bg-slate-800 border-slate-600',
  };

  const colorActiveMap = {
    blue:   'bg-blue-50 text-blue-700 border-l-4 border-blue-600',
    violet: 'bg-violet-50 text-violet-700 border-l-4 border-violet-600',
    amber:  'bg-amber-50 text-amber-700 border-l-4 border-amber-500',
    emerald:'bg-emerald-50 text-emerald-700 border-l-4 border-emerald-600',
    cyan:   'bg-cyan-50 text-cyan-700 border-l-4 border-cyan-600',
    rose:   'bg-rose-50 text-rose-700 border-l-4 border-rose-600',
    slate:  'bg-slate-100 text-slate-800 border-l-4 border-slate-700',
  };

  const seccionActual = secciones.find(s => s.id === seccion);

  return (
    <div className="page-container">
      {/* Header */}
      <div className="page-header mb-6">
        <div>
          <h1 className="page-title flex items-center gap-3">
            <span className="text-3xl">🛡️</span>
            Panel de Administración
          </h1>
          <p className="page-subtitle">
            Gestión total del sistema — <span className="font-semibold text-blue-600">{usuario?.nombre}</span>
          </p>
        </div>
        <div className="flex items-center gap-2 bg-violet-50 border border-violet-200 px-4 py-2 rounded-xl">
          <span className="text-violet-500">👑</span>
          <span className="text-sm font-bold text-violet-700">Administrador</span>
        </div>
      </div>

      <div className="flex gap-6">
        {/* Sidebar de navegación */}
        <aside className="w-56 flex-shrink-0">
          <nav className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
            {secciones.map(s => (
              <button
                key={s.id}
                onClick={() => setSeccion(s.id)}
                className={`w-full flex items-center gap-3 px-4 py-3.5 text-left text-sm font-semibold transition-all ${
                  seccion === s.id
                    ? colorActiveMap[s.color]
                    : 'text-slate-600 hover:bg-slate-50 border-l-4 border-transparent'
                }`}
              >
                <span className="text-lg">{s.icon}</span>
                <span>{s.label}</span>
              </button>
            ))}
          </nav>
        </aside>

        {/* Contenido principal */}
        <main className="flex-1 min-w-0">
          {seccion === 'dashboard'  && <SeccionDashboard />}
          {seccion === 'usuarios'   && <SeccionUsuarios />}
          {seccion === 'materias'   && <SeccionMaterias />}
          {seccion === 'unidades'   && <SeccionUnidades />}
          {seccion === 'anio'       && <SeccionAnioEscolar />}
          {seccion === 'reportes'   && <SeccionReportesGlobales />}
          {seccion === 'auditoria'  && <SeccionAuditoria />}
        </main>
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════
// SECCIÓN: DASHBOARD (Estadísticas rápidas)
// ═══════════════════════════════════════════════════════════
const SeccionDashboard = () => {
  const [stats, setStats] = useState(null);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    API.get('/admin/reportes-globales')
      .then(r => setStats(r.data.data))
      .catch(console.error)
      .finally(() => setCargando(false));
  }, []);

  if (cargando) return <CargandoCard />;

  const tarjetas = [
    { label: 'Total Usuarios',   valor: stats?.usuarios?.total    || 0, icon: '👥', color: 'blue'   },
    { label: 'Docentes',         valor: stats?.usuarios?.docentes  || 0, icon: '👨‍🏫', color: 'violet' },
    { label: 'Directores',       valor: stats?.usuarios?.directores|| 0, icon: '🎩', color: 'emerald'},
    { label: 'Estudiantes',      valor: stats?.estudiantes?.total  || 0, icon: '🎓', color: 'amber'  },
    { label: 'Materias',         valor: stats?.academico?.totalMaterias || 0, icon: '📚', color: 'cyan'},
    { label: 'Cursos',           valor: stats?.academico?.totalCursos   || 0, icon: '🏫', color: 'rose'},
  ];

  const colorCard = {
    blue:   'bg-blue-50 border-blue-200 text-blue-700',
    violet: 'bg-violet-50 border-violet-200 text-violet-700',
    emerald:'bg-emerald-50 border-emerald-200 text-emerald-700',
    amber:  'bg-amber-50 border-amber-200 text-amber-700',
    cyan:   'bg-cyan-50 border-cyan-200 text-cyan-700',
    rose:   'bg-rose-50 border-rose-200 text-rose-700',
  };

  return (
    <div className="space-y-6">
      <SectionTitle icon="📊" title="Panel General" subtitle="Resumen del sistema educativo" />

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        {tarjetas.map(t => (
          <div key={t.label} className={`border rounded-2xl p-5 ${colorCard[t.color]}`}>
            <div className="text-3xl mb-2">{t.icon}</div>
            <div className="text-3xl font-black">{t.valor}</div>
            <div className="text-sm font-semibold mt-1 opacity-80">{t.label}</div>
          </div>
        ))}
      </div>

      {/* Materias por nivel */}
      {stats?.academico?.materiasPorNivel?.length > 0 && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
          <h3 className="font-bold text-slate-800 mb-4">📚 Materias por Nivel</h3>
          <div className="flex gap-4 flex-wrap">
            {stats.academico.materiasPorNivel.map(m => (
              <div key={m._id} className="bg-indigo-50 border border-indigo-200 rounded-xl px-4 py-3 text-center">
                <div className="text-2xl font-black text-indigo-700">{m.cantidad}</div>
                <div className="text-xs font-semibold text-indigo-600 capitalize">{m._id}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Año escolar */}
      <div className="bg-gradient-to-r from-blue-600 to-violet-600 rounded-2xl p-6 text-white">
        <div className="flex justify-between items-start">
          <div>
            <div className="text-sm font-semibold opacity-75 mb-1">📅 Año Escolar Activo</div>
            <div className="text-4xl font-black">{stats?.anioEscolar?.anio || new Date().getFullYear()}</div>
            {stats?.anioEscolar?.fechaInicio && (
              <div className="text-sm opacity-80 mt-1">
                {stats.anioEscolar.fechaInicio} → {stats.anioEscolar.fechaFin}
              </div>
            )}
          </div>
          <div className="bg-white/20 rounded-xl p-3 text-3xl">📅</div>
        </div>
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════
// SECCIÓN: GESTIONAR USUARIOS
// ═══════════════════════════════════════════════════════════
const SeccionUsuarios = () => {
  const [usuarios, setUsuarios] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [modalCrear, setModalCrear] = useState(false);
  const [modalRol, setModalRol]   = useState(null); // { id, nombre, rolActual }
  const [busqueda, setBusqueda]   = useState('');
  const [filtroRol, setFiltroRol] = useState('todos');
  const [guardando, setGuardando] = useState(false);
  const [error, setError]         = useState('');
  const [exito, setExito]         = useState('');

  const [formCrear, setFormCrear] = useState({
    nombre: '', email: '', password: '', rol: 'docente',
  });

  const cargar = () => {
    setCargando(true);
    API.get('/admin/usuarios')
      .then(r => setUsuarios(r.data.data || []))
      .catch(console.error)
      .finally(() => setCargando(false));
  };

  useEffect(() => { cargar(); }, []);

  const mostrarExito = (msg) => {
    setExito(msg);
    setTimeout(() => setExito(''), 3000);
  };

  // Crear docente
  const handleCrear = async (e) => {
    e.preventDefault();
    setGuardando(true);
    setError('');
    try {
      await API.post('/admin/usuarios', formCrear);
      setModalCrear(false);
      setFormCrear({ nombre: '', email: '', password: '', rol: 'docente' });
      cargar();
      mostrarExito(`✅ Usuario "${formCrear.nombre}" creado exitosamente`);
    } catch (err) {
      setError(err.response?.data?.mensaje || 'Error al crear usuario');
    } finally {
      setGuardando(false);
    }
  };

  // Asignar rol
  const handleAsignarRol = async (nuevoRol) => {
    setGuardando(true);
    try {
      await API.put(`/admin/usuarios/${modalRol.id}/rol`, { rol: nuevoRol });
      setModalRol(null);
      cargar();
      mostrarExito(`✅ Rol de "${modalRol.nombre}" cambiado a "${nuevoRol}"`);
    } catch (err) {
      alert(err.response?.data?.mensaje || 'Error al cambiar rol');
    } finally {
      setGuardando(false);
    }
  };

  // Eliminar usuario
  const handleEliminar = async (id, nombre) => {
    if (!window.confirm(`¿Seguro que deseas eliminar al usuario "${nombre}"? Esta acción no se puede deshacer.`)) return;
    try {
      await API.delete(`/admin/usuarios/${id}`);
      cargar();
      mostrarExito(`✅ Usuario "${nombre}" eliminado`);
    } catch (err) {
      alert(err.response?.data?.mensaje || 'Error al eliminar usuario');
    }
  };

  // Filtrar
  const usuariosFiltrados = usuarios.filter(u => {
    const matchBusqueda = !busqueda || 
      u.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
      u.email.toLowerCase().includes(busqueda.toLowerCase());
    const matchRol = filtroRol === 'todos' || u.rol === filtroRol;
    return matchBusqueda && matchRol;
  });

  const rolBadge = {
    admin:    'bg-red-100 text-red-700 border border-red-200',
    director: 'bg-blue-100 text-blue-700 border border-blue-200',
    docente:  'bg-emerald-100 text-emerald-700 border border-emerald-200',
  };

  return (
    <div className="space-y-5">
      <SectionTitle icon="👥" title="Gestionar Usuarios" subtitle="Crear docentes, asignar roles y eliminar usuarios" />

      {/* Notificación de éxito */}
      {exito && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 text-emerald-700 font-semibold flex items-center gap-2">
          {exito}
        </div>
      )}

      {/* Barra de acciones */}
      <div className="flex flex-wrap gap-3 items-center">
        <input
          type="text"
          placeholder="🔍 Buscar usuario..."
          value={busqueda}
          onChange={e => setBusqueda(e.target.value)}
          className="border border-slate-200 rounded-xl px-4 py-2.5 text-sm flex-1 min-w-[200px] focus:outline-none focus:ring-2 focus:ring-violet-300"
        />
        <select
          value={filtroRol}
          onChange={e => setFiltroRol(e.target.value)}
          className="border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-300"
        >
          <option value="todos">Todos los roles</option>
          <option value="admin">Administradores</option>
          <option value="director">Directores</option>
          <option value="docente">Docentes</option>
        </select>
        <button
          onClick={() => setModalCrear(true)}
          className="bg-violet-600 hover:bg-violet-700 text-white px-5 py-2.5 rounded-xl font-semibold text-sm flex items-center gap-2 transition-colors shadow-sm"
        >
          ➕ Crear Docente
        </button>
      </div>

      {/* Tabla de usuarios */}
      {cargando ? <CargandoCard /> : (
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-800 text-white">
                <tr>
                  <th className="p-4 text-left">Usuario</th>
                  <th className="p-4 text-left">Email</th>
                  <th className="p-4 text-center">Rol</th>
                  <th className="p-4 text-center">Creado</th>
                  <th className="p-4 text-center">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {usuariosFiltrados.length === 0 ? (
                  <tr><td colSpan="5" className="text-center p-8 text-slate-400">No hay usuarios que coincidan</td></tr>
                ) : usuariosFiltrados.map(u => (
                  <tr key={u._id} className="hover:bg-slate-50 transition-colors">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-violet-100 text-violet-700 flex items-center justify-center font-bold text-sm">
                          {u.nombre?.split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase()}
                        </div>
                        <span className="font-semibold text-slate-800">{u.nombre}</span>
                      </div>
                    </td>
                    <td className="p-4 text-slate-500">{u.email}</td>
                    <td className="p-4 text-center">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold ${rolBadge[u.rol] || ''}`}>
                        {u.rol}
                      </span>
                    </td>
                    <td className="p-4 text-center text-slate-400 text-xs">
                      {new Date(u.createdAt).toLocaleDateString('es-BO')}
                    </td>
                    <td className="p-4">
                      <div className="flex gap-2 justify-center">
                        <button
                          onClick={() => setModalRol({ id: u._id, nombre: u.nombre, rolActual: u.rol })}
                          title="Asignar Rol"
                          className="bg-blue-50 hover:bg-blue-100 text-blue-700 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors"
                        >
                          🔑 Rol
                        </button>
                        <button
                          onClick={() => handleEliminar(u._id, u.nombre)}
                          title="Eliminar Usuario"
                          className="bg-red-50 hover:bg-red-100 text-red-600 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors"
                        >
                          🗑️
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="p-4 border-t border-slate-100 bg-slate-50 text-xs text-slate-500">
            Mostrando {usuariosFiltrados.length} de {usuarios.length} usuarios
          </div>
        </div>
      )}

      {/* Modal: Crear Docente */}
      {modalCrear && (
        <Modal title="➕ Crear Nuevo Usuario" onClose={() => { setModalCrear(false); setError(''); }}>
          <form onSubmit={handleCrear} className="space-y-4">
            {error && <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-red-700 text-sm">{error}</div>}
            <FormField label="Nombre completo" required>
              <input
                required
                value={formCrear.nombre}
                onChange={e => setFormCrear({ ...formCrear, nombre: e.target.value })}
                placeholder="Ej: Juan Pérez"
                className="input-base"
              />
            </FormField>
            <FormField label="Email" required>
              <input
                required
                type="email"
                value={formCrear.email}
                onChange={e => setFormCrear({ ...formCrear, email: e.target.value })}
                placeholder="correo@ejemplo.com"
                className="input-base"
              />
            </FormField>
            <FormField label="Contraseña" required>
              <input
                required
                type="password"
                minLength={6}
                value={formCrear.password}
                onChange={e => setFormCrear({ ...formCrear, password: e.target.value })}
                placeholder="Mínimo 6 caracteres"
                className="input-base"
              />
            </FormField>
            <FormField label="Rol">
              <select
                value={formCrear.rol}
                onChange={e => setFormCrear({ ...formCrear, rol: e.target.value })}
                className="input-base"
              >
                {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </FormField>
            <div className="flex gap-3 justify-end pt-2">
              <BtnCancelar onClick={() => { setModalCrear(false); setError(''); }} />
              <BtnGuardar loading={guardando} label="Crear Usuario" />
            </div>
          </form>
        </Modal>
      )}

      {/* Modal: Asignar Rol */}
      {modalRol && (
        <Modal title={`🔑 Asignar Rol — ${modalRol.nombre}`} onClose={() => setModalRol(null)}>
          <p className="text-sm text-slate-500 mb-4">
            Rol actual: <span className="font-bold text-slate-700">{modalRol.rolActual}</span>
          </p>
          <div className="space-y-3">
            {ROLES.map(rol => (
              <button
                key={rol}
                onClick={() => handleAsignarRol(rol)}
                disabled={guardando || rol === modalRol.rolActual}
                className={`w-full flex items-center gap-3 p-4 rounded-xl border-2 text-left font-semibold transition-all ${
                  rol === modalRol.rolActual
                    ? 'border-violet-400 bg-violet-50 text-violet-700 cursor-default'
                    : 'border-slate-200 hover:border-blue-300 hover:bg-blue-50 text-slate-700'
                }`}
              >
                <span className="text-xl">{rol === 'admin' ? '👑' : rol === 'director' ? '🎩' : '👨‍🏫'}</span>
                <div>
                  <div className="font-bold capitalize">{rol}</div>
                  <div className="text-xs text-slate-500 font-normal">
                    {rol === 'admin' ? 'Acceso total al sistema' :
                     rol === 'director' ? 'Gestión de cursos y reportes' :
                     'Gestión de clases y estudiantes'}
                  </div>
                </div>
                {rol === modalRol.rolActual && (
                  <span className="ml-auto text-xs bg-violet-100 text-violet-600 px-2 py-1 rounded-full">Actual</span>
                )}
              </button>
            ))}
          </div>
        </Modal>
      )}
    </div>
  );
};

// ═══════════════════════════════════════════════════════════
// SECCIÓN: GESTIONAR MATERIAS (con asignación a docente)
// ═══════════════════════════════════════════════════════════
const SeccionMaterias = () => {
  const [materias, setMaterias]   = useState([]);
  const [docentes, setDocentes]   = useState([]);
  const [cargando, setCargando]   = useState(true);
  const [modalCrear, setModalCrear] = useState(false);
  const [modalAsignar, setModalAsignar] = useState(null);
  const [guardando, setGuardando] = useState(false);
  const [exito, setExito]         = useState('');

  const [formCrear, setFormCrear] = useState({
    nombre: '', area: '', nivel: 'secundaria', grado: '1ro',
  });

  const cargar = async () => {
    setCargando(true);
    try {
      const [matRes, usrRes] = await Promise.all([
        API.get('/materias'),
        API.get('/admin/usuarios'),
      ]);
      setMaterias(matRes.data.data || []);
      setDocentes((usrRes.data.data || []).filter(u => u.rol === 'docente' || u.rol === 'director'));
    } catch (e) { console.error(e); }
    finally { setCargando(false); }
  };

  useEffect(() => { cargar(); }, []);

  const mostrarExito = (msg) => {
    setExito(msg);
    setTimeout(() => setExito(''), 3000);
  };

  const handleCrear = async (e) => {
    e.preventDefault();
    setGuardando(true);
    try {
      await API.post('/materias', formCrear);
      setModalCrear(false);
      setFormCrear({ nombre: '', area: '', nivel: 'secundaria', grado: '1ro' });
      cargar();
      mostrarExito('✅ Materia creada exitosamente');
    } catch (err) {
      alert(err.response?.data?.mensaje || 'Error al crear materia');
    } finally { setGuardando(false); }
  };

  const handleAsignarDocente = async (docenteId) => {
    if (!docenteId) return;
    setGuardando(true);
    try {
      const r = await API.put(`/admin/materias/${modalAsignar._id}/asignar-docente`, { docenteId });
      setModalAsignar(null);
      cargar();
      mostrarExito(`✅ ${r.data.mensaje}`);
    } catch (err) {
      alert(err.response?.data?.mensaje || 'Error al asignar docente');
    } finally { setGuardando(false); }
  };

  const handleEliminar = async (id, nombre) => {
    if (!window.confirm(`¿Eliminar la materia "${nombre}"?`)) return;
    try {
      await API.delete(`/materias/${id}`);
      cargar();
      mostrarExito(`✅ Materia "${nombre}" eliminada`);
    } catch (err) {
      alert(err.response?.data?.mensaje || 'Error al eliminar materia');
    }
  };

  return (
    <div className="space-y-5">
      <SectionTitle icon="📚" title="Gestionar Materias" subtitle="Crear materias y asignarlas a docentes" />

      {exito && <Alerta tipo="exito" mensaje={exito} />}

      <div className="flex justify-end">
        <button
          onClick={() => setModalCrear(true)}
          className="bg-amber-500 hover:bg-amber-600 text-white px-5 py-2.5 rounded-xl font-semibold text-sm flex items-center gap-2 transition-colors shadow-sm"
        >
          ➕ Crear Materia
        </button>
      </div>

      {cargando ? <CargandoCard /> : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {materias.length === 0 ? (
            <div className="col-span-2 text-center p-8 bg-slate-50 rounded-2xl text-slate-500 border border-dashed border-slate-300">
              No hay materias registradas aún.
            </div>
          ) : materias.map(m => (
            <div key={m._id} className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm hover:border-amber-300 transition-colors">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h3 className="font-bold text-slate-800">{m.nombre}</h3>
                  <p className="text-xs text-slate-500">{m.area || 'Sin área'}</p>
                </div>
                <div className="flex gap-1">
                  <span className="bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded text-xs font-semibold capitalize">{m.nivel}</span>
                  <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded text-xs font-semibold">{m.grado}</span>
                </div>
              </div>

              {/* Docente asignado */}
              <div className="mt-3 bg-slate-50 rounded-xl p-3 text-sm">
                <span className="text-slate-500 text-xs font-semibold">DOCENTE ASIGNADO:</span>
                <div className="font-semibold text-slate-800 mt-0.5">
                  {m.docenteAsignado?.nombre || m.docenteAsignado || (
                    <span className="text-slate-400 italic">Sin asignar</span>
                  )}
                </div>
              </div>

              <div className="flex gap-2 mt-3">
                <button
                  onClick={() => setModalAsignar(m)}
                  className="flex-1 bg-blue-50 hover:bg-blue-100 text-blue-700 px-3 py-2 rounded-lg text-xs font-bold transition-colors"
                >
                  👨‍🏫 Asignar Docente
                </button>
                <button
                  onClick={() => handleEliminar(m._id, m.nombre)}
                  className="bg-red-50 hover:bg-red-100 text-red-600 px-3 py-2 rounded-lg text-xs font-bold transition-colors"
                >
                  🗑️
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal: Crear Materia */}
      {modalCrear && (
        <Modal title="➕ Crear Nueva Materia" onClose={() => setModalCrear(false)}>
          <form onSubmit={handleCrear} className="space-y-4">
            <FormField label="Nombre de la materia" required>
              <input required value={formCrear.nombre} onChange={e => setFormCrear({...formCrear, nombre: e.target.value})}
                placeholder="Ej: Matemáticas" className="input-base" />
            </FormField>
            <FormField label="Área curricular">
              <input value={formCrear.area} onChange={e => setFormCrear({...formCrear, area: e.target.value})}
                placeholder="Ej: Ciencia, Tecnología y Producción" className="input-base" />
            </FormField>
            <div className="grid grid-cols-2 gap-3">
              <FormField label="Nivel">
                <select value={formCrear.nivel} onChange={e => setFormCrear({...formCrear, nivel: e.target.value})} className="input-base">
                  {NIVELES.map(n => <option key={n} value={n} className="capitalize">{n}</option>)}
                </select>
              </FormField>
              <FormField label="Grado" required>
                <input required value={formCrear.grado} onChange={e => setFormCrear({...formCrear, grado: e.target.value})}
                  placeholder="Ej: 4to" className="input-base" />
              </FormField>
            </div>
            <div className="flex gap-3 justify-end pt-2">
              <BtnCancelar onClick={() => setModalCrear(false)} />
              <BtnGuardar loading={guardando} label="Crear Materia" color="amber" />
            </div>
          </form>
        </Modal>
      )}

      {/* Modal: Asignar Docente */}
      {modalAsignar && (
        <Modal title={`👨‍🏫 Asignar Docente — ${modalAsignar.nombre}`} onClose={() => setModalAsignar(null)}>
          <p className="text-sm text-slate-500 mb-4">Selecciona el docente para esta materia:</p>
          <div className="space-y-2 max-h-72 overflow-y-auto">
            {docentes.length === 0 ? (
              <p className="text-slate-400 text-center py-4">No hay docentes registrados</p>
            ) : docentes.map(d => (
              <button
                key={d._id}
                onClick={() => handleAsignarDocente(d._id)}
                disabled={guardando}
                className="w-full flex items-center gap-3 p-3 rounded-xl border border-slate-200 hover:border-blue-300 hover:bg-blue-50 transition-all text-left"
              >
                <div className="w-9 h-9 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-sm">
                  {d.nombre.split(' ').slice(0,2).map(n=>n[0]).join('').toUpperCase()}
                </div>
                <div>
                  <div className="font-semibold text-slate-800">{d.nombre}</div>
                  <div className="text-xs text-slate-400">{d.email} · {d.rol}</div>
                </div>
              </button>
            ))}
          </div>
        </Modal>
      )}
    </div>
  );
};

// ═══════════════════════════════════════════════════════════
// SECCIÓN: UNIDADES EDUCATIVAS
// ═══════════════════════════════════════════════════════════
const SeccionUnidades = () => {
  const [unidades, setUnidades]   = useState([]);
  const [cargando, setCargando]   = useState(true);
  const [modal, setModal]         = useState(false);
  const [editando, setEditando]   = useState(null);
  const [guardando, setGuardando] = useState(false);
  const [exito, setExito]         = useState('');

  const [form, setForm] = useState({
    nombre: '', codigo: '', nivel: '', director: '', direccion: '', telefono: '',
  });

  const cargar = () => {
    setCargando(true);
    API.get('/admin/unidades-educativas')
      .then(r => setUnidades(r.data.data || []))
      .catch(console.error)
      .finally(() => setCargando(false));
  };

  useEffect(() => { cargar(); }, []);

  const mostrarExito = (msg) => { setExito(msg); setTimeout(() => setExito(''), 3000); };

  const abrirModal = (u = null) => {
    if (u) {
      setEditando(u);
      setForm({ nombre: u.nombre, codigo: u.codigo, nivel: u.nivel, director: u.director, direccion: u.direccion, telefono: u.telefono });
    } else {
      setEditando(null);
      setForm({ nombre: '', codigo: '', nivel: '', director: '', direccion: '', telefono: '' });
    }
    setModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setGuardando(true);
    try {
      if (editando) {
        await API.put(`/admin/unidades-educativas/${editando._id}`, form);
        mostrarExito('✅ Unidad educativa actualizada');
      } else {
        await API.post('/admin/unidades-educativas', form);
        mostrarExito('✅ Unidad educativa creada');
      }
      setModal(false);
      cargar();
    } catch (err) {
      alert(err.response?.data?.mensaje || 'Error al guardar');
    } finally { setGuardando(false); }
  };

  const handleEliminar = async (id, nombre) => {
    if (!window.confirm(`¿Eliminar la unidad educativa "${nombre}"?`)) return;
    try {
      await API.delete(`/admin/unidades-educativas/${id}`);
      cargar();
      mostrarExito(`✅ Unidad "${nombre}" eliminada`);
    } catch (err) {
      alert('Error al eliminar');
    }
  };

  return (
    <div className="space-y-5">
      <SectionTitle icon="🏫" title="Gestionar Unidades Educativas" subtitle="Administrar los establecimientos educativos" />

      {exito && <Alerta tipo="exito" mensaje={exito} />}

      <div className="flex justify-end">
        <button
          onClick={() => abrirModal()}
          className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-xl font-semibold text-sm flex items-center gap-2 transition-colors shadow-sm"
        >
          ➕ Nueva Unidad Educativa
        </button>
      </div>

      {cargando ? <CargandoCard /> : (
        <div className="space-y-4">
          {unidades.length === 0 ? (
            <div className="text-center p-8 bg-slate-50 rounded-2xl text-slate-500 border border-dashed border-slate-300">
              No hay unidades educativas registradas.
            </div>
          ) : unidades.map(u => (
            <div key={u._id} className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm hover:border-emerald-300 transition-colors">
              <div className="flex justify-between items-start">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center text-xl">🏫</div>
                  <div>
                    <h3 className="font-bold text-slate-800">{u.nombre}</h3>
                    <p className="text-sm text-slate-500">Código: <span className="font-mono font-bold">{u.codigo}</span></p>
                    {u.nivel && <p className="text-xs text-slate-400 capitalize">Nivel: {u.nivel}</p>}
                    {u.director && <p className="text-xs text-slate-400">Director/a: {u.director}</p>}
                    {u.direccion && <p className="text-xs text-slate-400">📍 {u.direccion}</p>}
                  </div>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => abrirModal(u)}
                    className="bg-blue-50 hover:bg-blue-100 text-blue-700 px-3 py-1.5 rounded-lg text-xs font-semibold">✏️ Editar</button>
                  <button onClick={() => handleEliminar(u._id, u.nombre)}
                    className="bg-red-50 hover:bg-red-100 text-red-600 px-3 py-1.5 rounded-lg text-xs font-semibold">🗑️</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {modal && (
        <Modal title={`🏫 ${editando ? 'Editar' : 'Nueva'} Unidad Educativa`} onClose={() => setModal(false)}>
          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <FormField label="Nombre" required className="col-span-2">
                <input required value={form.nombre} onChange={e=>setForm({...form,nombre:e.target.value})} placeholder="Nombre de la unidad" className="input-base" />
              </FormField>
              <FormField label="Código SIE" required>
                <input required value={form.codigo} onChange={e=>setForm({...form,codigo:e.target.value})} placeholder="Ej: 70810001" className="input-base" />
              </FormField>
              <FormField label="Nivel Educativo">
                <input value={form.nivel} onChange={e=>setForm({...form,nivel:e.target.value})} placeholder="primaria y secundaria" className="input-base" />
              </FormField>
            </div>
            <FormField label="Director/a">
              <input value={form.director} onChange={e=>setForm({...form,director:e.target.value})} placeholder="Nombre del director/a" className="input-base" />
            </FormField>
            <FormField label="Dirección">
              <input value={form.direccion} onChange={e=>setForm({...form,direccion:e.target.value})} placeholder="Calle, zona, ciudad" className="input-base" />
            </FormField>
            <FormField label="Teléfono">
              <input value={form.telefono} onChange={e=>setForm({...form,telefono:e.target.value})} placeholder="Ej: 4-451234" className="input-base" />
            </FormField>
            <div className="flex gap-3 justify-end pt-2">
              <BtnCancelar onClick={() => setModal(false)} />
              <BtnGuardar loading={guardando} label={editando ? 'Actualizar' : 'Crear'} color="emerald" />
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};

// ═══════════════════════════════════════════════════════════
// SECCIÓN: CONFIGURAR AÑO ESCOLAR
// ═══════════════════════════════════════════════════════════
const SeccionAnioEscolar = () => {
  const [config, setConfig]     = useState(null);
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [exito, setExito]       = useState('');
  const [form, setForm]         = useState({
    anio: new Date().getFullYear(),
    fechaInicio: '',
    fechaFin: '',
    periodos: [
      { nombre: '1er Trimestre', inicio: '', fin: '' },
      { nombre: '2do Trimestre', inicio: '', fin: '' },
      { nombre: '3er Trimestre', inicio: '', fin: '' },
    ],
  });

  useEffect(() => {
    API.get('/admin/anio-escolar')
      .then(r => {
        setConfig(r.data.data);
        const d = r.data.data;
        setForm({
          anio:       d.anio || new Date().getFullYear(),
          fechaInicio: d.fechaInicio || '',
          fechaFin:    d.fechaFin || '',
          periodos:    d.periodos || form.periodos,
        });
      })
      .catch(console.error)
      .finally(() => setCargando(false));
  }, []);

  const handlePeriodo = (idx, campo, valor) => {
    const p = [...form.periodos];
    p[idx] = { ...p[idx], [campo]: valor };
    setForm({ ...form, periodos: p });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setGuardando(true);
    try {
      await API.put('/admin/anio-escolar', form);
      setExito('✅ Configuración del año escolar guardada exitosamente');
      setTimeout(() => setExito(''), 3000);
    } catch (err) {
      alert('Error al guardar configuración');
    } finally { setGuardando(false); }
  };

  if (cargando) return <CargandoCard />;

  return (
    <div className="space-y-5">
      <SectionTitle icon="📅" title="Configurar Año Escolar" subtitle="Fechas del ciclo educativo y periodos trimestrales" />

      {exito && <Alerta tipo="exito" mensaje={exito} />}

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* General */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
          <h3 className="font-bold text-slate-800 flex items-center gap-2">📆 Datos Generales</h3>
          <div className="grid grid-cols-3 gap-4">
            <FormField label="Año escolar">
              <input type="number" value={form.anio}
                onChange={e => setForm({...form, anio: Number(e.target.value)})}
                className="input-base" min="2020" max="2040" />
            </FormField>
            <FormField label="Fecha de inicio">
              <input type="date" value={form.fechaInicio}
                onChange={e => setForm({...form, fechaInicio: e.target.value})}
                className="input-base" />
            </FormField>
            <FormField label="Fecha de fin">
              <input type="date" value={form.fechaFin}
                onChange={e => setForm({...form, fechaFin: e.target.value})}
                className="input-base" />
            </FormField>
          </div>
        </div>

        {/* Periodos */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
          <h3 className="font-bold text-slate-800 flex items-center gap-2">📊 Periodos Trimestrales</h3>
          <div className="space-y-3">
            {form.periodos.map((p, idx) => (
              <div key={idx} className="grid grid-cols-3 gap-3 items-center bg-slate-50 rounded-xl p-4">
                <div className="font-semibold text-slate-700 text-sm">{p.nombre}</div>
                <FormField label="Inicio">
                  <input type="date" value={p.inicio}
                    onChange={e => handlePeriodo(idx, 'inicio', e.target.value)}
                    className="input-base" />
                </FormField>
                <FormField label="Fin">
                  <input type="date" value={p.fin}
                    onChange={e => handlePeriodo(idx, 'fin', e.target.value)}
                    className="input-base" />
                </FormField>
              </div>
            ))}
          </div>
        </div>

        {/* Info última actualización */}
        {config?.updatedAt && (
          <p className="text-xs text-slate-400 text-right">
            Última actualización: {new Date(config.updatedAt).toLocaleString('es-BO')} por {config.updatedBy}
          </p>
        )}

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={guardando}
            className="bg-cyan-600 hover:bg-cyan-700 text-white px-6 py-3 rounded-xl font-semibold flex items-center gap-2 transition-colors shadow-sm disabled:opacity-50"
          >
            {guardando ? '⏳ Guardando...' : '💾 Guardar Configuración'}
          </button>
        </div>
      </form>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════
// SECCIÓN: REPORTES GLOBALES
// ═══════════════════════════════════════════════════════════
const SeccionReportesGlobales = () => {
  const [stats, setStats]       = useState(null);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    API.get('/admin/reportes-globales')
      .then(r => setStats(r.data.data))
      .catch(console.error)
      .finally(() => setCargando(false));
  }, []);

  if (cargando) return <CargandoCard />;

  return (
    <div className="space-y-5">
      <SectionTitle icon="📈" title="Ver Reportes Globales" subtitle={`Generado el ${new Date(stats?.generadoEn).toLocaleString('es-BO')}`} />

      {/* Usuarios */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
        <h3 className="font-bold text-slate-800 mb-4">👥 Distribución de Usuarios</h3>
        <div className="grid grid-cols-4 gap-4">
          {[
            { label: 'Total', valor: stats?.usuarios?.total,      color: 'bg-slate-100 text-slate-800' },
            { label: 'Admins', valor: stats?.usuarios?.admins,    color: 'bg-red-100 text-red-700' },
            { label: 'Directores', valor: stats?.usuarios?.directores, color: 'bg-blue-100 text-blue-700' },
            { label: 'Docentes', valor: stats?.usuarios?.docentes, color: 'bg-emerald-100 text-emerald-700' },
          ].map(t => (
            <div key={t.label} className={`rounded-xl p-4 text-center ${t.color}`}>
              <div className="text-3xl font-black">{t.valor ?? 0}</div>
              <div className="text-sm font-semibold mt-1">{t.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Estudiantes */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
        <h3 className="font-bold text-slate-800 mb-4">🎓 Estudiantes</h3>
        <div className="flex items-center gap-6">
          <div className="text-center bg-amber-50 rounded-xl px-8 py-4">
            <div className="text-4xl font-black text-amber-700">{stats?.estudiantes?.total ?? 0}</div>
            <div className="text-sm font-semibold text-amber-600">Total Estudiantes</div>
          </div>
          {stats?.estudiantes?.porGenero?.map(g => (
            <div key={g._id} className="text-center bg-slate-50 rounded-xl px-6 py-4">
              <div className="text-3xl font-black text-slate-700">{g.cantidad}</div>
              <div className="text-sm font-semibold text-slate-500 capitalize">{g._id || 'No especificado'}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Académico */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
        <h3 className="font-bold text-slate-800 mb-4">📚 Información Académica</h3>
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="bg-indigo-50 rounded-xl p-4 text-center">
            <div className="text-3xl font-black text-indigo-700">{stats?.academico?.totalMaterias ?? 0}</div>
            <div className="text-sm font-semibold text-indigo-600">Total Materias</div>
          </div>
          <div className="bg-cyan-50 rounded-xl p-4 text-center">
            <div className="text-3xl font-black text-cyan-700">{stats?.academico?.totalCursos ?? 0}</div>
            <div className="text-sm font-semibold text-cyan-600">Total Cursos</div>
          </div>
        </div>
        {stats?.academico?.materiasPorNivel?.length > 0 && (
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Materias por nivel</p>
            <div className="flex gap-3">
              {stats.academico.materiasPorNivel.map(m => (
                <div key={m._id} className="bg-slate-100 rounded-lg px-4 py-2 text-center">
                  <div className="text-xl font-black text-slate-700">{m.cantidad}</div>
                  <div className="text-xs text-slate-500 capitalize">{m._id}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════
// SECCIÓN: AUDITORÍA DEL SISTEMA
// ═══════════════════════════════════════════════════════════
const SeccionAuditoria = () => {
  const [logs, setLogs]         = useState([]);
  const [total, setTotal]       = useState(0);
  const [cargando, setCargando] = useState(true);
  const [filtroAccion, setFiltroAccion] = useState('');
  const [filtroUsuario, setFiltroUsuario] = useState('');
  const [pagina, setPagina]     = useState(1);

  const cargar = () => {
    setCargando(true);
    const params = new URLSearchParams({ page: pagina, limit: 30 });
    if (filtroAccion)  params.append('accion', filtroAccion);
    if (filtroUsuario) params.append('usuario', filtroUsuario);

    API.get(`/admin/auditoria?${params}`)
      .then(r => { setLogs(r.data.data || []); setTotal(r.data.total || 0); })
      .catch(console.error)
      .finally(() => setCargando(false));
  };

  useEffect(() => { cargar(); }, [pagina, filtroAccion, filtroUsuario]);

  const accionColor = {
    CREAR_USUARIO:          'bg-emerald-100 text-emerald-700',
    CAMBIAR_ROL:            'bg-blue-100 text-blue-700',
    ELIMINAR_USUARIO:       'bg-red-100 text-red-700',
    ASIGNAR_MATERIA_DOCENTE:'bg-amber-100 text-amber-700',
    CONFIGURAR_ANIO_ESCOLAR:'bg-cyan-100 text-cyan-700',
    CREAR_UNIDAD_EDUCATIVA: 'bg-violet-100 text-violet-700',
    ACTUALIZAR_UNIDAD_EDUCATIVA: 'bg-indigo-100 text-indigo-700',
    ELIMINAR_UNIDAD_EDUCATIVA:   'bg-red-100 text-red-600',
    SISTEMA_INICIADO:       'bg-slate-100 text-slate-600',
  };

  return (
    <div className="space-y-5">
      <SectionTitle icon="🔍" title="Auditoría del Sistema" subtitle={`${total} eventos registrados en total`} />

      {/* Filtros */}
      <div className="flex gap-3 flex-wrap">
        <input
          type="text"
          placeholder="🔍 Filtrar por acción..."
          value={filtroAccion}
          onChange={e => { setFiltroAccion(e.target.value); setPagina(1); }}
          className="border border-slate-200 rounded-xl px-4 py-2.5 text-sm flex-1 min-w-[180px] focus:outline-none focus:ring-2 focus:ring-slate-300"
        />
        <input
          type="text"
          placeholder="👤 Filtrar por usuario..."
          value={filtroUsuario}
          onChange={e => { setFiltroUsuario(e.target.value); setPagina(1); }}
          className="border border-slate-200 rounded-xl px-4 py-2.5 text-sm flex-1 min-w-[180px] focus:outline-none focus:ring-2 focus:ring-slate-300"
        />
        <button onClick={cargar}
          className="bg-slate-700 hover:bg-slate-800 text-white px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors">
          🔄 Actualizar
        </button>
      </div>

      {/* Lista de logs */}
      {cargando ? <CargandoCard /> : (
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-800 text-white">
                <tr>
                  <th className="p-4 text-left">Fecha y Hora</th>
                  <th className="p-4 text-left">Acción</th>
                  <th className="p-4 text-left">Descripción</th>
                  <th className="p-4 text-left">Usuario</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {logs.length === 0 ? (
                  <tr><td colSpan="4" className="text-center p-8 text-slate-400">No hay registros de auditoría</td></tr>
                ) : logs.map(log => (
                  <tr key={log.id} className="hover:bg-slate-50 transition-colors">
                    <td className="p-4 text-slate-400 text-xs whitespace-nowrap font-mono">
                      {new Date(log.fecha).toLocaleString('es-BO')}
                    </td>
                    <td className="p-4">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${accionColor[log.accion] || 'bg-slate-100 text-slate-600'}`}>
                        {log.accion.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="p-4 text-slate-700">{log.descripcion}</td>
                    <td className="p-4">
                      <div className="font-semibold text-slate-800">{log.usuario}</div>
                      <div className="text-xs text-slate-400">{log.usuarioRol}</div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {/* Paginación */}
          <div className="flex justify-between items-center p-4 border-t border-slate-100 bg-slate-50">
            <span className="text-xs text-slate-500">Mostrando {logs.length} de {total} registros</span>
            <div className="flex gap-2">
              <button disabled={pagina === 1} onClick={() => setPagina(p => p-1)}
                className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold disabled:opacity-40 hover:bg-slate-100 transition-colors">
                ← Anterior
              </button>
              <span className="px-3 py-1.5 text-xs text-slate-600 font-semibold">Pág. {pagina}</span>
              <button disabled={logs.length < 30} onClick={() => setPagina(p => p+1)}
                className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold disabled:opacity-40 hover:bg-slate-100 transition-colors">
                Siguiente →
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ═══════════════════════════════════════════════════════════
// COMPONENTES AUXILIARES
// ═══════════════════════════════════════════════════════════

const SectionTitle = ({ icon, title, subtitle }) => (
  <div className="border-b border-slate-100 pb-4">
    <h2 className="text-xl font-black text-slate-800 flex items-center gap-2">
      <span>{icon}</span> {title}
    </h2>
    {subtitle && <p className="text-sm text-slate-500 mt-0.5">{subtitle}</p>}
  </div>
);

const CargandoCard = () => (
  <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center text-slate-400 animate-pulse">
    ⏳ Cargando...
  </div>
);

const Alerta = ({ tipo, mensaje }) => (
  <div className={`rounded-xl p-4 font-semibold flex items-center gap-2 text-sm ${
    tipo === 'exito' ? 'bg-emerald-50 border border-emerald-200 text-emerald-700' :
    'bg-red-50 border border-red-200 text-red-700'
  }`}>
    {mensaje}
  </div>
);

const Modal = ({ title, children, onClose }) => (
  <div className="fixed inset-0 bg-slate-900/60 flex items-center justify-center p-4 z-50">
    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] flex flex-col">
      <div className="flex items-center justify-between p-6 border-b border-slate-100">
        <h3 className="font-bold text-slate-800 text-lg">{title}</h3>
        <button onClick={onClose} className="text-slate-400 hover:text-slate-700 text-2xl leading-none">×</button>
      </div>
      <div className="p-6 overflow-y-auto flex-1">{children}</div>
    </div>
  </div>
);

const FormField = ({ label, children, required, className = '' }) => (
  <div className={className}>
    <label className="block text-xs font-semibold text-slate-600 mb-1">
      {label} {required && <span className="text-red-400">*</span>}
    </label>
    {children}
  </div>
);

const BtnCancelar = ({ onClick }) => (
  <button type="button" onClick={onClick}
    className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-semibold text-sm transition-colors">
    Cancelar
  </button>
);

const BtnGuardar = ({ loading, label, color = 'violet' }) => {
  const colors = {
    violet: 'bg-violet-600 hover:bg-violet-700',
    amber:  'bg-amber-500 hover:bg-amber-600',
    emerald:'bg-emerald-600 hover:bg-emerald-700',
    cyan:   'bg-cyan-600 hover:bg-cyan-700',
  };
  return (
    <button type="submit" disabled={loading}
      className={`px-5 py-2.5 text-white rounded-xl font-semibold text-sm transition-colors disabled:opacity-50 flex items-center gap-2 ${colors[color]}`}>
      {loading ? '⏳ Guardando...' : `💾 ${label}`}
    </button>
  );
};

export default AdminPanel;
