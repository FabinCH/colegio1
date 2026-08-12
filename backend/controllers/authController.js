// ============================================
// controllers/authController.js — Lógica de Autenticación
// ============================================
//
// ¿QUÉ HACE ESTE ARCHIVO?
// Contiene las FUNCIONES que manejan el registro y login de usuarios.
// En MVC, el CONTROLLER es el "cerebro" — recibe la petición del usuario,
// procesa la lógica y envía la respuesta.
//
// ¿QUÉ ES JWT?
// JSON Web Token — Es como un "pase digital" que el servidor le da al usuario
// cuando hace login. Cada vez que el usuario quiere acceder a algo protegido,
// envía ese token como prueba de que ya inició sesión.
//
// El token contiene: { id del usuario, rol } + una firma secreta.
// Es como una credencial con foto: si alguien la altera, la firma no coincide.

const jwt = require('jsonwebtoken');
const User = require('../models/User');

// --- FUNCIÓN AUXILIAR: Generar Token JWT ---
// Creamos esta función aparte para no repetir código en register y login.
const generarToken = (usuario) => {
  return jwt.sign(
    // Payload: datos que se guardan DENTRO del token
    {
      id: usuario._id,
      rol: usuario.rol,
    },
    // Clave secreta para firmar el token (del archivo .env)
    process.env.JWT_SECRET,
    // Opciones: el token expira en 7 días
    { expiresIn: '7d' }
  );
};

// ================================================
// REGISTRAR un nuevo usuario
// ================================================
// Ruta: POST /api/auth/register
// Body esperado: { nombre, email, password, rol }
//
// Flujo:
//   1. Recibir datos del body
//   2. Verificar que no exista un usuario con ese email
//   3. Crear el usuario (el password se hashea automáticamente por el middleware pre-save)
//   4. Generar un JWT
//   5. Responder con los datos del usuario + token
const register = async (req, res) => {
  try {
    const { nombre, email, password, rol } = req.body;

    // Paso 1: Verificar que el email no esté ya registrado
    const usuarioExistente = await User.findOne({ email });
    if (usuarioExistente) {
      return res.status(400).json({
        exito: false,
        mensaje: 'Ya existe un usuario con ese email',
      });
    }

    // Paso 2: Crear el usuario en la base de datos
    // El password se hashea automáticamente gracias al middleware pre('save')
    // que definimos en el modelo User.js
    const nuevoUsuario = await User.create({
      nombre,
      email,
      password,
      rol, // Si no envían rol, será 'docente' (el default del schema)
    });

    // Paso 3: Generar el token JWT
    const token = generarToken(nuevoUsuario);

    // Paso 4: Responder con éxito (status 201 = "Created")
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
    // Si Mongoose detecta un error de validación (campo required faltante, etc.)
    if (error.name === 'ValidationError') {
      const mensajes = Object.values(error.errors).map((err) => err.message);
      return res.status(400).json({
        exito: false,
        mensaje: 'Error de validación',
        errores: mensajes,
      });
    }

    // Para cualquier otro error inesperado
    console.error('Error en register:', error);
    res.status(500).json({
      exito: false,
      mensaje: 'Error interno del servidor',
    });
  }
};

// ================================================
// INICIAR SESIÓN (Login)
// ================================================
// Ruta: POST /api/auth/login
// Body esperado: { email, password }
//
// Flujo:
//   1. Buscar usuario por email
//   2. Comparar la contraseña con el hash guardado
//   3. Si coincide, generar JWT y responder
//   4. Si no, enviar error 401 (no autorizado)
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validar que enviaron ambos campos
    if (!email || !password) {
      return res.status(400).json({
        exito: false,
        mensaje: 'Email y contraseña son obligatorios',
      });
    }

    // Paso 1: Buscar al usuario por email
    // Usamos .select('+password') porque en el modelo pusimos select: false
    // para que el password no se incluya por defecto. Aquí SÍ lo necesitamos
    // para poder comparar.
    const usuario = await User.findOne({ email }).select('+password');

    // Si no existe un usuario con ese email
    if (!usuario) {
      return res.status(401).json({
        exito: false,
        mensaje: 'Credenciales incorrectas',
        // Por seguridad, NO decimos "el email no existe" — eso le daría
        // pistas a un atacante. Siempre decimos "credenciales incorrectas".
      });
    }

    // Paso 2: Comparar la contraseña ingresada con el hash guardado
    const passwordCorrecto = await usuario.compararPassword(password);

    if (!passwordCorrecto) {
      return res.status(401).json({
        exito: false,
        mensaje: 'Credenciales incorrectas',
      });
    }

    // Paso 3: Generar token y responder
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

// ================================================
// OBTENER PERFIL del usuario autenticado
// ================================================
// Ruta: GET /api/auth/perfil
// Headers requeridos: Authorization: Bearer <token>
//
// Esta ruta es protegida — solo funciona si el middleware 'protect'
// ya verificó el token y puso req.usuario con los datos del usuario.
const getPerfil = async (req, res) => {
  try {
    // req.usuario fue puesto por el middleware 'protect' en authMiddleware.js
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

// Exportar las funciones para usarlas en las rutas
module.exports = { register, login, getPerfil };
