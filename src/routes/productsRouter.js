import express from 'express';
import Product from '../models/productModel.js';

const router = express.Router();

// Ruta GET /api/products/ - Lista todos los productos con un límite opcional
router.get('/', async (req, res) => {
  try {
    const products = await Product.find();
    const limit = parseInt(req.query.limit) || products.length;
    res.json(products.slice(0, limit));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Ruta GET /api/products/:id - Devuelve los detalles de un producto en formato JSON
router.get('/:id', async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ error: 'Producto no encontrado' });
    }
    res.json(product);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Ruta POST /api/products/ - Crea un nuevo producto
router.post('/', async (req, res) => {
  try {
    const { code, name, price, description, imageUrl, stock, category } = req.body;
    if (!stock || !category) {
      return res.status(400).json({ error: 'Faltan propiedades obligatorias: stock y category.' });
    }

    const newProduct = new Product({ code, name, price, description, imageUrl, stock, category });
    await newProduct.save();

    // Emitir el nuevo producto a través de WebSockets
    if (req.io) {
      req.io.emit('new-product', newProduct);
    }

    res.status(201).json(newProduct);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Ruta PUT /api/products/:id - Actualiza un producto existente
router.put('/:id', async (req, res) => {
  try {
    const { name, price, description, imageUrl, stock, category } = req.body;
    const updatedProduct = await Product.findByIdAndUpdate(
      req.params.id,
      { name, price, description, imageUrl, stock, category },
      { new: true, runValidators: true }
    );

    if (!updatedProduct) {
      return res.status(404).json({ error: 'Producto no encontrado.' });
    }

    res.json(updatedProduct);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Ruta DELETE /api/products/:id - Elimina un producto
router.delete('/:id', async (req, res) => {
  try {
    const deletedProduct = await Product.findByIdAndDelete(req.params.id);
    if (!deletedProduct) {
      return res.status(404).json({ error: 'Producto no encontrado' });
    }

    // Emitir la eliminación del producto a través de WebSockets
    if (req.io) {
      req.io.emit('delete-product', req.params.id);
    }

    res.status(204).send();
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
