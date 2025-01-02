import express from 'express';
import Cart from '../models/cartModels.js';
import Product from '../models/productModel.js';

const router = express.Router();

router.post('/default-cart/products/:pid', async (req, res) => {
  try {
    let cart = await Cart.findOne();
    if (!cart) cart = new Cart({ products: [] });

    const product = await Product.findById(req.params.pid);
    if (!product) return res.status(404).json({ error: 'Producto no encontrado' });

    const existingProduct = cart.products.find((p) => p.product.toString() === req.params.pid);
    if (existingProduct) {
      existingProduct.quantity += 1;
    } else {
      cart.products.push({ product: req.params.pid, quantity: 1 });
    }

    await cart.save();
    req.io.emit('cartUpdated', { cartId: cart._id });
    res.status(201).json({ message: 'Producto agregado al carrito.', cart });
  } catch (err) {
    console.error('Error al agregar producto al carrito:', err);
    res.status(500).json({ error: err.message });
  }
});

export default router;
