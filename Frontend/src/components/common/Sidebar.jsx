// src/components/Layout.jsx (o donde prefieras guardarlo)
import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext'; // Asume que AuthContext está disponible
import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import {
    FiHome,
    FiFileText,
    FiPlusSquare,
    FiSettings,
    FiLogOut,
    FiDatabase,
    FiMenu,
    FiX,
} from 'react-icons/fi';
import { AiFillRobot } from 'react-icons/ai';

// --- Componente SidebarContent (exactamente como antes) ---
function SidebarContent({ onLinkClick, onLogout }) {
    // ... (mismo código del SidebarContent que ya tienes)
    return (
        <>
            <div className="flex-grow">
                <div className="mb-10 text-center">
                    <Link to="/Dashboard" className="text-2xl font-bold text-white hover:text-blue-300 transition-colors" onClick={onLinkClick}>
                        SoporteSys
                    </Link>
                </div>
                <nav>
                    <ul>
                        <motion.li whileHover={{ x: 5, backgroundColor: "rgba(255, 255, 255, 0.1)" }} className="mb-2 rounded">
                            <Link to="/Dashboard" className="flex items-center py-2 px-4 hover:bg-gray-700 rounded transition-colors" onClick={onLinkClick}>
                                <FiHome className="mr-3" /> Dashboard
                            </Link>
                        </motion.li>
                        {/* ... otros links ... */}
                        <motion.li whileHover={{ x: 5, backgroundColor: "rgba(255, 255, 255, 0.1)" }} className="mb-2 rounded">
                            <Link to="/TicketList" className="flex items-center py-2 px-4 hover:bg-gray-700 rounded transition-colors" onClick={onLinkClick} >
                                <FiFileText className="mr-3" /> Tus Tickets
                            </Link>
                        </motion.li>
                         <motion.li whileHover={{ x: 5, backgroundColor: "rgba(255, 255, 255, 0.1)" }} className="mb-2 rounded">
                             <Link to="/CreateTicket" className="flex items-center py-2 px-4 hover:bg-gray-700 rounded transition-colors" onClick={onLinkClick} >
                                 <FiPlusSquare className="mr-3" /> Crear Ticket
                             </Link>
                         </motion.li>
                         <motion.li whileHover={{ x: 5, backgroundColor: "rgba(255, 255, 255, 0.1)" }} className="mb-2 rounded">
                             <Link to="/knowledgebase" className="flex items-center py-2 px-4 hover:bg-gray-700 rounded transition-colors" onClick={onLinkClick} >
                                 <FiDatabase className="mr-3" /> Base Conocimiento
                             </Link>
                         </motion.li>
                         <motion.li whileHover={{ x: 5, backgroundColor: "rgba(255, 255, 255, 0.1)" }} className="mb-2 rounded">
                             <Link to="/VirtualAssistent" className="flex items-center py-2 px-4 hover:bg-gray-700 rounded transition-colors" onClick={onLinkClick} >
                                 <AiFillRobot className="mr-3" /> Asistente Virtual
                             </Link>
                         </motion.li>
                         <motion.li whileHover={{ x: 5, backgroundColor: "rgba(255, 255, 255, 0.1)" }} className="mb-2 rounded">
                             <Link to="/Settings" className="flex items-center py-2 px-4 hover:bg-gray-700 rounded transition-colors" onClick={onLinkClick} >
                                 <FiSettings className="mr-3" /> Configuración
                             </Link>
                         </motion.li>
                    </ul>
                </nav>
            </div>
            <motion.button onClick={onLogout} className="w-full flex items-center justify-center py-2 px-4 bg-red-600 hover:bg-red-700 rounded text-white transition-colors mt-6" whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <FiLogOut className="mr-2" /> Cerrar Sesión
            </motion.button>
        </>
    );
}

