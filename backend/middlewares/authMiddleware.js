

const jwt = require('jsonwebtoken');
const User = require('../models/User');

const protect = async (req, res, next) => {
  try {
    let token;

    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith('Bearer')
    ) {

      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({
        exito: false,
        mensaje: 'No autorizado. Debes iniciar sesión.',
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const usuario = await User.findById(decoded.id);

    if (!usuario) {
      return res.status(401).json({
        exito: false,
        mensaje: 'El usuario asociado a este token ya no existe.',
      });
    }

    req.usuario = {
      id: usuario._id,
      nombre: usuario.nombre,
      email: usuario.email,
      rol: usuario.rol,
    };

    next();
  } catch (error) {
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        exito: false,
        mensaje: 'Tu sesión ha expirado. Por favor, inicia sesión de nuevo.',
      });
    }

    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        exito: false,
        mensaje: 'Token inválido. Por favor, inicia sesión de nuevo.',
      });
    }

    console.error('Error en middleware protect:', error);
    res.status(500).json({
      exito: false,
      mensaje: 'Error interno del servidor',
    });
  }
};

const authorize = (...rolesPermitidos) => {
  return (req, res, next) => {
    
    if (!req.usuario) {
      return res.status(401).json({
        exito: false,
        mensaje: 'No autorizado. Debes iniciar sesión primero.',
      });
    }

    if (!rolesPermitidos.includes(req.usuario.rol)) {
      return res.status(403).json({
        exito: false,
        mensaje: `Acceso denegado. Se requiere rol: ${rolesPermitidos.join(' o ')}. Tu rol actual: ${req.usuario.rol}.`,
      });
    }

    next();
  };
};

module.exports = { protect, authorize };
