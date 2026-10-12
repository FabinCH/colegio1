

const dotenv = require('dotenv');
dotenv.config();

const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');

const app = express();

app.use(cors({
  origin: [
    'http://localhost:5173',
    'http://localhost:5174',
    'https://colegio1-two.vercel.app',
    'https://colegio1-git-main-fabian-73d9.vercel.app',
    /\.vercel\.app$/,  
  ],
  credentials: true,
}));

app.use(express.json());

app.get('/api/status', (req, res) => {
  res.json({
    mensaje: 'Servidor del Cuaderno Pedagógico funcionando correctamente',
    version: '1.0.0',
    fecha: new Date().toLocaleDateString('es-BO'),
  });
});

app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    mensaje: 'Cuaderno Pedagógico 2026 — Servidor saludable',
    timestamp: new Date().toISOString(),
  });
});

app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/estudiantes', require('./routes/studentRoutes'));
app.use('/api/materias', require('./routes/materiaRoutes'));
app.use('/api/cursos', require('./routes/cursoRoutes'));
app.use('/api/cuadernos', require('./routes/cuadernoRoutes'));

app.use('/api/asistencia', require('./routes/asistenciaRoutes'));
app.use('/api/evaluaciones', require('./routes/evaluacionRoutes'));
app.use('/api/inscripciones', require('./routes/inscripcionRoutes'));
app.use('/api/director', require('./routes/directorRoutes'));

app.use('/api/ml', require('./routes/mlRoutes'));

app.use('/api/admin', require('./routes/adminRoutes'));

app.use('/api/notificaciones', require('./routes/notificacionRoutes'));

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    
    await connectDB();

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
