// ============================================
// models/PushSubscripcion.js — Suscripciones Push
// ============================================
//
// Guarda las suscripciones push de cada navegador/dispositivo.
// Cuando el director acepta recibir notificaciones, el navegador
// genera un objeto de suscripción único. Lo guardamos aquí para
// poder enviar notificaciones push en cualquier momento.

const mongoose = require('mongoose');

const pushSubscripcionSchema = new mongoose.Schema(
  {
    usuario: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },

    // El objeto de suscripción que devuelve el navegador
    // Contiene: endpoint, keys.p256dh, keys.auth
    endpoint: {
      type: String,
      required: true,
    },

    keys: {
      p256dh: { type: String, required: true },
      auth:   { type: String, required: true },
    },

    // Info del dispositivo (opcional, para gestión)
    userAgent: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

// Un usuario puede tener múltiples suscripciones (varios dispositivos)
// pero cada endpoint debe ser único
pushSubscripcionSchema.index({ endpoint: 1 }, { unique: true });
pushSubscripcionSchema.index({ usuario: 1 });

const PushSubscripcion = mongoose.model('PushSubscripcion', pushSubscripcionSchema);
module.exports = PushSubscripcion;
