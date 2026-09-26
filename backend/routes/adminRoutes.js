// ============================================
// routes/adminRoutes.js — Rutas del Panel de Administración
// ============================================
//
// TODAS las rutas aquí requieren:
//   1. Token JWT válido (middleware protect)
//   2. Rol 'admin' (middleware authorize)
//
// RUTAS DISPONIBLES:
//   GET    /api/admin/usuarios                    → Listar todos los usuarios
//   POST   /api/admin/usuarios                    → Crear docente/director
//   PUT    /api/admin/usuarios/:id/rol            → Asignar rol a usuario
//   DELETE /api/admin/usuarios/:id                → Eliminar usuario
//
//   PUT    /api/admin/materias/:id/asignar-docente → Asignar materia a docente
//
//   GET    /api/admin/anio-escolar                → Obtener configuración
//   PUT    /api/admin/anio-escolar                → Actualizar configuración
//
//   GET    /api/admin/unidades-educativas         → Listar unidades
//   POST   /api/admin/unidades-educativas         → Crear unidad
//   PUT    /api/admin/unidades-educativas/:id     → Actualizar unidad
//   DELETE /api/admin/unidades-educativas/:id     → Eliminar unidad
//
//   GET    /api/admin/reportes-globales           → Estadísticas globales
//   GET    /api/admin/auditoria                   → Log de auditoría

const express = require('express');
const router  = express.Router();
const { protect, authorize } = require('../middlewares/authMiddleware');

const {
  listarUsuarios,
  crearDocente,
  asignarRol,
  eliminarUsuario,
  asignarMateriaDocente,
  obtenerConfigAnio,
  actualizarConfigAnio,
  listarUnidades,
  crearUnidad,
  actualizarUnidad,
  eliminarUnidad,
  obtenerReportesGlobales,
  obtenerAuditoria,
} = require('../controllers/adminController');

// Aplicar protect + authorize('admin', 'director') a las rutas de este router
router.use(protect, authorize('admin', 'director'));

// ── Gestión de Usuarios ──────────────────────────────────────
router.route('/usuarios')
  .get(listarUsuarios)
  .post(crearDocente);

router.put('/usuarios/:id/rol', asignarRol);
router.delete('/usuarios/:id',  eliminarUsuario);

// ── Asignar Materia a Docente ─────────────────────────────────
router.put('/materias/:id/asignar-docente', asignarMateriaDocente);

// ── Configuración Año Escolar ─────────────────────────────────
router.route('/anio-escolar')
  .get(obtenerConfigAnio)
  .put(actualizarConfigAnio);

// ── Unidades Educativas ───────────────────────────────────────
router.route('/unidades-educativas')
  .get(listarUnidades)
  .post(crearUnidad);

router.route('/unidades-educativas/:id')
  .put(actualizarUnidad)
  .delete(eliminarUnidad);

// ── Reportes Globales ─────────────────────────────────────────
router.get('/reportes-globales', obtenerReportesGlobales);

// ── Auditoría del Sistema ─────────────────────────────────────
router.get('/auditoria', obtenerAuditoria);

module.exports = router;
