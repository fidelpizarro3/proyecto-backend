import express from 'express';
import { Server } from 'socket.io';
import productsRouter from './routes/productsRouter.js';  // Importación correcta
import cartsRouter from './routes/cartsRouter.js';
import { join } from 'path';
import { engine } from 'express-handlebars';


const app = express();

app.engine('handlebars', engine());
app.set('view engine', 'handlebars');
app.set('views', join(process.cwd(), 'src', 'views'));

// Servidor de Express y Socket.io
const server = app.listen(8080, () => {
  console.log('Servidor corriendo en el puerto 8080');
});

const io = new Server(server);

// Middleware
app.use(express.json());
app.use(express.static(join(process.cwd(), 'src', 'public')));

// Middleware para pasar io a las rutas
app.use((req, res, next) => {
  req.io = io;  // Añadir la instancia de io a cada request
  next();
});

// Rutas
app.use('/api/products', productsRouter);  // Ya no es necesario pasar io como argumento
app.use('/api/carts', cartsRouter);

// Rutas de vistas
app.get('/', (req, res) => {
  res.render('home');
});

app.get('/realtimeproducts', (req, res) => {
  res.render('realTimeProducts');
});

// Socket.io: escucha por nuevas conexiones
io.on('connection', (socket) => {
  console.log('Usuario conectado');
  
  // Emite productos actualizados cada vez que se conecte un cliente
  socket.emit('update-products', []);

  // Emitir cualquier cambio cuando se cree un producto o se elimine
  socket.on('new-product', (product) => {
    io.emit('update-products', product);  // Enviar los productos nuevos
  });
  
  socket.on('delete-product', (productId) => {
    io.emit('update-products', productId);  // Enviar la eliminación del producto
  });
});  
