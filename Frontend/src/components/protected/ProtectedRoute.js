// src/components/ProtectedRoute.js
import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
// Asegúrate que la ruta sea correcta (probablemente '../../' si está en src/components/protected)
import { useAuth } from '../../context/AuthContext'; // O '../../context/AuthContext'

const ProtectedRoute = () => {
  // Obtenemos isLoading y token del contexto
  const { token, isLoading } = useAuth();

  // --- Lógica de Protección ---
  if (isLoading) {
    // Si estamos verificando el token/cargando el usuario, muestra un mensaje/spinner
    return <div>Verificando autenticación...</div>; // O tu componente de carga preferido
  }

  // Si ya no estamos cargando (isLoading es false):
  // Verificamos si existe el token. Si no hay token, redirigimos al login.
  // La comprobación de si el token es válido ya la hizo el useEffect en AuthContext
  // (llamando a logout si era inválido, lo que pondría token a null y nos traería aquí).
  // La condición `!!user` es una doble seguridad, aunque con `!!token` podría bastar si confías en logout.
  if (!token) {
     return <Navigate to="/" replace />;
  }

  // Si no está cargando y hay un token, el usuario está autenticado. Renderiza la ruta hija.
  return <Outlet />;
};

export default ProtectedRoute;