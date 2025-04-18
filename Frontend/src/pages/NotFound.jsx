// src/pages/NotFound.jsx (o donde corresponda)

import React from 'react';
import { Link } from 'react-router-dom'; // Para el botón de regreso
import { FiAlertTriangle, FiHome } from 'react-icons/fi'; // Íconos para dar contexto visual
import { motion } from 'framer-motion'; // Para una animación sutil
import '../styles/global.css'; // Tus estilos globales/tailwind

export default function NotFound() {
  return (
    // Contenedor principal: Centra todo vertical y horizontalmente, ocupa toda la pantalla
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-gray-100 to-gray-200 text-center p-6">

      {/* Tarjeta contenedora con animación */}
      <motion.div
        initial={{ opacity: 0, y: -30, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="bg-white p-8 sm:p-12 rounded-xl shadow-2xl max-w-md w-full transform" // Añadido transform para posibles animaciones hover
      >
        {/* Ícono de alerta */}
        <FiAlertTriangle className="text-yellow-500 text-7xl mx-auto mb-6 animate-pulse" /> {/* Animación sutil */}

        {/* Título grande 404 */}
        <h1 className="text-6xl sm:text-8xl font-extrabold text-gray-800 mb-3 tracking-tight">
          404
        </h1>

        {/* Mensaje principal */}
        <h2 className="text-2xl sm:text-3xl font-semibold text-gray-700 mb-4">
          Página No Encontrada
        </h2>

        {/* Descripción amigable */}
        <p className="text-gray-500 mb-8 leading-relaxed">
          Parece que te has perdido en el universo digital. La página que buscas no está aquí.
          ¡No te preocupes! Puedes volver a un lugar seguro.
        </p>

        {/* Botón para volver al Dashboard */}
        <Link
          to="/Dashboard" // Asegúrate que esta ruta sea la correcta para tu Dashboard
          className="inline-flex items-center px-6 py-3 bg-blue-600 text-white font-medium rounded-lg shadow-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-300 ease-in-out transform hover:-translate-y-1 hover:shadow-xl"
        >
          <FiHome className="mr-2 -ml-1 h-5 w-5" /> {/* Ícono en el botón */}
          Volver al Inicio
        </Link>
      </motion.div>

      {/* Pie de página opcional */}
      <footer className="mt-8 text-gray-500 text-sm">
        Si crees que esto es un error, contacta con el soporte.
      </footer>
    </div>
  );
}