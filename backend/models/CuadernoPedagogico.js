// ============================================
// models/CuadernoPedagogico.js — Modelo de Carátula del Cuaderno
// ============================================
//
// ¿QUÉ HACE ESTE ARCHIVO?
// Define la estructura de la CARÁTULA del Cuaderno Pedagógico.
// Según la RM 01/2026, cada cuaderno debe tener datos institucionales:
// departamento, distrito educativo, unidad educativa, director, etc.
//
// ¿POR QUÉ ES IMPORTANTE?
// El Cuaderno Pedagógico es el DOCUMENTO CENTRAL del sistema.
// Es como la "carpeta" que agrupa: un docente + un curso + una materia.
// Dentro de este cuaderno se registran las asistencias y evaluaciones.

const mongoose = require('mongoose');

const cuadernoPedagogicoSchema = new mongoose.Schema(
  {
    // --- DATOS INSTITUCIONALES (Carátula) ---
    departamento: {
      type: String,
      required: [true, 'El departamento es obligatorio'],
      trim: true,
    },
    distritoEducativo: {
      type: String,
      required: [true, 'El distrito educativo es obligatorio'],
      trim: true,
    },
    unidadEducativa: {
      type: String,
      required: [true, 'La unidad educativa es obligatoria'],
      trim: true,
    },
    director: {
      type: String,
      trim: true,
      default: '',
    },

    // --- REFERENCIAS A OTROS MODELOS ---
    // Estas son relaciones: conectan el cuaderno con el docente, curso y materia.
    docente: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'El docente es obligatorio'],
    },
    curso: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Curso',
      required: [true, 'El curso es obligatorio'],
    },
    materia: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Materia',
      required: [true, 'La materia es obligatoria'],
    },
    nivel: {
      type: String,
      enum: ['inicial', 'primaria', 'secundaria'],
    },
    gestion: {
      type: Number,
      required: [true, 'La gestión (año) es obligatoria'],
      default: new Date().getFullYear(),
    },
  },
  {
    timestamps: true,
  }
);

// Índice único: un docente no puede tener dos cuadernos para la misma materia+curso+gestión
cuadernoPedagogicoSchema.index(
  { docente: 1, curso: 1, materia: 1, gestion: 1 },
  { unique: true }
);

const CuadernoPedagogico = mongoose.model(
  'CuadernoPedagogico',
  cuadernoPedagogicoSchema
);

module.exports = CuadernoPedagogico;
