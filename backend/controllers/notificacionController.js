// ============================================
// controllers/notificacionController.js
// ============================================
//
// Maneja toda la lógica de notificaciones:
//   - Crear notificaciones
//   - Listar notificaciones del director
//   - Marcar como leídas
//   - Enviar push notifications
//   - Gestionar suscripciones push

const webpush = require('web-push');
const Notificacion = require('../models/Notificacion');
const PushSubscripcion = require('../models/PushSubscripcion');
const User = require('../models/User');

// --- Configurar Web Push ---
webpush.setVapidDetails(
  process.env.VAPID_EMAIL || 'mailto:admin@cuaderno.edu.bo',
  process.env.VAPID_PUBLIC_KEY,
  process.env.VAPID_PRIVATE_KEY
);

// ─────────────────────────────────────────────────────────────
// HELPER: Enviar push a todos los dispositivos de un usuario
// ─────────────────────────────────────────────────────────────
async function enviarPushAUsuario(usuarioId, payload) {
  try {
    const suscripciones = await PushSubscripcion.find({ usuario: usuarioId });
    if (!suscripciones.length) return;

    const promesas = suscripciones.map(async (sub) => {
      const pushSub = {
        endpoint: sub.endpoint,
        keys: {
          p256dh: sub.keys.p256dh,
          auth: sub.keys.auth,
        },
      };
      try {
        await webpush.sendNotification(pushSub, JSON.stringify(payload));
      } catch (err) {
        // Si el endpoint ya no es válido (expiró), lo eliminamos
        if (err.statusCode === 410 || err.statusCode === 404) {
          await PushSubscripcion.deleteOne({ _id: sub._id });
          console.log('Suscripción push expirada eliminada:', sub.endpoint);
        } else {
          console.error('Error enviando push:', err.message);
        }
      }
    });

    await Promise.allSettled(promesas);
  } catch (error) {
    console.error('Error en enviarPushAUsuario:', error.message);
  }
}

// ─────────────────────────────────────────────────────────────
// HELPER EXPORTADO: Crear notificación + enviar push
// Usado desde otros controllers (asistencia, evaluacion, etc.)
// ─────────────────────────────────────────────────────────────
async function crearYEnviarNotificacion({
  tipo = 'sistema',
  titulo,
  mensaje,
  datos = {},
  prioridad = 'media',
  remitente = null,
  soloRoles = ['director', 'admin'],
}) {
  try {
    // Buscar todos los directores y admins
    const destinatarios = await User.find({
      rol: { $in: soloRoles },
    }).select('_id');

    if (!destinatarios.length) return;

    // Crear notificación en BD para cada uno
    const notificaciones = destinatarios.map((u) => ({
      destinatario: u._id,
      remitente,
      tipo,
      titulo,
      mensaje,
      datos,
      prioridad,
    }));

    await Notificacion.insertMany(notificaciones);

    // Enviar push a cada destinatario
    const pushPayload = {
      title: titulo,
      body: mensaje,
      icon: '/icons/icon-192x192.png',
      badge: '/icons/badge-72x72.png',
      data: { tipo, ...datos },
      tag: tipo, // agrupa notificaciones del mismo tipo
    };

    for (const u of destinatarios) {
      await enviarPushAUsuario(u._id, pushPayload);
    }
  } catch (error) {
    console.error('Error en crearYEnviarNotificacion:', error.message);
  }
}

// ─────────────────────────────────────────────────────────────
// GET /api/notificaciones/vapid-key
// Retorna la clave pública VAPID para que el frontend la use
// ─────────────────────────────────────────────────────────────
const getVapidKey = (req, res) => {
  res.json({
    exito: true,
    data: { publicKey: process.env.VAPID_PUBLIC_KEY },
  });
};

// ─────────────────────────────────────────────────────────────
// POST /api/notificaciones/suscribir
// El frontend envía su suscripción push para guardarla
// ─────────────────────────────────────────────────────────────
const suscribir = async (req, res) => {
  try {
    const { subscription } = req.body;
    if (!subscription?.endpoint || !subscription?.keys) {
      return res.status(400).json({ exito: false, mensaje: 'Suscripción inválida' });
    }

    // Upsert: si ya existe el endpoint, actualiza; si no, crea
    await PushSubscripcion.findOneAndUpdate(
      { endpoint: subscription.endpoint },
      {
        usuario: req.usuario.id,
        endpoint: subscription.endpoint,
        keys: subscription.keys,
        userAgent: req.headers['user-agent'] || '',
      },
      { upsert: true, new: true }
    );

    res.json({ exito: true, mensaje: 'Suscripción push guardada' });
  } catch (error) {
    console.error('Error al suscribir:', error.message);
    res.status(500).json({ exito: false, mensaje: 'Error al guardar la suscripción' });
  }
};

