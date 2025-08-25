const express = require('express');
const router = express.Router();
const Product = require('../models/Product');

// Obtener todos los productos
router.get('/', async (req, res) => {
  try {
    const { category } = req.query;
    const query = category ? { category } : {};
    
    const products = await Product.find(query)
      .sort({ createdAt: -1 });
    res.json(products);
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener los productos', error: error.message });
  }
});

// Obtener un producto por ID
router.get('/:id', async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: 'Producto no encontrado' });
    }
    res.json(product);
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener el producto', error: error.message });
  }
});

// Crear un nuevo producto
router.post('/', async (req, res) => {
  try {
    const { name, sku, category, description, price, stock, minStock, imageUrl, status } = req.body;
    
    // Verificar si ya existe un producto con ese SKU
    const existingProduct = await Product.findOne({ sku });
    if (existingProduct) {
      return res.status(400).json({ message: 'Ya existe un producto con ese SKU' });
    }

    const product = new Product({
      name,
      sku,
      category,
      description,
      price,
      stock,
      minStock,
      imageUrl,
      status
    });

    const savedProduct = await product.save();
    res.status(201).json(savedProduct);
  } catch (error) {
    res.status(400).json({ message: 'Error al crear el producto', error: error.message });
  }
});

// Actualizar un producto
router.put('/:id', async (req, res) => {
  try {
    const { name, sku, category, description, price, stock, minStock, imageUrl, status } = req.body;
    
    // Si se está actualizando el SKU, verificar que no exista ya
    if (sku) {
      const existingProduct = await Product.findOne({ 
        sku, 
        _id: { $ne: req.params.id } 
      });
      if (existingProduct) {
        return res.status(400).json({ message: 'Ya existe un producto con ese SKU' });
      }
    }

    const updatedProduct = await Product.findByIdAndUpdate(
      req.params.id,
      { name, sku, category, description, price, stock, minStock, imageUrl, status },
      { new: true, runValidators: true }
    );

    if (!updatedProduct) {
      return res.status(404).json({ message: 'Producto no encontrado' });
    }

    res.json(updatedProduct);
  } catch (error) {
    res.status(400).json({ message: 'Error al actualizar el producto', error: error.message });
  }
});

// Eliminar un producto
router.delete('/:id', async (req, res) => {
  try {
    const deletedProduct = await Product.findByIdAndDelete(req.params.id);
    if (!deletedProduct) {
      return res.status(404).json({ message: 'Producto no encontrado' });
    }
    res.json({ message: 'Producto eliminado correctamente' });
  } catch (error) {
    res.status(500).json({ message: 'Error al eliminar el producto', error: error.message });
  }
});

// Actualizar stock de un producto
router.patch('/:id/stock', async (req, res) => {
  try {
    const { stock } = req.body;
    
    if (typeof stock !== 'number' || stock < 0) {
      return res.status(400).json({ message: 'El stock debe ser un número no negativo' });
    }

    const product = await Product.findByIdAndUpdate(
      req.params.id,
      { stock },
      { new: true, runValidators: true }
    );

    if (!product) {
      return res.status(404).json({ message: 'Producto no encontrado' });
    }

    res.json(product);
  } catch (error) {
    res.status(400).json({ message: 'Error al actualizar el stock', error: error.message });
  }
});

module.exports = router; 