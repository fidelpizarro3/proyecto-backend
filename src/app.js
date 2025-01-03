import express from 'express';
import { Server } from 'socket.io';
import productsRouter from './routes/productsRouter.js';
import cartsRouter from './routes/cartsRouter.js';
import { join } from 'path';
import { engine } from 'express-handlebars';
import mongoose from 'mongoose';

const app = express();

// Configuración de Handlebars
app.set('view engine', 'handlebars');
app.set('views', join(process.cwd(), 'src', 'views'));

app.engine('handlebars', engine({
  runtimeOptions: {
    allowProtoPropertiesByDefault: true,
    allowProtoMethodsByDefault: true
  }
}));

// Conectar a MongoDB
mongoose.connect('mongodb+srv://fidelpizarro11:1234@cluster0.fn5mr.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0', {})
  .then(() => console.log('Conexión a MongoDB exitosa'))
  .catch((err) => console.log('Error de conexión a MongoDB:', err));

// Servidor de Express y Socket.io
const server = app.listen(8080, () => {
  console.log('Servidor corriendo en el puerto 8080');
});

const io = new Server(server);

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(join(process.cwd(), 'src', 'public')));

// Middleware para pasar la instancia de Socket.io a las rutas
app.use((req, res, next) => {
  req.io = io;
  next();
});

// Rutas de la API
app.use('/api/products', productsRouter);
app.use('/api/carts', cartsRouter);

// Rutas de vistas
app.get('/', async (req, res) => {
  try {
    const products = await mongoose.model('Product').find();
    res.render('home', { title: 'Inicio', headerTitle: 'Lista de Productos', products });
  } catch (error) {
    console.error('Error renderizando la página home:', error);
    res.status(500).send('Error interno del servidor');
  }
});

app.get('/cart', async (req, res) => {
  try {
    const cart = await mongoose.model('Cart').findOne().populate('products.product');
    const cartProducts = cart
      ? cart.products.map((item) => ({
          id: item.product._id,
          name: item.product.name,
          description: item.product.description,
          price: item.product.price,
          quantity: item.quantity,
        }))
      : [];
    res.render('cart', { cart: cartProducts });
  } catch (err) {
    console.error('Error obteniendo el carrito:', err);
    res.status(500).send('Error interno del servidor');
  }
});

app.get('/detalles/:id', async (req, res) => {
  try {
      const product = await mongoose.model('Product').findById(req.params.id);

      if (!product) {
          return res.status(404).send('Producto no encontrado.');
      }

      res.render('details', {
          title: `Detalles de ${product.name}`,
          product: {
              name: product.name,
              price: product.price,
              description: product.description,
              imageUrl: product.imageUrl || '/default-image.jpg', // Si tienes una imagen, usa esto
          },
      });
  } catch (error) {
      console.error('Error obteniendo detalles del producto:', error);
      res.status(500).send('Error interno del servidor.');
  }
});

