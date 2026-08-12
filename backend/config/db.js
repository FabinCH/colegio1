// ============================================
// config/db.js — Conexión a la base de datos MongoDB
// ============================================
// 
// ¿QUÉ HACE ESTE ARCHIVO?
// Contiene una función que conecta nuestra aplicación a MongoDB.
// Usamos "mongoose" que es una librería que nos facilita trabajar con MongoDB
// desde Node.js (es como un traductor entre JavaScript y MongoDB).
//
// ¿POR QUÉ ESTÁ SEPARADO?
// En la arquitectura MVC, la configuración va en su propia carpeta.
// Así si algún día cambias de base de datos, solo tocas ESTE archivo.

const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    // mongoose.connect() intenta conectarse a la URL que pusimos en .env
    // Es una operación ASÍNCRONA (tarda un momento), por eso usamos "await"
    const conn = await mongoose.connect(process.env.MONGO_URI);

    // Si llega aquí, la conexión fue exitosa
    console.log(`MongoDB conectado: ${conn.connection.host}`);

    // Retornamos la conexión para que server.js pueda usar "await"
    return conn;
  } catch (error) {
    // Si hay un error (MongoDB no está corriendo, URL mal escrita, etc.)
    console.error(`Error de conexión a MongoDB: ${error.message}`);
    // Lanzamos el error para que server.js lo atrape en su try/catch
    throw error;
  }
};

// Exportamos la función para usarla en server.js
module.exports = connectDB;
