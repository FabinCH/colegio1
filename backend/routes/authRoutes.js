// ============================================
// routes/authRoutes.js — Rutas de Autenticación
// ============================================
//
// ¿QUÉ HACE ESTE ARCHIVO?
// Define las URLs (rutas) relacionadas con la autenticación.
// En MVC, las RUTAS son como el "mapa" que dice:
//   "Si alguien visita /api/auth/login, ejecuta la función login()"
//
// ¿POR QUÉ SEPARAR LAS RUTAS?
// Para mantener el código organizado. Si tuviéramos todas las rutas
// en server.js, sería un archivo enorme e imposible de mantener.
// Separamos por "tema": auth, students, materias, etc.
//
// RUTAS DISPONIBLES:
//   POST /api/auth/register  → Crear cuenta nueva
//   POST /api/auth/login     → Iniciar sesión
//   GET  /api/auth/perfil    → Ver perfil (requiere token)

const express = require('express');
const router = express.Router();

// Importar los controllers (las funciones que procesan cada ruta)
const { register, login, getPerfil } = require('../controllers/authController');

// Importar el middleware de protección
const { protect } = require('../middlewares/authMiddleware');

// --- DEFINIR LAS RUTAS ---

// POST /api/auth/register
// ¿Quién puede usarla? Cualquiera (no requiere token)
// Body: { nombre, email, password, rol }
router.post('/register', register);

// POST /api/auth/login
// ¿Quién puede usarla? Cualquiera (no requiere token)
// Body: { email, password }
router.post('/login', login);

// GET /api/auth/perfil o /api/auth/me
// ¿Quién puede usarla? Solo usuarios autenticados (requiere token)
// Headers: Authorization: Bearer <token>
// El middleware 'protect' verifica el token ANTES de ejecutar getPerfil
router.get('/perfil', protect, getPerfil);
router.get('/me', protect, getPerfil);

module.exports = router;
