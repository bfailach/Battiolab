const express = require('express');
const router = express.Router();
const Employee = require('../models/Employee');

// Obtener todos los empleados
router.get('/', async (req, res) => {
  try {
    const employees = await Employee.find()
      .sort({ createdAt: -1 });
    res.json(employees);
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener los empleados', error: error.message });
  }
});

// Obtener un empleado por ID
router.get('/:id', async (req, res) => {
  try {
    const employee = await Employee.findById(req.params.id);
    if (!employee) {
      return res.status(404).json({ message: 'Empleado no encontrado' });
    }
    res.json(employee);
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener el empleado', error: error.message });
  }
});

// Crear un nuevo empleado
router.post('/', async (req, res) => {
  try {
    const { name, email, phone, position, department, status, hireDate, salary } = req.body;
    
    // Verificar si ya existe un empleado con ese email
    const existingEmployee = await Employee.findOne({ email });
    if (existingEmployee) {
      return res.status(400).json({ message: 'Ya existe un empleado con ese email' });
    }

    const employee = new Employee({
      name,
      email,
      phone,
      position,
      department,
      status,
      hireDate,
      salary
    });

    const savedEmployee = await employee.save();
    res.status(201).json(savedEmployee);
  } catch (error) {
    res.status(400).json({ message: 'Error al crear el empleado', error: error.message });
  }
});

// Actualizar un empleado
router.put('/:id', async (req, res) => {
  try {
    const { name, email, phone, position, department, status, hireDate, salary } = req.body;
    
    // Si se está actualizando el email, verificar que no exista ya
    if (email) {
      const existingEmployee = await Employee.findOne({ 
        email, 
        _id: { $ne: req.params.id } 
      });
      if (existingEmployee) {
        return res.status(400).json({ message: 'Ya existe un empleado con ese email' });
      }
    }

    const updatedEmployee = await Employee.findByIdAndUpdate(
      req.params.id,
      { name, email, phone, position, department, status, hireDate, salary },
      { new: true, runValidators: true }
    );

    if (!updatedEmployee) {
      return res.status(404).json({ message: 'Empleado no encontrado' });
    }

    res.json(updatedEmployee);
  } catch (error) {
    res.status(400).json({ message: 'Error al actualizar el empleado', error: error.message });
  }
});

// Eliminar un empleado
router.delete('/:id', async (req, res) => {
  try {
    const deletedEmployee = await Employee.findByIdAndDelete(req.params.id);
    if (!deletedEmployee) {
      return res.status(404).json({ message: 'Empleado no encontrado' });
    }
    res.json({ message: 'Empleado eliminado correctamente' });
  } catch (error) {
    res.status(500).json({ message: 'Error al eliminar el empleado', error: error.message });
  }
});

module.exports = router; 