import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { FiFileText, FiPlusSquare, FiDatabase, FiBarChart2, FiMessageSquare } from 'react-icons/fi';
import Layout from '../components/common/Sidebar';

const itemVariants = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: { opacity: 1, scale: 1, transition: { duration: 0.3 } },
};

function Dashboard() {
  const { user, token } = useAuth();
  const [stats, setStats] = useState({ openTickets: 0, inProgressTickets: 0, closedTickets: 0 });

  // Obtener estadísticas básicas de tickets
  useEffect(() => {
    if (token) {
      const fetchStats = async () => {
        try {
          const response = await fetch('http://localhost:3001/tickets', {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (response.ok) {
            const tickets = await response.json();
            const open = tickets.filter(t => t.status.name === 'Nuevo').length;
            const inProgress = tickets.filter(t => t.status.name === 'En Progreso').length;
            const closed = tickets.filter(t => t.status.name === 'Cerrado').length;
            setStats({ openTickets: open, inProgressTickets: inProgress, closedTickets: closed });
          }
        } catch (err) {
          console.error('Error al cargar estadísticas:', err);
        }
      };
      fetchStats();
    }
  }, [token]);

  // Mensaje de bienvenida según el rol
  const welcomeMessage = user?.role === 'admin'
    ? `¡Hola, ${user?.username}! Gestiona todos los tickets como administrador.`
    : user?.role === 'client'
    ? `¡Bienvenido, ${user?.username}! Crea y sigue tus tickets de soporte.`
    : `¡Hola, ${user?.username}! Revisa tus tickets asignados.`;

  return (
    <Layout>
      <motion.div
        className="max-w-6xl mx-auto p-6"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        {/* Encabezado */}
        <motion.h2
          className="text-3xl font-bold text-gray-800 dark:text-gray-100 mb-2"
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
        >
          {welcomeMessage}
        </motion.h2>
        <motion.p
          className="text-gray-600 dark:text-gray-300 mb-8"
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          Usa las opciones abajo para gestionar tus tickets o explorar la base de conocimiento.
        </motion.p>

        {/* Tarjetas */}
        <motion.div
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
          initial="hidden"
          animate="visible"
          variants={{
            visible: { transition: { staggerChildren: 0.1 } },
          }}
        >
          {/* Tarjeta: Mis Tickets */}
          <motion.div
            className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg hover:shadow-xl transition-shadow border border-gray-200 dark:border-gray-700"
            variants={itemVariants}
          >
            <FiFileText className="text-4xl text-blue-500 mb-4" />
            <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-100 mb-2">Mis Tickets</h3>
            <p className="text-gray-600 dark:text-gray-300 text-sm mb-4">
              Visualiza y gestiona los tickets que has creado o te han asignado.
            </p>
            <Link
              to="/TicketList"
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Ver tickets <span className="ml-2">→</span>
            </Link>
          </motion.div>

          {/* Tarjeta: Crear Ticket */}
          <motion.div
            className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg hover:shadow-xl transition-shadow border border-gray-200 dark:border-gray-700"
            variants={itemVariants}
          >
            <FiPlusSquare className="text-4xl text-green-500 mb-4" />
            <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-100 mb-2">Crear Nuevo Ticket</h3>
            <p className="text-gray-600 dark:text-gray-300 text-sm mb-4">
              ¿Necesitas ayuda? Abre un nuevo ticket de soporte detallando tu problema.
            </p>
            <Link
              to="/CreateTicket"
              className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              Crear ticket <span className="ml-2">→</span>
            </Link>
          </motion.div>

          {/* Tarjeta: Base de Conocimiento */}
          <motion.div
            className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg hover:shadow-xl transition-shadow border border-gray-200 dark:border-gray-700"
            variants={itemVariants}
          >
            <FiDatabase className="text-4xl text-purple-500 mb-4" />
            <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-100 mb-2">Base de Conocimiento</h3>
            <p className="text-gray-600 dark:text-gray-300 text-sm mb-4">
              Encuentra respuestas a preguntas frecuentes y guías útiles.
            </p>
            <Link
              to="/Knowledgebase"
              className="inline-flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
            >
              Explorar <span className="ml-2">→</span>
            </Link>
          </motion.div>

          {/* Tarjeta: Estadísticas (Nueva) */}
          <motion.div
            className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg hover:shadow-xl transition-shadow border border-gray-200 dark:border-gray-700"
            variants={itemVariants}
          >
            <FiBarChart2 className="text-4xl text-indigo-500 mb-4" />
            <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-100 mb-2">Estadísticas</h3>
            <p className="text-gray-600 dark:text-gray-300 text-sm mb-4">
              Tickets abiertos: {stats.openTickets}<br />
              En progreso: {stats.inProgressTickets}<br />
              Cerrados: {stats.closedTickets}
            </p>
            <Link
              to="/TicketList"
              className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
            >
              Ver detalles <span className="ml-2">→</span>
            </Link>
          </motion.div>

          {/* Tarjeta: Asistente Virtual (Nueva) */}
          <motion.div
            className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg hover:shadow-xl transition-shadow border border-gray-200 dark:border-gray-700"
            variants={itemVariants}
          >
            <FiMessageSquare className="text-4xl text-teal-500 mb-4" />
            <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-100 mb-2">Asistente Virtual</h3>
            <p className="text-gray-600 dark:text-gray-300 text-sm mb-4">
              Chatea con nuestro asistente para obtener ayuda rápida o crear tickets.
            </p>
            <Link
              to="/VirtualAssistent"
              className="inline-flex items-center px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors"
            >
              Chatear <span className="ml-2">→</span>
            </Link>
          </motion.div>
        </motion.div>
      </motion.div>
    </Layout>
  );
}

export default Dashboard;