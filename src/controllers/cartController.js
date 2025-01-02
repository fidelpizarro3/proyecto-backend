
import Cart from '../models/cartModels.js';

console.log(Cart);  // Esto debería imprimir la clase Cart o el objeto del modelo

export const getCart = async (req, res) => {
  try {
    const cart = await Cart.findOne().populate('products.product');
    if (!cart) return res.status(404).json({ message: 'Carrito vacio' });
    res.status(200).json(cart);
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener carrito', error });
  }
};

export const addToCart = async (req, res) => {
  try {
    const { productId } = req.body;
    let cart = await Cart.findOne();

    if (!cart) cart = new Cart();

    const existingProduct = cart.products.find((p) => p.product.toString() === productId);

    if (existingProduct) {
      existingProduct.quantity += 1;
    } else {
      cart.products.push({ product: productId });
    }

    await cart.save();
    res.status(200).json(cart);
  } catch (error) {
    res.status(400).json({ message: 'Error al agregar al carrito', error });
  }
};
