// ============================================
// api/offlineDB.js — Base de datos local (IndexedDB)
// ============================================
//
// ¿QUÉ HACE ESTE ARCHIVO?
// Maneja el almacenamiento LOCAL en el navegador usando IndexedDB.
// Permite guardar asistencia y evaluaciones aunque no haya internet.
//
// STORES (tablas):
//   - asistencia_cache   → copia local de asistencias consultadas
//   - evaluacion_cache   → copia local de evaluaciones consultadas
//   - sync_queue         → operaciones pendientes de sincronizar con el servidor

const DB_NAME = 'colegio_offline_db';
const DB_VERSION = 1;

let db = null;

// ─── Abrir / inicializar la base de datos ───────────────────────────────────
export function openDB() {
  return new Promise((resolve, reject) => {
    if (db) return resolve(db);

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const database = event.target.result;

      // Store: caché de asistencia (por cuaderno+trimestre+fecha)
      if (!database.objectStoreNames.contains('asistencia_cache')) {
        const store = database.createObjectStore('asistencia_cache', { keyPath: '_id' });
        store.createIndex('cuaderno', 'cuaderno', { unique: false });
        store.createIndex('cuaderno_trimestre', ['cuaderno', 'trimestre'], { unique: false });
        store.createIndex('fecha', 'fecha', { unique: false });
      }

      // Store: caché de evaluaciones (por cuaderno+trimestre+estudiante)
      if (!database.objectStoreNames.contains('evaluacion_cache')) {
        const store = database.createObjectStore('evaluacion_cache', { keyPath: '_id' });
        store.createIndex('cuaderno', 'cuaderno', { unique: false });
        store.createIndex('cuaderno_trimestre', ['cuaderno', 'trimestre'], { unique: false });
        store.createIndex('estudiante', 'estudiante', { unique: false });
      }

      // Store: cola de sincronización (operaciones pendientes)
      if (!database.objectStoreNames.contains('sync_queue')) {
        const store = database.createObjectStore('sync_queue', {
          keyPath: 'id',
          autoIncrement: true,
        });
        store.createIndex('tipo', 'tipo', { unique: false });
        store.createIndex('estado', 'estado', { unique: false });
        store.createIndex('timestamp', 'timestamp', { unique: false });
      }
    };

    request.onsuccess = (event) => {
      db = event.target.result;
      resolve(db);
    };

    request.onerror = () => reject(request.error);
  });
}

// ─── Helper genérico: transacción de escritura ──────────────────────────────
async function withStore(storeName, mode, callback) {
  const database = await openDB();
  return new Promise((resolve, reject) => {
    const tx = database.transaction(storeName, mode);
    const store = tx.objectStore(storeName);
    const result = callback(store);
    if (result && typeof result.onsuccess === 'undefined') {
      // es una promesa o valor directo
      tx.oncomplete = () => resolve(result);
      tx.onerror = () => reject(tx.error);
    } else if (result) {
      result.onsuccess = () => resolve(result.result);
      result.onerror = () => reject(result.error);
    } else {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    }
  });
}

// ─── ASISTENCIA CACHE ────────────────────────────────────────────────────────

