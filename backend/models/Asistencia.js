// ============================================
// models/Asistencia.js — Modelo de Asistencia
// ============================================
//
// ¿QUÉ HACE ESTE ARCHIVO?
// Define cómo se guarda la ASISTENCIA diaria en la base de datos.
// Cada registro contiene: qué cuaderno, qué trimestre, qué fecha,
// y un arreglo con el estado de CADA estudiante (A, R, L, F).
//
// VALORES DE ASISTENCIA (RM 01/2026):
//   A = Asiste
//   R = Retraso
//   L = Licencia/Permiso
//   F = Falta

const mongoose = require('mongoose');

const asistenciaSchema = new mongoose.Schema(
  {
    // ¿A qué cuaderno pertenece esta asistencia?
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
    fecha: {
      type: Date,
      required: [true, 'La fecha es obligatoria'],
      default: Date.now,
    },

    // Arreglo de registros: uno por cada estudiante
    registros: [
      {
        estudiante: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Student',
          required: true,
        },
        valor: {
          type: String,
          enum: {
            values: ['A', 'R', 'L', 'F'],
            message: 'El valor debe ser A (Asiste), R (Retraso), L (Licencia) o F (Falta)',
          },
          required: [true, 'El valor de asistencia es obligatorio'],
          default: 'A',
        },
      },
    ],

    // Quién registró la asistencia
    registradoPor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  {
    timestamps: true,
  }
);

// Índice: evitar registrar asistencia duplicada (misma fecha y cuaderno)
asistenciaSchema.index({ cuaderno: 1, fecha: 1 }, { unique: true });

const Asistencia = mongoose.model('Asistencia', asistenciaSchema);

module.exports = Asistencia;
