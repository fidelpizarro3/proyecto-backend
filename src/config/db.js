import mongoose from 'mongoose';

const connectDB = async () => {
  try {
    await mongoose.connect('mongodb+srv://fidelpizarro11:1234@cluster0.fn5mr.mongodb.net/Cluster0', {
    });
    console.log('Conectado a MongoDB Atlas');
  } catch (error) {
    console.error('Error al conectar a MongoDB', error);
    process.exit(1);
  }
};

export default connectDB;
