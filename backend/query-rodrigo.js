const mongoose = require('mongoose');
const User = require('./models/User');
const Curso = require('./models/Curso');
const Student = require('./models/Student');
const CuadernoPedagogico = require('./models/CuadernoPedagogico');
const connectDB = require('./config/db');
require('dotenv').config();

const queryRodrigo = async () => {
  try {
    await connectDB();
    const rodrigo = await User.findOne({ email: 'rodi@gmail.com' });
    const cuaderno = await CuadernoPedagogico.findOne({ docente: rodrigo._id }).populate('curso');
    
    if (cuaderno) {
      console.log(`Cuaderno: ${cuaderno._id}`);
      const students = await Student.find({ _id: { $in: cuaderno.curso.estudiantes } });
      console.log(`Estudiantes de Rodrigo (${students.length}):`);
      for (let i = 0; i < Math.min(5, students.length); i++) {
         console.log(` - ${students[i].nombres} ${students[i].apellidos} (RUDE: ${students[i].rude})`);
      }
    }
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

queryRodrigo();
