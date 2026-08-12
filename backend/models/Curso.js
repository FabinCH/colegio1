// ============================================
// models/Curso.js — Modelo de Curso/Paralelo
// ============================================
//
// ¿QUÉ HACE ESTE ARCHIVO?
// Define la estructura de un CURSO (grado + paralelo) en la base de datos.
// Ejemplo: "4to A" del turno "mañana", gestión 2026.
//
// ¿QUÉ ES UN PARALELO?
// En Bolivia, cada grado puede tener varios paralelos: A, B, C, etc.
// Cada paralelo tiene un docente y una lista de estudiantes diferente.

const mongoose = require('mongoose');

const cursoSchema = new mongoose.Schema(
  {
    grado: {
      type: String,
      required: [true, 'El grado es obligatorio'],
      trim: true,
      // Ejemplos: "1ro", "2do", "3ro", "4to", "5to", "6to"
    },
    paralelo: {
      type: String,
      required: [true, 'El paralelo es obligatorio'],
      trim: true,
      uppercase: true, // Convierte a mayúscula automáticamente: "a" → "A"
    },
    nivel: {
      type: String,
      enum: {
        values: ['inicial', 'primaria', 'secundaria'],
        message: 'El nivel debe ser: inicial, primaria o secundaria',
      },
      required: [true, 'El nivel es obligatorio'],
    },
    turno: {
      type: String,
      enum: {
        values: ['mañana', 'tarde', 'noche'],
        message: 'El turno debe ser: mañana, tarde o noche',
      },
      default: 'mañana',
    },
    gestion: {
      type: Number,
      required: [true, 'La gestión (año) es obligatoria'],
      default: new Date().getFullYear(),
    },

    // Referencia al docente responsable de este curso
    docente: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },

    // Lista de estudiantes inscritos en este curso
    // Es un arreglo de referencias → cada elemento apunta a un Student
    estudiantes: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Student',
      },
    ],
  },
  {
    timestamps: true,
  }
);

// Índice único: no puede haber dos cursos con el mismo grado+paralelo+gestión+turno
cursoSchema.index(
  { grado: 1, paralelo: 1, gestion: 1, turno: 1 },
  { unique: true }
);

const Curso = mongoose.model('Curso', cursoSchema);

module.exports = Curso;
