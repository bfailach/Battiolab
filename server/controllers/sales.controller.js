const Sale = require('../models/Sale');

const getSales = async (req, res) => {
  try {
    console.log('Fetching sales...');
    
    const sales = await Sale.find()
      .sort({ date: -1 })
      .populate('items.productId', 'name price')
      .populate('client', 'name email phone')
      .lean();

    console.log(`Found ${sales.length} sales`);
    
    const transformedSales = sales.map(sale => {
      try {
        // Handle potentially missing client reference
        const client = sale.client || {};
        
        return {
          id: sale._id.toString(),
          client: {
            id: client._id ? client._id.toString() : 'unknown',
            name: client.name || 'Cliente desconocido',
            email: client.email || 'N/A',
            phone: client.phone || 'N/A'
          },
          items: (sale.items || []).map(item => {
            // Handle potentially missing product reference
            const product = item.productId || {};
            return {
              productId: product._id ? product._id.toString() : 'unknown',
              productName: product.name || 'Producto desconocido',
              quantity: item.quantity || 0,
              price: item.price || 0,
              subtotal: (item.price || 0) * (item.quantity || 0)
            };
          }),
          total: sale.total || 0,
          status: sale.status || 'unknown',
          date: sale.date ? sale.date.toISOString() : new Date().toISOString()
        };
      } catch (itemError) {
        console.error('Error transforming sale item:', itemError);
        return null;
      }
    }).filter(Boolean); // Filter out any null items from transformation errors

    res.json(transformedSales);
  } catch (error) {
    res.status(500).json({ 
      error: 'Error en el servidor',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
};

const getSaleById = async (req, res) => {
  try {
    const saleId = req.params.id || req.body.id;
    console.log(`Fetching sale with ID: ${saleId}`);
    
    const sale = await Sale.findById(saleId)
      .populate('items.productId', 'name price')
      .populate('client', 'name email phone')
      .lean();

    if (!sale) {
      return res.status(404).json({ message: 'Venta no encontrada' });
    }

    // Handle potentially missing client reference
    const client = sale.client || {};
    
    const transformedSale = {
      id: sale._id.toString(),
      client: {
        id: client._id ? client._id.toString() : 'unknown',
        name: client.name || 'Cliente desconocido',
        email: client.email || 'N/A',
        phone: client.phone || 'N/A'
      },
      items: (sale.items || []).map(item => {
        // Handle potentially missing product reference
        const product = item.productId || {};
        return {
          productId: product._id ? product._id.toString() : 'unknown',
          productName: product.name || 'Producto desconocido',
          quantity: item.quantity || 0,
          price: item.price || 0,
          subtotal: (item.price || 0) * (item.quantity || 0)
        };
      }),
      total: sale.total || 0,
      status: sale.status || 'unknown',
      date: sale.date ? sale.date.toISOString() : new Date().toISOString()
    };

    res.json(transformedSale);
  } catch (error) {
    res.status(500).json({ 
      error: 'Error en el servidor',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
};

const createSale = async (req, res) => {
  try {
    console.log('Creating new sale:', JSON.stringify(req.body));
    
    const sale = new Sale(req.body);
    const savedSale = await sale.save();
    
    console.log('Sale created successfully with ID:', savedSale._id);
    res.status(201).json(savedSale);
  } catch (error) {
    console.error('Error creating sale:', error);
    res.status(400).json({ 
      message: error.message,
      error: 'Error al crear la venta',
      timestamp: new Date().toISOString()
    });
  }
};

const updateSale = async (req, res) => {
  try {
    if (!req.params.id) {
      return res.status(400).json({ 
        error: 'ID de venta no proporcionado', 
        message: 'Se requiere un ID válido para actualizar la venta',
        timestamp: new Date().toISOString()
      });
    }

    console.log('Update sale request body:', JSON.stringify(req.body, null, 2));
    
    // Get the original sale first
    const originalSale = await Sale.findById(req.params.id);
    
    if (!originalSale) {
      return res.status(404).json({ message: 'Venta no encontrada' });
    }
    
    // Clean up the update data to prevent ObjectId casting issues
    const updateData = { ...req.body };
    
    // If client has an invalid ID or is the special "unknown" placeholder, use the original client
    if (updateData.client && 
        (!updateData.client.id || 
         updateData.client.id === 'unknown' || 
         updateData.client.id.length !== 24)) {
      console.log('Using original client ID instead of invalid ID');
      updateData.client = originalSale.client;
    }
    
    // Filter out any items with invalid product IDs
    if (updateData.items) {
      updateData.items = updateData.items.filter(item => {
        if (!item.productId || item.productId === 'unknown' || item.productId.length !== 24) {
          console.log('Filtering out item with invalid productId:', item.productId);
          return false;
        }
        return true;
      });
      
      // If all items were filtered out, keep the original items
      if (updateData.items.length === 0) {
        updateData.items = originalSale.items;
      }
    }
    
    console.log('Cleaned update data:', JSON.stringify(updateData, null, 2));
    
    const sale = await Sale.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );
    
    res.json(sale);
  } catch (error) {
    console.error('Error al actualizar venta:', error);
    res.status(400).json({ 
      error: 'Error al actualizar la venta',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
};

const deleteSale = async (req, res) => {
  try {
    const sale = await Sale.findByIdAndDelete(req.params.id);
    if (!sale) {
      return res.status(404).json({ message: 'Venta no encontrada' });
    }
    res.json({ message: 'Venta eliminada' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getSales,
  getSaleById,
  createSale,
  updateSale,
  deleteSale
};
