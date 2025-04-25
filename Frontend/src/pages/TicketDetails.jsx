import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Layout from '../components/common/Sidebar';
import { motion } from 'framer-motion';
import {
  FiLoader,
  FiAlertCircle,
  FiX,
  FiSend,
  FiLock,
  FiMessageSquare,
} from 'react-icons/fi';

function TicketDetails() {
  const { token, user, isLoading: authLoading } = useAuth();
  const { ticketId } = useParams();
  const navigate = useNavigate();
  const [ticket, setTicket] = useState(null);
  const [statuses, setStatuses] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [comment, setComment] = useState('');
  const [resolutionMessage, setResolutionMessage] = useState('');
  const isAdmin = user?.role === 'admin';
  const canComment =
    ticket &&
    ticket.status.name !== 'Cerrado' &&
    user &&
    (isAdmin ||
      (ticket.creator.id === user.id && user.role !== 'client') ||
      ticket.assignedTo?.id === user.id);

  // Validar ticketId al inicio
  useEffect(() => {
    if (!ticketId || isNaN(parseInt(ticketId))) {
      setError('ID de ticket inválido.');
      setIsLoading(false);
      navigate('/TicketList', { replace: true });
    }
  }, [ticketId, navigate]);

  // Obtener detalles del ticket
  const fetchTicket = useCallback(async () => {
    if (!token || !user) {
      setError('No estás autenticado. Inicia sesión.');
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const response = await fetch(`http://localhost:3001/tickets/${parseInt(ticketId)}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        setTicket(data);
      } else {
        const errorData = await response.json();
        if (response.status === 403) {
          setError('No tienes permiso para ver este ticket.');
        } else if (response.status === 404) {
          setError('Ticket no encontrado.');
        } else {
          setError(`Error ${response.status}: ${errorData.message || 'No se pudo cargar el ticket.'}`);
        }
      }
    } catch (err) {
      console.error('Error al cargar ticket:', err);
      setError('Error de conexión al cargar el ticket. Por favor, intenta de nuevo.');
    } finally {
      setIsLoading(false);
    }
  }, [token, user, ticketId]);

  // Obtener estados
  const fetchStatuses = useCallback(async () => {
    if (!token) return;

    try {
      const response = await fetch('http://localhost:3001/tickets/lookup/statuses', {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        setStatuses(await response.json());
      } else {
        throw new Error('Error al cargar estados');
      }
    } catch (err) {
      console.error('Error al cargar estados:', err);
      setError('Error al cargar opciones de estado.');
    }
  }, [token]);

  // Cargar ticket y estados al iniciar
  useEffect(() => {
    if (!authLoading && user && ticketId && !isNaN(parseInt(ticketId))) {
      fetchTicket();
      fetchStatuses();
    }
  }, [authLoading, user, ticketId, fetchTicket, fetchStatuses]);

  // Añadir comentario
  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!comment.trim()) {
      setError('El comentario no puede estar vacío.');
      return;
    }

    try {
      const response = await fetch(`http://localhost:3001/tickets/${parseInt(ticketId)}/comments`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ content: comment }),
      });

      if (response.ok) {
        setComment('');
        fetchTicket();
      } else {
        const errorData = await response.json();
        if (response.status === 403) {
          setError('No tienes permiso para comentar en este ticket.');
        } else if (response.status === 404) {
          setError('Ticket no encontrado.');
        } else {
          setError(`Error ${response.status}: ${errorData.message || 'Error al añadir el comentario.'}`);
        }
      }
    } catch (err) {
      console.error('Error al añadir comentario:', err);
      setError('Error de conexión al añadir el comentario.');
    }
  };

  // Cerrar ticket con mensaje de resolución (solo admin)
  const handleResolveTicket = async (e) => {
    e.preventDefault();
    if (!resolutionMessage.trim()) {
      setError('El mensaje de resolución no puede estar vacío.');
      return;
    }

    const closedStatus = statuses.find((s) => s.name === 'Cerrado')?.id;
    if (!closedStatus) {
      setError('No se encontró el estado "Cerrado". Contacta al administrador.');
      return;
    }

    try {
      const response = await fetch(`http://localhost:3001/tickets/${parseInt(ticketId)}`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          statusId: closedStatus,
          resolutionMessage,
          closedAt: new Date().toISOString(),
        }),
      });

      if (response.ok) {
        setResolutionMessage('');
        fetchTicket();
      } else {
        const errorData = await response.json();
        if (response.status === 403) {
          setError('No tienes permiso para cerrar este ticket.');
        } else if (response.status === 404) {
          setError('Ticket no encontrado.');
        } else {
          setError(`Error ${response.status}: ${errorData.message || 'Error al cerrar el ticket.'}`);
        }
      }
    } catch (err) {
      console.error('Error al cerrar ticket:', err);
      setError('Error de conexión al cerrar el ticket.');
    }
  };

  // Estilos para badges
  const getBadgeStyles = (type, value) => {
    const styles = {
      status: {
        Nuevo: 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-200',
        'En Progreso': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-200',
        Cerrado: 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-200',
      },
      priority: {
        Baja: 'bg-gray-100 text-gray-800 dark:bg-gray-700/50 dark:text-gray-200',
        Media: 'bg-orange-100 text-orange-800 dark:bg-orange-900/50 dark:text-orange-200',
        Alta: 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-200',
      },
      type: {
        Incidente: 'bg-purple-100 text-purple-800 dark:bg-purple-900/50 dark:text-purple-200',
        Pregunta: 'bg-teal-100 text-teal-800 dark:bg-teal-900/50 dark:text-teal-200',
        Tarea: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/50 dark:text-indigo-200',
      },
    };
    return styles[type][value] || 'bg-gray-100 text-gray-800 dark:bg-gray-700/50 dark:text-gray-200';
  };

  return (
    <Layout>
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-full px-4 sm:px-6 lg:px-8 py-6 mx-auto"
      >
        <h2 className="text-2xl sm:text-3xl font-bold text-gray-800 dark:text-gray-100 mb-6 truncate">
          Detalles del Ticket #{ticketId}
        </h2>

        {error && (
          <div className="mb-6 flex items-center bg-red-100 dark:bg-red-900/30 border-l-4 border-red-500 text-red-700 dark:text-red-300 p-4 rounded-r-lg w-full">
            <FiAlertCircle className="mr-3 h-5 w-5 flex-shrink-0" />
            <span className="text-sm flex-grow break-words">{error}</span>
            <button
              onClick={() => setError('')}
              className="ml-auto p-1"
              aria-label="Cerrar error"
            >
              <FiX className="h-5 w-5" />
            </button>
          </div>
        )}

        {isLoading || authLoading ? (
          <div className="flex justify-center items-center py-8">
            <FiLoader className="animate-spin h-8 w-8 text-indigo-600" />
            <span className="ml-3 text-lg text-gray-600 dark:text-gray-300">
              Cargando ticket...
            </span>
          </div>
        ) : !ticket ? (
          <div className="text-center py-8">
            <p className="text-gray-600 dark:text-gray-400 text-lg">
              No se pudo cargar el ticket.
            </p>
            <button
              onClick={() => navigate('/TicketList')}
              className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              Volver a la lista
            </button>
          </div>
        ) : (
          <div className="bg-white dark:bg-gray-800 p-4 sm:p-6 lg:p-8 rounded-xl shadow-lg w-full">
            {/* Detalles del Ticket */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 mb-8">
              <div className="space-y-2">
                <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 truncate">
                  {ticket.title}
                </h3>
                <p className="text-gray-600 dark:text-gray-300 break-words">
                  {ticket.description}
                </p>
              </div>
              <div className="space-y-2 text-sm sm:text-base">
                <p className="flex flex-wrap items-center">
                  <strong className="text-gray-700 dark:text-gray-300 mr-2">Estado:</strong>
                  <span
                    className={`inline-flex px-3 py-1 rounded-full text-xs sm:text-sm font-semibold ${getBadgeStyles(
                      'status',
                      ticket.status.name
                    )}`}
                  >
                    {ticket.status.name}
                  </span>
                </p>
                <p className="flex flex-wrap items-center">
                  <strong className="text-gray-700 dark:text-gray-300 mr-2">Prioridad:</strong>
                  <span
                    className={`inline-flex px-3 py-1 rounded-full text-xs sm:text-sm font-semibold ${getBadgeStyles(
                      'priority',
                      ticket.priority.name
                    )}`}
                  >
                    {ticket.priority.name}
                  </span>
                </p>
                <p className="flex flex-wrap items-center">
                  <strong className="text-gray-700 dark:text-gray-300 mr-2">Tipo:</strong>
                  <span
                    className={`inline-flex px-3 py-1 rounded-full text-xs sm:text-sm font-semibold ${getBadgeStyles(
                      'type',
                      ticket.type.name
                    )}`}
                  >
                    {ticket.type.name}
                  </span>
                </p>
                <p className="flex flex-wrap">
                  <strong className="text-gray-700 dark:text-gray-300 mr-2">Categoría:</strong>
                  <span className="break-words">{ticket.category.name}</span>
                </p>
                <p className="flex flex-wrap">
                  <strong className="text-gray-700 dark:text-gray-300 mr-2">Creador:</strong>
                  <span className="break-words">{ticket.creator.username}</span>
                </p>
                <p className="flex flex-wrap">
                  <strong className="text-gray-700 dark:text-gray-300 mr-2">Asignado:</strong>
                  <span className="break-words">{ticket.assignedTo?.username || 'No asignado'}</span>
                </p>
                <p className="flex flex-wrap">
                  <strong className="text-gray-700 dark:text-gray-300 mr-2">Creado:</strong>
                  <span className="break-words">
                    {new Date(ticket.created_at).toLocaleDateString('es-ES', {
                      day: '2-digit',
                      month: '2-digit',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </p>
              </div>
            </div>

            {/* Mensaje de Resolución */}
            {ticket.resolutionMessage && (
              <div className="mb-8 p-4 bg-green-100 dark:bg-green-900/30 border-l-4 border-green-500 text-green-700 dark:text-green-300 rounded-r-lg">
                <h4 className="font-semibold text-base sm:text-lg">Resolución:</h4>
                <p className="mt-2 break-words">{ticket.resolutionMessage}</p>
              </div>
            )}

            {/* Lista de Comentarios */}
            <div className="mb-8">
              <h3 className="text-lg sm:text-xl font-semibold text-gray-800 dark:text-gray-100 mb-4 flex items-center">
                <FiMessageSquare className="inline mr-2 h-5 w-5" /> Comentarios
              </h3>
              {ticket.comments.length === 0 ? (
                <p className="text-gray-600 dark:text-gray-400">No hay comentarios aún.</p>
              ) : (
                <div className="space-y-4">
                  {ticket.comments.map((comment) => (
                    <div
                      key={comment.id}
                      className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg w-full"
                    >
                      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-2 gap-2">
                        <span className="font-semibold text-gray-800 dark:text-gray-200 truncate">
                          {comment.user.username} ({comment.user.role})
                        </span>
                        <span className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                          {new Date(comment.created_at).toLocaleDateString('es-ES', {
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>
                      <p className="text-gray-700 dark:text-gray-300 break-words">{comment.content}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Formulario para Añadir Comentario */}
            {canComment && (
              <form onSubmit={handleAddComment} className="mb-8 w-full">
                <label
                  htmlFor="comment"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                >
                  Añadir Comentario
                </label>
                <textarea
                  id="comment"
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Escribe tu comentario..."
                  rows={4}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 transition resize-y"
                />
                <button
                  type="submit"
                  className="mt-3 flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 w-full sm:w-auto"
                >
                  <FiSend className="mr-2 h-4 w-4" />
                  Enviar Comentario
                </button>
              </form>
            )}

            {/* Formulario para Cerrar Ticket (solo admin) */}
            {isAdmin && ticket.status.name !== 'Cerrado' && (
              <form onSubmit={handleResolveTicket} className="w-full">
                <label
                  htmlFor="resolutionMessage"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                >
                  Cerrar Ticket con Mensaje de Resolución
                </label>
                <textarea
                  id="resolutionMessage"
                  value={resolutionMessage}
                  onChange={(e) => setResolutionMessage(e.target.value)}
                  placeholder="Explica cómo se resolvió el problema..."
                  rows={4}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 transition resize-y"
                />
                <button
                  type="submit"
                  className="mt-3 flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors focus:outline-none focus:ring-2 focus:ring-green-500 w-full sm:w-auto"
                >
                  <FiLock className="mr-2 h-4 w-4" />
                  Cerrar Ticket
                </button>
              </form>
            )}
          </div>
        )}
      </motion.div>
    </Layout>
  );
}

export default TicketDetails;