import express from 'express';
import fs from 'fs';
import path from 'path';

const router = express.Router();
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

const generateUniqueId = (products) => {
  const ids = products.map((p) => Number(p.id));
  return (Math.max(...ids, 0) + 1).toString();
};

// Ruta GET /api/products/
router.get('/', (req, res) => {
  try {
    const products = readJSON(productosFilePath);
    const limit = parseInt(req.query.limit) || products.length;
    res.json(products.slice(0, limit));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Ruta GET /api/products/:pid
router.get('/:pid', (req, res) => {
  try {
    const products = readJSON(productosFilePath);
    const product = products.find((p) => p.id.toString() === req.params.pid.toString());
    if (!product) return res.status(404).json({ error: 'Producto no encontrado' });
    res.json(product);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


// Ruta POST /api/products/
router.post('/', (req, res) => {
  try {
    const products = readJSON(productosFilePath);
    const newProduct = {
      id: generateUniqueId(products),
      ...req.body,
      status: req.body.status ?? true,
      thumbnails: req.body.thumbnails ?? [],
    };
    products.push(newProduct);
    writeJSON(productosFilePath, products);
    res.status(201).json(newProduct);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Ruta PUT /api/products/:pid
router.put('/:pid', (req, res) => {
  try {
    const products = readJSON(productosFilePath);
    const index = products.findIndex((p) => String(p.id) === String(req.params.pid));
    if (index === -1) return res.status(404).json({ error: 'Producto no encontrado' });

    products[index] = { ...products[index], ...req.body };
    writeJSON(productosFilePath, products);
    res.json(products[index]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Ruta DELETE /api/products/:pid
router.delete('/:pid', (req, res) => {
  try {
    let products = readJSON(productosFilePath);
    const initialLength = products.length;
    products = products.filter((p) => String(p.id) !== String(req.params.pid));

    if (products.length === initialLength) {
      return res.status(404).json({ error: 'Producto no encontrado' });
    }

    writeJSON(productosFilePath, products);
    res.status(204).send();
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
