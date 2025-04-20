// src/pages/VirtualAsistent.jsx
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../context/AuthContext'; // Asegúrate que la ruta sea correcta
// *** NUEVAS IMPORTACIONES DE REACT ROUTER ***
import { useParams, useNavigate } from 'react-router-dom';
// *******************************************
import { motion, AnimatePresence } from 'framer-motion';
import Layout from '../components/common/Sidebar'; // Ajusta la ruta si es necesario
// *** Iconos necesarios (Asegúrate de tener react-icons instalado) ***
import {
    FiSend, FiCheckCircle, FiAlertTriangle, FiCopy, FiTrash2, FiMoon, FiSun,
    FiLoader, FiPlusCircle, FiMessageSquare, FiTrash, FiMenu, FiX // <-- Añadido FiMenu y FiX para el menú responsive
} from 'react-icons/fi';
import { AiFillRobot } from 'react-icons/ai';
// *********************************************************************
// import { GoogleGenerativeAI } from '@google/generative-ai'; // <--- ELIMINADO DEFINITIVAMENTE
import ReactMarkdown from 'react-markdown';
import { format } from 'date-fns'; // Para formatear fechas/horas
import { es } from 'date-fns/locale'; // Para formato en español

// --- Variantes de animación (SIN CAMBIOS - COMPLETAS) ---
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
// *** Variantes para el menú móvil ***
const mobileMenuVariants = {
    closed: { x: '-100%', transition: { duration: 0.3, ease: 'easeOut' } },
    open: { x: 0, transition: { duration: 0.3, ease: 'easeIn' } },
};
const backdropVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1 },
    exit: { opacity: 0 },
};
// -------------------------------------------

