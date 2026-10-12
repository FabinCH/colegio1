

const webpush = require('web-push');
const Notificacion = require('../models/Notificacion');
const PushSubscripcion = require('../models/PushSubscripcion');
const User = require('../models/User');

webpush.setVapidDetails(
  process.env.VAPID_EMAIL || 'mailto:admin@cuaderno.edu.bo',
  process.env.VAPID_PUBLIC_KEY,
  process.env.VAPID_PRIVATE_KEY
);

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
    
    const destinatarios = await User.find({
      rol: { $in: soloRoles },
    }).select('_id');

    if (!destinatarios.length) return;

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

    const pushPayload = {
      title: titulo,
      body: mensaje,
      icon: '/icons/icon-192x192.png',
      badge: '/icons/badge-72x72.png',
      data: { tipo, ...datos },
      tag: tipo, 
    };

    for (const u of destinatarios) {
      await enviarPushAUsuario(u._id, pushPayload);
    }
  } catch (error) {
    console.error('Error en crearYEnviarNotificacion:', error.message);
  }
}

const getVapidKey = (req, res) => {
  res.json({
    exito: true,
    data: { publicKey: process.env.VAPID_PUBLIC_KEY },
  });
};

const suscribir = async (req, res) => {
  try {
    const { subscription } = req.body;
    if (!subscription?.endpoint || !subscription?.keys) {
      return res.status(400).json({ exito: false, mensaje: 'Suscripción inválida' });
    }

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
  
  crearYEnviarNotificacion,
};
