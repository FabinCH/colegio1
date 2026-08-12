// ============================================
// middlewares/authMiddleware.js — Protección de Rutas
// ============================================
//
// ¿QUÉ HACE ESTE ARCHIVO?
// Contiene dos middlewares (funciones "guardianes") que protegen las rutas:
//
// 1. protect → Verifica que el usuario envió un token JWT válido.
//              Si sí, deja pasar. Si no, bloquea con error 401.
//
// 2. authorize → Verifica que el usuario tenga el ROL correcto.
//                Ejemplo: solo 'admin' puede borrar usuarios.
//
// ¿CÓMO FUNCIONA EL FLUJO?
//   1. El frontend hace login → recibe un token JWT
//   2. Para cada petición protegida, el frontend envía:
//      Header → Authorization: Bearer eyJhbGciOi...
//   3. El middleware 'protect' lee ese header, decodifica el token,
//      y pone los datos del usuario en req.usuario
//   4. El middleware 'authorize' (opcional) verifica el rol

const jwt = require('jsonwebtoken');
const User = require('../models/User');

// ================================================
// MIDDLEWARE: Proteger rutas (verificar JWT)
// ================================================
// Uso en rutas: router.get('/perfil', protect, controllerFn)
//
// ¿Qué hace paso a paso?
//   1. Lee el header Authorization
//   2. Extrae el token (quita "Bearer ")
//   3. Verifica que el token es válido y no ha expirado
//   4. Busca al usuario en la BD
//   5. Pone los datos del usuario en req.usuario
//   6. Si algo falla → error 401 (no autorizado)
const protect = async (req, res, next) => {
  try {
    let token;

    // Paso 1: Verificar que el header Authorization existe y tiene formato "Bearer <token>"
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith('Bearer')
    ) {
      // Extraer solo el token (sin "Bearer ")
      // "Bearer eyJhbGciOi..." → "eyJhbGciOi..."
      token = req.headers.authorization.split(' ')[1];
    }

    // Si no hay token, el usuario no está autenticado
    if (!token) {
      return res.status(401).json({
        exito: false,
        mensaje: 'No autorizado. Debes iniciar sesión.',
      });
    }

    // Paso 2: Verificar y decodificar el token
    // jwt.verify() lanza un error si el token es inválido o expiró
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Paso 3: Buscar al usuario en la BD usando el ID del token
    // Si el usuario fue eliminado después de crear el token, lo atrapamos aquí
    const usuario = await User.findById(decoded.id);

    if (!usuario) {
      return res.status(401).json({
        exito: false,
        mensaje: 'El usuario asociado a este token ya no existe.',
      });
    }

    // Paso 4: Poner los datos del usuario en req.usuario
    // Así los controllers pueden acceder a req.usuario.id, req.usuario.rol, etc.
    req.usuario = {
      id: usuario._id,
      nombre: usuario.nombre,
      email: usuario.email,
      rol: usuario.rol,
    };

    // Todo bien → dejar pasar al siguiente middleware/controller
    next();
  } catch (error) {
    // Si el token expiró
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        exito: false,
        mensaje: 'Tu sesión ha expirado. Por favor, inicia sesión de nuevo.',
      });
    }

    // Si el token es inválido (fue alterado)
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        exito: false,
        mensaje: 'Token inválido. Por favor, inicia sesión de nuevo.',
      });
    }

    // Cualquier otro error
    console.error('Error en middleware protect:', error);
    res.status(500).json({
      exito: false,
      mensaje: 'Error interno del servidor',
    });
  }
};

// ================================================
// MIDDLEWARE: Autorizar por rol
// ================================================
// Uso en rutas: router.delete('/usuario/:id', protect, authorize('admin'), controllerFn)
//
// ¿Cómo funciona?
//   - Recibe una lista de roles permitidos
//   - Verifica si el rol del usuario (que ya fue puesto por 'protect') está en la lista
//   - Si sí → deja pasar. Si no → error 403 (prohibido)
//
// NOTA: Este middleware SIEMPRE debe ir DESPUÉS de 'protect',
//       porque necesita que req.usuario ya exista.
const authorize = (...rolesPermitidos) => {
  return (req, res, next) => {
    // Verificar que protect ya se ejecutó
    if (!req.usuario) {
      return res.status(401).json({
        exito: false,
        mensaje: 'No autorizado. Debes iniciar sesión primero.',
      });
    }

    // Verificar si el rol del usuario está en la lista de roles permitidos
    if (!rolesPermitidos.includes(req.usuario.rol)) {
      return res.status(403).json({
        exito: false,
        mensaje: `Acceso denegado. Se requiere rol: ${rolesPermitidos.join(' o ')}. Tu rol actual: ${req.usuario.rol}.`,
      });
    }

    // Rol correcto → dejar pasar
    next();
  };
};

module.exports = { protect, authorize };
