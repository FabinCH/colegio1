// ============================================
// models/Materia.js — Modelo de Materia/Asignatura
// ============================================
//
// ¿QUÉ HACE ESTE ARCHIVO?
// Define la estructura de una MATERIA (asignatura) en la base de datos.
// Ejemplo: "Matemáticas" del área "Ciencia, Tecnología y Producción"
// para el nivel "secundaria", grado "4to".

const mongoose = require('mongoose');

const materiaSchema = new mongoose.Schema(
  {
    nombre: {
      type: String,
      required: [true, 'El nombre de la materia es obligatorio'],
      trim: true,
    },
    area: {
      type: String,
      trim: true,
      default: '',
      // Áreas según el currículo boliviano:
      // - Cosmos y Pensamiento
      // - Comunidad y Sociedad
      // - Vida, Tierra y Territorio
      // - Ciencia, Tecnología y Producción
    },
    nivel: {
      type: String,
      enum: {
        values: ['inicial', 'primaria', 'secundaria'],
        message: 'El nivel debe ser: inicial, primaria o secundaria',
      },
      required: [true, 'El nivel es obligatorio'],
    },
    grado: {
      type: String,
      required: [true, 'El grado es obligatorio'],
      trim: true,
      // Ejemplos: "1ro", "2do", "3ro", "4to", "5to", "6to"
    },
    // Docente asignado a esta materia (opcional, asignado por el admin)
    docenteAsignado: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Índice para evitar materias duplicadas en el mismo nivel y grado
materiaSchema.index({ nombre: 1, nivel: 1, grado: 1 }, { unique: true });

const Materia = mongoose.model('Materia', materiaSchema);

module.exports = Materia;
