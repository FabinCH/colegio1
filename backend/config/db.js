

const mongoose = require('mongoose');
const dns = require('dns');
try { dns.setServers(['8.8.8.8', '1.1.1.1']); } catch (e) {}

const connectDB = async () => {
  try {

    const conn = await mongoose.connect(process.env.MONGO_URI);

    console.log(`MongoDB conectado: ${conn.connection.host}`);

    return conn;
  } catch (error) {
    
    console.error(`Error de conexión a MongoDB: ${error.message}`);
    
    throw error;
  }
};

module.exports = connectDB;
