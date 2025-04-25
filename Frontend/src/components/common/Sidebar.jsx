import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
    FiHome,
    FiFileText,
    FiPlusSquare,
    FiSettings,
    FiLogOut,
    FiDatabase,
    FiMenu,
    FiX,
    FiUser,
    FiBell,
    FiMoon,
    FiSun,
} from 'react-icons/fi';
import { AiFillRobot } from 'react-icons/ai';


// Componente SidebarContent
function SidebarContent({ onLinkClick, onLogout, currentPath, isMobile }) {
    const navItems = [
        { path: '/Dashboard', label: 'Dashboard', icon: FiHome },
        { path: '/TicketList', label: 'Tus Tickets', icon: FiFileText },
        { path: '/CreateTicket', label: 'Crear Ticket', icon: FiPlusSquare },
        { path: '/Knowledgebase', label: 'Base Conocimiento', icon: FiDatabase },
        { path: '/VirtualAssistent', label: 'Asistente Virtual', icon: AiFillRobot },
        { path: '/Settings', label: 'Configuración', icon: FiSettings },
    ];

    return (
        <div className={`flex flex-col h-full p-6`}>
            <div className="mb-8 text-left">
                <Link
                    to="/Dashboard"
                    className="font-bold text-2xl text-white hover:text-indigo-300 transition-colors"
                    onClick={onLinkClick}
                >
                    SupportSys
                </Link>
            </div>
            <nav className="flex-grow">
                <ul>
                    {navItems.map((item) => (
                        <motion.li
                            key={item.path}
                            whileHover={{ scale: 1.05 }}
                            className={`mb-2 rounded relative ${
                                currentPath === item.path ? 'bg-indigo-700' : ''
                            }`}
                        >
                            <Link
                                to={item.path}
                                className={`flex items-center py-2 px-4 rounded transition-colors ${
                                    currentPath === item.path
                                        ? 'text-white bg-indigo-600'
                                        : 'text-gray-200 hover:bg-gray-700'
                                }`}
                                onClick={onLinkClick}
                                aria-label={item.label}
                            >
                                <item.icon className="h-5 w-5 mr-3" />
                                <span>{item.label}</span>
                            </Link>
                            {currentPath === item.path && (
                                <motion.div
                                    className="absolute left-0 top-0 h-full w-1 bg-indigo-400"
                                    layoutId="activeIndicator"
                                    transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                                />
                            )}
                        </motion.li>
                    ))}
                </ul>
            </nav>
            <motion.button
                onClick={onLogout}
                className="flex items-center py-2 px-4 bg-red-600 hover:bg-red-700 rounded text-white transition-colors mt-6 w-full justify-center"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                aria-label="Cerrar Sesión"
            >
                <FiLogOut className="h-5 w-5 mr-2" />
                <span>Cerrar Sesión</span>
            </motion.button>
        </div>
    );
}

// Componente NotificationsPanel
function NotificationsPanel({ isOpen, onClose, notifications }) {
    return (
        <motion.aside
            className={`fixed inset-y-0 right-0 z-40 w-80 bg-white dark:bg-gray-800 shadow-lg p-6 transform transition-transform duration-300 ease-in-out ${
                isOpen ? 'translate-x-0' : 'translate-x-full'
            }`}
            initial={false}
            animate={{ x: isOpen ? 0 : '100%' }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
        >
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200">Notificaciones</h2>
                <button
                    onClick={onClose}
                    className="text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-gray-100"
                    aria-label="Cerrar notificaciones"
                >
                    <FiX size={20} />
                </button>
            </div>
            <div className="space-y-4">
                {notifications.length === 0 ? (
                    <p className="text-gray-600 dark:text-gray-400">No hay notificaciones.</p>
                ) : (
                    notifications.map((notification, index) => (
                        <motion.div
                            key={index}
                            className="p-4 bg-gray-100 dark:bg-gray-700 rounded-lg"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.1 }}
                        >
                            <p className="text-gray-800 dark:text-gray-200">{notification.message}</p>
                            <span className="text-sm text-gray-500 dark:text-gray-400">
                                {notification.time}
                            </span>
                        </motion.div>
                    ))
                )}
            </div>
        </motion.aside>
    );
}

