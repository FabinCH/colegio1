const mongoose = require('mongoose');
const User = require('./models/User');
const connectDB = require('./config/db');
require('dotenv').config();

const createDocentes = async () => {
  try {
    await connectDB();
    
    // Crear Raul
    const raulExists = await User.findOne({ email: 'raul@colegio.com' });
    if (!raulExists) {
      await User.create({
        nombre: 'Raul Docente',
        email: 'raul@colegio.com',
        password: 'password123',
        rol: 'docente'
      });
      console.log('✅ Usuario docente creado (raul@colegio.com / password123)');
    } else {
      console.log('El usuario Raul ya existe');
    }

    // Crear Jorge
    const jorgeExists = await User.findOne({ email: 'jorge@colegio.com' });
    if (!jorgeExists) {
      await User.create({
        nombre: 'Jorge Docente',
        email: 'jorge@colegio.com',
        password: 'password123',
        rol: 'docente'
      });
      console.log('✅ Usuario docente creado (jorge@colegio.com / password123)');
    } else {
      console.log('El usuario Jorge ya existe');
    }

    process.exit();
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

createDocentes();
