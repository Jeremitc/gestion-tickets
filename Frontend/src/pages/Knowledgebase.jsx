import React from 'react';
import Layout from '../components/common/Sidebar'; // Asegúrate de que la ruta sea correcta
import { motion, AnimatePresence } from 'framer-motion';
import { FiChevronDown, FiChevronRight, FiLifeBuoy, FiFileText, FiCheckSquare, FiClock, FiAlertTriangle, FiPlusCircle } from 'react-icons/fi'; // Importar iconos relevantes

// --- Componente Reutilizable para Secciones Desplegables (Acordeón) ---
const AccordionItem = ({ title, children, icon: Icon }) => {
    const [isOpen, setIsOpen] = React.useState(false);
    const contentId = `kb-content-${title.replace(/\s+/g, '-').toLowerCase()}`; // ID único para accesibilidad
    const headerId = `kb-header-${title.replace(/\s+/g, '-').toLowerCase()}`;

    return (
        <div className="border-b border-gray-200 dark:border-gray-700 last:border-b-0">
            <h2> {/* Usar h2 para semántica */}
                <button
                    type="button"
                    className={`flex items-center justify-between w-full py-4 px-5 text-left font-medium transition-colors duration-200 ${
                        isOpen
                            ? 'text-indigo-600 dark:text-indigo-400 bg-gray-100/50 dark:bg-gray-800/30'
                            : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100/80 dark:hover:bg-gray-700/50'
                    }`}
                    onClick={() => setIsOpen(!isOpen)}
                    aria-expanded={isOpen}
                    aria-controls={contentId}
                    id={headerId}
                >
                    <span className="flex items-center">
                        {Icon && <Icon className="mr-3 h-5 w-5 flex-shrink-0 text-indigo-500 dark:text-indigo-400" />}
                        {title}
                    </span>
                    {isOpen ? <FiChevronDown className="w-5 h-5 transform rotate-180 transition-transform" /> : <FiChevronRight className="w-5 h-5 transition-transform" />}
                </button>
            </h2>
            <AnimatePresence initial={false}>
                {isOpen && (
                    <motion.div
                        id={contentId}
                        role="region"
                        aria-labelledby={headerId}
                        key="content"
                        initial="collapsed"
                        animate="open"
                        exit="collapsed"
                        variants={{
                            open: { opacity: 1, height: 'auto', marginTop: '0px', marginBottom: '16px' }, // Añadir margen inferior
                            collapsed: { opacity: 0, height: 0, marginTop: '0px', marginBottom: '0px' }
                        }}
                        transition={{ duration: 0.3, ease: [0.04, 0.62, 0.23, 0.98] }}
                        // Padding y estilos del contenido
                        className="overflow-hidden" // Necesario para la animación de altura
                    >
                        {/* Aplicar estilos de 'prose' para formatear el contenido interno */}
                        <div className="px-5 pb-4 text-sm text-gray-600 dark:text-gray-400 prose prose-sm dark:prose-invert max-w-none">
                            {children}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};
// --------------------------------------------------------------------

// --- Componente Principal de la Página ---
function Knowledgebase() {
    // Contenido de ejemplo (puedes moverlo a un archivo separado o cargarlo desde una API si crece)
    const kbContent = [
        {
            id: 'what-is-ticket',
            title: '¿Qué es un Ticket de Soporte?',
            icon: FiFileText,
            content: (
                <>
                    <p>Un ticket en nuestro sistema SoporteSys es un registro formal de tu solicitud de ayuda, reporte de error, pregunta o cualquier incidencia que necesites comunicar a nuestro equipo.</p>
                    <p>Piensa en él como un expediente único para tu caso. Nos permite:</p>
                    <ul>
                        <li><strong>Organizar:</strong> Cada solicitud tiene su propio espacio.</li>
                        <li><strong>Priorizar:</strong> Atendemos los casos según su urgencia e impacto.</li>
                        <li><strong>Rastrear:</strong> Tanto tú como nosotros podemos seguir el progreso hasta la solución.</li>
                        <li><strong>Comunicar:</strong> Mantenemos toda la comunicación sobre un problema en un solo lugar (a través de los comentarios del ticket).</li>
                    </ul>
                    <p>Crear un ticket asegura que tu solicitud no se pierda y sea atendida de manera eficiente.</p>
                </>
            )
        },
        {
            id: 'how-to-create',
            title: '¿Cómo Crear un Ticket Efectivo?',
            icon: FiPlusCircle, // Asumiendo que importaste FiPlusCircle
            content: (
                <>
                    <p>Crear un buen ticket nos ayuda a resolver tu problema más rápido. Sigue estos consejos:</p>
                    <ol>
                        <li><strong>Ve a la sección "Crear Ticket":</strong> La encontrarás en el menú lateral.</li>
                        <li><strong>Título Claro y Conciso:</strong> Escribe un asunto que resuma el problema. Ej: "Error 500 al guardar perfil", "No puedo acceder a la factura de Octubre". Evita títulos vagos como "Ayuda" o "Problema".</li>
                        <li><strong>Descripción Detallada:</strong> ¡Aquí está la clave! Explica claramente qué sucede. Incluye:
                            <ul>
                                <li>¿Qué intentabas hacer?</li>
                                <li>¿Qué esperabas que sucediera?</li>
                                <li>¿Qué sucedió en realidad? (Menciona mensajes de error exactos si los hay).</li>
                                <li>¿Cuándo empezó el problema?</li>
                                <li>¿Puedes reproducirlo? Si es así, ¿cuáles son los pasos?</li>
                                <li>¿Has intentado alguna solución por tu cuenta?</li>
                                <li>Cualquier otra información relevante (navegador, sistema operativo, si afecta a otros usuarios, etc.).</li>
                            </ul>
                        </li>
                        <li><strong>Selecciona Tipo y Categoría:</strong> Elige las opciones que mejor describan tu solicitud. Esto nos ayuda a clasificar y asignar el ticket correctamente.
                            <ul>
                                <li><strong>Tipo:</strong> ¿Es un error (Incidente), una duda (Pregunta), algo más complejo (Problema), o una solicitud de trabajo (Tarea)?</li>
                                <li><strong>Categoría:</strong> ¿A qué área pertenece? (Problema Técnico, Facturación, Cuenta, etc.)</li>
                            </ul>
                         </li>
                         <li><strong>(Opcional) Prioridad:</strong> Si tienes la opción, selecciona la urgencia real. No marques todo como "Urgente" si no lo es, ya que esto retrasa otros casos importantes.</li>
                         <li><strong>(Opcional) Adjuntos:</strong> Si una captura de pantalla, un log o un documento ayuda a entender el problema, ¡adjúntalo! (Funcionalidad futura).</li>
                        <li><strong>Enviar:</strong> Revisa la información y haz clic en "Crear Ticket".</li>
                    </ol>
                </>
            )
        },
        {
            id: 'ticket-states',
            title: 'Entendiendo los Estados de un Ticket',
            icon: FiCheckSquare,
            content: (
                <>
                    <p>Tu ticket pasará por diferentes estados a medida que trabajamos en él:</p>
                    <ul>
                        <li><strong>Nuevo:</strong> Acabas de crear el ticket. ¡Gracias! Lo hemos recibido y está en la cola para ser revisado.</li>
                        <li><strong>Abierto:</strong> Un agente ha visto tu ticket y probablemente te contactará pronto o empezará a investigarlo.</li>
                        <li><strong>En Progreso:</strong> Estamos trabajando activamente para solucionar tu problema o responder tu consulta.</li>
                        <li><strong>Pendiente:</strong> Hemos necesitado más información de tu parte o estamos esperando una acción de otro equipo. Revisa los comentarios por si te hemos preguntado algo. El ticket se reactivará cuando respondas o se resuelva la dependencia.</li>
                        <li><strong>Resuelto:</strong> ¡Creemos que hemos solucionado el problema o respondido tu pregunta! Revisa la solución propuesta en los comentarios.</li>
                        <li><strong>Cerrado:</strong> Has confirmado que el problema está resuelto, o el ticket se cerró automáticamente después de un tiempo en estado "Resuelto". Si el problema persiste, por favor, crea un nuevo ticket haciendo referencia a este.</li>
                    </ul>
                </>
            )
        },
        {
            id: 'ticket-priorities',
            title: '¿Qué Significan las Prioridades?',
            icon: FiAlertTriangle,
            content: (
                 <>
                    <p>La prioridad nos ayuda a determinar la urgencia de tu solicitud:</p>
                    <ul>
                        <li><strong>Baja:</strong> Problemas menores, consultas generales que no impiden tu trabajo principal.</li>
                        <li><strong>Media:</strong> Es la prioridad por defecto. Problemas que causan inconvenientes pero tienen soluciones temporales o no bloquean completamente.</li>
                        <li><strong>Alta:</strong> Problemas importantes que afectan significativamente tu capacidad de trabajo o a un grupo de usuarios, pero el sistema principal sigue operativo.</li>
                        <li><strong>Urgente:</strong> ¡Emergencia! El sistema principal está caído, hay una brecha de seguridad, o un problema crítico que impide totalmente el trabajo a muchos usuarios. Úsala con responsabilidad.</li>
                    </ul>
                    <p>Nuestro equipo puede reajustar la prioridad si considera que la clasificación inicial no es la adecuada, siempre buscando atender los casos más críticos primero.</p>
                 </>
            )
        },
         {
            id: 'response-times',
            title: 'Tiempos de Respuesta Esperados (SLA)',
            icon: FiClock,
            content: (
                 <>
                    <p>Nos esforzamos por responder y resolver tus tickets lo más rápido posible. Nuestros objetivos de nivel de servicio (SLA) generales son:</p>
                    <ul>
                        <li><strong>Prioridad Urgente:</strong> Primera respuesta en 1 hora laborable, objetivo de resolución en 4 horas laborables.</li>
                        <li><strong>Prioridad Alta:</strong> Primera respuesta en 4 horas laborables, objetivo de resolución en 1 día laborable.</li>
                        <li><strong>Prioridad Media:</strong> Primera respuesta en 1 día laborable, objetivo de resolución en 3 días laborables.</li>
                        <li><strong>Prioridad Baja:</strong> Primera respuesta en 2 días laborables, objetivo de resolución según disponibilidad.</li>
                    </ul>
                    <p><em>(Nota: Estos son ejemplos. Los tiempos reales pueden variar según la complejidad del caso y la carga de trabajo actual. Las horas laborables son de Lunes a Viernes, 9:00 a 18:00, hora local, excluyendo festivos.)</em></p>
                    <p>Puedes ver la prioridad asignada a tu ticket en la lista o en los detalles del mismo.</p>
                 </>
            )
        },
        // Puedes añadir más secciones aquí: Cómo añadir comentarios, adjuntar archivos (cuando esté), etc.
    ];

    return (
        <Layout>
            {/* --- Cabecera de la Página --- */}
            <motion.div
                 initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
                 className="mb-8"
            >
                <h2 className="text-3xl font-bold text-gray-800 dark:text-gray-100 mb-2 flex items-center">
                   <FiLifeBuoy className="mr-3 text-indigo-500"/> Base de Conocimiento
                </h2>
                <p className="text-gray-600 dark:text-gray-400">
                    Encuentra respuestas rápidas y guías sobre cómo usar nuestro sistema de soporte.
                </p>
            </motion.div>

            {/* --- Barra de Búsqueda (Funcionalidad Futura) --- */}
            {/* <div className="mb-8">
                <div className="relative">
                    <input
                        type="search"
                        placeholder="Buscar en la base de conocimiento..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
                    />
                    <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500" />
                </div>
            </div> */}

             {/* --- Contenedor de Acordeones --- */}
            <motion.div
                 initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2, duration: 0.5 }}
                 // Estilos del contenedor principal del acordeón
                 className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden"
             >
                 {kbContent.length > 0 ? (
                    kbContent.map((item) => (
                        <AccordionItem key={item.id} title={item.title} icon={item.icon}>
                            {item.content}
                        </AccordionItem>
                    ))
                 ) : (
                     <p className="p-5 text-center text-gray-500 dark:text-gray-400">
                         No se encontraron artículos en la base de conocimiento.
                     </p>
                 )}
            </motion.div>

            {/* --- Estilos Adicionales para 'prose' si son necesarios --- */}
             <style jsx global>{`
                .prose ul > li::before { background-color: #6366f1; /* Color de viñeta indigo */ }
                .dark .prose-invert ul > li::before { background-color: #a5b4fc; /* Color de viñeta indigo claro */ }
                .prose ol > li::marker { font-weight: 600; color: #4f46e5; /* Color número lista indigo */ }
                .dark .prose-invert ol > li::marker { color: #818cf8; }
                /* Ajustes menores si es necesario */
                .prose h2 { margin-top: 1.5em; margin-bottom: 0.5em; padding-bottom: 0.3em; border-bottom: 1px solid #e5e7eb; }
                .dark .prose-invert h2 { border-bottom-color: #4b5563; }
             `}</style>
        </Layout>
    )
}

export default Knowledgebase;