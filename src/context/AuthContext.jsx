import { createContext, useContext, useState, useEffect, useCallback } from 'react';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Check if token exists in localStorage on mount
  useEffect(() => {
    const savedUser = localStorage.getItem('google_oauth_user');
    const savedToken = localStorage.getItem('google_oauth_token');
    const savedExpiry = localStorage.getItem('google_oauth_expiry');
    
    if (savedToken && savedExpiry && Date.now() < parseInt(savedExpiry) && savedUser) {
      setUser(JSON.parse(savedUser));
      setIsAuthenticated(true);
    }
  }, []);

  const login = useCallback((userData, token, expiresIn) => {
    setUser(userData);
    setIsAuthenticated(true);
    localStorage.setItem('google_oauth_user', JSON.stringify(userData));
    localStorage.setItem('google_oauth_token', token);
    localStorage.setItem('google_oauth_expiry', String(Date.now() + (expiresIn * 1000)));
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    setIsAuthenticated(false);
    localStorage.removeItem('google_oauth_user');
    localStorage.removeItem('google_oauth_token');
    localStorage.removeItem('google_oauth_expiry');
  }, []);

  return (
    <AuthContext.Provider value={{ user, isAuthenticated, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};