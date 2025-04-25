import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import Layout from '../components/common/Sidebar';
import {
    FiSend, FiCheckCircle, FiAlertTriangle, FiCopy, FiTrash2, FiMoon, FiSun,
    FiLoader, FiPlusCircle, FiMessageSquare, FiTrash, FiMenu, FiX
} from 'react-icons/fi';
import { AiFillRobot } from 'react-icons/ai';
import ReactMarkdown from 'react-markdown';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

// --- Variantes de animación ---
const messageVariants = {
    hidden: { opacity: 0, x: (props) => (props.isUser ? 30 : -30), scale: 0.9 },
    visible: { opacity: 1, x: 0, scale: 1, transition: { duration: 0.3, ease: 'easeOut' } },
};
const alertVariants = {
    hidden: { opacity: 0, scale: 0.95 },
    visible: { opacity: 1, scale: 1, transition: { duration: 0.2 } },
    exit: { opacity: 0, scale: 0.95, transition: { duration: 0.2 } },
};
const chatContainerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};
const mobileMenuVariants = {
    closed: { x: '-100%', transition: { duration: 0.3, ease: 'easeOut' } },
    open: { x: 0, transition: { duration: 0.3, ease: 'easeIn' } },
};
const backdropVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1 },
    exit: { opacity: 0 },
};

