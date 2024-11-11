import express from 'express';
import fs from 'fs';
import path from 'path';


const app = express();
app.use(express.json());  

// Rutas de productos
import productsRouter from './src/routes/productsRouter.js';
app.use('/api/products', productsRouter);

// Rutas de carritos
import cartsRouter from './src/routes/cartsRouter.js';
app.use('/api/carts', cartsRouter);

// Arrancamos el servidor en el puerto 8080
const PORT = 8080;
app.listen(PORT, () => {
    console.log(`Servidor corriendo en el puerto ${PORT}`);
});
