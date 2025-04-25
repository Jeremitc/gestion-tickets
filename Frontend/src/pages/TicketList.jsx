import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/common/Sidebar';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import {
  FiLoader,
  FiAlertCircle,
  FiX,
  FiRefreshCw,
  FiTrash2,
  FiPlus,
} from 'react-icons/fi';

function TicketList() {
  const { token, user, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [tickets, setTickets] = useState([]);
  const [filteredTickets, setFilteredTickets] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState({
    status: '', type: '', priority: '', creator: '', assigned: '', title: '',
  });
  const [statuses, setStatuses] = useState([]);
  const [types, setTypes] = useState([]);
  const [priorities, setPriorities] = useState([]);
  const [users, setUsers] = useState([]);
  const isAdmin = user?.role === 'admin';

  const fetchTickets = useCallback(async () => {
    // ... (fetchTickets logic - sin cambios visuales)
    if (!token) { setError('No estás autenticado. Inicia sesión.'); setIsLoading(false); return; }
    setIsLoading(true); setError('');
    try {
      const response = await fetch('http://localhost:3001/tickets', { headers: { Authorization: `Bearer ${token}` } });
      if (response.ok) { const data = await response.json(); setTickets(data); setFilteredTickets(data); }
      else { const errorText = await response.text(); throw new Error(`Error ${response.status}: ${errorText || 'No se pudieron cargar los tickets.'}`); }
    } catch (err) { console.error('Error al cargar tickets:', err); setError(err.message || 'Error de conexión al cargar los tickets.'); }
    finally { setIsLoading(false); }
  }, [token]);

  const fetchLookups = useCallback(async () => {
    // ... (fetchLookups logic - sin cambios visuales)
     if (!token) return;
     try {
      const [statusRes, typeRes, priorityRes, usersRes] = await Promise.all([
        fetch('http://localhost:3001/tickets/lookup/statuses', { headers: { Authorization: `Bearer ${token}` } }),
        fetch('http://localhost:3001/tickets/lookup/ticket-types', { headers: { Authorization: `Bearer ${token}` } }),
        fetch('http://localhost:3001/tickets/lookup/priorities', { headers: { Authorization: `Bearer ${token}` } }),
        isAdmin ? fetch('http://localhost:3001/users', { headers: { Authorization: `Bearer ${token}` } }) : Promise.resolve({ ok: true, json: () => [] }),
      ]);
      if (statusRes.ok) setStatuses(await statusRes.json()); else throw new Error('Error al cargar estados');
      if (typeRes.ok) setTypes(await typeRes.json()); else throw new Error('Error al cargar tipos');
      if (priorityRes.ok) setPriorities(await priorityRes.json()); else throw new Error('Error al cargar prioridades');
      if (usersRes.ok) setUsers(await usersRes.json()); else throw new Error('Error al cargar usuarios');
    } catch (err) { console.error('Error al cargar filtros:', err); setError('Error al cargar opciones de filtro.'); }
  }, [token, isAdmin]);

  useEffect(() => {
    if (!authLoading) { fetchTickets(); fetchLookups(); }
  }, [authLoading, fetchTickets, fetchLookups]);

  useEffect(() => {
    // ... (filter logic - sin cambios visuales)
    let result = [...tickets];
    if (filters.status) result = result.filter((ticket) => ticket.status.name === filters.status);
    if (filters.type) result = result.filter((ticket) => ticket.type.name === filters.type);
    if (filters.priority) result = result.filter((ticket) => ticket.priority.name === filters.priority);
    if (filters.creator) result = result.filter((ticket) => ticket.creator.id === parseInt(filters.creator));
    if (filters.assigned) result = result.filter((ticket) => ticket.assignedTo?.id === parseInt(filters.assigned));
    if (filters.title) result = result.filter((ticket) => ticket.title.toLowerCase().includes(filters.title.toLowerCase()));
    setFilteredTickets(result);
  }, [tickets, filters]);

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  const handleRowClick = (ticketId) => {
    navigate(`/TicketDetails/${ticketId}`);
  };

  const handleRefresh = () => {
    fetchTickets();
  };

  const handleUpdate = async (ticketId, field, value) => {
    // ... (update logic - sin cambios visuales, pero los errores ahora usan setError)
    try {
      const updateData = {};
      if (field === 'status') updateData.statusId = parseInt(value);
      if (field === 'priority') updateData.priorityId = parseInt(value);
      if (field === 'assignedTo') updateData.assignedToId = value ? parseInt(value) : null;

      const response = await fetch(`http://localhost:3001/tickets/${ticketId}`, {
        method: 'PATCH', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }, body: JSON.stringify(updateData),
      });
      if (response.ok) { fetchTickets(); }
      else {
          const errorText = await response.text();
          if (response.status === 403) { setError('No tienes permiso para actualizar este ticket.'); }
          else if (response.status === 404) { setError('Ticket no encontrado.'); }
          else { setError(`Error ${response.status}: ${errorText || 'Error al actualizar el ticket.'}`); }
      }
    } catch (err) { console.error('Error al actualizar:', err); setError('Error de conexión al actualizar el ticket.'); }
  };

  const handleDelete = async (ticketId) => {
    // ... (delete logic - sin cambios visuales, pero los errores ahora usan setError)
    try {
      const response = await fetch(`http://localhost:3001/tickets/${ticketId}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
      if (response.ok) { fetchTickets(); }
      else {
          const errorText = await response.text();
          if (response.status === 403) { setError('No tienes permiso para eliminar este ticket.'); }
          else if (response.status === 404) { setError('Ticket no encontrado.'); }
          else { setError(`Error ${response.status}: ${errorText || 'Error al eliminar el ticket.'}`); }
      }
    } catch (err) { console.error('Error al eliminar:', err); setError('Error de conexión al eliminar el ticket.'); }
  };

  // Estilos para los badges (ya incluían dark mode, se mantiene)
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

  // --- Componente Renderizado con mejoras Responsive y Dark Mode ---
  return (
    <Layout>
      {/* --- Header --- */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        // Responsive header: stack on small screens, space-between on larger
        className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4"
      >
        <h2 className="text-2xl sm:text-3xl font-bold text-gray-800 dark:text-gray-100">
          {isAdmin ? 'Panel: Tickets' : 'Mis Tickets'}
        </h2>
        <div className="flex space-x-2 sm:space-x-3 w-full sm:w-auto">
          {/* Buttons adjusted for smaller screens */}
          <button
            onClick={() => navigate('/CreateTicket')}
            className="flex-1 sm:flex-none flex items-center justify-center px-3 py-2 sm:px-4 sm:py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors focus:outline-none focus:ring-2 focus:ring-green-500 text-sm sm:text-base"
          >
            <FiPlus className="mr-1 sm:mr-2 h-4 w-4" />
            Nuevo
          </button>
          <button
            onClick={handleRefresh}
            className="flex-1 sm:flex-none flex items-center justify-center px-3 py-2 sm:px-4 sm:py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50 text-sm sm:text-base"
            disabled={isLoading || authLoading}
          >
            <FiRefreshCw className={`mr-1 sm:mr-2 h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            Refrescar
          </button>
        </div>
      </motion.div>

      {/* --- Main Content Area --- */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2, duration: 0.5 }}
        // Responsive padding and dark mode background
        className="bg-white dark:bg-gray-800 p-4 sm:p-6 lg:p-8 rounded-xl shadow-lg"
      >
        {/* --- Error Message --- */}
        {error && (
          <div className="mb-6 flex items-center bg-red-100 dark:bg-red-900/30 border-l-4 border-red-500 text-red-700 dark:text-red-300 p-3 sm:p-4 rounded-r-lg">
            <FiAlertCircle className="mr-2 sm:mr-3 h-5 w-5 flex-shrink-0" />
            <span className="text-sm flex-grow">{error}</span>
            <button
              onClick={() => setError('')}
              className="ml-2 sm:ml-auto text-red-700 dark:text-red-300 hover:text-red-900 dark:hover:text-red-100 p-1 rounded-md focus:outline-none focus:ring-1 focus:ring-red-500"
              aria-label="Cerrar error"
            >
              <FiX className="h-4 w-4 sm:h-5 sm:w-5" />
            </button>
          </div>
        )}

        {/* --- Barra de Filtros (Responsive Grid) --- */}
        <div className="mb-8 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
          {/* Estado Filter */}
          <div>
            <label htmlFor="status" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Estado</label>
            <select id="status" name="status" value={filters.status} onChange={handleFilterChange}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 transition text-sm">
              <option value="">Todos</option>
              {statuses.map((status) => <option key={status.id} value={status.name}>{status.name}</option>)}
            </select>
          </div>
          {/* Tipo Filter */}
          <div>
            <label htmlFor="type" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Tipo</label>
            <select id="type" name="type" value={filters.type} onChange={handleFilterChange}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 transition text-sm">
              <option value="">Todos</option>
              {types.map((type) => <option key={type.id} value={type.name}>{type.name}</option>)}
            </select>
          </div>
          {/* Prioridad Filter */}
          <div>
            <label htmlFor="priority" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Prioridad</label>
            <select id="priority" name="priority" value={filters.priority} onChange={handleFilterChange}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 transition text-sm">
              <option value="">Todos</option>
              {priorities.map((priority) => <option key={priority.id} value={priority.name}>{priority.name}</option>)}
            </select>
          </div>
          {/* Creador Filter (Admin Only) */}
          {isAdmin && (
            <div>
              <label htmlFor="creator" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Creador</label>
              <select id="creator" name="creator" value={filters.creator} onChange={handleFilterChange}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 transition text-sm">
                <option value="">Todos</option>
                {users.map((u) => <option key={u.id} value={u.id}>{u.username}</option>)}
              </select>
            </div>
          )}
          {/* Asignado Filter (Admin Only) */}
          {isAdmin && (
            <div>
              <label htmlFor="assigned" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Asignado</label>
              <select id="assigned" name="assigned" value={filters.assigned} onChange={handleFilterChange}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 transition text-sm">
                <option value="">Todos</option>
                {users.filter(u => ['agent', 'support'].includes(u.role)).map((u) => <option key={u.id} value={u.id}>{u.username}</option>)}
              </select>
            </div>
          )}
          {/* Título Filter */}
          <div className={isAdmin ? '' : 'sm:col-span-2 md:col-span-1'}> {/* Ocupa más espacio si no es admin */}
            <label htmlFor="title" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Buscar Título</label>
            <input id="title" name="title" type="text" value={filters.title} onChange={handleFilterChange} placeholder="Buscar..."
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 transition placeholder-gray-400 dark:placeholder-gray-500 text-sm"/>
          </div>
        </div>

        {/* --- Loading State --- */}
        {isLoading || authLoading ? (
          <div className="flex justify-center items-center py-8">
            <FiLoader className="animate-spin h-8 w-8 text-indigo-600 dark:text-indigo-400" />
            <span className="ml-3 text-lg text-gray-600 dark:text-gray-300">Cargando tickets...</span>
          </div>
        ) :
        /* --- Empty State --- */
        filteredTickets.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-600 dark:text-gray-400 text-lg mb-4">
              No hay tickets que coincidan con los filtros.
            </p>
            <button
              onClick={() => navigate('/CreateTicket')}
              className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
               <FiPlus className="mr-2 h-4 w-4" />
              Crea uno nuevo
            </button>
          </div>
        ) : (
          /* --- Tickets Table (with Horizontal Scroll) --- */
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700 border border-gray-200 dark:border-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-700/50">
                <tr>
                  {/* Headers con dark mode y responsive visibility */}
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wider whitespace-nowrap">ID</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wider">Título</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wider whitespace-nowrap">Tipo</th>
                  {/* Ocultar Categoría en pantallas pequeñas */}
                  <th className="hidden md:table-cell px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wider whitespace-nowrap">Categoría</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wider whitespace-nowrap">Estado</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wider whitespace-nowrap">Prioridad</th>
                  {/* Ocultar Creador y Asignado en pantallas medianas/pequeñas */}
                  {isAdmin && (
                    <>
                      <th className="hidden lg:table-cell px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wider whitespace-nowrap">Creador</th>
                      <th className="hidden lg:table-cell px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wider whitespace-nowrap">Asignado</th>
                    </>
                  )}
                   {/* Ocultar Creado en pantallas extra pequeñas */}
                  <th className="hidden sm:table-cell px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wider whitespace-nowrap">Creado</th>
                  {isAdmin && (
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wider whitespace-nowrap">Acciones</th>
                  )}
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {filteredTickets.map((ticket) => (
                  <tr key={ticket.id} onClick={() => handleRowClick(ticket.id)}
                      className="hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer transition-colors duration-150">

                    {/* ID Cell */}
                    <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-indigo-600 dark:text-indigo-400">{ticket.id}</td>

                    {/* Título Cell (with truncation) */}
                    <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100 max-w-[200px] sm:max-w-xs md:max-w-sm lg:max-w-md truncate" title={ticket.title}>{ticket.title}</td>

                    {/* Tipo Cell (Badge) */}
                    <td className="px-4 py-3 whitespace-nowrap text-xs">
                      <span className={`inline-flex px-2.5 py-0.5 rounded-full font-semibold ${getBadgeStyles('type', ticket.type.name)}`}>{ticket.type.name}</span>
                    </td>

                    {/* Categoría Cell (Hidden on small screens) */}
                    <td className="hidden md:table-cell px-4 py-3 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">{ticket.category.name}</td>

                    {/* Estado Cell (Select for Admin, Badge otherwise) */}
                    <td className="px-4 py-3 whitespace-nowrap text-xs">
                      {isAdmin ? (
                        <select value={ticket.status.id} onChange={(e) => handleUpdate(ticket.id, 'status', e.target.value)} onClick={(e) => e.stopPropagation()}
                                className="w-full text-xs px-2 py-1 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:focus:ring-indigo-400 transition">
                          {statuses.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                        </select>
                      ) : (
                        <span className={`inline-flex px-2.5 py-0.5 rounded-full font-semibold ${getBadgeStyles('status', ticket.status.name)}`}>{ticket.status.name}</span>
                      )}
                    </td>

                    {/* Prioridad Cell (Select for Admin, Badge otherwise) */}
                    <td className="px-4 py-3 whitespace-nowrap text-xs">
                      {isAdmin ? (
                        <select value={ticket.priority.id} onChange={(e) => handleUpdate(ticket.id, 'priority', e.target.value)} onClick={(e) => e.stopPropagation()}
                                className="w-full text-xs px-2 py-1 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:focus:ring-indigo-400 transition">
                          {priorities.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                        </select>
                      ) : (
                        <span className={`inline-flex px-2.5 py-0.5 rounded-full font-semibold ${getBadgeStyles('priority', ticket.priority.name)}`}>{ticket.priority.name}</span>
                      )}
                    </td>

                    {/* Creador & Asignado Cells (Admin Only, Hidden on smaller screens) */}
                    {isAdmin && (
                      <>
                        <td className="hidden lg:table-cell px-4 py-3 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">{ticket.creator.username}</td>
                        <td className="hidden lg:table-cell px-4 py-3 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">{ticket.assignedTo?.username || <span className="text-gray-400 italic">N/A</span>}</td>
                      </>
                    )}

                    {/* Creado Cell (Hidden on extra small screens) */}
                    <td className="hidden sm:table-cell px-4 py-3 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">
                      {new Date(ticket.created_at).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                    </td>

                    {/* Acciones Cell (Admin Only) */}
                    {isAdmin && (
                      <td className="px-4 py-3 whitespace-nowrap text-sm flex items-center space-x-2">
                         {/* Assign User Select */}
                        <select value={ticket.assignedTo?.id || ''} onChange={(e) => handleUpdate(ticket.id, 'assignedTo', e.target.value)} onClick={(e) => e.stopPropagation()} title="Asignar agente"
                                className="flex-grow min-w-[100px] text-xs px-2 py-1 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:focus:ring-indigo-400 transition">
                          <option value="">Sin asignar</option>
                          {users.filter(u => ['agent', 'support'].includes(u.role)).map(u => <option key={u.id} value={u.id}>{u.username}</option>)}
                        </select>
                         {/* Delete Button */}
                        <button onClick={(e) => { e.stopPropagation(); if (window.confirm(`¿Seguro que quieres eliminar el ticket #${ticket.id}?`)) { handleDelete(ticket.id); } }}
                                className="p-1.5 text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 rounded-md hover:bg-red-100 dark:hover:bg-red-900/50 focus:outline-none focus:ring-1 focus:ring-red-500" title="Eliminar ticket">
                          <FiTrash2 className="h-4 w-4" />
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </motion.div>
    </Layout>
  );
}

export default TicketList;