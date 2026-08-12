// ============================================================
// backend/routes/mlRoutes.js
// ============================================================
//
// PROPÓSITO:
//   Define las rutas de la API de Machine Learning.
//   Todas están protegidas con JWT y requieren rol admin o director.
//
// BASE URL: /api/ml
// ============================================================

'use strict';

const express    = require('express');
const router     = express.Router();
const { protect, authorize } = require('../middlewares/authMiddleware');
const mlCtrl     = require('../controllers/mlController');

// Middleware base: todas las rutas ML requieren auth + rol elevado
router.use(protect);
router.use(authorize('admin', 'director'));

// ── Resumen global ────────────────────────────────────────────
// GET /api/ml/resumen
router.get('/resumen', mlCtrl.getResumen);

// ── Predicciones por estudiante ───────────────────────────────
// GET /api/ml/predicciones/estudiantes         (con filtros opcionales)
// GET /api/ml/predicciones/estudiantes/:id     (estudiante específico)
router.get('/predicciones/estudiantes',      mlCtrl.getPrediccionesEstudiantes);
router.get('/predicciones/estudiantes/:id',  mlCtrl.getPrediccionEstudiante);

// ── Predicciones por curso ────────────────────────────────────
// GET /api/ml/predicciones/cursos              (todos los cursos)
// GET /api/ml/predicciones/cursos/:id          (curso específico)
router.get('/predicciones/cursos',           mlCtrl.getPrediccionesCursos);
router.get('/predicciones/cursos/:id',       mlCtrl.getPrediccionCurso);

module.exports = router;
