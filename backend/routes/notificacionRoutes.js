

const express = require('express');
const router  = express.Router();
const { protect, authorize } = require('../middlewares/authMiddleware');
const ctrl = require('../controllers/notificacionController');

router.get('/vapid-key', protect, ctrl.getVapidKey);

router.post('/suscribir',    protect, ctrl.suscribir);
router.delete('/desuscribir', protect, ctrl.desuscribir);

router.get('/',           protect, ctrl.listar);
router.get('/conteo',     protect, ctrl.conteoNoLeidas);
router.patch('/leer-todas', protect, ctrl.marcarTodasLeidas);
router.patch('/:id/leer',   protect, ctrl.marcarLeida);
router.delete('/:id',       protect, ctrl.eliminar);

router.post(
  '/enviar-prueba',
  protect,
  authorize('admin', 'director'),
  ctrl.enviarPrueba
);

module.exports = router;
