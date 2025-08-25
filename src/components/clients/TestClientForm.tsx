import React, { useState } from 'react';
import {
  Box,
  TextField,
  Button,
  Typography,
  Paper,
  Alert,
} from '@mui/material';
import axios from 'axios';
import { API_BASE_URL } from '../../config';

const TestClientForm = () => {
  const [formData, setFormData] = useState({
    name: 'Test Client',
    document: '12345678',
    email: 'test@test.com',
    phone: '123456789',
    status: true
  });
  
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleChange = (field: string) => (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    setFormData({
      ...formData,
      [field]: e.target.value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setMessage(null);
      setError(null);
      
      // Log all request data
      console.log('Test form - Sending data:', {
        ...formData,
        document: String(formData.document) // Ensure document is a string
      });
      
      // Make a direct axios request to test
      const response = await axios.post(`${API_BASE_URL}/clients`, {
        ...formData,
        document: String(formData.document) // Ensure document is a string
      });
      
      setMessage('Cliente creado exitosamente: ' + JSON.stringify(response.data));
    } catch (err: any) {
      console.error('Test form error:', err);
      setError(err.response?.data?.error || err.message || 'Error desconocido');
    }
  };

  return (
    <Paper sx={{ p: 4, maxWidth: 500, mx: 'auto', mt: 4 }}>
      <Typography variant="h5" sx={{ mb: 2 }}>
        Test de Creación de Cliente
      </Typography>
      
      {message && (
        <Alert severity="success" sx={{ mb: 2 }}>
          {message}
        </Alert>
      )}
      
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          Error: {error}
        </Alert>
      )}
      
      <form onSubmit={handleSubmit}>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <TextField
            label="Nombre"
            value={formData.name}
            onChange={handleChange('name')}
            required
          />
          
          <TextField
            label="Documento"
            value={formData.document}
            onChange={handleChange('document')}
            required
            helperText="Este campo es el que causa el error"
          />
          
          <TextField
            label="Email"
            value={formData.email}
            onChange={handleChange('email')}
            required
          />
          
          <TextField
            label="Teléfono"
            value={formData.phone}
            onChange={handleChange('phone')}
            required
          />
          
          <Button 
            type="submit" 
            variant="contained" 
            sx={{ mt: 2 }}
          >
            Probar Creación de Cliente
          </Button>
        </Box>
      </form>
      
      <Typography variant="subtitle2" sx={{ mt: 4 }}>
        Datos que se enviarán al servidor:
      </Typography>
      <pre style={{ background: '#f5f5f5', padding: 8, overflowX: 'auto' }}>
        {JSON.stringify(formData, null, 2)}
      </pre>
    </Paper>
  );
};

export default TestClientForm;
