// ============================================
// models/Student.js — Modelo de Estudiante
// ============================================
//
// ¿QUÉ HACE ESTE ARCHIVO?
// Define la estructura de un ESTUDIANTE en la base de datos.
// Incluye todos los datos de filiación requeridos por la RM 01/2026:
// - Datos personales del estudiante
// - Datos del apoderado (tutor legal)
//
// El código RUDE (Registro Único de Estudiante) es un identificador
// único asignado a cada estudiante en Bolivia.

const mongoose = require('mongoose');

const studentSchema = new mongoose.Schema(
  {
    // --- DATOS PERSONALES DEL ESTUDIANTE ---
    nombres: {
      type: String,
      required: [true, 'Los nombres son obligatorios'],
      trim: true,
    },
    apellidos: {
      type: String,
      required: [true, 'Los apellidos son obligatorios'],
      trim: true,
    },
    rude: {
      type: String,
      required: [true, 'El código RUDE es obligatorio'],
      unique: true,
      trim: true,
    },
    ci: {
      type: String,
      trim: true,
      default: '',
    },
    fechaNacimiento: {
      type: Date,
    },
    lugarNacimiento: {
      type: String,
      trim: true,
      default: '',
    },
    direccion: {
      type: String,
      trim: true,
      default: '',
    },
    sexo: {
      type: String,
      enum: {
        values: ['M', 'F'],
        message: 'El sexo debe ser M (masculino) o F (femenino)',
      },
    },

    // --- DATOS DEL APODERADO (subdocumento) ---
    // En Mongoose, podemos anidar objetos para agrupar datos relacionados.
    // Esto es como tener una "mini-tabla" dentro de la tabla del estudiante.
    apoderado: {
      nombreCompleto: {
        type: String,
        trim: true,
        default: '',
      },
      ci: {
        type: String,
        trim: true,
        default: '',
      },
      telefono: {
        type: String,
        trim: true,
        default: '',
      },
      parentesco: {
        type: String,
        trim: true,
        default: '',
      },
    },

    // --- CAMPO DE CONTROL ---
    // Referencia al usuario (docente) que registró al estudiante
    registradoPor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    // Referencia al curso en el que está matriculado
    curso: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Curso',
    },
  },
  {
    timestamps: true,
  }
);

// Índice compuesto para búsquedas rápidas por nombre
studentSchema.index({ apellidos: 1, nombres: 1 });

const Student = mongoose.model('Student', studentSchema);

module.exports = Student;
