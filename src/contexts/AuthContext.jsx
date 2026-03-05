import { createContext, useState, useContext, useEffect } from 'react';

const AuthContext = createContext();

const BACKEND_URL = 'http://localhost:5000/api';

export function AuthProvider({ children }) {
  const [token, setToken] = useState(localStorage.getItem('auth_token') || null);
  const [username, setUsername] = useState(localStorage.getItem('auth_username') || null);
  const [isAuthenticated, setIsAuthenticated] = useState(!!token);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Update isAuthenticated when token changes
  useEffect(() => {
    setIsAuthenticated(!!token);
  }, [token]);

  const login = async (username, password) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${BACKEND_URL}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      const data = await response.json();
      if (data.success) {
        const { token, username: user } = data;
        setToken(token);
        setUsername(user);
        localStorage.setItem('auth_token', token);
        localStorage.setItem('auth_username', user);
        setError(null);
        return { success: true };
      } else {
        setError(data.message || 'Login failed');
        return { success: false, message: data.message };
      }
    } catch (err) {
      setError('Network error: ' + err.message);
      return { success: false, message: err.message };
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    if (token) {
      try {
        await fetch(`${BACKEND_URL}/logout`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
        });
      } catch (err) {
        console.error('Logout API error:', err);
      }
    }
    setToken(null);
    setUsername(null);
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_username');
    setError(null);
  };

  const fetchData = async () => {
    if (!token) {
      throw new Error('Not authenticated');
    }
    const response = await fetch(`${BACKEND_URL}/data`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!response.ok) {
      if (response.status === 401) {
        logout();
        throw new Error('Authentication expired');
      }
      throw new Error(`Failed to fetch data: ${response.status}`);
    }
    return response.json();
  };

  const updateData = async (newData) => {
    if (!token) {
      throw new Error('Not authenticated');
    }
    const response = await fetch(`${BACKEND_URL}/data`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ data: newData }),
    });
    if (!response.ok) {
      if (response.status === 401) {
        logout();
        throw new Error('Authentication expired');
      }
      throw new Error(`Failed to update data: ${response.status}`);
    }
    return response.json();
  };

  const value = {
    token,
    username,
    isAuthenticated,
    loading,
    error,
    login,
    logout,
    fetchData,
    updateData,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}