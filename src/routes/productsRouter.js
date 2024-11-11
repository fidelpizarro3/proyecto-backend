import express from 'express';
import fs from 'fs';
import path from 'path';

const router = express.Router();

// Definimos las rutas explícitas a los archivos JSON
const productosFilePath = path.join(process.cwd(), 'src', 'public', 'productos.json');
const carritoFilePath = path.join(process.cwd(), 'src', 'public', 'carrito.json');

// Ruta GET /api/products/
router.get('/', (req, res) => {
  const limit = req.query.limit ? parseInt(req.query.limit) : 0;
  fs.readFile(productosFilePath, 'utf-8', (err, data) => {
    if (err) return res.status(500).json({ error: 'Error leyendo los productos' });

    const products = JSON.parse(data);
    if (limit) {
      return res.json(products.slice(0, limit));
    }
    res.json(products);
  });
});

// Ruta GET /api/products/:pid
router.get('/:pid', (req, res) => {
  const { pid } = req.params;
  fs.readFile(productosFilePath, 'utf-8', (err, data) => {
    if (err) return res.status(500).json({ error: 'Error leyendo los productos' });

    const products = JSON.parse(data);
    const product = products.find(p => p.id == pid);
    if (product) {
      return res.json(product);
    }
    res.status(404).json({ error: 'Producto no encontrado' });
  });
});

// Ruta POST /api/products/
router.post('/', (req, res) => {
  const { title, description, code, price, status = true, stock, category, thumbnails = [] } = req.body;
  fs.readFile(productosFilePath, 'utf-8', (err, data) => {
    if (err) return res.status(500).json({ error: 'Error leyendo los productos' });

    const products = JSON.parse(data);
    const newProduct = {
      id: Date.now(), // Usamos Date.now() como id único
      title,
      description,
      code,
      price,
      status,
      stock,
      category,
      thumbnails,
    };

    products.push(newProduct);
    fs.writeFile(productosFilePath, JSON.stringify(products), err => {
      if (err) return res.status(500).json({ error: 'Error guardando el producto' });

      res.status(201).json(newProduct);
    });
  });
});

// Ruta PUT /api/products/:pid
router.put('/:pid', (req, res) => {
  const { pid } = req.params;
  const { title, description, code, price, status, stock, category, thumbnails } = req.body;
  fs.readFile(productosFilePath, 'utf-8', (err, data) => {
    if (err) return res.status(500).json({ error: 'Error leyendo los productos' });

    const products = JSON.parse(data);
    const productIndex = products.findIndex(p => p.id == pid);
    if (productIndex === -1) return res.status(404).json({ error: 'Producto no encontrado' });

    const updatedProduct = {
      ...products[productIndex],
      title, description, code, price, status, stock, category, thumbnails
    };

    products[productIndex] = updatedProduct;
    fs.writeFile(productosFilePath, JSON.stringify(products), err => {
      if (err) return res.status(500).json({ error: 'Error actualizando el producto' });

      res.json(updatedProduct);
    });
  });
});

// Ruta DELETE /api/products/:pid
router.delete('/:pid', (req, res) => {
  const { pid } = req.params;
  fs.readFile(productosFilePath, 'utf-8', (err, data) => {
    if (err) return res.status(500).json({ error: 'Error leyendo los productos' });

    let products = JSON.parse(data);
    const productIndex = products.findIndex(p => p.id == pid);
    if (productIndex === -1) return res.status(404).json({ error: 'Producto no encontrado' });

    products = products.filter(p => p.id != pid);
    fs.writeFile(productosFilePath, JSON.stringify(products), err => {
      if (err) return res.status(500).json({ error: 'Error eliminando el producto' });

      res.status(204).send();
    });
  });
});

export default router;
