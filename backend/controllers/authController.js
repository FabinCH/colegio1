

const jwt = require('jsonwebtoken');
const User = require('../models/User');

const generarToken = (usuario) => {
  return jwt.sign(
    
    {
      id: usuario._id,
      rol: usuario.rol,
    },
    
    process.env.JWT_SECRET,
    
    { expiresIn: '7d' }
  );
};

const register = async (req, res) => {
  try {
    const { nombre, email, password, rol } = req.body;

    const usuarioExistente = await User.findOne({ email });
    if (usuarioExistente) {
      return res.status(400).json({
        exito: false,
        mensaje: 'Ya existe un usuario con ese email',
      });
    }

    const nuevoUsuario = await User.create({
      nombre,
      email,
      password,
      rol, 
    });

    const token = generarToken(nuevoUsuario);

    res.status(201).json({
      exito: true,
      mensaje: 'Usuario registrado exitosamente',
      data: {
        usuario: {
          id: nuevoUsuario._id,
          nombre: nuevoUsuario.nombre,
          email: nuevoUsuario.email,
          rol: nuevoUsuario.rol,
        },
        token,
      },
    });
  } catch (error) {
    
    if (error.name === 'ValidationError') {
      const mensajes = Object.values(error.errors).map((err) => err.message);
      return res.status(400).json({
        exito: false,
        mensaje: 'Error de validación',
        errores: mensajes,
      });
    }

    console.error('Error en register:', error);
    res.status(500).json({
      exito: false,
      mensaje: 'Error interno del servidor',
    });
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        exito: false,
        mensaje: 'Email y contraseña son obligatorios',
      });
    }

    const usuario = await User.findOne({ email }).select('+password');

    if (!usuario) {
      return res.status(401).json({
        exito: false,
        mensaje: 'Credenciales incorrectas',

      });
    }

    const passwordCorrecto = await usuario.compararPassword(password);

    if (!passwordCorrecto) {
      return res.status(401).json({
        exito: false,
        mensaje: 'Credenciales incorrectas',
      });
    }

    const token = generarToken(usuario);

    res.json({
      exito: true,
      mensaje: 'Inicio de sesión exitoso',
      data: {
        usuario: {
          id: usuario._id,
          nombre: usuario.nombre,
          email: usuario.email,
          rol: usuario.rol,
        },
        token,
      },
    });
  } catch (error) {
    console.error('Error en login:', error);
    res.status(500).json({
      exito: false,
      mensaje: 'Error interno del servidor',
    });
  }
};

const getPerfil = async (req, res) => {
  try {
    
    const usuario = await User.findById(req.usuario.id);

    if (!usuario) {
      return res.status(404).json({
        exito: false,
        mensaje: 'Usuario no encontrado',
      });
    }

    res.json({
      exito: true,
      data: {
        usuario: {
          id: usuario._id,
          nombre: usuario.nombre,
          email: usuario.email,
          rol: usuario.rol,
        },
      },
    });
  } catch (error) {
    console.error('Error en getPerfil:', error);
    res.status(500).json({
      exito: false,
      mensaje: 'Error interno del servidor',
    });
  }
};

module.exports = { register, login, getPerfil };