// Componente Layout Principal
function Layout({ children }) {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
    const [isDarkTheme, setIsDarkTheme] = useState(() => {
        return localStorage.getItem('theme') === 'dark' || !localStorage.getItem('theme');
    });
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
    const [notifications, setNotifications] = useState([]);

    // Persistencia del tema
    useEffect(() => {
        localStorage.setItem('theme', isDarkTheme ? 'dark' : 'light');
        document.documentElement.classList.toggle('dark', isDarkTheme);
    }, [isDarkTheme]);

    // Simulación de notificaciones
    useEffect(() => {
        const interval = setInterval(() => {
            const newNotification = {
                message: `Nuevo ticket asignado: #${Math.floor(Math.random() * 1000)}`,
                time: new Date().toLocaleTimeString(),
            };
            setNotifications((prev) => [...prev, newNotification].slice(-5));
        }, 30000);
        return () => clearInterval(interval);
    }, []);

    // Cerrar sidebar móvil al cambiar de tamaño
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
        navigate('/');
        setIsDropdownOpen(false);
    };

    const toggleMobileSidebar = () => {
        setIsMobileSidebarOpen(!isMobileSidebarOpen);
    };

    const toggleTheme = () => {
        setIsDarkTheme(!isDarkTheme);
    };

    const toggleDropdown = () => {
        setIsDropdownOpen(!isDropdownOpen);
    };

    const toggleNotifications = () => {
        setIsNotificationsOpen(!isNotificationsOpen);
    };

    const closeMobileSidebarIfNeeded = useCallback(() => {
        if (typeof window !== 'undefined' && window.innerWidth < 768 && isMobileSidebarOpen) {
            setIsMobileSidebarOpen(false);
        }
    }, [isMobileSidebarOpen]);

    // Títulos dinámicos
    const pageTitles = {
        '/Dashboard': 'Dashboard',
        '/TicketList': 'Tus Tickets',
        '/CreateTicket': 'Crear Ticket',
        '/Knowledgebase': 'Base de Conocimiento',
        '/VirtualAssistent': 'Asistente Virtual',
        '/Settings': 'Configuración',
    };
    const currentTitle = pageTitles[location.pathname] || 'Panel de Control';

    if (!user) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900">
                <motion.div
                    className="animate-pulse text-gray-600 dark:text-gray-300"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                >
                    Cargando...
                </motion.div>
            </div>
        );
    }

    const pageVariants = {
        initial: { opacity: 0, x: 20 },
        in: { opacity: 1, x: 0 },
        out: { opacity: 0, x: -20 },
    };
    const pageTransition = {
        type: 'spring',
        stiffness: 100,
        damping: 20,
        duration: 0.4,
    };

    return (
        <div className={`flex min-h-screen ${isDarkTheme ? 'dark' : ''}`}>
            {/* Sidebar Escritorio */}
            <motion.aside
                className="w-64 bg-gray-900 text-gray-100 flex-col justify-between hidden md:flex flex-shrink-0 sticky top-0 h-screen transition-all duration-300"
            >
                <div className="flex flex-col h-full">
                    <SidebarContent
                        onLinkClick={() => {}}
                        onLogout={handleLogout}
                        currentPath={location.pathname}
                        isMobile={false}
                    />
                </div>
            </motion.aside>

            {/* Sidebar Móvil */}
            <motion.aside
                className={`fixed inset-y-0 left-0 z-30 w-64 bg-gray-900 text-gray-100 flex flex-col justify-between transform transition-transform duration-300 ease-in-out md:hidden ${
                    isMobileSidebarOpen ? 'translate-x-0' : '-translate-x-full'
                }`}
                initial={false}
                animate={{ x: isMobileSidebarOpen ? 0 : '-100%' }}
                transition={{ duration: 0.3, ease: 'easeInOut' }}
            >
                <SidebarContent
                    onLinkClick={closeMobileSidebarIfNeeded}
                    onLogout={handleLogout}
                    currentPath={location.pathname}
                    isMobile={true}
                />
            </motion.aside>

            {/* Overlay Móvil */}
            <AnimatePresence>
                {isMobileSidebarOpen && (
                    <motion.div
                        className="fixed inset-0 bg-black bg-opacity-50 z-20 md:hidden"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 0.5 }}
                        exit={{ opacity: 0 }}
                        onClick={toggleMobileSidebar}
                    />
                )}
            </AnimatePresence>

            {/* Contenido Principal */}
            <div className="flex flex-col flex-grow overflow-hidden">
                {/* Header */}
                <motion.header
                    className="bg-white dark:bg-gray-800 shadow py-4 px-6 flex justify-between items-center flex-shrink-0"
                    initial={{ y: -50 }}
                    animate={{ y: 0 }}
                    transition={{ duration: 0.3, ease: 'easeOut' }}
                >
                    <div className="flex items-center">
                        <button
                            onClick={toggleMobileSidebar}
                            className="text-gray-600 dark:text-gray-300 mr-4 p-2 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-500 md:hidden"
                            aria-label={isMobileSidebarOpen ? 'Cerrar menú' : 'Abrir menú'}
                        >
                            {isMobileSidebarOpen ? <FiX size={24} /> : <FiMenu size={24} />}
                        </button>
                        <h1 className="text-xl font-semibold text-gray-700 dark:text-gray-200 hidden sm:block">
                            {currentTitle}
                        </h1>
                        <h1 className="text-xl font-semibold text-gray-700 dark:text-gray-200 block sm:hidden">
                            {currentTitle.split(' ')[0]}
                        </h1>
                    </div>
                    <div className="flex items-center space-x-2">
                        {/* Notificaciones */}
                        <motion.button
                            onClick={toggleNotifications}
                            className="relative p-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            aria-label="Notificaciones"
                        >
                            <FiBell size={20} />
                            {notifications.length > 0 && (
                                <motion.span
                                    className="absolute top-0 right-0 h-4 w-4 bg-red-500 rounded-full text-white text-xs flex items-center justify-center"
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    transition={{ type: 'spring', stiffness: 300 }}
                                >
                                    {notifications.length}
                                </motion.span>
                            )}
                        </motion.button>
                        {/* Tema */}
                        <motion.button
                            onClick={toggleTheme}
                            className="p-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                            whileHover={{ rotate: 360 }}
                            whileTap={{ scale: 0.9 }}
                            aria-label={isDarkTheme ? 'Cambiar a tema claro' : 'Cambiar a tema oscuro'}
                        >
                            {isDarkTheme ? <FiSun size={20} /> : <FiMoon size={20} />}
                        </motion.button>
                        {/* Avatar */}
                        <motion.button
                            onClick={toggleDropdown}
                            className="flex items-center focus:outline-none focus:ring-2 focus:ring-indigo-500 rounded-full"
                            whileHover={{ rotateY: 360 }}
                            transition={{ duration: 0.6 }}
                            aria-label="Opciones de usuario"
                        >
                            <div className="w-10 h-10 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold uppercase flex-shrink-0">
                                {user.username ? user.username.charAt(0) : '?'}
                            </div>
                        </motion.button>
                        {/* Dropdown */}
                        <AnimatePresence>
                            {isDropdownOpen && (
                                <motion.div
                                    className="absolute right-6 top-16 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg py-2 z-50"
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.95 }}
                                    transition={{ duration: 0.2 }}
                                >
                                    <div className="px-4 py-2 text-gray-7
