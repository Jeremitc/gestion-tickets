// src/pages/Dashboard.jsx (o donde esté tu Dashboard)
import React from 'react';
import { useAuth } from '../context/AuthContext'; // Aún necesario para el saludo
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { FiFileText, FiPlusSquare, FiDatabase } from 'react-icons/fi';
import Layout from '../components/common/Sidebar'; // Importa el nuevo Layout

// Las variantes de animación de los items pueden quedarse aquí si son específicas del dashboard
const itemVariants = {
    hidden: { opacity: 0, scale: 0.95 },
    visible: { opacity: 1, scale: 1 },
};

function Dashboard() {
    const { user } = useAuth(); // Solo necesitas user para el saludo específico aquí

    // No necesitas el estado del sidebar, ni useEffect, ni handleLogout aquí.
    // El Layout se encarga de eso.

    // El if (!user) también puede ser manejado por el Layout o las rutas.

    return (
        // Envuelve TODO el contenido específico de esta página en el componente Layout
        <Layout>
            {/* El contenido que ANTES estaba dentro del <main> y <motion.div> principal */}
            {/* Puedes quitar el motion.div externo si la animación del Layout es suficiente, */}
            {/* o mantenerlo si quieres una animación anidada. */}

            {/* Saludo específico del Dashboard */}
            <motion.h2
                className="text-2xl font-semibold text-gray-800 mb-6"
                initial={{ opacity: 0, x: -50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }} // Ajusta delay si animas desde Layout
            >
                Bienvenido a tu Dashboard, {user?.username || 'Usuario'}
            </motion.h2>

            {/* Contenido del dashboard (Tarjetas) */}
            <motion.div
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                initial="hidden"
                animate="visible"
                variants={{
                    visible: {
                        transition: {
                            staggerChildren: 0.1,
                        },
                    },
                }}
            >
                 <motion.div
                     className="bg-white p-6 rounded-lg shadow-md hover:shadow-xl transition-shadow"
                     variants={itemVariants}
                 >
                     <FiFileText className="text-3xl text-blue-500 mb-3" />
                     <h3 className="text-lg font-semibold text-gray-700 mb-2">Mis Tickets</h3>
                     <p className="text-gray-600 text-sm mb-4">
                         Visualiza y gestiona los tickets que has creado o te han asignado.
                     </p>
                     <Link to="/TicketList" className="text-blue-600 hover:underline text-sm font-medium">
                         Ver mis tickets →
                     </Link>
                 </motion.div>

                 {/* ... Otras tarjetas ... */}
                 <motion.div
                     className="bg-white p-6 rounded-lg shadow-md hover:shadow-xl transition-shadow"
                     variants={itemVariants}
                 >
                     <FiPlusSquare className="text-3xl text-green-500 mb-3" />
                     <h3 className="text-lg font-semibold text-gray-700 mb-2">Crear Nuevo Ticket</h3>
                     <p className="text-gray-600 text-sm mb-4">
                         ¿Necesitas ayuda? Abre un nuevo ticket de soporte detallando tu problema.
                     </p>
                     <Link to="/CreateTicket" className="text-green-600 hover:underline text-sm font-medium">
                         Abrir ticket →
                     </Link>
                 </motion.div>

                 <motion.div
                     className="bg-white p-6 rounded-lg shadow-md hover:shadow-xl transition-shadow"
                     variants={itemVariants}
                 >
                     <FiDatabase className="text-3xl text-purple-500 mb-3" />
                     <h3 className="text-lg font-semibold text-gray-700 mb-2">Base de Conocimiento</h3>
                     <p className="text-gray-600 text-sm mb-4">
                         Encuentra respuestas a preguntas frecuentes y guías útiles.
                     </p>
                     <Link to="/knowledgebase" className="text-purple-600 hover:underline text-sm font-medium">
                         Explorar →
                     </Link>
                 </motion.div>

            </motion.div>
        </Layout>
    );
}

export default Dashboard;