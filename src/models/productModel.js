import mongoose from 'mongoose';

const productSchema = new mongoose.Schema({
  name: { type: String, required: true },
  price: { type: Number, required: true },
  description: { type: String, required: true },
  code: { type: String, required: true},
});

const Product = mongoose.model('Product', productSchema);
export default Product;
