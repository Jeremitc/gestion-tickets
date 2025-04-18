// src/context/AuthContext.js
import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('accessToken'));
  const [isLoading, setIsLoading] = useState(!!token); // Sigue iniciando true si hay token
  const navigate = useNavigate();

  const logout = useCallback(() => {
    console.log("AUTH_CONTEXT: Logout called");
    localStorage.removeItem('accessToken');
    setToken(null);
    setUser(null);
    setIsLoading(false); // Asegurarse de que no estamos cargando
    navigate('/');
  }, [navigate]);

  // --- Función dedicada para buscar el perfil ---
  const fetchUserProfile = useCallback(async (currentToken) => {
      if (!currentToken) {
          setUser(null);
          setIsLoading(false);
          return;
      }
      console.log("AUTH_CONTEXT: Fetching profile...");
      setIsLoading(true); // Poner cargando ANTES del fetch
      try {
          const response = await fetch('http://localhost:3001/auth/profile', {
              headers: { 'Authorization': `Bearer ${currentToken}` }
          });
          if (response.ok) {
              const userData = await response.json();
              console.log("AUTH_CONTEXT: Profile fetched successfully", userData);
              setUser(userData);
          } else {
              console.error(`AUTH_CONTEXT: Fetch profile failed (${response.status}), logging out.`);
              logout(); // Llama a logout si el token no es válido
          }
      } catch (error) {
          console.error("AUTH_CONTEXT: Error fetching profile:", error);
          // Podrías decidir hacer logout aquí o mostrar un error diferente
          logout(); // Hacer logout si hay error de red, etc.
      } finally {
          console.log("AUTH_CONTEXT: Fetch profile finished. Setting isLoading=false.");
          setIsLoading(false); // Poner fin a la carga SIEMPRE
      }
  }, [logout]); // Depende de logout (que es estable por useCallback)


  // Efecto que se ejecuta al inicio y cuando el token cambia
  useEffect(() => {
      const currentToken = localStorage.getItem('accessToken'); // Lee el token más reciente
      fetchUserProfile(currentToken);
  }, [token, fetchUserProfile]); // Ahora depende de token y la función estable fetchUserProfile


  // Login solo guarda el token y actualiza el estado (dispara el useEffect)
  const login = useCallback((newToken) => {
    console.log("AUTH_CONTEXT: Login function called");
    localStorage.setItem('accessToken', newToken);
    setToken(newToken);
    // NO ponemos setIsLoading(true) aquí, el useEffect se encargará
  }, []);

  // --- NUEVA FUNCIÓN PARA REFRESCAR MANUALMENTE ---
  const refreshProfile = useCallback(() => {
      console.log("AUTH_CONTEXT: Manual refreshProfile called");
      const currentToken = localStorage.getItem('accessToken');
      fetchUserProfile(currentToken); // Reutiliza la lógica de fetch
  }, [fetchUserProfile]); // Depende de fetchUserProfile

  const isAuthenticated = !isLoading && !!token && !!user;

  const value = {
    user,
    token,
    isLoading,
    isAuthenticated,
    login,
    logout,
    refreshProfile // <-- Exporta la nueva función
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => { return useContext(AuthContext); };