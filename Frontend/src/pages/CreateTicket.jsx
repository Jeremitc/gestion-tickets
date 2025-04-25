import React, { useState, useEffect, useCallback } from 'react';
import Layout from '../components/common/Sidebar';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { FiSend, FiLoader, FiAlertCircle, FiCheckCircle, FiX } from 'react-icons/fi';

function CreateTicket() {
  const { token } = useAuth();
  const navigate = useNavigate();

  // Estados del Formulario
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [typeId, setTypeId] = useState('');
  const [categories, setCategories] = useState([]);
  const [ticketTypes, setTicketTypes] = useState([]);
  // Estados de UI
  const [isLoadingCategories, setIsLoadingCategories] = useState(true);
  const [isLoadingTicketTypes, setIsLoadingTicketTypes] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Cargar Categorías
  const fetchCategories = useCallback(async () => {
    if (!token) return;
    setIsLoadingCategories(true);
    setError('');
    try {
      const response = await fetch('http://localhost:3001/tickets/lookup/categories', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        setCategories(data);
      } else {
        throw new Error(`Error ${response.status}: No se pudieron cargar las categorías.`);
      }
    } catch (err) {
      console.error('Error fetching categories:', err);
      setError(err.message || 'Error de conexión al cargar categorías.');
    } finally {
      setIsLoadingCategories(false);
    }
  }, [token]);

  // Cargar Tipos de Ticket
  const fetchTicketTypes = useCallback(async () => {
    if (!token) return;
    setIsLoadingTicketTypes(true);
    setError('');
    try {
      const response = await fetch('http://localhost:3001/tickets/lookup/ticket-types', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        setTicketTypes(data);
      } else {
        throw new Error(`Error ${response.status}: No se pudieron cargar los tipos de ticket.`);
      }
    } catch (err) {
      console.error('Error fetching ticket types:', err);
      setError(err.message || 'Error de conexión al cargar tipos de ticket.');
    } finally {
      setIsLoadingTicketTypes(false);
    }
  }, [token]);

  useEffect(() => {
    fetchCategories();
    fetchTicketTypes();
  }, [fetchCategories, fetchTicketTypes]);

  // Manejador de Envío
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // Validaciones
    if (!title.trim()) {
      setError('El título es obligatorio.');
      return;
    }
    if (title.length < 5) {
      setError('El título debe tener al menos 5 caracteres.');
      return;
    }
    if (!description.trim()) {
      setError('La descripción es obligatoria.');
      return;
    }
    if (description.length < 10) {
      setError('La descripción debe tener al menos 10 caracteres.');
      return;
    }
    if (!categoryId) {
      setError('Debes seleccionar una categoría.');
      return;
    }
    if (!typeId) {
      setError('Debes seleccionar un tipo de ticket.');
      return;
    }
    if (!token) {
      setError('Error de autenticación. Intenta recargar.');
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch('http://localhost:3001/tickets', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim(),
          categoryId: parseInt(categoryId, 10),
          typeId: parseInt(typeId, 10),
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || `Error ${response.status} al crear el ticket.`);
      }

      setSuccess(`Ticket #${result.id} creado exitosamente!`);
      setTitle('');
      setDescription('');
      setCategoryId('');
      setTypeId('');
      setTimeout(() => {
        navigate('/TicketList');
      }, 1500);
    } catch (err) {
      console.error('Error creating ticket:', err);
      setError(err.message || 'Ocurrió un error inesperado.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Layout>
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex justify-between items-center mb-6"
      >
        <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-100">Crear Nuevo Ticket</h2>
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2, duration: 0.5 }}
        className="bg-white dark:bg-gray-800 p-6 sm:p-8 rounded-lg shadow-md max-w-2xl mx-auto"
      >
        {error && (
          <div className="mb-4 flex items-center bg-red-100 dark:bg-red-900/30 border border-red-400 dark:border-red-600/50 text-red-700 dark:text-red-300 px-4 py-3 rounded relative" role="alert">
            <FiAlertCircle className="mr-2 flex-shrink-0" />
            <span className="block sm:inline text-sm">{error}</span>
            <button onClick={() => setError('')} className="absolute top-0 bottom-0 right-0 px-4 py-3" aria-label="Cerrar error">
              <FiX className="h-4 w-4" />
            </button>
          </div>
        )}
        {success && (
          <div className="mb-4 flex items-center bg-green-100 dark:bg-green-900/30 border border-green-400 dark:border-green-600/50 text-green-700 dark:text-green-300 px-4 py-3 rounded relative" role="alert">
            <FiCheckCircle className="mr-2 flex-shrink-0" />
            <span className="block sm:inline text-sm">{success}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate>
          <div className="mb-5">
            <label htmlFor="title" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Título <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={150}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white disabled:opacity-50"
              placeholder="Ej: Error al guardar cambios en perfil"
              required
              disabled={isSubmitting}
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Asunto breve y descriptivo (mín. 5 caracteres).</p>
          </div>

          <div className="mb-5">
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Descripción Detallada <span className="text-red-500">*</span>
            </label>
            <textarea
              id="description"
              rows={6}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white disabled:opacity-50 custom-scrollbar"
              placeholder="Describe el problema o solicitud con el mayor detalle posible. Incluye pasos para reproducirlo si aplica."
              required
              disabled={isSubmitting}
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Proporciona todos los detalles relevantes (mín. 10 caracteres).</p>
          </div>

          <div className="mb-5">
            <label htmlFor="typeId" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Tipo de Ticket <span className="text-red-500">*</span>
            </label>
            <select
              id="typeId"
              value={typeId}
              onChange={(e) => setTypeId(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white disabled:opacity-50 bg-white "
              required
              disabled={isSubmitting || isLoadingTicketTypes}
            >
              <option value="" disabled>
                {isLoadingTicketTypes ? 'Cargando tipos de ticket...' : '-- Selecciona un tipo de ticket --'}
              </option>
              {!isLoadingTicketTypes &&
                ticketTypes.map((type) => (
                  <option key={type.id} value={type.id.toString()}>
                    {type.name}
                  </option>
                ))}
            </select>
            {isLoadingTicketTypes && ticketTypes.length === 0 && (
              <p className="text-xs text-yellow-600 dark:text-yellow-400 mt-1">Cargando opciones...</p>
            )}
            {!isLoadingTicketTypes && ticketTypes.length === 0 && !error && (
              <p className="text-xs text-red-600 dark:text-red-400 mt-1">No hay tipos de ticket disponibles. Contacta al administrador.</p>
            )}
          </div>

          <div className="mb-6">
            <label htmlFor="categoryId" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Categoría <span className="text-red-500">*</span>
            </label>
            <select
              id="categoryId"
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white disabled:opacity-50 bg-white "
              required
              disabled={isSubmitting || isLoadingCategories}
            >
              <option value="" disabled>
                {isLoadingCategories ? 'Cargando categorías...' : '-- Selecciona una categoría --'}
              </option>
              {!isLoadingCategories &&
                categories.map((cat) => (
                  <option key={cat.id} value={cat.id.toString()}>
                    {cat.name}
                  </option>
                ))}
            </select>
            {isLoadingCategories && categories.length === 0 && (
              <p className="text-xs text-yellow-600 dark:text-yellow-400 mt-1">Cargando opciones...</p>
            )}
            {!isLoadingCategories && categories.length === 0 && !error && (
              <p className="text-xs text-red-600 dark:text-red-400 mt-1">No hay categorías disponibles. Contacta al administrador.</p>
            )}
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              className="inline-flex items-center justify-center px-6 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed dark:focus:ring-offset-gray-800"
              disabled={isSubmitting || isLoadingCategories || isLoadingTicketTypes}
            >
              {isSubmitting ? (
                <>
                  <FiLoader className="animate-spin -ml-1 mr-2 h-4 w-4" />
                  Enviando...
                </>
              ) : (
                <>
                  <FiSend className="-ml-1 mr-2 h-4 w-4" />
                  Crear Ticket
                </>
              )}
            </button>
          </div>
        </form>
      </motion.div>
    </Layout>
  );
}

export default CreateTicket;