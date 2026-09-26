// ============================================
// controllers/adminController.js — Panel de Administración
// ============================================
//
// Funciones exclusivas para el rol 'admin':
//   - Gestionar Usuarios (listar, crear docente, asignar rol, eliminar)
//   - Gestionar Unidades Educativas
//   - Configurar Año Escolar
//   - Asignar Materia a Docente
//   - Ver Reportes Globales
//   - Auditoría del Sistema

const User    = require('../models/User');
const Materia = require('../models/Materia');
const Curso   = require('../models/Curso');
const Student = require('../models/Student');

// ─── LOG DE AUDITORÍA EN MEMORIA ──────────────────────────────────────────────
// Guardamos los últimos 500 eventos en un array en memoria.
// En producción esto debería persistirse en BD, pero para el proyecto funciona.
const auditLogs = [];

const registrarAuditoria = (accion, descripcion, usuario, datos = {}) => {
  auditLogs.unshift({
    id:          Date.now().toString(),
    accion,
    descripcion,
    usuario:     usuario?.nombre || 'Sistema',
    usuarioRol:  usuario?.rol    || '',
    datos,
    fecha:       new Date().toISOString(),
  });
  // Mantener máximo 500 registros
  if (auditLogs.length > 500) auditLogs.pop();
};

// ─── EXPORTAR registrarAuditoria para usarla desde otros controllers ──────────
module.exports.registrarAuditoria = registrarAuditoria;

// =============================================================
// GESTIÓN DE USUARIOS
// =============================================================

// LISTAR todos los usuarios — GET /api/admin/usuarios
const listarUsuarios = async (req, res) => {
  try {
    const usuarios = await User.find({}).select('-password').sort({ createdAt: -1 });
    res.json({ exito: true, cantidad: usuarios.length, data: usuarios });
  } catch (error) {
    console.error('Error en listarUsuarios:', error);
    res.status(500).json({ exito: false, mensaje: 'Error interno del servidor' });
  }
};

// CREAR DOCENTE — POST /api/admin/usuarios
const crearDocente = async (req, res) => {
  try {
    const { nombre, email, password, rol = 'docente' } = req.body;

    // Validar que el rol sea válido
    const rolesPermitidos = ['admin', 'director', 'docente'];
    if (!rolesPermitidos.includes(rol)) {
      return res.status(400).json({
        exito: false,
        mensaje: 'Rol inválido. Roles permitidos: admin, director, docente',
      });
    }

    const existe = await User.findOne({ email });
    if (existe) {
      return res.status(400).json({ exito: false, mensaje: 'Ya existe un usuario con ese email' });
    }

    const nuevoUsuario = await User.create({ nombre, email, password, rol });

    registrarAuditoria(
      'CREAR_USUARIO',
      `Se creó el usuario "${nombre}" con rol "${rol}"`,
      req.usuario,
      { usuarioCreado: nuevoUsuario._id, email, rol }
    );

    res.status(201).json({
      exito: true,
      mensaje: 'Usuario creado exitosamente',
      data: {
        id:     nuevoUsuario._id,
        nombre: nuevoUsuario.nombre,
        email:  nuevoUsuario.email,
        rol:    nuevoUsuario.rol,
      },
    });
  } catch (error) {
    if (error.name === 'ValidationError') {
      const mensajes = Object.values(error.errors).map(e => e.message);
      return res.status(400).json({ exito: false, mensaje: 'Error de validación', errores: mensajes });
    }
    console.error('Error en crearDocente:', error);
    res.status(500).json({ exito: false, mensaje: 'Error interno del servidor' });
  }
};

