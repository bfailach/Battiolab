import http, { SESSION_KEY } from '../api/http';

export interface SessionUser {
  id: string;
  email: string;
  name?: string;
  role: 'admin' | 'user' | string;
  siteCode?: string;
}

export interface AuthResponse {
  token: string;
  user: SessionUser;
}

export interface RegisterData {
  email: string;
  password: string;
  siteCode: string;
  name?: string;
}

const save = (data: AuthResponse) => {
  localStorage.setItem(SESSION_KEY, JSON.stringify(data));
  return data;
};

const authService = {
  async login(email: string, password: string): Promise<AuthResponse> {
    const { data } = await http.post<AuthResponse>('/auth/login', { email, password });
    return save(data);
  },
  async register(payload: RegisterData): Promise<AuthResponse> {
    const { data } = await http.post<AuthResponse>('/auth/register', payload);
    return save(data);
  },
  async me(): Promise<SessionUser> {
    const { data } = await http.get<SessionUser>('/auth/me');
    return data;
  },
  getCurrentUser(): AuthResponse | null {
    try {
      const raw = localStorage.getItem(SESSION_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  },
  logout() {
    localStorage.removeItem(SESSION_KEY);
  }
};

export default authService;
