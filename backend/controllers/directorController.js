// ============================================
// controllers/directorController.js — Panel del Director
// ============================================
//
// ¿QUÉ HACE ESTE ARCHIVO?
// Centraliza las funciones del Director (aprobación de cuadernos,
// reportes estadísticos, rendimiento, exportaciones).

const User = require('../models/User');
const Student = require('../models/Student');
const Curso = require('../models/Curso');
const Materia = require('../models/Materia');
const CuadernoPedagogico = require('../models/CuadernoPedagogico');
const RegistroAsistencia = require('../models/Asistencia');
const Calificacion = require('../models/Evaluacion');

// 1. OBTENER REPORTES POR CURSO
// Retorna la cantidad de estudiantes y promedios por curso
exports.obtenerReportesPorCurso = async (req, res) => {
  try {
    const cursos = await Curso.find().lean();
    const data = [];
    
    for (const curso of cursos) {
      const estudiantes = await Student.countDocuments({ curso: curso._id });
      // Aquí se calcularía el promedio del curso usando las calificaciones
      // Simulado para MVP si no hay datos complejos
      data.push({
        _id: curso._id,
        nombre: curso.nombre,
        nivel: curso.nivel,
        grado: curso.grado,
        paralelo: curso.paralelo,
        totalEstudiantes: estudiantes,
        promedioGeneral: Math.floor(Math.random() * 20) + 70 // Simulación
      });
    }
    
    res.json({ exito: true, data });
  } catch (error) {
    console.error(error);
    res.status(500).json({ exito: false, mensaje: 'Error al obtener reportes por curso' });
  }
};

// 2. OBTENER RENDIMIENTO POR DOCENTE
exports.obtenerRendimientoDocente = async (req, res) => {
  try {
    const docentes = await User.find({ rol: 'docente' }).select('nombre email').lean();
    const data = [];
    
    for (const doc of docentes) {
      const cuadernos = await CuadernoPedagogico.countDocuments({ docente: doc._id });
      const cuadernosAprobados = await CuadernoPedagogico.countDocuments({ docente: doc._id, estadoSupervision: 'aprobado' });
      
      data.push({
        _id: doc._id,
        nombre: doc.nombre,
        email: doc.email,
        cuadernosAsignados: cuadernos,
        cuadernosAprobados,
        rendimiento: cuadernos === 0 ? 0 : Math.round((cuadernosAprobados / cuadernos) * 100)
      });
    }
    
    res.json({ exito: true, data });
  } catch (error) {
    console.error(error);
    res.status(500).json({ exito: false, mensaje: 'Error al obtener rendimiento docente' });
  }
};

// 3. OBTENER ESTADÍSTICAS DE ASISTENCIA
exports.obtenerEstadisticasAsistencia = async (req, res) => {
  try {
    const asistencias = await RegistroAsistencia.aggregate([
      { $unwind: "$estudiantes" },
      { $group: {
          _id: "$estudiantes.estado",
          total: { $sum: 1 }
      }}
    ]);
    
    // Normalizar datos (presente, falta, atraso, licencia)
    const formato = { presente: 0, falta: 0, atraso: 0, licencia: 0 };
    asistencias.forEach(a => { formato[a._id] = a.total; });
    
    res.json({ exito: true, data: formato });
  } catch (error) {
    console.error(error);
    res.status(500).json({ exito: false, mensaje: 'Error al obtener estadísticas de asistencia' });
  }
};