// ASIGNAR ROL — PUT /api/admin/usuarios/:id/rol
const asignarRol = async (req, res) => {
  try {
    const { rol } = req.body;
    const rolesPermitidos = ['admin', 'director', 'docente'];

    if (!rolesPermitidos.includes(rol)) {
      return res.status(400).json({
        exito: false,
        mensaje: 'Rol inválido. Roles permitidos: admin, director, docente',
      });
    }

    // No puede cambiar su propio rol
    if (req.params.id === String(req.usuario.id)) {
      return res.status(400).json({
        exito: false,
        mensaje: 'No puedes cambiar tu propio rol',
      });
    }

    const usuario = await User.findByIdAndUpdate(
      req.params.id,
      { rol },
      { new: true, runValidators: true }
    ).select('-password');

    if (!usuario) {
      return res.status(404).json({ exito: false, mensaje: 'Usuario no encontrado' });
    }

    registrarAuditoria(
      'CAMBIAR_ROL',
      `Se cambió el rol de "${usuario.nombre}" a "${rol}"`,
      req.usuario,
      { usuarioAfectado: usuario._id, nuevoRol: rol }
    );

    res.json({ exito: true, mensaje: 'Rol actualizado exitosamente', data: usuario });
  } catch (error) {
    console.error('Error en asignarRol:', error);
    res.status(500).json({ exito: false, mensaje: 'Error interno del servidor' });
  }
};

// ELIMINAR USUARIO — DELETE /api/admin/usuarios/:id
const eliminarUsuario = async (req, res) => {
  try {
    // No puede eliminarse a sí mismo
    if (req.params.id === String(req.usuario.id)) {
      return res.status(400).json({
        exito: false,
        mensaje: 'No puedes eliminar tu propia cuenta',
      });
    }

    const usuario = await User.findByIdAndDelete(req.params.id);

    if (!usuario) {
      return res.status(404).json({ exito: false, mensaje: 'Usuario no encontrado' });
    }

    registrarAuditoria(
      'ELIMINAR_USUARIO',
      `Se eliminó al usuario "${usuario.nombre}" (${usuario.email}) con rol "${usuario.rol}"`,
      req.usuario,
      { usuarioEliminado: usuario._id, email: usuario.email, rol: usuario.rol }
    );

    res.json({ exito: true, mensaje: 'Usuario eliminado exitosamente' });
  } catch (error) {
    console.error('Error en eliminarUsuario:', error);
    res.status(500).json({ exito: false, mensaje: 'Error interno del servidor' });
  }
};

// =============================================================
// ASIGNAR MATERIA A DOCENTE
// =============================================================
// PUT /api/admin/materias/:id/asignar-docente
const asignarMateriaDocente = async (req, res) => {
  try {
    const { docenteId } = req.body;

    // Verificar que el docente existe
    const docente = await User.findById(docenteId).select('-password');
    if (!docente) {
      return res.status(404).json({ exito: false, mensaje: 'Docente no encontrado' });
    }

    // Buscar el curso que corresponde y asignarle ese docente
    // En este sistema, la materia se asigna actualizando el campo 'docente' en Curso
    // Buscamos cursos que tengan esa materia via cuadernos, o bien asignamos al modelo Materia
    // Por simplicidad, agregamos un campo docenteAsignado a la Materia
    const materia = await Materia.findByIdAndUpdate(
      req.params.id,
      { docenteAsignado: docenteId },
      { new: true }
    );

    if (!materia) {
      return res.status(404).json({ exito: false, mensaje: 'Materia no encontrada' });
    }

    registrarAuditoria(
      'ASIGNAR_MATERIA_DOCENTE',
      `Se asignó la materia "${materia.nombre}" al docente "${docente.nombre}"`,
      req.usuario,
      { materiaId: materia._id, docenteId }
    );

    res.json({
      exito: true,
      mensaje: `Materia "${materia.nombre}" asignada a ${docente.nombre}`,
      data: { materia, docente: { id: docente._id, nombre: docente.nombre, email: docente.email } },
    });
  } catch (error) {
    console.error('Error en asignarMateriaDocente:', error);
    res.status(500).json({ exito: false, mensaje: 'Error interno del servidor' });
  }
};

// =============================================================
// CONFIGURACIÓN AÑO ESCOLAR
// =============================================================
// Guardamos la configuración en memoria (en producción sería en BD)
let configAnioEscolar = {
  anio:         new Date().getFullYear(),
  fechaInicio:  '',
  fechaFin:     '',
  periodos:     [
    { nombre: '1er Trimestre', inicio: '', fin: '' },
    { nombre: '2do Trimestre', inicio: '', fin: '' },
    { nombre: '3er Trimestre', inicio: '', fin: '' },
  ],
  activo:       true,
  updatedAt:    null,
  updatedBy:    null,
};