// --- Componente Layout Principal ---
function Layout({ children }) { // Recibe el contenido de la página como children
    const { user, logout } = useAuth(); // Obtiene user y logout del contexto
    const navigate = useNavigate();
    const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

    // Efecto para cerrar sidebar móvil si la pantalla se agranda
    useEffect(() => {
        const handleResize = () => {
            if (window.innerWidth >= 768 && isMobileSidebarOpen) {
                setIsMobileSidebarOpen(false);
            }
        };
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, [isMobileSidebarOpen]);

    const handleLogout = () => {
        logout();
        navigate('/'); // Redirige al login después del logout
    };

    const toggleMobileSidebar = () => {
        setIsMobileSidebarOpen(!isMobileSidebarOpen);
    };

    // Función para cerrar el sidebar móvil al hacer clic en un enlace
    const closeMobileSidebarIfNeeded = useCallback(() => {
        // Comprobación explícita para evitar errores si window no está definido (SSR)
        if (typeof window !== 'undefined' && window.innerWidth < 768 && isMobileSidebarOpen) {
            setIsMobileSidebarOpen(false);
        }
    }, [isMobileSidebarOpen]);

    // Si el usuario no está autenticado (opcional, podrías manejarlo en las rutas)
    if (!user) {
        // Podrías mostrar un loader o redirigir aquí, o dejar que las rutas lo manejen
        return (
             <div className="flex items-center justify-center min-h-screen bg-gray-100">
                 Cargando...
             </div>
         );
    }

    // --- Variantes de animación para el contenido de la página ---
     const pageVariants = {
         initial: { opacity: 0, y: 20 },
         in: { opacity: 1, y: 0 },
         out: { opacity: 0, y: -20 },
     };
     const pageTransition = {
         type: "tween",
         ease: "anticipate",
         duration: 0.5, // Ajusta duración si quieres
     };


    return (
        <div className="flex min-h-screen bg-gray-100">

            {/* --- Sidebar para Escritorio --- */}
            <aside className="w-64 bg-gray-800 text-gray-100 p-6 flex-col justify-between hidden md:flex flex-shrink-0">
                 <SidebarContent onLinkClick={() => {}} onLogout={handleLogout} /> {/* onLinkClick vacío para escritorio */}
            </aside>

            {/* --- Sidebar para Móvil (Overlay) --- */}
            <motion.aside
                className={`fixed inset-y-0 left-0 z-30 w-64 bg-gray-800 text-gray-100 p-6 flex flex-col justify-between transform transition-transform duration-300 ease-in-out md:hidden ${
                    isMobileSidebarOpen ? 'translate-x-0' : '-translate-x-full'
                }`}
            >
                 <SidebarContent onLinkClick={closeMobileSidebarIfNeeded} onLogout={handleLogout} />
            </motion.aside>

            {/* --- Overlay oscuro --- */}
            {isMobileSidebarOpen && (
                <div
                    className="fixed inset-0 bg-black bg-opacity-50 z-20 md:hidden"
                    onClick={toggleMobileSidebar}
                ></div>
            )}

            {/* --- Contenido Principal (Header + children) --- */}
            <div className="flex flex-col flex-grow overflow-hidden">

                 {/* Header */}
                 <motion.header
                     className="bg-white shadow py-4 px-6 flex justify-between items-center flex-shrink-0"
                     initial={{ y: -50 }} // Animación ligeramente diferente
                     animate={{ y: 0 }}
                     transition={{ duration: 0.3, ease: "easeOut" }}
                 >
                     <div className="flex items-center">
                         {/* Botón Hamburguesa */}
                         <button
                             onClick={toggleMobileSidebar}
                             className="text-gray-600 mr-4 p-2 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500 md:hidden"
                             aria-label="Abrir menú"
                         >
                             {isMobileSidebarOpen ? <FiX size={24} /> : <FiMenu size={24} />}
                         </button>
                         {/* Títulos (Puedes hacerlos dinámicos si quieres pasándolos como prop al Layout) */}
                         <h1 className="text-xl font-semibold text-gray-700 hidden sm:block">Panel de Control</h1>
                         <h1 className="text-xl font-semibold text-gray-700 block sm:hidden">Panel</h1>
                     </div>

                     {/* Info Usuario */}
                     <div className="flex items-center">
                         <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold mr-3 uppercase flex-shrink-0">
                             {user.username ? user.username.charAt(0) : '?'}
                         </div>
                         <span className="text-gray-600 mr-4 hidden sm:inline">Hola, {user.username}!</span>
                     </div>
                 </motion.header>

                 {/* Área de Contenido Específico de la Página */}
                 {/* Aquí es donde se renderizará el contenido de Dashboard, Settings, etc. */}
                 <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-100 p-6">
                    {/* Añadimos animación al contenedor del contenido de la página */}
                    <motion.div
                        key={window.location.pathname} // Clave para animar en cambio de ruta
                        variants={pageVariants}
                        initial="initial"
                        animate="in"
                        exit="out"
                        transition={pageTransition}
                    >
                         {children} {/* Renderiza el contenido pasado */}
                    </motion.div>
                 </main>
            </div>
        </div>
    );
}

export default Layout;