const mongoose = require('mongoose');
const User = require('./models/User');
const connectDB = require('./config/db');
require('dotenv').config();

const createAdmin = async () => {
  try {
    await connectDB();
    const adminExists = await User.findOne({ email: 'admin@colegio.com' });
    if (!adminExists) {
      await User.create({
        nombre: 'Administrador Principal',
        email: 'admin@colegio.com',
        password: 'admin123',
        rol: 'admin'
      });
      console.log('✅ Usuario admin creado (admin@colegio.com / admin123)');
    } else {
      console.log('El usuario admin ya existe');
    }
    process.exit();
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

createAdmin();