00 dark:text-gray-200 border-b dark:border-gray-700">
                                        <span className="text-sm">{user.username}</span>
                                    </div>
                                    <Link
                                        to="/Settings"
                                        className="flex items-center px-4 py-2 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
                                        onClick={() => setIsDropdownOpen(false)}
                                    >
                                        <FiUser className="mr-2 h-4 w-4" />
                                        Perfil
                                    </Link>
                                    <button
                                        onClick={toggleTheme}
                                        className="w-full flex items-center px-4 py-2 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 text-left"
                                    >
                                        {isDarkTheme ? (
                                            <>
                                                <FiSun className="mr-2 h-4 w-4" />
                                                Tema Claro
                                            </>
                                        ) : (
                                            <>
                                                <FiMoon className="mr-2 h-4 w-4" />
                                                Tema Oscuro
                                            </>
                                        )}
                                    </button>
                                    <button
                                        onClick={handleLogout}
                                        className="w-full flex items-center px-4 py-2 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 text-left"
                                    >
                                        <FiLogOut className="mr-2 h-4 w-4" />
                                        Cerrar Sesión
                                    </button>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </motion.header>

                {/* Notificaciones */}
                <AnimatePresence>
                    {isNotificationsOpen && (
                        <NotificationsPanel
                            isOpen={isNotificationsOpen}
                            onClose={() => setIsNotificationsOpen(false)}
                            notifications={notifications}
                        />
                    )}
                </AnimatePresence>

                {/* Contenido */}
                <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-100 dark:bg-gray-900 p-6">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={location.pathname}
                            variants={pageVariants}
                            initial="initial"
                            animate="in"
                            exit="out"
                            transition={pageTransition}
                        >
                            {children}
                        </motion.div>
                    </AnimatePresence>
                </main>
            </div>
        </div>
    );
}

export default Layout;