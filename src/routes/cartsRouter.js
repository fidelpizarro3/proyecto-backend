import express from 'express';
import mongoose from 'mongoose';
import Cart from '../models/cartModels.js'; // Esquema del carrito
import Product from '../models/productModel.js'; // Esquema del producto

const router = express.Router();

// Ruta POST /api/carts/ - Crear un nuevo carrito
router.post('/', async (req, res) => {
  try {
    const newCart = new Cart({ products: [] });
    await newCart.save();
    res.status(201).json(newCart);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Ruta GET /api/carts/:cid - Obtener productos de un carrito por ID
router.get('/:cid', async (req, res) => {
  try {
    const cart = await Cart.findById(req.params.cid).populate('products.product');
    if (!cart) return res.status(404).json({ error: 'Carrito no encontrado' });
    res.json(cart.products);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Ruta POST /api/carts/:cid/product/:pid - Agregar producto al carrito
router.post('/:cid/product/:pid', async (req, res) => {
  try {
    const cart = await Cart.findById(req.params.cid);
    if (!cart) return res.status(404).json({ error: 'Carrito no encontrado' });

    const product = await Product.findById(req.params.pid);
    if (!product) return res.status(404).json({ error: 'Producto no encontrado' });

    const existingProduct = cart.products.find((p) => p.product.toString() === req.params.pid);

    if (existingProduct) {
      existingProduct.quantity += 1;
    } else {
      cart.products.push({ product: req.params.pid, quantity: 1 });
    }

    await cart.save();
    res.status(201).json(cart);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Ruta DELETE /api/carts/:cid/product/:pid - Eliminar producto del carrito
router.delete('/:cid/product/:pid', async (req, res) => {
  try {
    const cart = await Cart.findById(req.params.cid);
    if (!cart) return res.status(404).json({ error: 'Carrito no encontrado' });

    cart.products = cart.products.filter((p) => p.product.toString() !== req.params.pid);

    await cart.save();
    res.status(200).json(cart);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Ruta PATCH /api/carts/:cid/product/:pid - Actualizar cantidad de producto
router.patch('/:cid/product/:pid', async (req, res) => {
  try {
    const { quantity } = req.body;
    if (quantity <= 0) return res.status(400).json({ error: 'La cantidad debe ser mayor a 0' });

    const cart = await Cart.findById(req.params.cid);
    if (!cart) return res.status(404).json({ error: 'Carrito no encontrado' });

    const product = cart.products.find((p) => p.product.toString() === req.params.pid);
    if (!product) return res.status(404).json({ error: 'Producto no encontrado en el carrito' });

    product.quantity = quantity;

    await cart.save();
    res.status(200).json(cart);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
