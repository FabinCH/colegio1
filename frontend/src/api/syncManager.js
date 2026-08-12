// ============================================
// api/syncManager.js — Sincronización automática
// ============================================

import API from './axiosConfig';
import {
  obtenerColaPendiente,
  eliminarDeLaCola,
  actualizarEstadoCola,
  guardarAsistenciaCache,
  guardarEvaluacionCache,
  guardarAsistenciaTemporal,
  guardarEvaluacionTemporal,
  actualizarEvaluacionCache,
  agregarALaCola,
} from './offlineDB';

let syncing = false;
const listeners = new Set();

// ─── Listeners de estado ─────────────────────────────────────────────────────
export function onSyncChange(callback) {
  listeners.add(callback);
  return () => listeners.delete(callback);
}

function notificar(payload) {
  listeners.forEach((cb) => cb(payload));
}

// ─── Extraer el documento real de la respuesta del backend ───────────────────
// El backend devuelve { exito: true, data: {...} } o { exito: true, data: [{...}] }
// Necesitamos el documento real, no el envelope completo
function extraerDocumento(responseData) {
  if (!responseData) return null;
  // Si tiene la forma { exito, data } → extraer data
  if (responseData.exito !== undefined && responseData.data !== undefined) {
    return responseData.data;
  }
  // Si ya es el documento directamente
  return responseData;
}

// ─── Procesar la cola de sincronización ──────────────────────────────────────
export async function procesarCola() {
  if (syncing || !navigator.onLine) return;

  const pendientes = await obtenerColaPendiente();
  if (pendientes.length === 0) return;

  syncing = true;
  notificar({ estado: 'sincronizando', total: pendientes.length, procesados: 0 });

  let procesados = 0;
  let errores = 0;

  for (const item of pendientes) {
    try {
      await actualizarEstadoCola(item.id, 'sincronizando', item.intentos + 1);

      let response;
      if      (item.metodo === 'POST')   response = await API.post(item.url, item.datos);
      else if (item.metodo === 'PUT')    response = await API.put(item.url, item.datos);
      else if (item.metodo === 'DELETE') response = await API.delete(item.url);

      // Guardar el documento real en caché (no el envelope)
      if (response?.data) {
        const doc = extraerDocumento(response.data);
        if (doc) {
          if (item.tipo === 'asistencia') {
            // Si el doc es array guardar cada uno, si es objeto guardar solo ese
            const lista = Array.isArray(doc) ? doc : [doc];
            await guardarAsistenciaCache(lista);
          } else if (item.tipo === 'evaluacion') {
            const lista = Array.isArray(doc) ? doc : [doc];
            await guardarEvaluacionCache(lista);
          }
        }
      }

      // Eliminar de la cola
      await eliminarDeLaCola(item.id);
      procesados++;
      notificar({ estado: 'sincronizando', total: pendientes.length, procesados });

    } catch (error) {
      errores++;
      const maxIntentos = 3;
      if (item.intentos + 1 >= maxIntentos) {
        await actualizarEstadoCola(item.id, 'error', item.intentos + 1);
        console.error(`[Sync] Item ${item.id} falló ${maxIntentos} veces.`, error.message);
      } else {
        await actualizarEstadoCola(item.id, 'pendiente', item.intentos + 1);
      }
    }
  }

  syncing = false;

  // Notificar con flag para que las páginas sepan que deben re-cargar datos
  if (errores === 0) {
    notificar({ estado: 'completado', procesados, debeRecargar: true });
  } else {
    notificar({ estado: 'parcial', procesados, errores, debeRecargar: procesados > 0 });
  }
}

// ─── Inicializar listeners del navegador ──────────────────────────────────────
let syncInitialized = false;

export function iniciarSyncManager() {
  if (syncInitialized) return; // evitar duplicados
  syncInitialized = true;

  window.addEventListener('online', () => {
    console.log('[Sync] Conexión recuperada. Procesando cola...');
    notificar({ estado: 'conectado' });
    // Esperar 2s para que la conexión estabilice
    setTimeout(procesarCola, 2000);
  });

  window.addEventListener('offline', () => {
    notificar({ estado: 'desconectado' });
  });

  // Si ya hay conexión al arrancar, procesar cola en 4s (dar tiempo a que cargue la app)
  if (navigator.onLine) {
    setTimeout(procesarCola, 4000);
  }
}

// ─── Helper: Registrar asistencia con fallback offline ───────────────────────
export async function registrarAsistenciaConOffline(datos) {
  if (navigator.onLine) {
    try {
      const response = await API.post('/asistencia', datos);
      // Extraer el documento real y guardarlo en caché
      const doc = extraerDocumento(response.data);
      if (doc) await guardarAsistenciaCache(Array.isArray(doc) ? doc : [doc]);
      return { data: doc || response.data, offline: false };
    } catch (error) {
      console.warn('[Sync] Error al guardar asistencia en servidor:', error.message);
    }
  }

  // Sin internet o error de red → guardar offline
  const temporal = await guardarAsistenciaTemporal(datos);
  await agregarALaCola('asistencia', 'POST', '/asistencia', datos, temporal._id);
  return { data: temporal, offline: true };
}

// ─── Helper: Registrar evaluaciones en lote con fallback offline ──────────────
export async function registrarEvaluacionesConOffline(evaluaciones) {
  if (navigator.onLine) {
    try {
      const response = await API.post('/evaluaciones/lote', evaluaciones);
      const doc = extraerDocumento(response.data);
      if (doc) await guardarEvaluacionCache(Array.isArray(doc) ? doc : [doc]);
      return { data: doc || response.data, offline: false };
    } catch (error) {
      console.warn('[Sync] Error al guardar evaluaciones:', error.message);
    }
  }

  const temporales = [];
  for (const ev of evaluaciones) {
    const temporal = await guardarEvaluacionTemporal(ev);
    await agregarALaCola('evaluacion', 'POST', '/evaluaciones', ev, temporal._id);
    temporales.push(temporal);
  }
  return { data: temporales, offline: true };
}

// ─── Helper: Actualizar evaluación con fallback offline ───────────────────────
export async function actualizarEvaluacionConOffline(id, datos) {
  if (navigator.onLine) {
    try {
      const response = await API.put(`/evaluaciones/${id}`, datos);
      const doc = extraerDocumento(response.data);
      if (doc) await guardarEvaluacionCache(Array.isArray(doc) ? doc : [doc]);
      return { data: doc || response.data, offline: false };
    } catch (error) {
      console.warn('[Sync] Error al actualizar evaluación:', error.message);
    }
  }

  const updated = await actualizarEvaluacionCache(id, datos);
  await agregarALaCola('evaluacion', 'PUT', `/evaluaciones/${id}`, datos);
  return { data: { ...updated, ...datos, _offline: true }, offline: true };
}
