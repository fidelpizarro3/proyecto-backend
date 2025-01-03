import express from 'express';
import Cart from '../models/cartModels.js';
import Product from '../models/productModel.js';

const router = express.Router();

// Agregar producto al carrito
router.post('/default-cart/products/:pid', async (req, res) => {
  try {
    let cart = await Cart.findOne();
    if (!cart) cart = new Cart({ products: [] });

    const product = await Product.findById(req.params.pid);
    if (!product) return res.status(404).json({ error: 'Producto no encontrado' });

    const existingProduct = cart.products.find((p) => p.product.toString() === req.params.pid);
    if (existingProduct) {
      existingProduct.quantity += 1; // Incrementa la cantidad si ya está en el carrito
    } else {
      cart.products.push({ product: req.params.pid, quantity: 1 }); // Agrega nuevo producto
    }

    await cart.save();
    res.status(201).json({ message: 'Producto agregado al carrito.', cart });
  } catch (err) {
    console.error('Error al agregar producto al carrito:', err);
    res.status(500).json({ error: 'Error al agregar producto al carrito' });
  }
});

// Incrementar o decrementar cantidad de un producto
router.put('/update/:pid', async (req, res) => {
  try {
    const { action } = req.body;
    const cart = await Cart.findOne();

    if (!cart) return res.status(404).json({ error: 'Carrito no encontrado' });

    const productIndex = cart.products.findIndex((p) => p.product.toString() === req.params.pid);
    if (productIndex === -1) return res.status(404).json({ error: 'Producto no encontrado en el carrito' });

    if (action === 'increment') {
      cart.products[productIndex].quantity += 1;
    } else if (action === 'decrement') {
      cart.products[productIndex].quantity -= 1;
      if (cart.products[productIndex].quantity <= 0) {
        cart.products.splice(productIndex, 1); // Eliminar producto si cantidad es 0
      }
    }

    await cart.save();
    res.status(200).json({ message: 'Cantidad actualizada', cart });
  } catch (err) {
    console.error('Error actualizando el carrito:', err);
    res.status(500).json({ error: 'Error al actualizar el carrito' });
  }
});

// Vaciar carrito
router.delete('/clear', async (req, res) => {
  try {
    const cart = await Cart.findOne();
    if (!cart) return res.status(404).json({ error: 'Carrito no encontrado' });

    cart.products = [];
    await cart.save();
    res.status(200).json({ message: 'Carrito vaciado' });
  } catch (err) {
    console.error('Error vaciando el carrito:', err);
    res.status(500).json({ error: 'Error al vaciar el carrito' });
  }
});

export default router;
