import express from 'express';
import { Server } from 'socket.io';
import productsRouter from './routes/productsRouter.js'; // Rutas de la API de productos
import cartsRouter from './routes/cartsRouter.js'; // Rutas de la API de carritos
import { join } from 'path';
import { engine } from 'express-handlebars';
import fs from 'fs/promises';

const app = express();

// Configuración de Handlebars
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

// Middleware para pasar la instancia de Socket.io a las rutas
app.use((req, res, next) => {
  req.io = io; // Añadir la instancia de io a cada request
  next();
});

// Ruta del archivo productos.json
const productsFilePath = join(process.cwd(), 'src', 'data', 'productos.json');

// Función para leer productos
async function getProducts() {
  try {
    const data = await fs.readFile(productsFilePath, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error leyendo productos:', error);
    return [];
  }
}

// Función para guardar productos
async function saveProducts(products) {
  try {
    await fs.writeFile(productsFilePath, JSON.stringify(products, null, 2));
  } catch (error) {
    console.error('Error guardando productos:', error);
  }
}

// Rutas de la API
app.use('/api/products', productsRouter);
app.use('/api/carts', cartsRouter);

// Rutas de vistas
app.get('/', async (req, res) => {
  try {
    const products = await getProducts(); 
    res.render('home', { title: 'Inicio', headerTitle: 'Lista de Productos', products });
  } catch (error) {
    console.error('Error renderizando la página home:', error);
    res.status(500).send('Error interno del servidor');
  }
});

app.get('/realtimeproducts', async (req, res) => {
  try {
    const products = await getProducts();
    res.render('realTimeProducts', { title: 'Productos en Tiempo Real', headerTitle: 'Productos en Tiempo Real', products });
  } catch (error) {
    console.error('Error renderizando la página realtimeproducts:', error);
    res.status(500).send('Error interno del servidor');
  }
});


io.on('connection', async (socket) => {
  console.log('Usuario conectado');

  const products = await getProducts(); 
  socket.emit('update-products', products);

  socket.on('new-product', async (product) => {
    try {
      const products = await getProducts();
      const newProduct = { id: products.length + 1, ...product };
      products.push(newProduct);


      await saveProducts(products);


      io.emit('update-products', products);
    } catch (error) {
      console.error('Error guardando producto:', error);
    }
  });

  socket.on('delete-product', async (productId) => {
    try {
      const products = await getProducts();
      const updatedProducts = products.filter((product) => product.id !== productId);

      // Guardar la lista actualizada en el archivo JSON
      await saveProducts(updatedProducts);

      // Emitir la lista actualizada de productos
      io.emit('update-products', updatedProducts);
    } catch (error) {
      console.error('Error eliminando producto:', error);
    }
  });
});