// GET /api/admin/anio-escolar
const obtenerConfigAnio = async (req, res) => {
  res.json({ exito: true, data: configAnioEscolar });
};

// PUT /api/admin/anio-escolar
const actualizarConfigAnio = async (req, res) => {
  try {
    const { anio, fechaInicio, fechaFin, periodos } = req.body;

    configAnioEscolar = {
      ...configAnioEscolar,
      ...(anio        && { anio }),
      ...(fechaInicio && { fechaInicio }),
      ...(fechaFin    && { fechaFin }),
      ...(periodos    && { periodos }),
      updatedAt: new Date().toISOString(),
      updatedBy: req.usuario?.nombre,
    };

    registrarAuditoria(
      'CONFIGURAR_ANIO_ESCOLAR',
      `Se actualizó la configuración del año escolar ${anio || configAnioEscolar.anio}`,
      req.usuario,
      { config: configAnioEscolar }
    );

    res.json({ exito: true, mensaje: 'Configuración actualizada exitosamente', data: configAnioEscolar });
  } catch (error) {
    console.error('Error en actualizarConfigAnio:', error);
    res.status(500).json({ exito: false, mensaje: 'Error interno del servidor' });
  }
};

// =============================================================
// UNIDADES EDUCATIVAS
// =============================================================
// En memoria para el proyecto (en producción, modelo MongoDB)
let unidades = [
  {
    _id:       'ue_principal',
    nombre:    'Unidad Educativa Principal',
    codigo:    '00001',
    nivel:     'primaria y secundaria',
    director:  '',
    direccion: '',
    telefono:  '',
    activa:    true,
    createdAt: new Date().toISOString(),
  },
];

// GET /api/admin/unidades-educativas
const listarUnidades = async (req, res) => {
  res.json({ exito: true, cantidad: unidades.length, data: unidades });
};

// POST /api/admin/unidades-educativas
const crearUnidad = async (req, res) => {
  try {
    const { nombre, codigo, nivel, director, direccion, telefono } = req.body;

    if (!nombre || !codigo) {
      return res.status(400).json({ exito: false, mensaje: 'Nombre y código son obligatorios' });
    }

    const nueva = {
      _id:       `ue_${Date.now()}`,
      nombre,
      codigo,
      nivel:     nivel    || '',
      director:  director || '',
      direccion: direccion || '',
      telefono:  telefono || '',
      activa:    true,
      createdAt: new Date().toISOString(),
    };

    unidades.push(nueva);

    registrarAuditoria(
      'CREAR_UNIDAD_EDUCATIVA',
      `Se creó la unidad educativa "${nombre}" (código: ${codigo})`,
      req.usuario,
      { unidadId: nueva._id }
    );

    res.status(201).json({ exito: true, mensaje: 'Unidad educativa creada', data: nueva });
  } catch (error) {
    console.error('Error en crearUnidad:', error);
    res.status(500).json({ exito: false, mensaje: 'Error interno del servidor' });
  }
};

// PUT /api/admin/unidades-educativas/:id
const actualizarUnidad = async (req, res) => {
  try {
    const idx = unidades.findIndex(u => u._id === req.params.id);
    if (idx === -1) {
      return res.status(404).json({ exito: false, mensaje: 'Unidad educativa no encontrada' });
    }

    unidades[idx] = { ...unidades[idx], ...req.body, _id: req.params.id };

    registrarAuditoria(
      'ACTUALIZAR_UNIDAD_EDUCATIVA',
      `Se actualizó la unidad educativa "${unidades[idx].nombre}"`,
      req.usuario,
      { unidadId: req.params.id }
    );

    res.json({ exito: true, mensaje: 'Unidad actualizada', data: unidades[idx] });
  } catch (error) {
    console.error('Error en actualizarUnidad:', error);
    res.status(500).json({ exito: false, mensaje: 'Error interno del servidor' });
  }
};

