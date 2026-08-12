// ============================================
// models/Notificacion.js — Modelo de Notificación
// ============================================
//
// Guarda las notificaciones que se envían al director.
// Tipos de notificaciones:
//   - alerta_asistencia  → muchas inasistencias detectadas
//   - alerta_prediccion  → estudiante en riesgo de reprobación
//   - nuevo_cuaderno     → docente subió cuaderno pedagógico
//   - alerta_evaluacion  → calificaciones bajas masivas
//   - sistema            → mensajes generales del sistema

const mongoose = require('mongoose');

const notificacionSchema = new mongoose.Schema(
  {
    // Destinatario (normalmente el director o admin)
    destinatario: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },

    // Quién la generó (puede ser un docente, el sistema, etc.)
    remitente: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },

    tipo: {
      type: String,
      enum: [
        'alerta_asistencia',
        'alerta_prediccion',
        'nuevo_cuaderno',
        'alerta_evaluacion',
        'sistema',
        'info',
      ],
      default: 'sistema',
    },

    titulo: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },

    mensaje: {
      type: String,
      required: true,
      trim: true,
      maxlength: 500,
    },

    // Datos extra (estudiante, curso, materia, etc.)
    datos: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },

    // Estado de lectura
    leida: {
      type: Boolean,
      default: false,
    },

    // Prioridad visual
    prioridad: {
      type: String,
      enum: ['baja', 'media', 'alta', 'critica'],
      default: 'media',
    },
  },
  {
    timestamps: true,
  }
);

// Índices para búsquedas rápidas
notificacionSchema.index({ destinatario: 1, leida: 1, createdAt: -1 });
notificacionSchema.index({ destinatario: 1, createdAt: -1 });

const Notificacion = mongoose.model('Notificacion', notificacionSchema);
module.exports = Notificacion;
