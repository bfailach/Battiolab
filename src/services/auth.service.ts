import axios from 'axios';
import { API_BASE_URL } from '../config';

const API_URL = `${API_BASE_URL}/auth`;

export interface RegisterData {
  email: string;
  password: string;
  siteCode: string;
}

export interface LoginData {
  email: string;
  password: string;
}

export interface AuthResponse {
  token: string;
  user: {
    id: string;
    email: string;
    role: string;
  };
}

class AuthService {
  async login(data: LoginData): Promise<AuthResponse> {
    try {
      const response = await axios.post(`${API_URL}/login`, data);
      if (response.data.token) {
        localStorage.setItem('user', JSON.stringify(response.data));
        return response.data;
      }
      throw new Error('No se recibió un token válido');
    } catch (error: any) {
      if (error.response) {
        // El servidor respondió con un estado de error
        throw new Error(error.response.data.message || 'Error en el servidor');
      } else if (error.request) {
        // La petición fue hecha pero no se recibió respuesta
        throw new Error('No se pudo conectar con el servidor. Por favor, intente más tarde.');
      } else {
        // Error al configurar la petición
        throw new Error('Error al procesar la solicitud. Por favor, intente más tarde.');
      }
    }
  }

  async register(data: RegisterData): Promise<AuthResponse> {
    try {
      console.log('Auth Service - Sending registration request to:', `${API_URL}/register`);
      console.log('Auth Service - Registration data:', data);
      
      const response = await axios.post(`${API_URL}/register`, data);
      console.log('Auth Service - Registration success response:', response.data);
      
      if (response.data.token) {
        localStorage.setItem('user', JSON.stringify(response.data));
        return response.data;
      }
      throw new Error('No se recibió un token válido');
    } catch (error: any) {
      console.error('Auth Service - Registration error:', error);
      
      if (error.response) {
        // Detailed error logging
        console.error('Auth Service - Server response error:', {
          status: error.response.status,
          statusText: error.response.statusText,
          data: error.response.data,
          headers: error.response.headers
        });
        
        const errorMessage = error.response.data.error || error.response.data.message || 'Error en el servidor';
        throw new Error(errorMessage);
      } else if (error.request) {
        console.error('Auth Service - No response received:', error.request);
        throw new Error('No se pudo conectar con el servidor. Por favor, intente más tarde.');
      } else {
        console.error('Auth Service - Request setup error:', error.message);
        throw new Error('Error al procesar la solicitud. Por favor, intente más tarde.');
      }
    }
  }

  getCurrentUser() {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      return JSON.parse(userStr);
    }
    return null;
  }

  logout() {
    localStorage.removeItem('user');
  }
}

export default new AuthService();
