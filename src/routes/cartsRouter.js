import express from 'express';
import fs from 'fs';
import path from 'path';

const router = express.Router();

// Ruta POST /api/carts/
router.post('/', (req, res) => {
  const newCart = {
    id: Date.now(),
    products: []
  };

  fs.readFile(path.join(__dirname, '..', '..', 'carrito.json'), 'utf-8', (err, data) => {
    if (err) return res.status(500).json({ error: 'Error leyendo los carritos' });

    const carts = JSON.parse(data);
    carts.push(newCart);
    fs.writeFile(path.join(__dirname, '..', '..', 'carrito.json'), JSON.stringify(carts), err => {
      if (err) return res.status(500).json({ error: 'Error guardando el carrito' });

      res.status(201).json(newCart);
    });
  });
});

// Ruta GET /api/carts/:cid
router.get('/:cid', (req, res) => {
  const { cid } = req.params;
  fs.readFile(path.join(__dirname, '..', '..', 'carrito.json'), 'utf-8', (err, data) => {
    if (err) return res.status(500).json({ error: 'Error leyendo los carritos' });

    const carts = JSON.parse(data);
    const cart = carts.find(c => c.id == cid);
    if (cart) {
      return res.json(cart.products);
    }
    res.status(404).json({ error: 'Carrito no encontrado' });
  });
});

// Ruta POST /api/carts/:cid/product/:pid
router.post('/:cid/product/:pid', (req, res) => {
  const { cid, pid } = req.params;
  const quantity = 1;

  fs.readFile(path.join(__dirname, '..', '..', 'carrito.json'), 'utf-8', (err, data) => {
    if (err) return res.status(500).json({ error: 'Error leyendo los carritos' });

    const carts = JSON.parse(data);
    const cart = carts.find(c => c.id == cid);
    if (!cart) return res.status(404).json({ error: 'Carrito no encontrado' });

    const existingProduct = cart.products.find(p => p.product == pid);
    if (existingProduct) {
      existingProduct.quantity += quantity;
    } else {
      cart.products.push({ product: pid, quantity });
    }

    fs.writeFile(path.join(__dirname, '..', '..', 'carrito.json'), JSON.stringify(carts), err => {
      if (err) return res.status(500).json({ error: 'Error actualizando el carrito' });

      res.status(201).json(cart);
    });
  });
});

export default router;
