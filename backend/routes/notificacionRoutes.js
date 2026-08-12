// ============================================
// routes/notificacionRoutes.js
// ============================================

const express = require('express');
const router  = express.Router();
const { protect, authorize } = require('../middlewares/authMiddleware');
const ctrl = require('../controllers/notificacionController');

// ── Rutas públicas de VAPID ──────────────────────────────────
// La clave pública VAPID la necesita el frontend para suscribirse
router.get('/vapid-key', protect, ctrl.getVapidKey);

// ── Suscripciones Push ───────────────────────────────────────
// Cualquier usuario autenticado puede suscribirse,
// pero el sistema solo enviará notificaciones a directores/admins
router.post('/suscribir',    protect, ctrl.suscribir);
router.delete('/desuscribir', protect, ctrl.desuscribir);

// ── Notificaciones del usuario autenticado ───────────────────
router.get('/',           protect, ctrl.listar);
router.get('/conteo',     protect, ctrl.conteoNoLeidas);
router.patch('/leer-todas', protect, ctrl.marcarTodasLeidas);
router.patch('/:id/leer',   protect, ctrl.marcarLeida);
router.delete('/:id',       protect, ctrl.eliminar);

// ── Solo admin puede enviar notificaciones de prueba ─────────
router.post(
  '/enviar-prueba',
  protect,
  authorize('admin', 'director'),
  ctrl.enviarPrueba
);

module.exports = router;
