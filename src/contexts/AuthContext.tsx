import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import authService, { AuthResponse, RegisterData } from '../services/auth.service';

interface AuthContextType {
  user: AuthResponse | null;
  isAdmin: boolean;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth debe usarse dentro de AuthProvider');
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthResponse | null>(() => authService.getCurrentUser());
  const [loading, setLoading] = useState(Boolean(authService.getCurrentUser()));

  const logout = useCallback(() => {
    authService.logout();
    setUser(null);
  }, []);

  // Valida la sesión guardada contra el servidor al abrir la app
  useEffect(() => {
    const stored = authService.getCurrentUser();
    if (!stored) return;
    authService
      .me()
      .then((me) => {
        const next = { ...stored, user: { ...stored.user, ...me } };
        localStorage.setItem('user', JSON.stringify(next));
        setUser(next);
      })
      // Sin conexión se conserva la sesión; un token inválido ya fue limpiado por el interceptor
      .catch(() => setUser(authService.getCurrentUser()))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    const onExpired = () => setUser(null);
    window.addEventListener('battiolab:session-expired', onExpired);
    return () => window.removeEventListener('battiolab:session-expired', onExpired);
  }, []);

  const login = async (email: string, password: string) => setUser(await authService.login(email, password));
  const register = async (data: RegisterData) => setUser(await authService.register(data));

  return (
    <AuthContext.Provider value={{ user, isAdmin: user?.user.role === 'admin', loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
