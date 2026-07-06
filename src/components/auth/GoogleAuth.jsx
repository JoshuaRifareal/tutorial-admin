import { useEffect, useState } from 'react';
import { useGoogleLogin } from '@react-oauth/google';
import { setOAuthToken, clearOAuthToken } from '../../services/googleSheets';

const GoogleAuth = ({ children, onAuthChange }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);

  // Check if token exists in localStorage on mount
  useEffect(() => {
    const savedToken = localStorage.getItem('google_oauth_token');
    const savedExpiry = localStorage.getItem('google_oauth_expiry');
    const savedUser = localStorage.getItem('google_oauth_user');
    
    if (savedToken && savedExpiry && Date.now() < parseInt(savedExpiry)) {
      setToken(savedToken);
      setOAuthToken(savedToken, (parseInt(savedExpiry) - Date.now()) / 1000);
      setIsAuthenticated(true);
      if (savedUser) {
        setUser(JSON.parse(savedUser));
      }
      if (onAuthChange) onAuthChange(true);
    }
  }, []);

  const login = useGoogleLogin({
    onSuccess: (response) => {
      const { access_token, expires_in } = response;
      
      // Store token
      setToken(access_token);
      setOAuthToken(access_token, expires_in);
      setIsAuthenticated(true);
      
      // Store in localStorage
      localStorage.setItem('google_oauth_token', access_token);
      localStorage.setItem('google_oauth_expiry', String(Date.now() + (expires_in * 1000)));
      
      // Get user info
      fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
        headers: {
          Authorization: `Bearer ${access_token}`,
        },
      })
      .then(res => res.json())
      .then(data => {
        setUser(data);
        localStorage.setItem('google_oauth_user', JSON.stringify(data));
        if (onAuthChange) onAuthChange(true);
      })
      .catch(err => console.error('Failed to get user info:', err));
    },
    onError: (error) => {
      console.error('Login failed:', error);
      if (onAuthChange) onAuthChange(false);
    },
    scope: 'https://www.googleapis.com/auth/spreadsheets https://www.googleapis.com/auth/drive.file',
  });

  const logout = () => {
    setToken(null);
    setUser(null);
    setIsAuthenticated(false);
    clearOAuthToken();
    localStorage.removeItem('google_oauth_token');
    localStorage.removeItem('google_oauth_expiry');
    localStorage.removeItem('google_oauth_user');
    if (onAuthChange) onAuthChange(false);
  };

  return children({
    isAuthenticated,
    user,
    login,
    logout,
    token,
  });
};

export default GoogleAuth;