// ─────────────────────────────────────────────────────────────
// DELETE /api/notificaciones/desuscribir
// Elimina la suscripción push del dispositivo
// ─────────────────────────────────────────────────────────────
const desuscribir = async (req, res) => {
  try {
    const { endpoint } = req.body;
    if (!endpoint) {
      return res.status(400).json({ exito: false, mensaje: 'Endpoint requerido' });
    }

    await PushSubscripcion.deleteOne({
      endpoint,
      usuario: req.usuario.id,
    });

    res.json({ exito: true, mensaje: 'Suscripción eliminada' });
  } catch (error) {
    console.error('Error al desuscribir:', error.message);
    res.status(500).json({ exito: false, mensaje: 'Error al eliminar la suscripción' });
  }
};

// ─────────────────────────────────────────────────────────────
// GET /api/notificaciones
// Lista las notificaciones del director autenticado
// ─────────────────────────────────────────────────────────────
const listar = async (req, res) => {
  try {
    const { pagina = 1, limite = 20, soloNoLeidas } = req.query;
    const skip = (Number(pagina) - 1) * Number(limite);

    const filtro = { destinatario: req.usuario.id };
    if (soloNoLeidas === 'true') filtro.leida = false;

    const [notificaciones, total] = await Promise.all([
      Notificacion.find(filtro)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limite))
        .populate('remitente', 'nombre rol'),
      Notificacion.countDocuments(filtro),
    ]);

    const noLeidas = await Notificacion.countDocuments({
      destinatario: req.usuario.id,
      leida: false,
    });

    res.json({
      exito: true,
      data: { notificaciones, total, noLeidas, pagina: Number(pagina) },
    });
  } catch (error) {
    console.error('Error al listar notificaciones:', error.message);
    res.status(500).json({ exito: false, mensaje: 'Error al obtener notificaciones' });
  }
};

// ─────────────────────────────────────────────────────────────
// GET /api/notificaciones/conteo
// Solo retorna el número de notificaciones no leídas (para el badge)
// ─────────────────────────────────────────────────────────────
const conteoNoLeidas = async (req, res) => {
  try {
    const count = await Notificacion.countDocuments({
      destinatario: req.usuario.id,
      leida: false,
    });
    res.json({ exito: true, data: { noLeidas: count } });
  } catch (error) {
    res.status(500).json({ exito: false, mensaje: 'Error al contar notificaciones' });
  }
};

// ─────────────────────────────────────────────────────────────
// PATCH /api/notificaciones/:id/leer
// Marca una notificación como leída
// ─────────────────────────────────────────────────────────────
const marcarLeida = async (req, res) => {
  try {
    const notif = await Notificacion.findOneAndUpdate(
      { _id: req.params.id, destinatario: req.usuario.id },
      { leida: true },
      { new: true }
    );

    if (!notif) {
      return res.status(404).json({ exito: false, mensaje: 'Notificación no encontrada' });
    }

    res.json({ exito: true, data: { notificacion: notif } });
  } catch (error) {
    res.status(500).json({ exito: false, mensaje: 'Error al marcar la notificación' });
  }
};

// ─────────────────────────────────────────────────────────────
// PATCH /api/notificaciones/leer-todas
// Marca TODAS las notificaciones del usuario como leídas
// ─────────────────────────────────────────────────────────────
const marcarTodasLeidas = async (req, res) => {
  try {
    await Notificacion.updateMany(
      { destinatario: req.usuario.id, leida: false },
      { leida: true }
    );

    res.json({ exito: true, mensaje: 'Todas las notificaciones marcadas como leídas' });
  } catch (error) {
    res.status(500).json({ exito: false, mensaje: 'Error al actualizar notificaciones' });
  }
};

// ─────────────────────────────────────────────────────────────
// DELETE /api/notificaciones/:id
// Elimina una notificación
// ─────────────────────────────────────────────────────────────
const eliminar = async (req, res) => {
  try {
    const notif = await Notificacion.findOneAndDelete({
      _id: req.params.id,
      destinatario: req.usuario.id,
    });

    if (!notif) {
      return res.status(404).json({ exito: false, mensaje: 'Notificación no encontrada' });
    }

    res.json({ exito: true, mensaje: 'Notificación eliminada' });
  } catch (error) {
    res.status(500).json({ exito: false, mensaje: 'Error al eliminar la notificación' });
  }
};

// ─────────────────────────────────────────────────────────────
// POST /api/notificaciones/enviar-prueba
// Envía una notificación de prueba (solo admin)
// ─────────────────────────────────────────────────────────────
const enviarPrueba = async (req, res) => {
  try {
    await crearYEnviarNotificacion({
      tipo: 'sistema',
      titulo: '🔔 Notificaciones Activas',
      mensaje: 'Las notificaciones push están funcionando correctamente en el sistema.',
      prioridad: 'baja',
      remitente: req.usuario.id,
    });

    res.json({ exito: true, mensaje: 'Notificación de prueba enviada a directores' });
  } catch (error) {
    console.error('Error al enviar prueba:', error.message);
    res.status(500).json({ exito: false, mensaje: 'Error al enviar notificación de prueba' });
  }
};

module.exports = {
  getVapidKey,
  suscribir,
  desuscribir,
  listar,
  conteoNoLeidas,
  marcarLeida,
  marcarTodasLeidas,
  eliminar,
  enviarPrueba,
  // Helper para usar desde otros controllers
  crearYEnviarNotificacion,
};
