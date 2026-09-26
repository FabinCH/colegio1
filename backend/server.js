// ============================================
// server.js — Punto de entrada del Backend
// ============================================
//
// ¿QUÉ HACE ESTE ARCHIVO?
// Este es el archivo PRINCIPAL del backend. Aquí:
// 1. Cargamos las variables de entorno (.env)
// 2. Creamos la aplicación Express (nuestro servidor web)
// 3. Configuramos los middlewares (funciones que procesan cada petición)
// 4. Conectamos a MongoDB
// 5. Definimos una ruta de prueba
// 6. Encendemos el servidor
//
// ¿QUÉ ES EXPRESS?
// Express es un framework para crear servidores web con Node.js.
// Sin Express, tendríamos que escribir mucho más código para manejar
// peticiones HTTP (GET, POST, PUT, DELETE).
//
// ¿QUÉ ES UN MIDDLEWARE?
// Es una función que se ejecuta ANTES de que la petición llegue a tu ruta.
// Ejemplo: cors() permite que el frontend (puerto 5173) hable con el backend (puerto 5000).

// --- 1. CARGAR VARIABLES DE ENTORNO ---
// dotenv lee el archivo .env y pone sus valores en process.env
// IMPORTANTE: Esta línea SIEMPRE debe ir al principio, antes de todo lo demás
const dotenv = require('dotenv');
dotenv.config();

// --- 2. IMPORTAR DEPENDENCIAS ---
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');

// --- 3. CREAR LA APLICACIÓN EXPRESS ---
const app = express();

// --- 4. CONFIGURAR MIDDLEWARES ---

// cors() → Permite que el frontend (React en localhost:5173) 
//          pueda hacer peticiones al backend (localhost:5000)
//          Sin esto, el navegador BLOQUEA las peticiones (política de seguridad).
app.use(cors());

// express.json() → Permite que el servidor entienda datos en formato JSON
//                  Cuando el frontend envíe { "nombre": "Juan" }, Express 
//                  lo convertirá automáticamente en un objeto JavaScript.
app.use(express.json());

// --- 5. RUTA DE PRUEBA ---
// Esta ruta es solo para verificar que el servidor está funcionando.
// Cuando visites http://localhost:5000/api/status en tu navegador,
// verás la respuesta JSON.
app.get('/api/status', (req, res) => {
  res.json({
    mensaje: 'Servidor del Cuaderno Pedagógico funcionando correctamente',
    version: '1.0.0',
    fecha: new Date().toLocaleDateString('es-BO'),
  });
});

// Endpoint de prueba (Fase 1 - HU-01)
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    mensaje: 'Cuaderno Pedagógico 2026 — Servidor saludable',
    timestamp: new Date().toISOString(),
  });
});

// --- 6. RUTAS DE LA API ---
// Cada app.use() conecta un "grupo de rutas" a una URL base.
// Ejemplo: app.use('/api/auth', authRoutes) significa que:
//   POST /api/auth/register → ejecuta authController.register()
//   POST /api/auth/login    → ejecuta authController.login()
//   GET  /api/auth/perfil   → ejecuta authController.getPerfil()
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/estudiantes', require('./routes/studentRoutes'));
app.use('/api/materias', require('./routes/materiaRoutes'));
app.use('/api/cursos', require('./routes/cursoRoutes'));
app.use('/api/cuadernos', require('./routes/cuadernoRoutes'));

app.use('/api/asistencia', require('./routes/asistenciaRoutes'));
app.use('/api/evaluaciones', require('./routes/evaluacionRoutes'));
app.use('/api/inscripciones', require('./routes/inscripcionRoutes'));
app.use('/api/director', require('./routes/directorRoutes'));

// Módulo de Machine Learning (solo admin y director)
app.use('/api/ml', require('./routes/mlRoutes'));

// Panel de Administración (solo admin)
app.use('/api/admin', require('./routes/adminRoutes'));

// Sistema de Notificaciones Push
app.use('/api/notificaciones', require('./routes/notificacionRoutes'));

// --- 7. FUNCIÓN PRINCIPAL: CONECTAR BD Y ENCENDER SERVIDOR ---
// Usamos una función async porque connectDB() es asíncrona (tarda un momento).
// Primero nos aseguramos de que MongoDB esté conectado, y LUEGO encendemos Express.
const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    // Primero conectamos a MongoDB
    await connectDB();

    // Solo si la conexión fue exitosa, encendemos el servidor
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`Servidor corriendo en http://localhost:${PORT}`);
      console.log(`Acceso desde celular (misma red WiFi): http://10.192.124.76:5173`);
      console.log(`Prueba API Backend desde celular: http://10.192.124.76:${PORT}/api/status`);
    });
  } catch (error) {
    console.error('No se pudo iniciar el servidor:', error.message);
    process.exit(1);
  }
};

startServer();
