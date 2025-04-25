import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('accessToken'));
  const [isLoading, setIsLoading] = useState(!!localStorage.getItem('accessToken'));
  const navigate = useNavigate();

  const logout = useCallback(() => {
    console.log("AUTH_CONTEXT: Logout called");
    localStorage.removeItem('accessToken');
    setToken(null);
    setUser(null);
    setIsLoading(false);
    navigate('/');
  }, [navigate]);

  const fetchUserProfile = useCallback(async (currentToken) => {
    if (!currentToken) {
      setUser(null);
      setIsLoading(false);
      return;
    }

    console.log("AUTH_CONTEXT: Fetching profile...");
    setIsLoading(true);
    try {
      const response = await fetch('http://localhost:3001/auth/profile', {
        headers: { 'Authorization': `Bearer ${currentToken}` },
      });
      if (response.ok) {
        const userData = await response.json();
        console.log("AUTH_CONTEXT: Profile fetched successfully", userData);
        setUser(userData);
      } else {
        console.error(`AUTH_CONTEXT: Fetch profile failed (${response.status}), logging out.`);
        logout();
      }
    } catch (error) {
      console.error("AUTH_CONTEXT: Error fetching profile:", error);
      logout();
    } finally {
      console.log("AUTH_CONTEXT: Fetch profile finished. Setting isLoading=false.");
      setIsLoading(false);
    }
  }, [logout]);

  // Evitar dobles llamadas al iniciar
  useEffect(() => {
    const currentToken = localStorage.getItem('accessToken');
    if (currentToken && !user) {
      fetchUserProfile(currentToken);
    } else if (!currentToken) {
      setIsLoading(false);
    }
  }, [fetchUserProfile, user]); // Added 'user' to the dependency array

  const login = useCallback((newToken) => {
    console.log("AUTH_CONTEXT: Login function called");
    localStorage.setItem('accessToken', newToken);
    setToken(newToken);
  }, []);

  const refreshProfile = useCallback(() => {
    console.log("AUTH_CONTEXT: Manual refreshProfile called");
    const currentToken = localStorage.getItem('accessToken');
    fetchUserProfile(currentToken);
  }, [fetchUserProfile]);

  const isAuthenticated = !isLoading && !!token && !!user;

  const value = {
    user,
    token,
    isLoading,
    isAuthenticated,
    login,
    logout,
    refreshProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  return useContext(AuthContext);
};