// ============================================
// models/Evaluacion.js — Modelo de Evaluación Trimestral
// ============================================
//
// ¿QUÉ HACE ESTE ARCHIVO?
// Define cómo se guardan las NOTAS trimestrales de cada estudiante.
//
// ESCALA DE EVALUACIÓN (RM 01/2026):
//   Ser             → máx 10 puntos (actitudes, valores)
//   Saber           → máx 45 puntos (conocimiento teórico)
//   Hacer           → máx 40 puntos (práctica, aplicación)
//   Autoevaluación  → máx  5 puntos (el estudiante se autoevalúa)
//   TOTAL           →    100 puntos

const mongoose = require('mongoose');

const evaluacionSchema = new mongoose.Schema(
  {
    cuaderno: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'CuadernoPedagogico',
      required: [true, 'El cuaderno pedagógico es obligatorio'],
    },
    trimestre: {
      type: Number,
      required: [true, 'El trimestre es obligatorio'],
      enum: {
        values: [1, 2, 3],
        message: 'El trimestre debe ser 1, 2 o 3',
      },
    },
    estudiante: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Student',
      required: [true, 'El estudiante es obligatorio'],
    },

    // --- LAS 4 DIMENSIONES DE EVALUACIÓN ---
    ser: {
      type: Number,
      min: [0, 'Ser no puede ser menor a 0'],
      max: [10, 'Ser no puede ser mayor a 10'],
      default: 0,
    },
    saber: {
      type: Number,
      min: [0, 'Saber no puede ser menor a 0'],
      max: [45, 'Saber no puede ser mayor a 45'],
      default: 0,
    },
    hacer: {
      type: Number,
      min: [0, 'Hacer no puede ser menor a 0'],
      max: [40, 'Hacer no puede ser mayor a 40'],
      default: 0,
    },
    autoevaluacion: {
      type: Number,
      min: [0, 'Autoevaluación no puede ser menor a 0'],
      max: [5, 'Autoevaluación no puede ser mayor a 5'],
      default: 0,
    },

    // Total calculado automáticamente
    total: {
      type: Number,
      default: 0,
    },

    // Observaciones opcionales del docente
    observaciones: {
      type: String,
      trim: true,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

// --- MIDDLEWARE PRE-SAVE: Calcular total automáticamente ---
// Cada vez que se guarde una evaluación, el total se calcula
// sumando las 4 dimensiones. El docente NO necesita calcularlo manualmente.
evaluacionSchema.pre('save', function () {
  this.total = this.ser + this.saber + this.hacer + this.autoevaluacion;
});

// También recalcular al actualizar con findOneAndUpdate
evaluacionSchema.pre('findOneAndUpdate', function () {
  const update = this.getUpdate();
  if (update.ser !== undefined || update.saber !== undefined ||
      update.hacer !== undefined || update.autoevaluacion !== undefined) {
    // Necesitamos saber los valores actuales + los nuevos
    const ser = update.ser !== undefined ? update.ser : 0;
    const saber = update.saber !== undefined ? update.saber : 0;
    const hacer = update.hacer !== undefined ? update.hacer : 0;
    const auto = update.autoevaluacion !== undefined ? update.autoevaluacion : 0;
    update.total = ser + saber + hacer + auto;
  }
});

// Índice: un estudiante solo puede tener una evaluación por trimestre y cuaderno
evaluacionSchema.index(
  { cuaderno: 1, trimestre: 1, estudiante: 1 },
  { unique: true }
);

const Evaluacion = mongoose.model('Evaluacion', evaluacionSchema);

module.exports = Evaluacion;
