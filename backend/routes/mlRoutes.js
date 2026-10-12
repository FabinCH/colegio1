

'use strict';

const express    = require('express');
const router     = express.Router();
const { protect, authorize } = require('../middlewares/authMiddleware');
const mlCtrl     = require('../controllers/mlController');

router.use(protect);
router.use(authorize('admin', 'director'));

router.get('/resumen', mlCtrl.getResumen);

router.get('/predicciones/estudiantes',      mlCtrl.getPrediccionesEstudiantes);
router.get('/predicciones/estudiantes/:id',  mlCtrl.getPrediccionEstudiante);

router.get('/predicciones/cursos',           mlCtrl.getPrediccionesCursos);
router.get('/predicciones/cursos/:id',       mlCtrl.getPrediccionCurso);

module.exports = router;