// --- Componente Principal ---
function VirtualAssistent() {
    // --- Hooks y Contexto ---
    const { user, token } = useAuth();
    const { conversationId: paramConversationId } = useParams(); // ID de la URL (string o undefined)
    const navigate = useNavigate(); // Hook para navegación programática
    // -------------------------

    // --- Estados del Componente ---
    const [prompt, setPrompt] = useState(''); // Input del usuario
    const [context, setContext] = useState('general'); // Contexto actual (general, tickets, etc.)
    const [history, setHistory] = useState([]); // Mensajes de la conversación *seleccionada*
    const [isSubmitting, setIsSubmitting] = useState(false); // Enviando mensaje al backend
    const [isLoadingHistory, setIsLoadingHistory] = useState(false); // Cargando mensajes de una conversación específica
    const [isLoadingConversations, setIsLoadingConversations] = useState(true); // Cargando lista inicial de conversaciones
    const [error, setError] = useState(''); // Mensajes de error
    const [success, setSuccess] = useState(''); // Mensajes de éxito
    const [isDarkMode, setIsDarkMode] = useState(false); // Estado del tema
    const [typingMessage, setTypingMessage] = useState(''); // Para animación de escritura del asistente
    const [conversations, setConversations] = useState([]); // Lista de todas las conversaciones del usuario [{id, title, createdAt, updatedAt}]
    const [selectedConversationId, setSelectedConversationId] = useState(null); // ID numérico de la conversación activa o null
    // *** NUEVO ESTADO PARA EL MENÚ MÓVIL ***
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    // ---------------------------------------

    // --- Referencias DOM ---
    const messagesEndRef = useRef(null); // Para auto-scroll
    const textareaRef = useRef(null); // Para ajustar altura
    const chatContainerRef = useRef(null); // Contenedor del chat
    // ---------------------

    // --- Efecto para Cargar y Guardar Tema ---
    useEffect(() => {
        // Cargar tema al montar
        const savedTheme = localStorage.getItem('theme');
        if (savedTheme) {
             setIsDarkMode(savedTheme === 'dark');
        } else {
            // Opcional: detectar preferencia del sistema si no hay nada guardado
            setIsDarkMode(window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches);
        }

        // Aplicar clase dark al HTML para Tailwind
        if (savedTheme === 'dark' || (!savedTheme && window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
    }, []); // Ejecutar solo al montar

    useEffect(() => {
        // Guardar tema cuando cambie y actualizar clase en HTML
        localStorage.setItem('theme', isDarkMode ? 'dark' : 'light');
        if (isDarkMode) {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
    }, [isDarkMode]); // Ejecutar cuando isDarkMode cambie
    // ----------------------------------------

    // --- Función para Cargar la Lista de Conversaciones ---
    const fetchConversations = useCallback(async (selectLatest = false) => { // Parámetro opcional para seleccionar la última
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
                // Ordenar por updatedAt descendente (más reciente primero) si no viene ordenado del backend
                const sortedData = data.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
                setConversations(sortedData);
                console.log(`VirtualAssistant: Conversations list fetched (${sortedData.length}).`);
                 if (selectLatest && !paramConversationId && sortedData.length > 0) {
                     console.log("Selecting latest conversation automatically.");
                     handleSelectConversation(sortedData[0].id); // Llamará a navigate y cerrará menú si es necesario
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
    }, [token, paramConversationId]); // <-- Quitamos handleSelectConversation de aquí, ya que se llama internamente y puede causar bucle si está en dependencias.
    // ----------------------------------------------------

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
        setHistory([]); // Limpiar historial anterior antes de cargar
        setError(''); // Limpiar errores anteriores
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
                     navigate('/VirtualAssistent', { replace: true }); // Usa navigate para volver a la vista de nuevo chat
                     setSelectedConversationId(null); // Asegurarse de limpiar el ID seleccionado
                     setIsMobileMenuOpen(false); // Cerrar menú si estaba abierto
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
    }, [token, navigate]); // Añadido navigate a dependencias
    // -------------------------------------------------------------------

    // --- useEffect Principal: Carga Inicial y Reacción a Cambios de URL/Token ---
    useEffect(() => {
        console.log("--- Main useEffect Running ---");
        console.log("Token:", token ? "Present" : "Absent");
        console.log("URL Param (conversationId):", paramConversationId);

        if (token) {
            // Cargar la lista si aún no se ha cargado o si está vacía (ej. después de login)
            // Esto evita recargar la lista innecesariamente en cada cambio de URL si ya la tenemos
            if (conversations.length === 0 || isLoadingConversations) {
                fetchConversations();
            }
        } else {
            console.log("No token found, clearing state.");
            setConversations([]);
            setHistory([]);
            setSelectedConversationId(null);
            setIsLoadingConversations(false); // Resetear loaders si el token desaparece
            setIsLoadingHistory(false);
            setIsMobileMenuOpen(false); // Asegurar que el menú esté cerrado si el usuario cierra sesión
            return; // Salir si no hay token
        }

        let currentRouteConvId = null;
        if (paramConversationId) {
            const parsedId = parseInt(paramConversationId, 10);
            if (!isNaN(parsedId) && parsedId > 0) {
                currentRouteConvId = parsedId;
            } else {
                console.error(`VirtualAssistant: Invalid conversation ID '${paramConversationId}' in URL. Redirecting.`);
                setError("El ID de la conversación en la URL no es válido.");
                // Solo navegar si realmente estamos en una ruta inválida, no si paramConversationId es undefined (ruta base)
                if (paramConversationId !== undefined) {
                    navigate('/VirtualAssistent', { replace: true });
                }
                // Limpiar estado si el ID es inválido
                setSelectedConversationId(null);
                setHistory([]);
                setIsLoadingHistory(false);
                return; // Salir si el ID es inválido
            }
        }

        // Sincronizar el ID seleccionado con la URL
        if (currentRouteConvId !== selectedConversationId) {
            console.log("Setting selectedConversationId based on URL:", currentRouteConvId);
            setSelectedConversationId(currentRouteConvId); // Actualiza el estado

            // Si el nuevo ID es válido, cargar sus mensajes. Si es null, limpiar.
            if (currentRouteConvId) {
                console.log(`Fetching messages for conversation ${currentRouteConvId} due to URL change or initial load.`);
                fetchMessagesForConversation(currentRouteConvId);
            } else {
                // Si currentRouteConvId es null (estamos en /VirtualAssistent)
                console.log("URL indicates 'New Chat', clearing message history.");
                setHistory([]);
                setIsLoadingHistory(false); // Asegurar que no se muestre loader
            }
        } else {
             console.log("URL param matches current selected ID, no state change needed for ID/history.");
             // Si estamos recargando la página en la misma conversación, podríamos necesitar recargar mensajes si están vacíos
             if (currentRouteConvId && history.length === 0 && !isLoadingHistory) {
                 console.log(`History is empty for selected conversation ${currentRouteConvId}, attempting to reload messages.`);
                 fetchMessagesForConversation(currentRouteConvId);
             }
        }

    // Añadimos 'conversations' como dependencia para que re-evalúe si la lista cambia (ej: al borrar la activa)
    // fetchConversations y fetchMessagesForConversation se llaman internamente, no necesitan estar aquí.
    }, [paramConversationId, token, navigate, selectedConversationId, fetchConversations, fetchMessagesForConversation, isLoadingConversations, history.length, isLoadingHistory]); // <-- Dependencias ajustadas
    // -------------------------------------------------------------------------------


    // --- Efecto para Auto-scroll (SIN CAMBIOS) ---
    useEffect(() => {
        const timer = setTimeout(() => {
            if (history.length > 0 || typingMessage) {
                 messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
            }
        }, 100); // Un poco más de delay por si acaso
        return () => clearTimeout(timer);
    }, [history, typingMessage]);
    // -------------------------------------------

    // --- Efecto para Ajustar Altura del Textarea (SIN CAMBIOS) ---
    useEffect(() => {
        const textarea = textareaRef.current;
        if (textarea) {
            textarea.style.height = 'auto'; // Reset height
            // Max height set via className max-h-[120px] for consistency
            // Min height implícita por rows={1} y padding
            const scrollHeight = textarea.scrollHeight;
            const maxHeight = 120; // Debe coincidir con max-h-[120px]
            textarea.style.height = `${Math.min(scrollHeight, maxHeight)}px`;
            // Habilitar scroll si el contenido excede max-height
            textarea.style.overflowY = scrollHeight > maxHeight ? 'auto' : 'hidden';
        }
    }, [prompt]);
    // -------------------------------------------------------

    // --- Manejadores de Eventos de UI (SIN CAMBIOS) ---
    const handlePromptChange = (e) => { setPrompt(e.target.value); setError(''); setSuccess(''); };
    const handleContextChange = (newContext) => { setContext(newContext); setError(''); setSuccess(''); };
    const toggleDarkMode = () => { setIsDarkMode((prev) => !prev); };
    // -------------------------------------------------

    // --- Función para Simular Escritura (SIN CAMBIOS LÓGICOS) ---
    const simulateTyping = useCallback((text, callback) => {
        let index = 0;
        setTypingMessage(''); // Resetear mensaje de escritura
        const interval = setInterval(() => {
            if (index < text.length) {
                setTypingMessage((prev) => prev + text[index]);
                index++;
                messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); // Scroll mientras escribe
            } else {
                clearInterval(interval);
                setTypingMessage(''); // Limpiar al terminar
                setIsSubmitting(false); // Indicar que ya no está "enviando/procesando"
                callback(text); // Llamar al callback con el texto completo
            }
        }, 15); // Velocidad de escritura
        return interval;
    }, []); // No dependencies needed here
    // ---------------------------------------------------------

    // --- Función para Enviar Mensaje (handleSubmit - MODIFICADA LIGERAMENTE PARA CLARIDAD) ---
    const handleSubmit = async (e) => {
        e.preventDefault();
        const trimmedPrompt = prompt.trim(); // Quitar espacios al inicio/final
        if (!trimmedPrompt) { setError('Por favor, ingresa una consulta.'); return; }
        if (!token) { setError('Error de autenticación.'); return; }
        if (isLoadingHistory) { console.warn("handleSubmit blocked: History is loading."); return; }
        if (isSubmitting) { console.warn("handleSubmit blocked: Already submitting."); return; } // Prevenir doble envío

        console.log(`Submitting prompt to convId: ${selectedConversationId ?? 'New'}`);
        setIsSubmitting(true); // Marcar como enviando ANTES de la llamada
        setError('');
        setSuccess('');

        // Añadir mensaje del usuario inmediatamente a la UI (Optimistic Update)
        const userMessage = {
             role: 'user',
             content: trimmedPrompt, // Usar el prompt trimado
             timestamp: new Date().toISOString()
        };
        setHistory((prev) => [...prev, userMessage]);
        setPrompt(''); // Limpiar input

        // Scroll hacia abajo después de añadir mensaje de usuario
        setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 50);

        try {
            const response = await fetch('http://localhost:3001/assistant/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({
                    prompt: trimmedPrompt, // Enviar prompt trimado
                    context: context,
                    conversationId: selectedConversationId // Enviar ID actual (puede ser null para nueva)
                }),
            });

            if (response.ok) {
                const data = await response.json();
                const assistantReply = data.reply;
                const returnedConversationId = data.conversationId;

                console.log(`Backend replied for conversation ${returnedConversationId}.`);

                const wasNewConversation = selectedConversationId === null;

                // Simular escritura de la respuesta del asistente
                simulateTyping(assistantReply, (fullText) => {
                     // Añadir mensaje del asistente al historial DESPUÉS de la animación
                     setHistory((prev) => {
                         // Evitar duplicados si hubo re-render o error previo
                         // Quitamos el mensaje optimista del usuario ANTES de añadir el final del asistente y el del usuario real si es necesario
                         const historyWithoutUserOptimistic = prev.filter(msg => msg !== userMessage);

                         return [
                             ...historyWithoutUserOptimistic,
                             userMessage, // Re-añadir el mensaje del usuario confirmado implícitamente por la respuesta OK
                             { role: 'assistant', content: fullText, timestamp: new Date().toISOString() },
                         ];
                     });

                     // Manejar navegación o actualización de sidebar
                     if (wasNewConversation && returnedConversationId) {
                         console.log(`Navigating to new conversation URL: /VirtualAssistent/chat/${returnedConversationId}`);
                         fetchConversations(); // Refrescar lista sidebar para mostrar la nueva conversación
                         // No necesitamos setSelectedConversationId aquí porque la navegación lo hará
                         navigate(`/VirtualAssistent/chat/${returnedConversationId}`, { replace: true }); // Navegar a la URL de la nueva conversación
                     } else if (selectedConversationId && returnedConversationId === selectedConversationId) {
                         // Si era existente y el ID coincide, solo refrescar la lista para actualizar 'updatedAt'
                         fetchConversations();
                     } else if (selectedConversationId && returnedConversationId !== selectedConversationId) {
                         // Caso raro: El backend devolvió un ID diferente al esperado para una conversación existente
                         console.warn(`Backend returned unexpected conversation ID ${returnedConversationId}, expected ${selectedConversationId}. Navigating.`);
                         fetchConversations(); // Refrescar lista
                         navigate(`/VirtualAssistent/chat/${returnedConversationId}`, { replace: true });
                     } else if (!selectedConversationId && !returnedConversationId) {
                        // Caso raro: Era nueva pero no se devolvió ID?
                        console.error("Backend did not return a conversation ID for a new chat.");
                        setError("Error: No se pudo crear la nueva conversación en el servidor.");
                        fetchConversations(); // Refrescar por si acaso
                     }
                     // NOTA: simulateTyping llama a setIsSubmitting(false) al terminar
                 });

            } else {
                // Manejo de errores del backend
                let errorMessage = `Error del asistente (${response.status})`;
                 try { const errorData = await response.json(); errorMessage = errorData.message || errorMessage; } catch {}
                setError(errorMessage);
                console.error("handleSubmit fetch error:", errorMessage);
                // Revertir mensaje optimista del usuario si falla la llamada
                setHistory(prev => prev.filter(msg => msg !== userMessage));
                setIsSubmitting(false); // Asegurarse de resetear el estado de envío
                setTypingMessage(''); // Limpiar mensaje de escritura si estaba activo
            }
        } catch (err) {
            // Manejo de errores de red u otros
            setError(err.message || 'Error de conexión.');
            console.error("handleSubmit network error:", err);
            // Revertir mensaje optimista del usuario
            setHistory(prev => prev.filter(msg => msg !== userMessage));
            setIsSubmitting(false); // Asegurarse de resetear el estado de envío
            setTypingMessage(''); // Limpiar mensaje de escritura si estaba activo
        }
        // NO poner setIsSubmitting(false) aquí si se usa simulateTyping,
        // porque simulateTyping lo hará al terminar.
    };
    // -----------------------------------------------------------

    // --- Manejador para Tecla Enter (SIN CAMBIOS) ---
    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey && !isSubmitting && !isLoadingHistory) {
            e.preventDefault(); // Prevenir salto de línea en textarea
            handleSubmit(e);
        }
    };
    // ---------------------------------------------

    // --- Copiar al Portapapeles (SIN CAMBIOS) ---
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
    // ------------------------------------------

    // --- Limpiar Vista de Historial (SOLO LOCAL - SIN CAMBIOS LÓGICOS) ---
    const clearHistory = () => {
         // Solo limpia la vista localmente, no afecta la conversación guardada
         setHistory([]);
         setSuccess('Vista de chat limpiada localmente.');
         console.warn("VirtualAssistant: Chat view cleared locally. Conversation still exists on server.");
         setTimeout(() => setSuccess(''), 2000);
    };
    // ---------------------------------------------------

    // --- Manejador para Seleccionar Conversación (MODIFICADO para cerrar menú móvil) ---
    const handleSelectConversation = (id) => {
        if (id === selectedConversationId && !isMobileMenuOpen) { // No hacer nada si ya está seleccionada Y el menú está cerrado
            console.log(`Conversation ${id} is already selected.`);
            return;
        }
        console.log(`UI: Selecting conversation ${id}. Navigating...`);
        setError(''); // Limpiar errores al cambiar
        setSuccess(''); // Limpiar mensajes de éxito
        // La navegación disparará el useEffect principal para cargar mensajes
        navigate(`/VirtualAssistent/chat/${id}`);
        setIsMobileMenuOpen(false); // Cerrar menú móvil al seleccionar una conversación
    };
    // -------------------------------------------

    // --- Manejador para Botón "Nuevo Chat" (MODIFICADO para cerrar menú móvil) ---
    const handleNewChat = () => {
        if (selectedConversationId === null && !isMobileMenuOpen) { // No hacer nada si ya está en Nuevo Chat Y el menú está cerrado
            console.log("Already in 'New Chat' view.");
            return;
        }
        console.log("UI: Starting new chat. Navigating to base route...");
        setError(''); // Limpiar errores
        setSuccess(''); // Limpiar mensajes de éxito
        // La navegación disparará el useEffect principal para limpiar estado
        navigate('/VirtualAssistent');
        setIsMobileMenuOpen(false); // Cerrar menú móvil al iniciar nuevo chat
    };
    // ---------------------------------------

    // --- Manejador para Borrar Conversación (Llama al Backend) ---
    const handleDeleteConversation = async (idToDelete, title, event) => {
        event.stopPropagation(); // Evitar que el click active la selección de la conversación
        if (!token) { setError("Autenticación requerida."); return; }

        // Usar un título más descriptivo si no existe
        const displayTitle = title || `Conversación ID: ${idToDelete}`;
        const confirmation = window.confirm(`¿Estás seguro de eliminar permanentemente la conversación "${displayTitle}"?\n\n¡Esta acción no se puede deshacer!`);
        if (!confirmation) { return; }

        console.log(`UI: Deleting conversation ${idToDelete}...`);
        setError(''); setSuccess('');

        // Guardar el ID activo antes de borrar, por si acaso
        const currentlyActiveId = selectedConversationId;

        try {
             const response = await fetch(`http://localhost:3001/assistant/conversations/${idToDelete}`, {
                 method: 'DELETE',
                 headers: { 'Authorization': `Bearer ${token}` },
             });

             if (response.ok || response.status === 204) { // 204 No Content también es éxito
                 setSuccess(`Conversación "${displayTitle}" eliminada.`);
                 console.log(`Conversation ${idToDelete} deleted successfully.`);

                 // Optimistic update: Remove from local state immediately
                 setConversations(prev => prev.filter(conv => conv.id !== idToDelete));

                 // Si se borró la conversación activa, navegar a "Nuevo Chat"
                 if (idToDelete === currentlyActiveId) {
                     console.log("Deleted active conversation, navigating to new chat.");
                     // Llamar a handleNewChat maneja la navegación Y el cierre del menú móvil
                     handleNewChat();
                 } else {
                     // Si se borró una conversación inactiva, la lista se actualizó, no hace falta navegar
                     // pero podríamos querer refrescar la lista completa por si acaso (aunque el setConversations ya lo hizo localmente)
                     // fetchConversations(); // Opcional, si queremos reconfirmar con el backend
                 }
                 setTimeout(() => setSuccess(''), 3000);

             } else {
                 // Manejo de error al borrar
                 let errorMessage = `Error al eliminar (${response.status})`;
                 try { const errorData = await response.json(); errorMessage = errorData.message || errorMessage; } catch {}
                 setError(errorMessage);
                 console.error(`Failed to delete conversation ${idToDelete}:`, errorMessage);
                 setTimeout(() => setError(''), 3000); // Limpiar error después de un tiempo
             }
        } catch (err) {
             // Manejo de error de red
             setError('Error de conexión al eliminar la conversación.');
             console.error(`Network error deleting conversation ${idToDelete}:`, err);
             setTimeout(() => setError(''), 3000); // Limpiar error después de un tiempo
        }
    };
    // ------------------------------------------------------

    // --- Opciones de Contexto (SIN CAMBIOS) ---
    const contextOptions = [
        { value: 'general', label: 'General', description: 'Consultas generales y respuestas amplias.' },
        { value: 'tickets', label: 'Tickets', description: 'Ayuda con la gestión de tickets de soporte.' },
        { value: 'knowledgebase', label: 'Base de Conocimiento', description: 'Respuestas basadas en una base de conocimiento.' },
    ];
    // ---------------------------------------

    // --- Funciones de Formato de Fecha/Hora (Completas y SIN CAMBIOS LÓGICOS) ---
    const getTimeSeparator = (currentMsg, prevMsg) => {
        if (!prevMsg) return null; // No hay separador antes del primer mensaje
         // Validar timestamps antes de crear fechas
         if (!currentMsg?.timestamp || !prevMsg?.timestamp) return null;
        try {
             const currentDate = new Date(currentMsg.timestamp);
             const prevDate = new Date(prevMsg.timestamp);

             // Comprobar si son días diferentes
             if (currentDate.toDateString() !== prevDate.toDateString()) {
                 return (
                     <div className="text-center text-xs text-gray-500 dark:text-gray-400 my-3 py-1 px-3 rounded-full bg-gray-200/50 dark:bg-gray-700/50 backdrop-blur-sm self-center mx-auto max-w-max">
                         {/* Usar date-fns para formato completo de fecha en español */}
                         {format(currentDate, 'PPPP', { locale: es })} {/* 'PPPP' es Lunes, 1 de Enero de 2024 */}
                     </div>
                 );
             }
        } catch (e) {
             console.error("Error formatting time separator:", e);
             return null; // Evitar crash si la fecha es inválida
        }
        return null; // No mostrar separador si son del mismo día
    };

    const formatTimestamp = (timestamp) => {
        if (!timestamp) return '??:??'; // Manejar nulo o undefined
        try {
             // Usar date-fns para formato corto de hora en español (ej: 14:30)
             return format(new Date(timestamp), 'p', { locale: es });
        } catch {
             return '??:??'; // Placeholder si la fecha/hora es inválida
        }
    };
    // --------------------------------------------------------------------

    // --- Componente Sidebar Interno (para reutilización) ---
    const SidebarContent = () => (
        <>
            {/* Botón Nuevo Chat */}
             <button
                onClick={handleNewChat} // handleNewChat ahora cierra el menú
                className={`w-full flex items-center justify-center px-4 py-2.5 mb-4 rounded-lg font-semibold text-sm transition-colors shadow-sm ${
                    isDarkMode
                        ? 'bg-indigo-600 text-white hover:bg-indigo-500 focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-indigo-500 disabled:bg-indigo-800 disabled:opacity-70'
                        : 'bg-indigo-500 text-white hover:bg-indigo-600 focus:ring-2 focus:ring-offset-2 focus:ring-offset-white focus:ring-indigo-500 disabled:bg-indigo-300'
                } ${selectedConversationId === null ? '!bg-opacity-70 cursor-default' : ''}`} // Estilo un poco diferente si ya está activo
                disabled={selectedConversationId === null || isLoadingHistory} // Deshabilitar si ya está en nuevo chat o cargando
                aria-label="Iniciar una nueva conversación"
            >
                <FiPlusCircle className="mr-2 flex-shrink-0" size={18}/> Nuevo Chat
            </button>

            {/* Título Historial */}
            <h3 className={`text-xs font-semibold uppercase tracking-wider mb-2 flex items-center justify-between px-1 ${
                isDarkMode ? 'text-gray-400' : 'text-gray-500'
            }`}>
                Historial
                {isLoadingConversations && <FiLoader className="animate-spin text-gray-400 dark:text-gray-500" size={14}/>}
            </h3>

            {/* Contenedor Scrollable Lista */}
            <div className="flex-1 overflow-y-auto -mx-3 px-3 custom-scrollbar">
                {isLoadingConversations && conversations.length === 0 ? ( // Loader si carga y no hay datos aún
                    <div className="flex justify-center items-center py-10">
                         <FiLoader className={`animate-spin ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`} size={24}/>
                    </div>
                ) : !isLoadingConversations && conversations.length === 0 ? ( // Mensaje si terminó y no hay nada
                    <div className="text-center py-10 px-4">
                        <FiMessageSquare className={`mx-auto mb-3 ${isDarkMode ? 'text-gray-600' : 'text-gray-400'}`} size={36} />
                        <p className={`text-sm ${isDarkMode ? 'text-gray-500' : 'text-gray-600'}`}>
                            No tienes conversaciones guardadas.
                        </p>
                    </div>
                ) : ( // Mostrar la lista
                    <ul className="space-y-1.5 py-1">
                        {conversations.map((conv) => (
                            <li key={conv.id}>
                                <button
                                    onClick={() => handleSelectConversation(conv.id)} // handleSelectConversation cierra el menú
                                    disabled={isLoadingHistory && selectedConversationId !== conv.id} // Deshabilitar mientras carga OTRA conversación
                                    className={`w-full text-left px-3 py-2.5 rounded-md transition-all duration-150 group relative ${
                                        selectedConversationId === conv.id
                                            ? (isDarkMode ? 'bg-gray-700 shadow-inner text-white font-semibold' : 'bg-indigo-100 shadow-inner text-indigo-800 font-semibold')
                                            : (isDarkMode ? 'text-gray-300 hover:bg-gray-700/60 hover:text-white' : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900')
                                    } disabled:opacity-50 disabled:cursor-not-allowed`}
                                    title={conv.title || `Conversación ${conv.id}`}
                                >
                                    {/* Icono Loader si esta conversación específica está cargando */}
                                    {isLoadingHistory && selectedConversationId === conv.id && (
                                        <FiLoader className="animate-spin inline-block mr-2 text-xs align-middle" />
                                    )}
                                    {/* Título y Fecha */}
                                    <p className="font-medium truncate pr-6 text-sm leading-tight inline"> {/* inline para que loader quede al lado */}
                                        {conv.title || `Conversación ${conv.id}`}
                                    </p>
                                    <p className={`text-xs mt-0.5 ${selectedConversationId === conv.id ? (isDarkMode? 'text-gray-400':'text-indigo-600'):(isDarkMode?'text-gray-500':'text-gray-500')}`}>
                                        {/* Usar date-fns para formatear relativo o específico */}
                                        {format(new Date(conv.updatedAt), 'Pp', { locale: es })} {/* Ej: 01/01/2024, 14:30 */}
                                    </p>
                                    {/* Botón Borrar (solo visible al hover en el grupo) */}
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
    // --------------------------------------------------------

    // --- RENDERIZADO JSX ---
    return (
        // Layout asume que proporciona la estructura base (navbar/header, etc.)
        <Layout>
            {/* Contenedor Flex Principal: Ocupa el alto restante y usa flexbox */}
            {/* Quitamos overflow-hidden aquí para permitir que el contenido maneje su propio scroll */}
            <div className="flex h-[calc(100vh-var(--header-height,64px))] dark:bg-gray-900 bg-gray-100"> {/* Ajustar altura si el Layout tiene header */}

                {/* --- Barra Lateral de Conversaciones (DESKTOP - SIEMPRE VISIBLE) --- */}
                {/* Se oculta en pantallas < md usando 'hidden md:flex' */}
                <div className={`hidden md:flex w-64 flex-shrink-0 border-r overflow-y-auto p-4 flex-col transition-colors duration-300 ${
                    isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
                }`}>
                    <SidebarContent />
                </div>

                {/* --- Menú Lateral Móvil (Overlay) --- */}
                {/* Controlado por isMobileMenuOpen, usa AnimatePresence para animación */}
                <AnimatePresence>
                    {isMobileMenuOpen && (
                        <>
                            {/* Backdrop */}
                            <motion.div
                                variants={backdropVariants}
                                initial="hidden"
                                animate="visible"
                                exit="exit"
                                transition={{ duration: 0.3 }}
                                className="fixed inset-0 z-30 bg-black/50 backdrop-blur-sm md:hidden" // Oculto en desktop
                                onClick={() => setIsMobileMenuOpen(false)}
                                aria-hidden="true"
                            />
                            {/* Panel del Menú */}
                            <motion.div
                                key="mobile-menu"
                                variants={mobileMenuVariants}
                                initial="closed"
                                animate="open"
                                exit="closed"
                                className={`fixed inset-y-0 left-0 z-40 w-64 p-4 flex flex-col shadow-xl md:hidden ${ // Oculto en desktop
                                    isDarkMode ? 'bg-gray-800 border-r border-gray-700' : 'bg-white border-r border-gray-200'
                                }`}
                                role="dialog" // Indicate it's a dialog (menu)
                                aria-modal="true" // It's modal because of the backdrop
                                aria-label="Menú de conversaciones"
                            >
                                {/* Botón de Cerrar dentro del menú móvil */}
                                <div className="flex justify-end mb-3 -mr-2">
                                    <button
                                        onClick={() => setIsMobileMenuOpen(false)}
                                        className={`p-2 rounded-full transition-colors ${isDarkMode ? 'text-gray-400 hover:bg-gray-700' : 'text-gray-500 hover:bg-gray-200'}`}
                                        aria-label="Cerrar menú"
                                    >
                                        <FiX size={20}/>
                                    </button>
                                </div>
                                {/* Reutilizar el contenido de la sidebar */}
                                <SidebarContent />
                            </motion.div>
                        </>
                    )}
                </AnimatePresence>

                {/* --- Área Principal del Chat --- */}
                {/* - flex-1 para que ocupe el espacio restante */}
                {/* - relative para posicionar elementos internos */}
                {/* - flex flex-col para organizar contenido verticalmente */}
                {/* - overflow-hidden para que el scroll SÓLO ocurra en el área de mensajes */}
                {/* - padding responsivo: p-4 en móvil, sm:p-6 lg:p-8 */}
                <main className={`flex-1 relative flex flex-col h-full overflow-hidden transition-colors duration-300 particles-bg p-4 sm:p-6 lg:p-8 ${
                    isDarkMode ? 'dark' : '' // Asegura que el modo oscuro aplique aquí también
                    }`}>
                    {/* Cabecera del Área de Chat (Botón Menú Móvil, Título y Botón Tema) */}
                    {/* - flex-shrink-0 para que no se encoja */}
                    {/* - Padding ajustado con px-0 pt-0 porque el padding ya está en el 'main' */}
                    <div className="flex items-center justify-between mb-4 flex-shrink-0 px-0 pt-0">
                        {/* *** BOTÓN HAMBURGUESA (SOLO MÓVIL) *** */}
                        <button
    onClick={() => setIsMobileMenuOpen(true)}
    //   ↓↓↓↓↓↓↓↓↓↓↓ Cambiado 'inspect' por 'inline-flex'
    className={`z-10 inline-flex md:hidden p-2 rounded-md transition-colors mr-2 -ml-1 ${
        isDarkMode ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-600 hover:bg-gray-200'
    }`}
    // ...
>
    <FiMenu size={22} />
</button>
                        {/* Título */}
                        <motion.h2
                            className={`text-xl sm:text-2xl lg:text-3xl font-bold tracking-tight truncate pr-2 ${ // Reducir pr un poco por si título es largo
                                isDarkMode ? 'text-gray-100' : 'text-gray-800'
                            }`}
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.3 }}
                            key={selectedConversationId || 'new-chat-title'} // Animar cambio de título
                        >
                             {selectedConversationId
                                ? conversations.find(c => c.id === selectedConversationId)?.title || `Conversación ${selectedConversationId}`
                                : "Nuevo Chat"}
                        </motion.h2>

                        {/* Botón de Tema */}
                         <motion.button
                            onClick={toggleDarkMode}
                            className={`z-10 p-2 rounded-full transition-colors ml-auto ${ // ml-auto para empujar a la derecha
                                isDarkMode ? 'bg-gray-700 text-yellow-400 hover:bg-gray-600' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                            }`}
                            whileHover={{ scale: 1.1, rotate: 15 }} whileTap={{ scale: 0.9 }} aria-label={isDarkMode ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
                         >
                             {isDarkMode ? <FiSun size={18} /> : <FiMoon size={18} />}
                         </motion.button>
                    </div>

                    {/* Alertas (Error y Éxito) */}
                    {/* - flex-shrink-0 */}
                    {/* - padding x ajustado a 0 */}
                    <div className="px-0 flex-shrink-0">
                        <AnimatePresence>
                             {success && (
                                 <motion.div
                                    key="success-alert" // Key única
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
                                     key="error-alert" // Key única
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

                    {/* Botones de Contexto y Borrar Vista */}
                    {/* - flex-shrink-0 */}
                    {/* - padding x ajustado a 0 */}
                    {/* - flex-wrap para que los botones pasen a la siguiente línea en pantallas pequeñas */}
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
                                 title={option.description} // Añadir tooltip con descripción
                             >
                                 {option.label}
                             </motion.button>
                         ))}
                         {/* Botón para limpiar vista local (menos prominente) */}
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

                    {/* Área de Mensajes Scrollable */}
                    {/* - flex-1 para que ocupe el espacio vertical restante */}
                    {/* - overflow-y-auto para habilitar scroll VERTICAL */}
                    {/* - padding responsivo p-3 sm:p-4 lg:p-6 */}
                    {/* - mb-4 para separarlo del input */}
                    {/* - rounded-lg o rounded-xl */}
                    <motion.div
                        ref={chatContainerRef}
                        className={`flex-1 rounded-lg shadow-inner p-3 sm:p-4 lg:p-6 overflow-y-auto mb-4 backdrop-blur-md custom-scrollbar flex flex-col ${
                            isDarkMode ? 'bg-gray-800/70 border border-gray-700/50' : 'bg-white/70 border border-gray-200/80'
                        }`}
                        variants={chatContainerVariants} initial="hidden" animate="visible"
                        key={selectedConversationId || 'chat-area-new'} // Re-animar si cambia la conversación
                    >
                        {/* --- Renderizado Condicional Interno --- */}
                        {isLoadingHistory ? (
                            <div className="flex flex-col items-center justify-center h-full text-gray-500 dark:text-gray-400 m-auto">
                                <FiLoader className="animate-spin mr-2 mb-2" size={24}/> Cargando Mensajes...
                            </div>
                        ) : !selectedConversationId && history.length === 0 && !isSubmitting ? (
                             <div className="flex flex-col items-center justify-center h-full text-gray-500 dark:text-gray-400 text-center m-auto p-5">
                                 <FiMessageSquare size={40} className="mb-4 opacity-50"/>
                                 <p className="text-base sm:text-lg">Selecciona una conversación del historial o inicia un <button onClick={handleNewChat} className="text-indigo-500 dark:text-indigo-400 hover:underline font-semibold">nuevo chat</button>.</p>
                                 <p className="text-sm mt-2 md:hidden">Usa el <FiMenu className='inline-block mx-1'/> menú para ver el historial.</p> {/* Hint para móvil */}
                             </div>
                        ) : history.length === 0 && !isSubmitting && !typingMessage && selectedConversationId ? (
                             <div className="flex flex-col items-center justify-center h-full text-gray-500 dark:text-gray-400 text-center m-auto p-5">
                                 <FiSend size={36} className="mb-4 opacity-50"/>
                                 <p className="text-base sm:text-lg">Envía tu primer mensaje para iniciar esta conversación.</p>
                             </div>
                        ) : (
                            // --- Renderizado del Historial y Mensajes de Escritura ---
                            // Usar un contenedor interno para que el ref de scroll funcione bien con flex-col en el padre
                            <div className="flex flex-col space-y-3">
                                {history.map((msg, index) => (
                                    <React.Fragment key={msg.timestamp + '-' + index + '-' + msg.role}> {/* Key más única */}
                                        {/* Separador de Fecha */}
                                        {getTimeSeparator(msg, history[index - 1])}

                                        {/* Contenedor del Mensaje (Usuario o Asistente) */}
                                        <motion.div
                                            variants={messageVariants} initial="hidden" animate="visible" custom={{ isUser: msg.role === 'user' }}
                                            className={`flex ${ msg.role === 'user' ? 'justify-end' : 'justify-start'} items-end group`} // items-end para alinear timestamp abajo
                                        >
                                            {/* Icono del Asistente */}
                                            {msg.role === 'assistant' && (
                                                <AiFillRobot className={`w-6 h-6 mb-1 mr-2 flex-shrink-0 self-start ${ isDarkMode ? 'text-indigo-400' : 'text-indigo-500' }`} />
                                            )}

                                            {/* Burbuja del Mensaje */}
                                            <div className={`relative max-w-[85%] sm:max-w-[75%] lg:max-w-[70%] ${msg.role === 'user' ? 'order-1' : ''}`}>
                                                <div className={`inline-block px-3.5 py-2.5 rounded-lg shadow-sm backdrop-blur-sm break-words ${
                                                    msg.role === 'user'
                                                        ? isDarkMode ? 'bg-gradient-to-br from-indigo-600 to-blue-600 text-indigo-50' : 'bg-gradient-to-br from-indigo-100 to-blue-100 text-indigo-900'
                                                        : isDarkMode ? 'bg-gradient-to-br from-gray-600 to-slate-600 text-gray-100' : 'bg-gradient-to-br from-gray-200 to-slate-200 text-gray-800'
                                                }`}>
                                                    {/* Contenido del Mensaje (Markdown) */}
                                                    {/* Aplicamos `whitespace-pre-wrap` para respetar saltos de línea del usuario */}
                                                    <div className={`text-sm prose dark:prose-invert max-w-none ${msg.role === 'user' ? 'whitespace-pre-wrap' : ''}`}>
                                                        <ReactMarkdown components={{
                                                             // Opcional: personalizar cómo se renderizan elementos específicos
                                                             a: ({node, ...props}) => <a {...props} target="_blank" rel="noopener noreferrer" className="text-indigo-500 dark:text-indigo-400 hover:underline"/>,
                                                             // Puedes añadir más personalizaciones aquí
                                                        }}>
                                                            {msg.content || ''}
                                                        </ReactMarkdown>
                                                    </div>
                                                </div>
                                                {/* Timestamp y Botón Copiar */}
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

                                {/* --- Mensaje "Escribiendo..." con Animación (Asistente) --- */}
                                {isSubmitting && typingMessage && (
                                     <motion.div
                                         initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}
                                         className="flex justify-start items-end group"
                                     >
                                         <AiFillRobot className={`w-6 h-6 mb-1 mr-2 flex-shrink-0 self-start ${ isDarkMode ? 'text-indigo-400' : 'text-indigo-500' }`} />
                                         <div className="relative max-w-[85%] sm:max-w-[75%] lg:max-w-[70%]">
                                             <div className={`inline-block px-3.5 py-2.5 rounded-lg shadow-sm backdrop-blur-sm ${ isDarkMode ? 'bg-gradient-to-br from-gray-600 to-slate-600 text-gray-100' : 'bg-gradient-to-br from-gray-200 to-slate-200 text-gray-800' }`}>
                                                 {/* Mostrar texto mientras se "escribe" */}
                                                 <div className="text-sm prose dark:prose-invert max-w-none flex items-center">
                                                     <ReactMarkdown>{typingMessage}</ReactMarkdown>
                                                     <span className="animate-ping ml-1 w-1 h-4 bg-gray-500 dark:bg-gray-400 inline-block"></span> {/* Cursor parpadeante */}
                                                 </div>
                                             </div>
                                             <div className={`text-xs mt-1 text-left ${ isDarkMode ? 'text-gray-400' : 'text-gray-500' }`}>
                                                 {formatTimestamp(new Date().toISOString())}
                                             </div>
                                         </div>
                                     </motion.div>
                                )}
                                {/* Indicador "Escribiendo..." antes de que empiece la animación de texto */}
                                {isSubmitting && !typingMessage && (
                                     <motion.div
                                        initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}
                                        className="flex justify-start items-end group"
                                     >
                                         <AiFillRobot className={`w-6 h-6 mb-1 mr-2 flex-shrink-0 self-start ${ isDarkMode ? 'text-indigo-400' : 'text-indigo-500' }`} />
                                         <div className="relative max-w-[85%] sm:max-w-[75%] lg:max-w-[70%]">
                                             <div className={`inline-block px-3.5 py-2.5 rounded-lg shadow-sm backdrop-blur-sm ${ isDarkMode ? 'bg-gradient-to-br from-gray-600 to-slate-600 text-gray-100' : 'bg-gradient-to-br from-gray-200 to-slate-200 text-gray-800' }`}>
                                                 <div className="text-sm flex items-center space-x-1.5 h-[20px]"> {/* Altura fija para evitar saltos */}
                                                     {/* Animación de puntos */}
                                                     <span className="w-1.5 h-1.5 bg-gray-400 dark:bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                                                     <span className="w-1.5 h-1.5 bg-gray-400 dark:bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                                                     <span className="w-1.5 h-1.5 bg-gray-400 dark:bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                                                 </div>
                                             </div>
                                         </div>
                                     </motion.div>
                                )}
                                {/* --- Fin de Mensajes --- */}
                                <div ref={messagesEndRef} className="h-0" /> {/* Elemento vacío para hacer scroll */}
                            </div> // Fin contenedor interno scrollable
                        )}
                    </motion.div> {/* Fin Área de Mensajes Scrollable */}

                    {/* --- Input de Chat --- */}
                    {/* - flex-shrink-0 para que no se encoja */}
                    {/* - Padding y estilos ajustados */}
                    {/* Mostrar solo si tenemos token Y (no estamos cargando lista inicial O ya hay un chat seleccionado/nuevo activo) */}
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
                                    className={`flex-1 rounded-lg border p-2.5 sm:p-3 text-sm resize-none shadow-inner transition duration-150 ease-in-out backdrop-blur-sm max-h-[120px] custom-scrollbar ${ // max-h para limitar altura, custom-scrollbar
                                        isDarkMode
                                            ? 'bg-gray-700/60 text-gray-100 border-gray-600 placeholder-gray-400 focus:bg-gray-700/80 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500'
                                            : 'bg-gray-50/80 text-gray-900 border-gray-300 placeholder-gray-500 focus:bg-white/90 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500'
                                    } ${
                                        error && !prompt.trim() && !isSubmitting // Borde rojo si hay error Y input vacío Y no enviando
                                            ? 'border-red-500 ring-1 ring-red-300 dark:border-red-600 dark:ring-red-500/50'
                                            : 'focus:outline-none' // Quitar outline por defecto, usar ring
                                    } ${
                                        (isSubmitting || isLoadingHistory) ? 'opacity-60 cursor-not-allowed' : '' // Estilo deshabilitado
                                    }`}
                                    disabled={isSubmitting || isLoadingHistory} // Deshabilitar input mientras carga/envía
                                    rows={1} // Empezar con 1 fila, se ajustará automáticamente
                                    aria-label="Escribir mensaje al asistente"
                                    style={{ overflowY: 'hidden' }} // Inicialmente ocultar scroll, JS lo maneja
                                />
                                <motion.button
                                    type="submit"
                                    className={`button-elegant self-end ${ // self-end para alinear con bottom del textarea
                                        (isSubmitting || isLoadingHistory || !prompt.trim()) ? 'disabled' : '' // Usar clase 'disabled' para estilo
                                    }`}
                                    disabled={isSubmitting || isLoadingHistory || !prompt.trim()} // Condición deshabilitado real
                                    whileHover={{ scale: (isSubmitting || isLoadingHistory || !prompt.trim()) ? 1 : 1.05, transition: { type: 'spring', stiffness: 400, damping: 15 } }}
                                    whileTap={{ scale: (isSubmitting || isLoadingHistory || !prompt.trim()) ? 1 : 0.95 }}
                                    aria-label="Enviar mensaje"
                                >
                                    {isSubmitting ? <FiLoader className="animate-spin text-white" size={18} /> : <FiSend className="text-white" size={18} />}
                                </motion.button>
                            </form>
                        </motion.div>
                    )} {/* Fin Input de Chat */}

                </main> {/* --- Fin Área Principal del Chat --- */}

                 {/* --- Estilos personalizados globales (CSS-in-JS) --- */}
                 {/* Mantenemos los estilos originales y añadimos algunos para mejorar */}
                <style jsx global>{`
                    :root {
                      --header-height: 64px; /* Define variable para altura del header si Layout lo tiene */
                    }
                    /* Estilo base del botón de enviar */
                    .button-elegant {
                        display: inline-flex;
                        align-items: center;
                        justify-content: center;
                        padding: 0.625rem; /* 10px (ligeramente más pequeño) */
                        height: 42px; /* Altura fija para alinear con textarea */
                        width: 42px;  /* Ancho fijo */
                        background-image: linear-gradient(to right, #4f46e5, #6366f1); /* indigo-600 to indigo-500 */
                        color: white;
                        border-radius: 0.5rem; /* 8px */
                        font-weight: 600; /* semibold */
                        box-shadow: 0 1px 3px 0 rgba(0,0,0,.1), 0 1px 2px -1px rgba(0,0,0,.1); /* Tailwind shadow-sm */
                        transition: all 0.2s ease-in-out;
                        border: none;
                        cursor: pointer;
                        flex-shrink: 0; /* Evitar que se encoja */
                    }
                    /* Hover state (solo si no está deshabilitado) */
                    .button-elegant:hover:not(:disabled) {
                        background-image: linear-gradient(to right, #4338ca, #4f46e5); /* indigo-700 to indigo-600 */
                        box-shadow: 0 4px 6px -1px rgba(0,0,0,.1), 0 2px 4px -2px rgba(0,0,0,.1); /* Tailwind shadow-md */
                    }
                    /* Focus state */
                    .button-elegant:focus-visible {
                        outline: 2px solid transparent;
                        outline-offset: 2px;
                        box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.4); /* ring-3 ring-indigo-500 ring-opacity-40 */
                    }
                    /* Active state */
                    .button-elegant:active:not(:disabled) {
                        transform: scale(0.98);
                    }
                    /* Disabled state (usando clase .disabled) */
                    .button-elegant.disabled {
                         opacity: 0.5;
                         cursor: not-allowed;
                         background-image: linear-gradient(to right, #a5b4fc, #c7d2fe); /* indigo-300 to indigo-200 */
                         box-shadow: none; /* Quitar sombra en estado deshabilitado */
                    }
                    .dark .button-elegant.disabled {
                         background-image: linear-gradient(to right, #4f46e5, #6366f1); /* Mantener color base pero con opacidad */
                         opacity: 0.4;
                    }

                    /* Estilos para el contenido Markdown (prose) */
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

                    /* Estilos Markdown modo oscuro (prose-invert) */
                    .dark .prose-invert { --tw-prose-body: #d1d5db; --tw-prose-headings: #f9fafb; --tw-prose-lead: #a1a1aa; --tw-prose-links: #818cf8; --tw-prose-bold: #f9fafb; --tw-prose-counters: #a1a1aa; --tw-prose-bullets: #6b7280; --tw-prose-hr: #4b5563; --tw-prose-quotes: #d1d5db; --tw-prose-quote-borders: #4b5563; --tw-prose-captions: #a1a1aa; --tw-prose-code: #f3f4f6; --tw-prose-pre-code: #d1d5db; --tw-prose-pre-bg: #1f2937; --tw-prose-th-borders: #4b5563; --tw-prose-td-borders: #374151; --tw-prose-invert-body: #d1d5db; /* ... otros colores invertidos ... */ }
                    .dark .prose :where(code):not(:where([class~="not-prose"] *)) { background-color: rgba(203, 213, 225, 0.15); }
                    .dark .prose :where(pre):not(:where([class~="not-prose"] *)) { background-color: #1e2937; color: #d1d5db; }
                    .dark .prose :where(blockquote):not(:where([class~="not-prose"] *)) { border-left-color: #4b5563; color: #9ca3af; }

                    /* --- Estilos de Fondo y Animaciones --- */
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
                        100% { background-position: -400px 800px; } /* Mover diagonalmente */
                    }
                    /* Animación de puntos 'escribiendo' */
                    .animate-bounce { animation: bounce 1s infinite; }
                    @keyframes bounce {
                        0%, 100% { transform: translateY(0); animation-timing-function: cubic-bezier(0.8,0,1,1); }
                        50% { transform: translateY(-25%); animation-timing-function: cubic-bezier(0,0,0.2,1); }
                    }

                    /* Scrollbar personalizado (Webkit y Firefox) */
                    .custom-scrollbar::-webkit-scrollbar { width: 6px; height: 6px; }
                    .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                    .custom-scrollbar::-webkit-scrollbar-thumb { background-color: rgba(156, 163, 175, 0.3); border-radius: 10px; border: 1px solid transparent; background-clip: content-box; }
                    .custom-scrollbar::-webkit-scrollbar-thumb:hover { background-color: rgba(156, 163, 175, 0.5); }
                    .dark .custom-scrollbar::-webkit-scrollbar-thumb { background-color: rgba(107, 114, 128, 0.4); }
                    .dark .custom-scrollbar::-webkit-scrollbar-thumb:hover { background-color: rgba(107, 114, 128, 0.6); }
                    .custom-scrollbar { scrollbar-width: thin; scrollbar-color: rgba(156, 163, 175, 0.3) transparent; }
                    .dark .custom-scrollbar { scrollbar-color: rgba(107, 114, 128, 0.4) transparent; }

                    /* Asegurar que prose no afecte negativamente whitespace */
                    .prose.whitespace-pre-wrap :where(p):not(:where([class~="not-prose"] *)) {
                       margin-top: 0; /* Quitar márgenes extra si el contenedor ya maneja saltos */
                       margin-bottom: 0;
                    }
                    .prose.whitespace-pre-wrap {
                       line-height: 1.6; /* Mantener buena legibilidad */
                    }

                `}</style>

            </div> {/* Fin Flex Container Principal */}
        </Layout>
    );
}

export default VirtualAssistent;