/** Guarda una lista de asistencias en caché local */
export async function guardarAsistenciaCache(asistencias) {
  const database = await openDB();
  return new Promise((resolve, reject) => {
    const tx = database.transaction('asistencia_cache', 'readwrite');
    const store = tx.objectStore('asistencia_cache');
    const lista = Array.isArray(asistencias) ? asistencias : [asistencias];
    lista.forEach((a) => {
      // Asegurar que tenga _id (puede ser temporal si es nueva)
      if (a._id) store.put(a);
    });
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

/** Obtiene asistencias por cuaderno y trimestre del caché local */
export async function obtenerAsistenciaCache(cuadernoId, trimestre) {
  const database = await openDB();
  return new Promise((resolve, reject) => {
    const tx = database.transaction('asistencia_cache', 'readonly');
    const store = tx.objectStore('asistencia_cache');
    const index = store.index('cuaderno_trimestre');
    const request = index.getAll([cuadernoId, trimestre]);
    request.onsuccess = () => resolve(request.result || []);
    request.onerror = () => reject(request.error);
  });
}

/** Guarda asistencia temporal con ID local (para offline) */
export async function guardarAsistenciaTemporal(data) {
  const tempId = `temp_asistencia_${Date.now()}`;
  const registro = { ...data, _id: tempId, _offline: true, _createdAt: new Date().toISOString() };
  await withStore('asistencia_cache', 'readwrite', (store) => store.put(registro));
  return registro;
}

// ─── EVALUACION CACHE ────────────────────────────────────────────────────────

/** Guarda una lista de evaluaciones en caché local */
export async function guardarEvaluacionCache(evaluaciones) {
  const database = await openDB();
  return new Promise((resolve, reject) => {
    const tx = database.transaction('evaluacion_cache', 'readwrite');
    const store = tx.objectStore('evaluacion_cache');
    const lista = Array.isArray(evaluaciones) ? evaluaciones : [evaluaciones];
    lista.forEach((e) => {
      if (e._id) store.put(e);
    });
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

/** Obtiene evaluaciones por cuaderno y trimestre del caché local */
export async function obtenerEvaluacionCache(cuadernoId, trimestre) {
  const database = await openDB();
  return new Promise((resolve, reject) => {
    const tx = database.transaction('evaluacion_cache', 'readonly');
    const store = tx.objectStore('evaluacion_cache');
    const index = store.index('cuaderno_trimestre');
    const request = index.getAll([cuadernoId, trimestre]);
    request.onsuccess = () => resolve(request.result || []);
    request.onerror = () => reject(request.error);
  });
}

/** Guarda evaluación temporal con ID local (para offline) */
export async function guardarEvaluacionTemporal(data) {
  const tempId = `temp_eval_${Date.now()}`;
  const registro = { ...data, _id: tempId, _offline: true, _createdAt: new Date().toISOString() };
  await withStore('evaluacion_cache', 'readwrite', (store) => store.put(registro));
  return registro;
}

/** Actualiza una evaluación en caché local (para edición offline) */
export async function actualizarEvaluacionCache(id, datos) {
  const database = await openDB();
  return new Promise((resolve, reject) => {
    const tx = database.transaction('evaluacion_cache', 'readwrite');
    const store = tx.objectStore('evaluacion_cache');
    const getReq = store.get(id);
    getReq.onsuccess = () => {
      const existing = getReq.result;
      if (existing) {
        const updated = { ...existing, ...datos, _offline: true };
        store.put(updated);
      }
      resolve(existing);
    };
    getReq.onerror = () => reject(getReq.error);
    tx.onerror = () => reject(tx.error);
  });
}

// ─── SYNC QUEUE (cola de sincronización) ─────────────────────────────────────

/**
 * Agrega una operación a la cola de sincronización.
 * @param {string} tipo - 'asistencia' | 'evaluacion'
 * @param {string} metodo - 'POST' | 'PUT' | 'DELETE'
 * @param {string} url - endpoint relativo, ej: '/asistencia' o '/evaluaciones/123'
 * @param {object} datos - body de la petición
 * @param {string} [tempId] - ID temporal local para reemplazar luego
 */
export async function agregarALaCola(tipo, metodo, url, datos, tempId = null) {
  const database = await openDB();
  return new Promise((resolve, reject) => {
    const tx = database.transaction('sync_queue', 'readwrite');
    const store = tx.objectStore('sync_queue');
    const item = {
      tipo,
      metodo,
      url,
      datos,
      tempId,
      estado: 'pendiente',   // 'pendiente' | 'sincronizando' | 'error'
      intentos: 0,
      timestamp: new Date().toISOString(),
    };
    const req = store.add(item);
    req.onsuccess = () => resolve(req.result); // retorna el id autoincremental
    req.onerror = () => reject(req.error);
  });
}

/** Obtiene todos los items pendientes de la cola */
export async function obtenerColaPendiente() {
  const database = await openDB();
  return new Promise((resolve, reject) => {
    const tx = database.transaction('sync_queue', 'readonly');
    const store = tx.objectStore('sync_queue');
    const index = store.index('estado');
    const request = index.getAll('pendiente');
    request.onsuccess = () => resolve(request.result || []);
    request.onerror = () => reject(request.error);
  });
}

/** Marca un item de la cola como completado (lo elimina) */
export async function eliminarDeLaCola(id) {
  await withStore('sync_queue', 'readwrite', (store) => store.delete(id));
}

/** Actualiza el estado de un item en la cola */
export async function actualizarEstadoCola(id, estado, intentos) {
  const database = await openDB();
  return new Promise((resolve, reject) => {
    const tx = database.transaction('sync_queue', 'readwrite');
    const store = tx.objectStore('sync_queue');
    const getReq = store.get(id);
    getReq.onsuccess = () => {
      const item = getReq.result;
      if (item) {
        item.estado = estado;
        item.intentos = intentos;
        store.put(item);
      }
      resolve();
    };
    getReq.onerror = () => reject(getReq.error);
  });
}

/** Retorna la cantidad de items pendientes en la cola */
export async function contarPendientes() {
  const pendientes = await obtenerColaPendiente();
  return pendientes.length;
}

/** Limpia toda la caché (útil al hacer logout) */
export async function limpiarCacheOffline() {
  const database = await openDB();
  return new Promise((resolve, reject) => {
    const tx = database.transaction(
      ['asistencia_cache', 'evaluacion_cache', 'sync_queue'],
      'readwrite'
    );
    tx.objectStore('asistencia_cache').clear();
    tx.objectStore('evaluacion_cache').clear();
    tx.objectStore('sync_queue').clear();
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}
