import express from 'express';

import productsRouter from './src/routes/productsRouter.js';
import cartsRouter from './src/routes/cartsRouter.js';

const app = express();

app.use(express.json());

// Rutas
app.use('/api/products', productsRouter);
app.use('/api/carts', cartsRouter);

// Arrancar el servidor
const PORT = 8080;
app.listen(PORT, () => {
console.log(`Servidor corriendo en el puerto ${PORT}`);
});
