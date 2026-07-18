import { useEffect } from 'react';
import { useGoogleLogin } from '@react-oauth/google';
import { setOAuthToken, clearOAuthToken } from '../../services/googleSheets';
import { useAuth } from '../../context/AuthContext';

const GoogleAuth = ({ children }) => {
  const { user, isAuthenticated, login, logout } = useAuth();

  // Check if token exists in localStorage on mount
  useEffect(() => {
    const savedToken = localStorage.getItem('google_oauth_token');
    const savedExpiry = localStorage.getItem('google_oauth_expiry');
    const savedUser = localStorage.getItem('google_oauth_user');
    
    if (savedToken && savedExpiry && Date.now() < parseInt(savedExpiry) && savedUser) {
      setOAuthToken(savedToken, (parseInt(savedExpiry) - Date.now()) / 1000);
      // login should be defined here
      if (login) {
        login(JSON.parse(savedUser), savedToken, (parseInt(savedExpiry) - Date.now()) / 1000);
      }
    }
  }, [login]);

  const googleLogin = useGoogleLogin({
    onSuccess: (response) => {
      const { access_token, expires_in } = response;
      
      // Set OAuth token for API calls
      setOAuthToken(access_token, expires_in);
      
      // Get user info
      fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
        headers: {
          Authorization: `Bearer ${access_token}`,
        },
      })
      .then(res => res.json())
      .then(data => {
        if (login) {
          login(data, access_token, expires_in);
        }
      })
      .catch(err => console.error('Failed to get user info:', err));
    },
    onError: (error) => {
      console.error('Login failed:', error);
    },
    scope: 'https://www.googleapis.com/auth/spreadsheets https://www.googleapis.com/auth/drive.file',
  });

  const handleLogout = () => {
    clearOAuthToken();
    if (logout) {
      logout();
    }
  };

  // Ensure login is defined before rendering children
  if (!login) {
    return null; // or loading state
  }

  return children({
    isAuthenticated,
    user,
    login: googleLogin,
    logout: handleLogout,
  });
};

export default GoogleAuth;