// DELETE /api/admin/unidades-educativas/:id
const eliminarUnidad = async (req, res) => {
  try {
    const idx = unidades.findIndex(u => u._id === req.params.id);
    if (idx === -1) {
      return res.status(404).json({ exito: false, mensaje: 'Unidad educativa no encontrada' });
    }

    const nombre = unidades[idx].nombre;
    unidades.splice(idx, 1);

    registrarAuditoria(
      'ELIMINAR_UNIDAD_EDUCATIVA',
      `Se eliminó la unidad educativa "${nombre}"`,
      req.usuario,
      { unidadId: req.params.id }
    );

    res.json({ exito: true, mensaje: 'Unidad educativa eliminada' });
  } catch (error) {
    console.error('Error en eliminarUnidad:', error);
    res.status(500).json({ exito: false, mensaje: 'Error interno del servidor' });
  }
};

// =============================================================
// REPORTES GLOBALES
// =============================================================
// GET /api/admin/reportes-globales
const obtenerReportesGlobales = async (req, res) => {
  try {
    const [
      totalUsuarios,
      totalDocentes,
      totalDirectores,
      totalAdmins,
      totalEstudiantes,
      totalMaterias,
      totalCursos,
    ] = await Promise.all([
      User.countDocuments({}),
      User.countDocuments({ rol: 'docente' }),
      User.countDocuments({ rol: 'director' }),
      User.countDocuments({ rol: 'admin' }),
      Student.countDocuments({}),
      Materia.countDocuments({}),
      Curso.countDocuments({}),
    ]);

    // Materias por nivel
    const materiasPorNivel = await Materia.aggregate([
      { $group: { _id: '$nivel', cantidad: { $sum: 1 } } },
      { $sort: { _id: 1 } },
    ]);

    // Estudiantes por género (si el modelo lo tiene)
    let estudiantesPorGenero = [];
    try {
      estudiantesPorGenero = await Student.aggregate([
        { $group: { _id: '$sexo', cantidad: { $sum: 1 } } },
      ]);
    } catch { /* campo no disponible */ }

    res.json({
      exito: true,
      data: {
        usuarios: {
          total:      totalUsuarios,
          docentes:   totalDocentes,
          directores: totalDirectores,
          admins:     totalAdmins,
        },
        estudiantes: {
          total:       totalEstudiantes,
          porGenero:   estudiantesPorGenero,
        },
        academico: {
          totalMaterias,
          totalCursos,
          materiasPorNivel,
        },
        anioEscolar: configAnioEscolar,
        generadoEn: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('Error en obtenerReportesGlobales:', error);
    res.status(500).json({ exito: false, mensaje: 'Error interno del servidor' });
  }
};

// =============================================================
// AUDITORÍA DEL SISTEMA
// =============================================================
// GET /api/admin/auditoria?page=1&limit=50&accion=CREAR_USUARIO
const obtenerAuditoria = async (req, res) => {
  try {
    const { page = 1, limit = 50, accion, usuario } = req.query;
    const pag = Math.max(1, Number(page));
    const lim = Math.min(200, Math.max(1, Number(limit)));

    let logs = [...auditLogs];

    if (accion)   logs = logs.filter(l => l.accion.includes(accion.toUpperCase()));
    if (usuario)  logs = logs.filter(l => l.usuario.toLowerCase().includes(usuario.toLowerCase()));

    const total    = logs.length;
    const inicio   = (pag - 1) * lim;
    const paginado = logs.slice(inicio, inicio + lim);

    res.json({
      exito: true,
      total,
      pagina:      pag,
      totalPaginas: Math.ceil(total / lim),
      data:        paginado,
    });
  } catch (error) {
    console.error('Error en obtenerAuditoria:', error);
    res.status(500).json({ exito: false, mensaje: 'Error interno del servidor' });
  }
};

// Registrar inicio del servidor como primer log
registrarAuditoria(
  'SISTEMA_INICIADO',
  'El servidor del Panel de Administración fue iniciado',
  { nombre: 'Sistema', rol: 'sistema' }
);

module.exports = {
  // Usuarios
  listarUsuarios,
  crearDocente,
  asignarRol,
  eliminarUsuario,
  // Materias
  asignarMateriaDocente,
  // Año Escolar
  obtenerConfigAnio,
  actualizarConfigAnio,
  // Unidades Educativas
  listarUnidades,
  crearUnidad,
  actualizarUnidad,
  eliminarUnidad,
  // Reportes Globales
  obtenerReportesGlobales,
  // Auditoría
  obtenerAuditoria,
  // Helper
  registrarAuditoria,
};
