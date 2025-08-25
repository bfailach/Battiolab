// routes/clients.routes.js
const express = require('express');
const router = express.Router();
const Client = require('../models/Client');

// Obtener todos los clientes
router.get('/', async (req, res) => {
  try {
    const clients = await Client.find().sort({ createdAt: -1 });
    res.json(clients);
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener los clientes', error: error.message });
  }
});

// Obtener un cliente por ID
router.get('/:id', async (req, res) => {
  try {
    const client = await Client.findById(req.params.id);
    if (!client) {
      return res.status(404).json({ message: 'Cliente no encontrado' });
    }
    res.json(client);
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener el cliente', error: error.message });
  }
});

// Crear un nuevo cliente
router.post('/', async (req, res) => {
  console.log('BODY RECIBIDO:', req.body);
  console.log('BODY TYPE:', typeof req.body);
  // Debugging para ver structure completa
  console.log('BODY KEYS:', Object.keys(req.body));
  console.log('DOCUMENT VALUE:', req.body.document);
  console.log('DATOS COMPLETOS:', JSON.stringify(req.body, null, 2));

  try {
    // Extract and sanitize fields
    const name = req.body.name?.trim();
    const document = req.body.document ? String(req.body.document).trim() : undefined;
    const email = req.body.email?.trim();
    const phone = req.body.phone?.trim();
    const status = req.body.status !== undefined ? Boolean(req.body.status) : true;

    console.log('CAMPOS PROCESADOS:', { name, document, email, phone, status });

    // Validar campos mínimos
    if (!name || !document || !email || !phone) {
      console.log('Faltan campos:', { name, document, email, phone });
      return res.status(400).json({ 
        message: 'Faltan campos requeridos',
        error: `Campos requeridos: ${!name ? 'name, ' : ''}${!document ? 'document, ' : ''}${!email ? 'email, ' : ''}${!phone ? 'phone' : ''}`.replace(/, $/, '')
      });
    }

    // Validación básica de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      console.log('Email formato inválido:', email);
      return res.status(400).json({ message: 'El formato del email es inválido', error: 'Invalid_email_format' });
    }

    // Verificar duplicados
    const existsEmail = await Client.findOne({ email });
    if (existsEmail) {
      console.log('Email duplicado:', email);
      return res.status(400).json({ message: 'Ya existe un cliente con ese email', error: 'Duplicate_email' });
    }
    
    const existsDoc = await Client.findOne({ document });
    if (existsDoc) {
      console.log('Documento duplicado:', document);
      return res.status(400).json({ message: 'Ya existe un cliente con ese documento', error: 'Duplicate_document' });
    }

    // Crear cliente explícitamente, sin confiar en la destructuración
    const clientData = {
      name: name,
      document: document,
      email: email,
      phone: phone,
      status: status
    };
    
    console.log('CREATING CLIENT WITH:', clientData);
    
    const client = new Client(clientData);
    const saved = await client.save();
    res.status(201).json(saved);
  } catch (error) {
    console.error('ERROR CREATING CLIENT:', error);
    
    // Errores de validación de Mongoose
    if (error.name === 'ValidationError') {
      const details = Object.values(error.errors).map(e => e.message);
      console.log('Validation error details:', details);
      return res.status(400).json({
        message: 'Error al crear el cliente',
        error: error.message
      });
    }
    // Índice único duplicado
    if (error.code === 11000) {
      return res.status(400).json({
        message: 'Clave duplicada',
        field: Object.keys(error.keyValue)[0]
      });
    }
    // Otros errores
    res.status(400).json({ message: 'Error al crear el cliente', error: error.message });
  }
});

// Actualizar un cliente
router.put('/:id', async (req, res) => {
  console.log('BODY RECIBIDO PUT:', req.body);
  try {
    const { name, document, email, phone, status } = req.body;

    // Validar campos mínimos
    if (!name || !document || !email || !phone || status === undefined) {
      return res.status(400).json({ message: 'Faltan campos requeridos para actualizar' });
    }

    // Verificar duplicados en email/doc
    if (email) {
      const dupEmail = await Client.findOne({ email, _id: { $ne: req.params.id } });
      if (dupEmail) return res.status(400).json({ message: 'Ya existe un cliente con ese email' });
    }
    if (document) {
      const dupDoc = await Client.findOne({ document, _id: { $ne: req.params.id } });
      if (dupDoc) return res.status(400).json({ message: 'Ya existe un cliente con ese documento' });
    }

    const updated = await Client.findByIdAndUpdate(
      req.params.id,
      { name, document, email, phone, status },
      { new: true, runValidators: true }
    );

    if (!updated) {
      return res.status(404).json({ message: 'Cliente no encontrado' });
    }
    res.json(updated);
  } catch (error) {
    if (error.name === 'ValidationError') {
      const details = Object.values(error.errors).map(e => e.message);
      return res.status(400).json({ message: 'Error de validación al actualizar el cliente', errors: details });
    }
    res.status(500).json({ message: 'Error interno al actualizar el cliente', error: error.message });
  }
});

// Eliminar un cliente
router.delete('/:id', async (req, res) => {
  try {
    const deleted = await Client.findByIdAndDelete(req.params.id);
    if (!deleted) {
      return res.status(404).json({ message: 'Cliente no encontrado' });
    }
    res.json({ message: 'Cliente eliminado correctamente' });
  } catch (error) {
    res.status(500).json({ message: 'Error al eliminar el cliente', error: error.message });
  }
});

module.exports = router;