// 4. OBTENER RANKING DE NOTAS (Top 10 Estudiantes)
exports.obtenerRankingNotas = async (req, res) => {
  try {
    // Simulando ranking global (MVP)
    // En un sistema real se agrupa de la colección de Calificaciones.
    const estudiantes = await Student.find().populate('curso', 'nombre nivel grado paralelo').lean();
    
    // Asignando promedios simulados para el prototipo si no hay notas suficientes
    const ranking = estudiantes.map(e => ({
      _id: e._id,
      nombre: `${e.nombre} ${e.apellidos}`,
      curso: e.curso ? `${e.curso.grado} ${e.curso.nivel} ${e.curso.paralelo}` : 'N/A',
      promedio: Math.floor(Math.random() * 30) + 70 // Simulado 70-100
    })).sort((a, b) => b.promedio - a.promedio).slice(0, 10);
    
    res.json({ exito: true, data: ranking });
  } catch (error) {
    console.error(error);
    res.status(500).json({ exito: false, mensaje: 'Error al obtener ranking de notas' });
  }
};

// 5. LISTAR CUADERNOS PARA SUPERVISIÓN
exports.listarCuadernosSupervision = async (req, res) => {
  try {
    const cuadernos = await CuadernoPedagogico.find()
      .populate('docente', 'nombre email')
      .populate('curso', 'nivel grado paralelo')
      .populate('materia', 'nombre')
      .sort({ createdAt: -1 });
      
    res.json({ exito: true, data: cuadernos });
  } catch (error) {
    console.error(error);
    res.status(500).json({ exito: false, mensaje: 'Error al listar cuadernos' });
  }
};

// 6. SUPERVISAR CUADERNO (Aprobar o Rechazar)
exports.supervisarCuaderno = async (req, res) => {
  try {
    const { id } = req.params;
    const { estado, comentario } = req.body; // 'aprobado' o 'rechazado'
    
    if (!['aprobado', 'rechazado', 'pendiente'].includes(estado)) {
      return res.status(400).json({ exito: false, mensaje: 'Estado inválido' });
    }
    
    const cuaderno = await CuadernoPedagogico.findByIdAndUpdate(
      id,
      {
        estadoSupervision: estado,
        comentarioSupervision: comentario || '',
        fechaSupervision: new Date()
      },
      { new: true }
    );
    
    if (!cuaderno) return res.status(404).json({ exito: false, mensaje: 'Cuaderno no encontrado' });
    
    res.json({ exito: true, mensaje: `Cuaderno ${estado} con éxito`, data: cuaderno });
  } catch (error) {
    console.error(error);
    res.status(500).json({ exito: false, mensaje: 'Error al supervisar el cuaderno' });
  }
};

// 7. EXPORTAR CENTRALIZADOR Y GENERAR REPORTE MINISTERIAL (SIGED)
// Retorna JSON consolidado para que el frontend lo descargue como CSV/Excel
exports.generarExportacionSIGED = async (req, res) => {
  try {
    const { tipo } = req.params; // 'centralizador' o 'ministerial'
    
    // Obtenemos todos los estudiantes matriculados
    const estudiantes = await Student.find().populate('curso').lean();
    
    if (tipo === 'centralizador') {
      const datosCentralizador = estudiantes.map(e => ({
        RUDE: e.rude || 'S/N',
        NombreCompleto: `${e.apellidos} ${e.nombre}`.toUpperCase(),
        Nivel: e.curso ? e.curso.nivel : 'S/A',
        Grado: e.curso ? e.curso.grado : 'S/A',
        PromedioFinal: Math.floor(Math.random() * 40) + 60, // Simulación de promedio
        Estado: 'APROBADO' // Simulación
      }));
      return res.json({ exito: true, tipo: 'Centralizador de Notas', data: datosCentralizador });
    }
    
    if (tipo === 'ministerial') {
      const stats = {
        TotalEstudiantes: estudiantes.length,
        Hombres: estudiantes.filter(e => e.genero === 'masculino').length,
        Mujeres: estudiantes.filter(e => e.genero === 'femenino').length,
        Aprobados: estudiantes.length - 2, // Simulación
        Reprobados: 2, // Simulación
        Abandono: 0
      };
      return res.json({ exito: true, tipo: 'Reporte Ministerial SIGED', data: [stats] });
    }
    
    res.status(400).json({ exito: false, mensaje: 'Tipo de exportación inválido' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ exito: false, mensaje: 'Error al generar exportación' });
  }
};
