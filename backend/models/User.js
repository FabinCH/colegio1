// ============================================
// models/User.js — Modelo de Usuario
// ============================================
//
// ¿QUÉ HACE ESTE ARCHIVO?
// Define la ESTRUCTURA de un usuario en la base de datos.
// Es como crear una "plantilla" que dice: "cada usuario debe tener
// nombre, email, password y un rol".
//
// ¿QUÉ ES UN MODELO (EN MVC)?
// En la arquitectura MVC, el MODELO es la capa que habla con la base de datos.
// Mongoose nos permite definir un "Schema" (esquema) que es como un plano
// arquitectónico: dice qué campos tiene cada documento y qué tipo de dato es.
//
// ¿QUÉ ES BCRYPT?
// Es una librería que "hashea" (encripta) las contraseñas.
// NUNCA guardamos contraseñas en texto plano en la base de datos.
// bcrypt convierte "miPassword123" → "$2a$10$xYz..." (irreversible).

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// --- DEFINIR EL ESQUEMA ---
// Un esquema en Mongoose es como decir:
// "Cada usuario que se guarde en MongoDB DEBE tener estos campos"
const userSchema = new mongoose.Schema(
  {
    nombre: {
      type: String,
      required: [true, 'El nombre es obligatorio'],
      trim: true, // Elimina espacios al inicio/final automáticamente
    },
    email: {
      type: String,
      required: [true, 'El email es obligatorio'],
      unique: true, // No puede haber dos usuarios con el mismo email
      lowercase: true, // Convierte a minúsculas automáticamente
      trim: true,
      match: [
        /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
        'Por favor ingresa un email válido',
      ],
    },
    password: {
      type: String,
      required: [true, 'La contraseña es obligatoria'],
      minlength: [6, 'La contraseña debe tener al menos 6 caracteres'],
      select: false, // ← MUY IMPORTANTE: cuando hagamos User.find(), NO incluirá
      //                  el password en los resultados. Es por seguridad.
    },
    rol: {
      type: String,
      enum: {
        values: ['admin', 'director', 'docente'],
        message: 'El rol debe ser: admin, director o docente',
      },
      default: 'docente', // Si no especifican rol, será docente
    },
  },
  {
    // timestamps: true → Mongoose agrega automáticamente:
    //   - createdAt: fecha de creación
    //   - updatedAt: fecha de última modificación
    timestamps: true,
  }
);

// --- MIDDLEWARE "PRE-SAVE" ---
// ¿Qué es esto? Es código que se ejecuta ANTES de guardar el usuario.
// Cada vez que alguien haga user.save(), PRIMERO se ejecuta esta función.
//
// ¿Para qué? Para hashear (encriptar) la contraseña automáticamente.
// Así no tenemos que acordarnos de hacerlo manualmente en el controller.
userSchema.pre('save', async function () {
  // Si la contraseña NO fue modificada, no la hasheamos de nuevo.
  // Esto es útil cuando actualizamos otros campos (como el nombre)
  // sin cambiar la contraseña.
  if (!this.isModified('password')) {
    return;
  }

  // Generar un "salt" (sal) → es un valor aleatorio que se mezcla
  // con la contraseña para hacer el hash único. El 12 es la "fuerza"
  // del hash (más alto = más seguro pero más lento).
  const salt = await bcrypt.genSalt(12);

  // Hashear la contraseña con el salt
  this.password = await bcrypt.hash(this.password, salt);
});

// --- MÉTODO PARA COMPARAR CONTRASEÑAS ---
// Este método se usa en el login: el usuario envía su contraseña en texto
// plano, y la comparamos con la versión hasheada en la base de datos.
//
// ¿Cómo funciona? bcrypt.compare() hashea la contraseña ingresada
// y la compara con el hash guardado. Retorna true si coinciden.
userSchema.methods.compararPassword = async function (passwordIngresado) {
  return await bcrypt.compare(passwordIngresado, this.password);
};

// --- CREAR Y EXPORTAR EL MODELO ---
// mongoose.model('User', userSchema) crea el modelo.
// MongoDB creará automáticamente una colección llamada "users" (en minúsculas y plural).
const User = mongoose.model('User', userSchema);

module.exports = User;
