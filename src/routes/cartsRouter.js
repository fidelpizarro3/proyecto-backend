import express from 'express';
import Cart from '../models/cartModels.js';
import Product from '../models/productModel.js';

const router = express.Router();

// Obtener todos los carritos
router.get('/', async (req, res) => {
  try {
    const carts = await Cart.find().populate('products.product');
    res.json(carts);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Obtener un carrito específico
router.get('/:id', async (req, res) => {
  try {
    const cart = await Cart.findById(req.params.id).populate('products.product');
    if (!cart) return res.status(404).json({ error: 'Carrito no encontrado' });
    res.json(cart);
  } catch (err) {
    res.status(500).json({ error: err.message });
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


// Crear un carrito
router.post('/', async (req, res) => {
  try {
    const newCart = new Cart({ products: [] });
    await newCart.save();
    res.status(201).json(newCart);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
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

// Actualizar la cantidad de un producto en el carrito
router.put('/:cid/products/:pid', async (req, res) => {
  try {
    const { cid, pid } = req.params;
    const { quantity } = req.body;

    const cart = await Cart.findById(cid);
    if (!cart) return res.status(404).json({ error: 'Carrito no encontrado.' });

    const productInCart = cart.products.find((p) => p.product.toString() === pid);
    if (!productInCart) return res.status(404).json({ error: 'Producto no encontrado en el carrito.' });

    productInCart.quantity = quantity;

    await cart.save();
    res.status(200).json(cart);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Quitar un producto del carrito
router.delete('/:cid/products/:pid', async (req, res) => {
  try {
    const { cid, pid } = req.params;

    const cart = await Cart.findById(cid);
    if (!cart) return res.status(404).json({ error: 'Carrito no encontrado.' });

    cart.products = cart.products.filter((p) => p.product.toString() !== pid);

    await cart.save();
    res.status(200).json(cart);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Vaciar un carrito
router.delete('/:cid/products', async (req, res) => {
  try {
    const { cid } = req.params;

    const cart = await Cart.findById(cid);
    if (!cart) return res.status(404).json({ error: 'Carrito no encontrado.' });

    cart.products = [];
    await cart.save();
    res.status(200).json({ message: 'Carrito vaciado', cart });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
