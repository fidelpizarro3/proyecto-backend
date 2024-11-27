import express from 'express';
import fs from 'fs';
import path from 'path';

const router = express.Router();
const carritoFilePath = path.join(process.cwd(), 'src', 'public', 'carrito.json');
const productosFilePath = path.join(process.cwd(), 'src', 'public', 'productos.json');

// Funciones auxiliares
const readJSON = (filePath) => {
  try {
    const data = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(data);
  } catch (err) {
    throw new Error('Error al leer o parsear el archivo JSON');
  }
};

const writeJSON = (filePath, data) => {
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
  } catch (err) {
    throw new Error('Error al guardar el archivo JSON');
  }
};

// Ruta POST /api/carts/
router.post('/', (req, res) => {
  try {
    const carts = readJSON(carritoFilePath);
    const newCart = { id: Date.now().toString(), products: [] };
    carts.push(newCart);
    writeJSON(carritoFilePath, carts);
    res.status(201).json(newCart);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Ruta GET /api/carts/:cid
router.get('/:cid', (req, res) => {
  try {
    const carts = readJSON(carritoFilePath);
    const cart = carts.find((c) => String(c.id) === String(req.params.cid));
    if (!cart) return res.status(404).json({ error: 'Carrito no encontrado' });
    res.json(cart.products);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Ruta POST /api/carts/:cid/product/:pid
router.post('/:cid/product/:pid', (req, res) => {
  try {
    const carts = readJSON(carritoFilePath);
    const products = readJSON(productosFilePath); // Leer productos

    const cart = carts.find((c) => String(c.id) === String(req.params.cid));
    if (!cart) return res.status(404).json({ error: 'Carrito no encontrado' });

    const productExists = products.some((p) => String(p.id) === String(req.params.pid));
    if (!productExists) return res.status(404).json({ error: 'Producto no encontrado en la base de datos' });

    const product = cart.products.find((p) => String(p.product) === String(req.params.pid));
    if (product) {
      product.quantity += 1;
    } else {
      cart.products.push({ product: String(req.params.pid), quantity: 1 });
    }

    writeJSON(carritoFilePath, carts);
    res.status(201).json(cart);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
