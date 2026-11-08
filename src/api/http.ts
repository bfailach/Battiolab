import axios, { AxiosError } from 'axios';
import { API_BASE_URL } from '../config';

export const SESSION_KEY = 'user';

/** Cliente HTTP compartido: agrega el token y normaliza los mensajes de error. */
const http = axios.create({ baseURL: API_BASE_URL });

http.interceptors.request.use((config) => {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    const token = raw ? JSON.parse(raw).token : null;
    if (token) config.headers.Authorization = `Bearer ${token}`;
  } catch {
    // sesión corrupta: se ignora y el servidor responderá 401
  }
  return config;
});

http.interceptors.response.use(
  (response) => response,
  (error: AxiosError<{ message?: string; error?: string }>) => {
    if (error.response?.status === 401 && !error.config?.url?.startsWith('/auth/')) {
      localStorage.removeItem(SESSION_KEY);
      window.dispatchEvent(new Event('battiolab:session-expired'));
    }
    const message = error.response
      ? error.response.data?.message || error.response.data?.error || `Error ${error.response.status}`
      : 'No hay conexión con el servidor. Revisa que el backend esté encendido en el puerto 3006.';
    return Promise.reject(new Error(message));
  }
);

/** Mongo devuelve _id; la UI trabaja con id. */
export const withId = <T extends { _id?: string; id?: string }>(doc: T): T & { id: string } => ({
  ...doc,
  id: (doc.id || doc._id) as string
});

export default http;

/** Las imágenes subidas se guardan como /uploads/archivo; se sirven desde el mismo servidor del API. */
export const API_ORIGIN = API_BASE_URL.replace(/\/api\/?$/, '');
export const assetUrl = (path?: string) => (!path ? undefined : /^(https?:|data:)/.test(path) ? path : `${API_ORIGIN}${path}`);
