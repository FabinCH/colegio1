// ============================================
// models/Inscripcion.js — Modelo de Inscripción por Materia
// ============================================
//
// ¿QUÉ HACE ESTE ARCHIVO?
// Registra la inscripción de un estudiante a un cuaderno pedagógico
// (que agrupa: docente + curso + materia + gestión).
//
// Esto permite que cada materia tenga su propia lista de estudiantes
// independiente de la lista general del curso.

const mongoose = require('mongoose');

const inscripcionSchema = new mongoose.Schema(
  {
    // El cuaderno pedagógico (une: docente + curso + materia + gestión)
    cuaderno: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'CuadernoPedagogico',
      required: [true, 'El cuaderno pedagógico es obligatorio'],
    },
    // El estudiante que se inscribe
    estudiante: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Student',
      required: [true, 'El estudiante es obligatorio'],
    },
    // Fecha en que se realizó la inscripción
    fechaInscripcion: {
      type: Date,
      default: Date.now,
    },
    // Quién realizó la inscripción
    registradoPor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  {
    timestamps: true,
  }
);

// Índice único: un estudiante no puede inscribirse dos veces al mismo cuaderno
inscripcionSchema.index({ cuaderno: 1, estudiante: 1 }, { unique: true });

const Inscripcion = mongoose.model('Inscripcion', inscripcionSchema);

module.exports = Inscripcion;