// --- Componente Principal ---
function VirtualAssistent() {
    // --- Hooks y Contexto ---
    const { token } = useAuth(); // Removed unused 'user'
    const { conversationId: paramConversationId } = useParams();
    const navigate = useNavigate();

    // --- Estados del Componente ---
    const [prompt, setPrompt] = useState('');
    const [context, setContext] = useState('general');
    const [history, setHistory] = useState([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isLoadingHistory, setIsLoadingHistory] = useState(false);
    const [isLoadingConversations, setIsLoadingConversations] = useState(true);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [isDarkMode, setIsDarkMode] = useState(false);
    const [typingMessage, setTypingMessage] = useState('');
    const [conversations, setConversations] = useState([]);
    const [selectedConversationId, setSelectedConversationId] = useState(null);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    // --- Referencias DOM ---
    const messagesEndRef = useRef(null);
    const textareaRef = useRef(null);
    const chatContainerRef = useRef(null);

    // --- Efecto para Cargar y Guardar Tema ---
    useEffect(() => {
        const savedTheme = localStorage.getItem('theme');
        if (savedTheme) {
            setIsDarkMode(savedTheme === 'dark');
        } else {
            setIsDarkMode(window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches);
        }

        if (savedTheme === 'dark' || (!savedTheme && window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
    }, []);

    useEffect(() => {
        localStorage.setItem('theme', isDarkMode ? 'dark' : 'light');
        if (isDarkMode) {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
    }, [isDarkMode]);

    // --- Función para Seleccionar Conversación (Memoized with useCallback) ---
    const handleSelectConversation = useCallback((id) => {
        if (id === selectedConversationId && !isMobileMenuOpen) {
            console.log(`Conversation ${id} is already selected.`);
            return;
        }
        console.log(`UI: Selecting conversation ${id}. Navigating...`);
        setError('');
        setSuccess('');
        navigate(`/VirtualAssistent/chat/${id}`);
        setIsMobileMenuOpen(false);
    }, [selectedConversationId, isMobileMenuOpen, navigate]);

    // --- Función para Cargar la Lista de Conversaciones ---
    const fetchConversations = useCallback(async (selectLatest = false) => {
        if (!token) {
            setIsLoadingConversations(false);
            console.warn("VirtualAssistant: No token, cannot fetch conversations list.");
            setConversations([]);
            return;
        }
        console.log("VirtualAssistant: Fetching conversations list...");
        setIsLoadingConversations(true);
        try {
            const response = await fetch('http://localhost:3001/assistant/conversations', {
                method: 'GET',
                headers: { 'Authorization': `Bearer ${token}` },
            });
            if (response.ok) {
                const data = await response.json();
                const sortedData = data.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
                setConversations(sortedData);
                console.log(`VirtualAssistant: Conversations list fetched (${sortedData.length}).`);
                if (selectLatest && !paramConversationId && sortedData.length > 0) {
                    console.log("Selecting latest conversation automatically.");
                    handleSelectConversation(sortedData[0].id);
                }
            } else {
                let errorMessage = `Error ${response.status} al cargar la lista de conversaciones.`;
                try { const errorData = await response.json(); errorMessage = errorData.message || errorMessage; } catch {}
                setError(errorMessage);
                console.error("VirtualAssistant: Failed to fetch conversations list -", errorMessage);
                setConversations([]);
            }
        } catch (err) {
            setError('Error de conexión al cargar conversaciones.');
            console.error("VirtualAssistant: Network error fetching conversations list", err);
            setConversations([]);
        } finally {
            setIsLoadingConversations(false);
        }
    }, [token, paramConversationId, handleSelectConversation]); // Added handleSelectConversation as a dependency

    // --- Función para Cargar Mensajes de una Conversación Específica ---
    const fetchMessagesForConversation = useCallback(async (convId) => {
        if (!token || typeof convId !== 'number' || convId <= 0) {
            setIsLoadingHistory(false);
            setHistory([]);
            console.warn(`VirtualAssistant: Invalid parameters for fetching messages (token: ${!!token}, convId: ${convId})`);
            if (convId && (typeof convId !== 'number' || convId <= 0)) {
                setError("ID de conversación inválido.");
            }
            return;
        }
        console.log(`VirtualAssistant: Fetching messages for conversation ${convId}...`);
        setIsLoadingHistory(true);
        setHistory([]);
        setError('');
        try {
            const response = await fetch(`http://localhost:3001/assistant/conversations/${convId}/messages`, {
                method: 'GET',
                headers: { 'Authorization': `Bearer ${token}` },
            });
            if (response.ok) {
                const fetchedMessages = await response.json();
                setHistory(fetchedMessages);
                console.log(`VirtualAssistant: Messages fetched for ${convId} (${fetchedMessages.length}).`);
            } else {
                let errorMessage = `Error ${response.status} al cargar mensajes.`;
                try { const errorData = await response.json(); errorMessage = errorData.message || errorMessage; } catch {}
                if (response.status === 404 || response.status === 403) {
                    setError(errorMessage + ". Mostrando Nuevo Chat.");
                    console.warn(`VirtualAssistant: Conversation ${convId} not found or forbidden. Redirecting.`);
                    navigate('/VirtualAssistent', { replace: true });
                    setSelectedConversationId(null);
                    setIsMobileMenuOpen(false);
                } else {
                    setError(errorMessage);
                }
                console.error("VirtualAssistant: Failed to fetch messages -", errorMessage);
                setHistory([]);
            }
        } catch (err) {
            setError('Error de conexión al cargar mensajes.');
            console.error("VirtualAssistant: Network error fetching messages", err);
            setHistory([]);
        } finally {
            setIsLoadingHistory(false);
        }
    }, [token, navigate]);

    // --- useEffect Principal: Carga Inicial y Reacción a Cambios de URL/Token ---
    useEffect(() => {
        console.log("--- Main useEffect Running ---");
        console.log("Token:", token ? "Present" : "Absent");
        console.log("URL Param (conversationId):", paramConversationId);

        if (token) {
            if (conversations.length === 0 || isLoadingConversations) {
                fetchConversations();
            }
        } else {
            console.log("No token found, clearing state.");
            setConversations([]);
            setHistory([]);
            setSelectedConversationId(null);
            setIsLoadingConversations(false);
            setIsLoadingHistory(false);
            setIsMobileMenuOpen(false);
            return;
        }

        let currentRouteConvId = null;
        if (paramConversationId) {
            const parsedId = parseInt(paramConversationId, 10);
            if (!isNaN(parsedId) && parsedId > 0) {
                currentRouteConvId = parsedId;
            } else {
                console.error(`VirtualAssistant: Invalid conversation ID '${paramConversationId}' in URL. Redirecting.`);
                setError("El ID de la conversación en la URL no es válido.");
                if (paramConversationId !== undefined) {
                    navigate('/VirtualAssistent', { replace: true });
                }
                setSelectedConversationId(null);
                setHistory([]);
                setIsLoadingHistory(false);
                return;
            }
        }

        if (currentRouteConvId !== selectedConversationId) {
            console.log("Setting selectedConversationId based on URL:", currentRouteConvId);
            setSelectedConversationId(currentRouteConvId);

            if (currentRouteConvId) {
                console.log(`Fetching messages for conversation ${currentRouteConvId} due to URL change or initial load.`);
                fetchMessagesForConversation(currentRouteConvId);
            } else {
                console.log("URL indicates 'New Chat', clearing message history.");
                setHistory([]);
                setIsLoadingHistory(false);
            }
        } else {
            console.log("URL param matches current selected ID, no state change needed for ID/history.");
            if (currentRouteConvId && history.length === 0 && !isLoadingHistory) {
                console.log(`History is empty for selected conversation ${currentRouteConvId}, attempting to reload messages.`);
                fetchMessagesForConversation(currentRouteConvId);
            }
        }
    }, [paramConversationId, token, navigate, selectedConversationId, fetchConversations, fetchMessagesForConversation, isLoadingConversations, history.length, isLoadingHistory, conversations]); // Replaced conversations.length with conversations

    // --- Efecto para Auto-scroll ---
    useEffect(() => {
        const timer = setTimeout(() => {
            if (history.length > 0 || typingMessage) {
                messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
            }
        }, 100);
        return () => clearTimeout(timer);
    }, [history, typingMessage]);

    // --- Efecto para Ajustar Altura del Textarea ---
    useEffect(() => {
        const textarea = textareaRef.current;
        if (textarea) {
            textarea.style.height = 'auto';
            const scrollHeight = textarea.scrollHeight;
            const maxHeight = 120;
            textarea.style.height = `${Math.min(scrollHeight, maxHeight)}px`;
            textarea.style.overflowY = scrollHeight > maxHeight ? 'auto' : 'hidden';
        }
    }, [prompt]);

    // --- Manejadores de Eventos de UI ---
    const handlePromptChange = (e) => { setPrompt(e.target.value); setError(''); setSuccess(''); };
    const handleContextChange = (newContext) => { setContext(newContext); setError(''); setSuccess(''); };
    const toggleDarkMode = () => { setIsDarkMode((prev) => !prev); };

    // --- Función para Simular Escritura ---
    const simulateTyping = useCallback((text, callback) => {
        let index = 0;
        setTypingMessage('');
        const interval = setInterval(() => {
            if (index < text.length) {
                setTypingMessage((prev) => prev + text[index]);
                index++;
                messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
            } else {
                clearInterval(interval);
                setTypingMessage('');
                setIsSubmitting(false);
                callback(text);
            }
        }, 15);
        return interval;
    }, []);

    // --- Función para Enviar Mensaje ---
    const handleSubmit = async (e) => {
        e.preventDefault();
        const trimmedPrompt = prompt.trim();
        if (!trimmedPrompt) { setError('Por favor, ingresa una consulta.'); return; }
        if (!token) { setError('Error de autenticación.'); return; }
        if (isLoadingHistory) { console.warn("handleSubmit blocked: History is loading."); return; }
        if (isSubmitting) { console.warn("handleSubmit blocked: Already submitting."); return; }

        console.log(`Submitting prompt to convId: ${selectedConversationId ?? 'New'}`);
        setIsSubmitting(true);
        setError('');
        setSuccess('');

        const userMessage = {
            role: 'user',
            content: trimmedPrompt,
            timestamp: new Date().toISOString()
        };
        setHistory((prev) => [...prev, userMessage]);
        setPrompt('');

        setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 50);

        try {
            const response = await fetch('http://localhost:3001/assistant/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({
                    prompt: trimmedPrompt,
                    context: context,
                    conversationId: selectedConversationId
                }),
            });

            if (response.ok) {
                const data = await response.json();
                const assistantReply = data.reply;
                const returnedConversationId = data.conversationId;

                console.log(`Backend replied for conversation ${returnedConversationId}.`);

                const wasNewConversation = selectedConversationId === null;

                simulateTyping(assistantReply, (fullText) => {
                    setHistory((prev) => {
                        const historyWithoutUserOptimistic = prev.filter(msg => msg !== userMessage);
                        return [
                            ...historyWithoutUserOptimistic,
                            userMessage,
                            { role: 'assistant', content: fullText, timestamp: new Date().toISOString() },
                        ];
                    });

                    if (wasNewConversation && returnedConversationId) {
                        console.log(`Navigating to new conversation URL: /VirtualAssistent/chat/${returnedConversationId}`);
                        fetchConversations();
                        navigate(`/VirtualAssistent/chat/${returnedConversationId}`, { replace: true });
                    } else if (selectedConversationId && returnedConversationId === selectedConversationId) {
                        fetchConversations();
                    } else if (selectedConversationId && returnedConversationId !== selectedConversationId) {
                        console.warn(`Backend returned unexpected conversation ID ${returnedConversationId}, expected ${selectedConversationId}. Navigating.`);
                        fetchConversations();
                        navigate(`/VirtualAssistent/chat/${returnedConversationId}`, { replace: true });
                    } else if (!selectedConversationId && !returnedConversationId) {
                        console.error("Backend did not return a conversation ID for a new chat.");
                        setError("Error: No se pudo crear la nueva conversación en el servidor.");
                        fetchConversations();
                    }
                });

            } else {
                let errorMessage = `Error del asistente (${response.status})`;
                try { const errorData = await response.json(); errorMessage = errorData.message || errorMessage; } catch {}
                setError(errorMessage);
                console.error("handleSubmit fetch error:", errorMessage);
                setHistory(prev => prev.filter(msg => msg !== userMessage));
                setIsSubmitting(false);
                setTypingMessage('');
            }
        } catch (err) {
            setError(err.message || 'Error de conexión.');
            console.error("handleSubmit network error:", err);
            setHistory(prev => prev.filter(msg => msg !== userMessage));
            setIsSubmitting(false);
            setTypingMessage('');
        }
    };

    // --- Manejador para Tecla Enter ---
    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey && !isSubmitting && !isLoadingHistory) {
            e.preventDefault();
            handleSubmit(e);
        }
    };

    // --- Copiar al Portapapeles ---
    const copyToClipboard = (content) => {
        navigator.clipboard.writeText(content).then(() => {
            setSuccess('Mensaje copiado.');
            setTimeout(() => setSuccess(''), 2000);
        }).catch(err => {
            setError('No se pudo copiar.');
            console.error('Clipboard copy failed:', err);
            setTimeout(() => setError(''), 2000);
        });
    };

    // --- Limpiar Vista de Historial ---
    const clearHistory = () => {
        setHistory([]);
        setSuccess('Vista de chat limpiada localmente.');
        console.warn("VirtualAssistant: Chat view cleared locally. Conversation still exists on server.");
        setTimeout(() => setSuccess(''), 2000);
    };

    // --- Manejador para Botón "Nuevo Chat" ---
    const handleNewChat = () => {
        if (selectedConversationId === null && !isMobileMenuOpen) {
            console.log("Already in 'New Chat' view.");
            return;
        }
        console.log("UI: Starting new chat. Navigating to base route...");
        setError('');
        setSuccess('');
        navigate('/VirtualAssistent');
        setIsMobileMenuOpen(false);
    };

    // --- Manejador para Borrar Conversación ---
    const handleDeleteConversation = async (idToDelete, title, event) => {
        event.stopPropagation();
        if (!token) { setError("Autenticación requerida."); return; }

        const displayTitle = title || `Conversación ID: ${idToDelete}`;
        const confirmation = window.confirm(`¿Estás seguro de eliminar permanentemente la conversación "${displayTitle}"?\n\n¡Esta acción no se puede deshacer!`);
        if (!confirmation) { return; }

        console.log(`UI: Deleting conversation ${idToDelete}...`);
        setError(''); setSuccess('');

        const currentlyActiveId = selectedConversationId;

        try {
            const response = await fetch(`http://localhost:3001/assistant/conversations/${idToDelete}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` },
            });

            if (response.ok || response.status === 204) {
                setSuccess(`Conversación "${displayTitle}" eliminada.`);
                console.log(`Conversation ${idToDelete} deleted successfully.`);

                setConversations(prev => prev.filter(conv => conv.id !== idToDelete));

                if (idToDelete === currentlyActiveId) {
                    console.log("Deleted active conversation, navigating to new chat.");
                    handleNewChat();
                }
                setTimeout(() => setSuccess(''), 3000);

            } else {
                let errorMessage = `Error al eliminar (${response.status})`;
                try { const errorData = await response.json(); errorMessage = errorData.message || errorMessage; } catch {}
                setError(errorMessage);
                console.error(`Failed to delete conversation ${idToDelete}:`, errorMessage);
                setTimeout(() => setError(''), 3000);
            }
        } catch (err) {
            setError('Error de conexión al eliminar la conversación.');
            console.error(`Network error deleting conversation ${idToDelete}:`, err);
            setTimeout(() => setError(''), 3000);
        }
    };

    // --- Opciones de Contexto ---
    const contextOptions = [
        { value: 'general', label: 'General', description: 'Consultas generales y respuestas amplias.' },
        { value: 'tickets', label: 'Tickets', description: 'Ayuda con la gestión de tickets de soporte.' },
        { value: 'knowledgebase', label: 'Base de Conocimiento', description: 'Respuestas basadas en una base de conocimiento.' },
    ];

    // --- Funciones de Formato de Fecha/Hora ---
    const getTimeSeparator = (currentMsg, prevMsg) => {
        if (!prevMsg) return null;
        if (!currentMsg?.timestamp || !prevMsg?.timestamp) return null;
        try {
            const currentDate = new Date(currentMsg.timestamp);
            const prevDate = new Date(prevMsg.timestamp);

            if (currentDate.toDateString() !== prevDate.toDateString()) {
                return (
                    <div className="text-center text-xs text-gray-500 dark:text-gray-400 my-3 py-1 px-3 rounded-full bg-gray-200/50 dark:bg-gray-700/50 backdrop-blur-sm self-center mx-auto max-w-max">
                        {format(currentDate, 'PPPP', { locale: es })}
                    </div>
                );
            }
        } catch (e) {
            console.error("Error formatting time separator:", e);
            return null;
        }
        return null;
    };

    const formatTimestamp = (timestamp) => {
        if (!timestamp) return '??:??';
        try {
            return format(new Date(timestamp), 'p', { locale: es });
        } catch {
            return '??:??';
        }
    };

    // --- Componente Sidebar Interno ---
    const SidebarContent = () => (
        <>
            <button
                onClick={handleNewChat}
                className={`w-full flex items-center justify-center px-4 py-2.5 mb-4 rounded-lg font-semibold text-sm transition-colors shadow-sm ${
                    isDarkMode
                        ? 'bg-indigo-600 text-white hover:bg-indigo-500 focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-indigo-500 disabled:bg-indigo-800 disabled:opacity-70'
                        : 'bg-indigo-500 text-white hover:bg-indigo-600 focus:ring-2 focus:ring-offset-2 focus:ring-offset-white focus:ring-indigo-500 disabled:bg-indigo-300'
                } ${selectedConversationId === null ? '!bg-opacity-70 cursor-default' : ''}`}
                disabled={selectedConversationId === null || isLoadingHistory}
                aria-label="Iniciar una nueva conversación"
            >
                <FiPlusCircle className="mr-2 flex-shrink-0" size={18}/> Nuevo Chat
            </button>

            <h3 className={`text-xs font-semibold uppercase tracking-wider mb-2 flex items-center justify-between px-1 ${
                isDarkMode ? 'text-gray-400' : 'text-gray-500'
            }`}>
                Historial
                {isLoadingConversations && <FiLoader className="animate-spin text-gray-400 dark:text-gray-500" size={14}/>}
            </h3>

            <div className="flex-1 overflow-y-auto -mx-3 px-3 custom-scrollbar">
                {isLoadingConversations && conversations.length === 0 ? (
                    <div className="flex justify-center items-center py-10">
                        <FiLoader className={`animate-spin ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`} size={24}/>
                    </div>
                ) : !isLoadingConversations && conversations.length === 0 ? (
                    <div className="text-center py-10 px-4">
                        <FiMessageSquare className={`mx-auto mb-3 ${isDarkMode ? 'text-gray-600' : 'text-gray-400'}`} size={36} />
                        <p className={`text-sm ${isDarkMode ? 'text-gray-500' : 'text-gray-600'}`}>
                            No tienes conversaciones guardadas.
                        </p>
                    </div>
                ) : (
                    <ul className="space-y-1.5 py-1">
                        {conversations.map((conv) => (
                            <li key={conv.id}>
                                <button
                                    onClick={() => handleSelectConversation(conv.id)}
                                    disabled={isLoadingHistory && selectedConversationId !== conv.id}
                                    className={`w-full text-left px-3 py-2.5 rounded-md transition-all duration-150 group relative ${
                                        selectedConversationId === conv.id
                                            ? (isDarkMode ? 'bg-gray-700 shadow-inner text-white font-semibold' : 'bg-indigo-100 shadow-inner text-indigo-800 font-semibold')
                                            : (isDarkMode ? 'text-gray-300 hover:bg-gray-700/60 hover:text-white' : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900')
                                    } disabled:opacity-50 disabled:cursor-not-allowed`}
                                    title={conv.title || `Conversación ${conv.id}`}
                                >
                                    {isLoadingHistory && selectedConversationId === conv.id && (
                                        <FiLoader className="animate-spin inline-block mr-2 text-xs align-middle" />
                                    )}
                                    <p className="font-medium truncate pr-6 text-sm leading-tight inline">
                                        {conv.title || `Conversación ${conv.id}`}
                                    </p>
                                    <p className={`text-xs mt-0.5 ${selectedConversationId === conv.id ? (isDarkMode? 'text-gray-400':'text-indigo-600'):(isDarkMode?'text-gray-500':'text-gray-500')}`}>
                                        {format(new Date(conv.updatedAt), 'Pp', { locale: es })}
                                    </p>
                                    <div className="absolute right-1 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 focus-within:opacity-100">
                                        <button
                                            onClick={(e) => handleDeleteConversation(conv.id, conv.title, e)}
                                            className={`p-1.5 rounded-md transition-colors ${
                                                isDarkMode ? 'text-gray-500 hover:text-red-400 hover:bg-gray-600/50 focus:text-red-400 focus:bg-gray-600/50'
                                                            : 'text-gray-400 hover:text-red-600 hover:bg-gray-200 focus:text-red-600 focus:bg-gray-200'
                                            }`}
                                            aria-label="Borrar conversación"
                                            title="Borrar conversación"
                                        >
                                            <FiTrash size={14} />
                                        </button>
                                    </div>
                                </button>
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </>
    );

    // --- RENDERIZADO JSX ---
    return (
        <Layout>
            <div className="flex h-[calc(100vh-var(--header-height,64px))] dark:bg-gray-900 bg-gray-100">
                <div className={`hidden md:flex w-64 flex-shrink-0 border-r overflow-y-auto p-4 flex-col transition-colors duration-300 ${
                    isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
                }`}>
                    <SidebarContent />
                </div>

                <AnimatePresence>
                    {isMobileMenuOpen && (
                        <>
                            <motion.div
                                variants={backdropVariants}
                                initial="hidden"
                                animate="visible"
                                exit="exit"
                                transition={{ duration: 0.3 }}
                                className="fixed inset-0 z-30 bg-black/50 backdrop-blur-sm md:hidden"
                                onClick={() => setIsMobileMenuOpen(false)}
                                aria-hidden="true"
                            />
                            <motion.div
                                key="mobile-menu"
                                variants={mobileMenuVariants}
                                initial="closed"
                                animate="open"
                                exit="closed"
                                className={`fixed inset-y-0 left-0 z-40 w-64 p-4 flex flex-col shadow-xl md:hidden ${
                                    isDarkMode ? 'bg-gray-800 border-r border-gray-700' : 'bg-white border-r border-gray-200'
                                }`}
                                role="dialog"
                                aria-modal="true"
                                aria-label="Menú de conversaciones"
                            >
                                <div className="flex justify-end mb-3 -mr-2">
                                    <button
                                        onClick={() => setIsMobileMenuOpen(false)}
                                        className={`p-2 rounded-full transition-colors ${isDarkMode ? 'text-gray-400 hover:bg-gray-700' : 'text-gray-500 hover:bg-gray-200'}`}
                                        aria-label="Cerrar menú"
                                    >
                                        <FiX size={20}/>
                                    </button>
                                </div>
                                <SidebarContent />
                            </motion.div>
                        </>
                    )}
                </AnimatePresence>

                <main className={`flex-1 relative flex flex-col h-full overflow-hidden transition-colors duration-300 particles-bg p-4 sm:p-6 lg:p-8 ${
                    isDarkMode ? 'dark' : ''
                    }`}>
                    <div className="flex items-center justify-between mb-4 flex-shrink-0 px-0 pt-0">
                        <button
                            onClick={() => setIsMobileMenuOpen(true)}
                            className={`z-10 inline-flex md:hidden p-2 rounded-md transition-colors mr-2 -ml-1 ${
                                isDarkMode ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-600 hover:bg-gray-200'
                            }`}
                        >
                            <FiMenu size={22} />
                        </button>
                        <motion.h2
                            className={`text-xl sm:text-2xl lg:text-3xl font-bold tracking-tight truncate pr-2 ${
                                isDarkMode ? 'text-gray-100' : 'text-gray-800'
                            }`}
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.3 }}
                            key={selectedConversationId || 'new-chat-title'}
                        >
                            {selectedConversationId
                                ? conversations.find(c => c.id === selectedConversationId)?.title || `Conversación ${selectedConversationId}`
                                : "Nuevo Chat"}
                        </motion.h2>

                        <motion.button
                            onClick={toggleDarkMode}
                            className={`z-10 p-2 rounded-full transition-colors ml-auto ${
                                isDarkMode ? 'bg-gray-700 text-yellow-400 hover:bg-gray-600' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                            }`}
                            whileHover={{ scale: 1.1, rotate: 15 }} whileTap={{ scale: 0.9 }} aria-label={isDarkMode ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
                        >
                            {isDarkMode ? <FiSun size={18} /> : <FiMoon size={18} />}
                        </motion.button>
                    </div>

                    <div className="px-0 flex-shrink-0">
                        <AnimatePresence>
                            {success && (
                                <motion.div
                                    key="success-alert"
                                    variants={alertVariants} initial="hidden" animate="visible" exit="exit"
                                    className={`flex items-center p-3 mb-3 text-sm rounded-lg border shadow-sm backdrop-blur-sm ${ isDarkMode ? 'text-emerald-200 bg-emerald-900/40 border-emerald-700/50' : 'text-emerald-700 bg-emerald-50/80 border-emerald-300' }`}
                                    role="alert"
                                >
                                    <FiCheckCircle className="flex-shrink-0 w-4 h-4 mr-2" />
                                    <span className="font-medium">{success}</span>
                                    <button onClick={() => setSuccess('')} className="ml-auto -mr-1 p-1 text-inherit opacity-70 hover:opacity-100"> <FiX size={16}/> </button>
                                </motion.div>
                            )}
                            {error && (
                                <motion.div
                                    key="error-alert"
                                    variants={alertVariants} initial="hidden" animate="visible" exit="exit"
                                    className={`flex items-center p-3 mb-3 text-sm rounded-lg border shadow-sm backdrop-blur-sm ${ isDarkMode ? 'text-red-300 bg-red-900/40 border-red-700/50' : 'text-red-700 bg-red-100/80 border-red-300' }`}
                                    role="alert"
                                >
                                    <FiAlertTriangle className="flex-shrink-0 w-4 h-4 mr-2" />
                                    <span className="font-medium">{error}</span>
                                    <button onClick={() => setError('')} className="ml-auto -mr-1 p-1 text-inherit opacity-70 hover:opacity-100"> <FiX size={16}/> </button>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    <div className="flex flex-wrap gap-2 mb-4 flex-shrink-0 px-0">
                        {contextOptions.map((option) => (
                            <motion.button
                                key={option.value}
                                onClick={() => handleContextChange(option.value)}
                                className={`px-3.5 py-1.5 rounded-full text-xs sm:text-sm font-medium transition-all backdrop-blur-sm ${
                                    context === option.value
                                        ? isDarkMode
                                            ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md'
                                            : 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow'
                                        : isDarkMode
                                            ? 'bg-gray-700/50 text-gray-300 hover:bg-gray-600/70 hover:text-gray-100'
                                            : 'bg-gray-200/80 text-gray-600 hover:bg-gray-300/90 hover:text-gray-800'
                                }`}
                                whileHover={{ scale: 1.05, transition: { type: 'spring', stiffness: 400, damping: 15 } }}
                                whileTap={{ scale: 0.95 }}
                                aria-pressed={context === option.value}
                                aria-label={`Seleccionar contexto ${option.label}`}
                                title={option.description}
                            >
                                {option.label}
                            </motion.button>
                        ))}
                        {history.length > 0 && (
                            <motion.button
                                onClick={clearHistory}
                                className={`ml-auto px-2.5 py-1.5 rounded-full text-xs font-medium transition-all backdrop-blur-sm flex items-center ${
                                    isDarkMode
                                        ? 'bg-gray-700/30 text-gray-400 hover:bg-gray-600/50 hover:text-gray-200'
                                        : 'bg-gray-200/50 text-gray-500 hover:bg-gray-300/70 hover:text-gray-700'
                                }`}
                                whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                                aria-label="Limpiar mensajes visibles (solo localmente)"
                                title="Limpiar mensajes visibles (solo localmente)"
                            >
                                <FiTrash2 size={14} />
                                <span className="ml-1 hidden sm:inline">Limpiar Vista</span>
                            </motion.button>
                        )}
                    </div>

                    <motion.div
                        ref={chatContainerRef}
                        className={`flex-1 rounded-lg shadow-inner p-3 sm:p-4 lg:p-6 overflow-y-auto mb-4 backdrop-blur-md custom-scrollbar flex flex-col ${
                            isDarkMode ? 'bg-gray-800/70 border border-gray-700/50' : 'bg-white/70 border border-gray-200/80'
                        }`}
                        variants={chatContainerVariants} initial="hidden" animate="visible"
                        key={selectedConversationId || 'chat-area-new'}
                    >
                        {isLoadingHistory ? (
                            <div className="flex flex-col items-center justify-center h-full text-gray-500 dark:text-gray-400 m-auto">
                                <FiLoader className="animate-spin mr-2 mb-2" size={24}/> Cargando Mensajes...
                            </div>
                        ) : !selectedConversationId && history.length === 0 && !isSubmitting ? (
                            <div className="flex flex-col items-center justify-center h-full text-gray-500 dark:text-gray-400 text-center m-auto p-5">
                                <FiMessageSquare size={40} className="mb-4 opacity-50"/>
                                <p className="text-base sm:text-lg">Selecciona una conversación del historial o inicia un <button onClick={handleNewChat} className="text-indigo-500 dark:text-indigo-400 hover:underline font-semibold">nuevo chat</button>.</p>
                                <p className="text-sm mt-2 md:hidden">Usa el <FiMenu className='inline-block mx-1'/> menú para ver el historial.</p>
                            </div>
                        ) : history.length === 0 && !isSubmitting && !typingMessage && selectedConversationId ? (
                            <div className="flex flex-col items-center justify-center h-full text-gray-500 dark:text-gray-400 text-center m-auto p-5">
                                <FiSend size={36} className="mb-4 opacity-50"/>
                                <p className="text-base sm:text-lg">Envía tu primer mensaje para iniciar esta conversación.</p>
                            </div>
                        ) : (
                            <div className="flex flex-col space-y-3">
                                {history.map((msg, index) => (
                                    <React.Fragment key={msg.timestamp + '-' + index + '-' + msg.role}>
                                        {getTimeSeparator(msg, history[index - 1])}
                                        <motion.div
                                            variants={messageVariants} initial="hidden" animate="visible" custom={{ isUser: msg.role === 'user' }}
                                            className={`flex ${ msg.role === 'user' ? 'justify-end' : 'justify-start'} items-end group`}
                                        >
                                            {msg.role === 'assistant' && (
                                                <AiFillRobot className={`w-6 h-6 mb-1 mr-2 flex-shrink-0 self-start ${ isDarkMode ? 'text-indigo-400' : 'text-indigo-500' }`} />
                                            )}
                                            <div className={`relative max-w-[85%] sm:max-w-[75%] lg:max-w-[70%] ${msg.role === 'user' ? 'order-1' : ''}`}>
                                                <div className={`inline-block px-3.5 py-2.5 rounded-lg shadow-sm backdrop-blur-sm break-words ${
                                                    msg.role === 'user'
                                                        ? isDarkMode ? 'bg-gradient-to-br from-indigo-600 to-blue-600 text-indigo-50' : 'bg-gradient-to-br from-indigo-100 to-blue-100 text-indigo-900'
                                                        : isDarkMode ? 'bg-gradient-to-br from-gray-600 to-slate-600 text-gray-100' : 'bg-gradient-to-br from-gray-200 to-slate-200 text-gray-800'
                                                }`}>
                                                    <div className={`text-sm prose dark:prose-invert max-w-none ${msg.role === 'user' ? 'whitespace-pre-wrap' : ''}`}>
                                                        <ReactMarkdown components={{
                                                            a: ({node, children, ...props}) => (
                                                                <a
                                                                    {...props}
                                                                    target="_blank"
                                                                    rel="noopener noreferrer"
                                                                    className="text-indigo-500 dark:text-indigo-400 hover:underline"
                                                                >
                                                                    {children}
                                                                </a>
                                                            ),
                                                        }}>
                                                            {msg.content || ''}
                                                        </ReactMarkdown>
                                                    </div>
                                                </div>
                                                <div className={`flex items-center mt-1 ${msg.role === 'user' ? 'justify-end' : 'justify-start'} space-x-2`}>
                                                    <span className={`text-xs ${ isDarkMode ? 'text-gray-400' : 'text-gray-500' }`}>
                                                        {formatTimestamp(msg.timestamp)}
                                                    </span>
                                                    <button
                                                        onClick={() => copyToClipboard(msg.content)}
                                                        className={`opacity-0 group-hover:opacity-60 focus:opacity-100 hover:opacity-100 transition-opacity p-0.5 rounded ${ isDarkMode ? 'text-gray-400 hover:text-gray-200' : 'text-gray-500 hover:text-gray-800' }`}
                                                        aria-label="Copiar mensaje"
                                                        title="Copiar mensaje"
                                                    >
                                                        <FiCopy size={12} />
                                                    </button>
                                                </div>
                                            </div>
                                        </motion.div>
                                    </React.Fragment>
                                ))}
                                {isSubmitting && typingMessage && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}
                                        className="flex justify-start items-end group"
                                    >
                                        <AiFillRobot className={`w-6 h-6 mb-1 mr-2 flex-shrink-0 self-start ${ isDarkMode ? 'text-indigo-400' : 'text-indigo-500' }`} />
                                        <div className="relative max-w-[85%] sm:max-w-[75%] lg:max-w-[70%]">
                                            <div className={`inline-block px-3.5 py-2.5 rounded-lg shadow-sm backdrop-blur-sm ${ isDarkMode ? 'bg-gradient-to-br from-gray-600 to-slate-600 text-gray-100' : 'bg-gradient-to-br from-gray-200 to-slate-200 text-gray-800' }`}>
                                                <div className="text-sm prose dark:prose-invert max-w-none flex items-center">
                                                    <ReactMarkdown>{typingMessage}</ReactMarkdown>
                                                    <span className="animate-ping ml-1 w-1 h-4 bg-gray-500 dark:bg-gray-400 inline-block"></span>
                                                </div>
                                            </div>
                                            <div className={`text-xs mt-1 text-left ${ isDarkMode ? 'text-gray-400' : 'text-gray-500' }`}>
                                                {formatTimestamp(new Date().toISOString())}
                                            </div>
                                        </div>
                                    </motion.div>
                                )}
                                {isSubmitting && !typingMessage && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}
                                        className="flex justify-start items-end group"
                                    >
                                        <AiFillRobot className={`w-6 h-6 mb-1 mr-2 flex-shrink-0 self-start ${ isDarkMode ? 'text-indigo-400' : 'text-indigo-500' }`} />
                                        <div className="relative max-w-[85%] sm:max-w-[75%] lg:max-w-[70%]">
                                            <div className={`inline-block px-3.5 py-2.5 rounded-lg shadow-sm backdrop-blur-sm ${ isDarkMode ? 'bg-gradient-to-br from-gray-600 to-slate-600 text-gray-100' : 'bg-gradient-to-br from-gray-200 to-slate-200 text-gray-800' }`}>
                                                <div className="text-sm flex items-center space-x-1.5 h-[20px]">
                                                    <span className="w-1.5 h-1.5 bg-gray-400 dark:bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                                                    <span className="w-1.5 h-1.5 bg-gray-400 dark:bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                                                    <span className="w-1.5 h-1.5 bg-gray-400 dark:bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                                                </div>
                                            </div>
                                        </div>
                                    </motion.div>
                                )}
                                <div ref={messagesEndRef} className="h-0" />
                            </div>
                        )}
                    </motion.div>

                    { token && (!isLoadingConversations || selectedConversationId !== null || paramConversationId === undefined) && (
                        <motion.div
                            className={`p-3 sm:p-4 rounded-lg shadow-md flex-shrink-0 backdrop-blur-md border ${
                                isDarkMode ? 'bg-gray-800/70 border-gray-700/50' : 'bg-white/70 border-gray-200/80'
                            }`}
                            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2, duration: 0.3 }}
                        >
                            <form onSubmit={handleSubmit} className="flex items-end space-x-2 sm:space-x-3">
                                <textarea
                                    ref={textareaRef}
                                    value={prompt}
                                    onChange={handlePromptChange}
                                    onKeyDown={handleKeyDown}
                                    placeholder={
                                        isSubmitting ? "Generando respuesta..."
                                        : isLoadingHistory ? "Cargando historial..."
                                        : selectedConversationId ? "Escribe tu mensaje (Shift+Enter para nueva línea)..."
                                        : "Escribe un mensaje para iniciar un nuevo chat..."
                                    }
                                    className={`flex-1 rounded-lg border p-2.5 sm:p-3 text-sm resize-none shadow-inner transition duration-150 ease-in-out backdrop-blur-sm max-h-[120px] custom-scrollbar ${
                                        isDarkMode
                                            ? 'bg-gray-700/60 text-gray-100 border-gray-600 placeholder-gray-400 focus:bg-gray-700/80 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500'
                                            : 'bg-gray-50/80 text-gray-900 border-gray-300 placeholder-gray-500 focus:bg-white/90 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500'
                                    } ${
                                        error && !prompt.trim() && !isSubmitting
                                            ? 'border-red-500 ring-1 ring-red-300 dark:border-red-600 dark:ring-red-500/50'
                                            : 'focus:outline-none'
                                    } ${
                                        (isSubmitting || isLoadingHistory) ? 'opacity-60 cursor-not-allowed' : ''
                                    }`}
                                    disabled={isSubmitting || isLoadingHistory}
                                    rows={1}
                                    aria-label="Escribir mensaje al asistente"
                                    style={{ overflowY: 'hidden' }}
                                />
                                <motion.button
                                    type="submit"
                                    className={`button-elegant self-end ${
                                        (isSubmitting || isLoadingHistory || !prompt.trim()) ? 'disabled' : ''
                                    }`}
                                    disabled={isSubmitting || isLoadingHistory || !prompt.trim()}
                                    whileHover={{ scale: (isSubmitting || isLoadingHistory || !prompt.trim()) ? 1 : 1.05, transition: { type: 'spring', stiffness: 400, damping: 15 } }}
                                    whileTap={{ scale: (isSubmitting || isLoadingHistory || !prompt.trim()) ? 1 : 0.95 }}
                                    aria-label="Enviar mensaje"
                                >
                                    {isSubmitting ? <FiLoader className="animate-spin text-white" size={18} /> : <FiSend className="text-white" size={18} />}
                                </motion.button>
                            </form>
                        </motion.div>
                    )}

                    <style jsx global>{`
                        :root {
                          --header-height: 64px;
                        }
                        .button-elegant {
                            display: inline-flex;
                            align-items: center;
                            justify-content: center;
                            padding: 0.625rem;
                            height: 42px;
                            width: 42px;
                            background-image: linear-gradient(to right, #4f46e5, #6366f1);
                            color: white;
                            border-radius: 0.5rem;
                            font-weight: 600;
                            box-shadow: 0 1px 3px 0 rgba(0,0,0,.1), 0 1px 2px -1px rgba(0,0,0,.1);
                            transition: all 0.2s ease-in-out;
                            border: none;
                            cursor: pointer;
                            flex-shrink: 0;
                        }
                        .button-elegant:hover:not(:disabled) {
                            background-image: linear-gradient(to right, #4338ca, #4f46e5);
                            box-shadow: 0 4px 6px -1px rgba(0,0,0,.1), 0 2px 4px -2px rgba(0,0,0,.1);
                        }
                        .button-elegant:focus-visible {
                            outline: 2px solid transparent;
                            outline-offset: 2px;
                            box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.4);
                        }
                        .button-elegant:active:not(:disabled) {
                            transform: scale(0.98);
                        }
                        .button-elegant.disabled {
                            opacity: 0.5;
                            cursor: not-allowed;
                            background-image: linear-gradient(to right, #a5b4fc, #c7d2fe);
                            box-shadow: none;
                        }
                        .dark .button-elegant.disabled {
                            background-image: linear-gradient(to right, #4f46e5, #6366f1);
                            opacity: 0.4;
                        }
                        .prose { max-width: none; font-size: 0.875rem; line-height: 1.65; }
                        .prose :where(p):not(:where([class~="not-prose"] *)) { margin-top: 0.5em; margin-bottom: 0.5em; }
                        .prose :where(ul,ol):not(:where([class~="not-prose"] *)) { margin-top: 0.75em; margin-bottom: 0.75em; padding-left: 1.6em; }
                        .prose :where(li):not(:where([class~="not-prose"] *)) { margin-top: 0.2em; margin-bottom: 0.2em; }
                        .prose :where(strong):not(:where([class~="not-prose"] *)) { font-weight: 600; }
                        .prose :where(a):not(:where([class~="not-prose"] *)) { font-weight: 500; text-decoration: underline; text-decoration-offset: 2px; transition: opacity 0.2s; }
                        .prose :where(a):not(:where([class~="not-prose"] *)):hover { opacity: 0.8; }
                        .prose :where(code):not(:where([class~="not-prose"] *)) { background-color: rgba(100, 116, 139, 0.1); padding: 0.2em 0.4em; margin: 0 0.1em; font-size: 0.875em; border-radius: 0.25rem; font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace; }
                        .prose :where(pre):not(:where([class~="not-prose"] *)) { background-color: #f8fafc; color: #1e293b; padding: 0.8em 1em; margin: 1em 0; border-radius: 0.375rem; overflow-x: auto; font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace; font-size: 0.875em; line-height: 1.5; white-space: pre; }
                        .prose :where(pre code):not(:where([class~="not-prose"] *)) { background-color: transparent; padding: 0; margin: 0; font-size: inherit; border-radius: 0; font-family: inherit; line-height: inherit; }
                        .prose :where(blockquote):not(:where([class~="not-prose"] *)) { margin: 1em 0; padding-left: 1em; border-left: 0.25em solid #e5e7eb; color: #4b5563; font-style: italic; }
                        .dark .prose-invert { --tw-prose-body: #d1d5db; --tw-prose-headings: #f9fafb; --tw-prose-lead: #a1a1aa; --tw-prose-links: #818cf8; --tw-prose-bold: #f9fafb; --tw-prose-counters: #a1a1aa; --tw-prose-bullets: #6b7280; --tw-prose-hr: #4b5563; --tw-prose-quotes: #d1d5db; --tw-prose-quote-borders: #4b5563; --tw-prose-captions: #a1a1aa; --tw-prose-code: #f3f4f6; --tw-prose-pre-code: #d1d5db; --tw-prose-pre-bg: #1f2937; --tw-prose-th-borders: #4b5563; --tw-prose-td-borders: #374151; --tw-prose-invert-body: #d1d5db; }
                        .dark .prose :where(code):not(:where([class~="not-prose"] *)) { background-color: rgba(203, 213, 225, 0.15); }
                        .dark .prose :where(pre):not(:where([class~="not-prose"] *)) { background-color: #1e2937; color: #d1d5db; }
                        .dark .prose :where(blockquote):not(:where([class~="not-prose"] *)) { border-left-color: #4b5563; color: #9ca3af; }
                        .particles-bg { position: relative; overflow: hidden; }
                        .particles-bg::before {
                            content: ''; position: absolute; top: 0; left: 0; width: 100%; height: 100%;
                            background-image: url('data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 800"%3E%3Cfilter id="a"%3E%3CfeTurbulence type="fractalNoise" baseFrequency=".03" numOctaves="4" stitchTiles="stitch"/%3E%3C/filter%3E%3Crect width="100%25" height="100%25" filter="url(%23a)" opacity=".04"/%3E%3C/svg%3E');
                            background-repeat: repeat; animation: particleMove 80s linear infinite alternate;
                            z-index: 0; opacity: 0.6; will-change: background-position;
                        }
                        .dark .particles-bg::before { opacity: 0.3; }
                        @keyframes particleMove {
                            0% { background-position: 0 0; }
                            100% { background-position: -400px 800px; }
                        }
                        .animate-bounce { animation: bounce 1s infinite; }
                        @keyframes bounce {
                            0%, 100% { transform: translateY(0); animation-timing-function: cubic-bezier(0.8,0,1,1); }
                            50% { transform: translateY(-25%); animation-timing-function: cubic-bezier(0,0,0.2,1); }
                        }
                        .custom-scrollbar::-webkit-scrollbar { width: 6px; height: 6px; }
                        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                        .custom-scrollbar::-webkit-scrollbar-thumb { background-color: rgba(156, 163, 175, 0.3); border-radius: 10px; border: 1px solid transparent; background-clip: content-box; }
                        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background-color: rgba(156, 163, 175, 0.5); }
                        .dark .custom-scrollbar::-webkit-scrollbar-thumb { background-color: rgba(107, 114, 128, 0.4); }
                        .dark .custom-scrollbar::-webkit-scrollbar-thumb:hover { background-color: rgba(107, 114, 128, 0.6); }
                        .custom-scrollbar { scrollbar-width: thin; scrollbar-color: rgba(156, 163, 175, 0.3) transparent; }
                        .dark .custom-scrollbar { scrollbar-color: rgba(107, 114, 128, 0.4) transparent; }
                        .prose.whitespace-pre-wrap :where(p):not(:where([class~="not-prose"] *)) {
                            margin-top: 0;
                            margin-bottom: 0;
                        }
                        .prose.whitespace-pre-wrap {
                            line-height: 1.6;
                        }
                    `}</style>
                </main>
            </div>
        </Layout>
    );
}

export default VirtualAssistent;