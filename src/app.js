import express from 'express';
import { Server } from 'socket.io';
import productsRouter from './routes/productsRouter.js'; // Rutas de la API de productos
import cartsRouter from './routes/cartsRouter.js'; // Rutas de la API de carritos
import { join } from 'path';
import { engine } from 'express-handlebars';
import mongoose from 'mongoose';
import Product from './models/productModel.js'; // Modelo de productos
import Cart from './models/cartModels.js';

const app = express();

// Configuración de Handlebars
app.set('view engine', 'handlebars');
app.set('views', join(process.cwd(), 'src', 'views'));


// Configuración de Handlebars
app.engine('handlebars', engine({
  runtimeOptions: {
    allowProtoPropertiesByDefault: true, // Permitir acceso a las propiedades del prototipo
    allowProtoMethodsByDefault: true // Permitir acceso a los métodos del prototipo
  }
}));
app.set('view engine', 'handlebars');


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
app.use(express.static(join(process.cwd(), 'src', 'public')));

// Middleware para pasar la instancia de Socket.io a las rutas
app.use((req, res, next) => {
  req.io = io; // Añadir la instancia de io a cada request
  next();
});

// Rutas de la API
app.use('/api/products', productsRouter);
app.use('/api/carts', cartsRouter);

// Función para obtener productos desde MongoDB
async function getProducts() {
  try {
    return await Product.find(); // Obtener todos los productos desde MongoDB
  } catch (error) {
    console.error('Error obteniendo productos:', error);
    return [];
  }
}

// Función para agregar un producto en MongoDB
async function addProduct(productData) {
  try {
    const newProduct = new Product(productData);
    return await newProduct.save(); // Guardar el producto en MongoDB
  } catch (error) {
    console.error('Error guardando el producto:', error);
  }
}

// Función para eliminar un producto en MongoDB
async function deleteProduct(productId) {
  try {
    return await Product.findByIdAndDelete(productId); // Eliminar el producto por ID
  } catch (error) {
    console.error('Error eliminando el producto:', error);
  }
}


// Ruta para agregar un producto al carrito
app.post('/api/carts/:cartId/products', async (req, res) => {
  const { cartId } = req.params;
  const { productId, quantity = 1 } = req.body; // Obtén el ID del producto y la cantidad (por defecto 1)
  
  try {
    let cart = await Cart.findById(cartId);
    if (!cart) {
      // Si no existe el carrito, crea uno nuevo
      cart = new Cart({ products: [{ product: productId, quantity }] });
      await cart.save();
    } else {
      // Si el carrito ya existe, agrega el producto o actualiza la cantidad
      const productIndex = cart.products.findIndex(p => p.product.toString() === productId);
      if (productIndex > -1) {
        // Si el producto ya está en el carrito, actualiza la cantidad
        cart.products[productIndex].quantity += quantity;
      } else {
        // Si el producto no está en el carrito, agrégalo
        cart.products.push({ product: productId, quantity });
      }
      await cart.save();
    }
    
    res.status(200).json(cart);
  } catch (error) {
    console.error('Error agregando producto al carrito:', error);
    res.status(500).send('Error interno del servidor');
  }
});


// Rutas de vistas

app.get('/', async (req, res) => {
  try {
    const products = await getProducts(); // Obtener productos desde MongoDB
    res.render('home', { title: 'Inicio', headerTitle: 'Lista de Productos', products });
  } catch (error) {
    console.error('Error renderizando la página home:', error);
    res.status(500).send('Error interno del servidor');
  }
});



app.get('/realtimeproducts', async (req, res) => {
  try {
    const products = await getProducts(); // Obtener productos desde MongoDB
    res.render('realTimeProducts', { title: 'Productos en Tiempo Real', headerTitle: 'Productos en Tiempo Real', products });
  } catch (error) {
    console.error('Error renderizando la página realtimeproducts:', error);
    res.status(500).send('Error interno del servidor');
  }
});




// Ruta para mostrar el detalle de un producto
app.get('/product/:id', async (req, res) => {
  try {
    const product = await Product.findById(req.params.id); // Buscar el producto por su ID
    if (!product) {
      return res.status(404).send('Producto no encontrado');
    }
    res.render('productDetail', { title: 'Detalle del Producto', product }); // Renderizar la vista con el producto encontrado
  } catch (error) {
    console.error('Error obteniendo el producto:', error);
    res.status(500).send('Error interno del servidor');
  }
});


// Ruta GET para obtener todos los carritos
app.get('/api/carts', async (req, res) => {
  try {
    const carts = await Cart.find(); // Obtener todos los carritos desde MongoDB
    res.status(200).json(carts); // Responder con la lista de carritos
  } catch (error) {
    console.error('Error obteniendo los carritos:', error);
    res.status(500).send('Error interno del servidor');
  }
});





io.on('connection', async (socket) => {
  console.log('Usuario conectado');

  // Enviar la lista de productos al cliente
  const products = await getProducts();
  socket.emit('product-list', products);  // Cambiar 'update-products' por 'product-list'

  // Escuchar el evento 'new-product' para agregar un producto
  socket.on('new-product', async (product) => {
    try {
      const newProduct = await addProduct(product);
      const products = await getProducts(); // Obtener productos actualizados
      io.emit('product-list', products);  // Emitir productos actualizados con el nombre correcto
    } catch (error) {
      console.error('Error agregando producto:', error);
    }
  });

  socket.on('delete-product', async (productId) => {
    try {
      // Eliminar el producto desde MongoDB
      await deleteProduct(productId);
  
      // Obtener productos actualizados
      const products = await getProducts();
  
      // Emitir productos actualizados a todos los clientes
      io.emit('update-products', products); // Emitir la lista de productos actualizada
  
    } catch (error) {
      console.error('Error eliminando producto:', error);
    }
  });
});
