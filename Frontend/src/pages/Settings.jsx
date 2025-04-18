// src/pages/Settings.jsx
import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import Layout from '../components/common/Sidebar'; // Asegúrate que la ruta sea correcta
import {
    FiCheckCircle, FiAlertTriangle, FiLoader, FiSave, FiUser,
    FiMail, FiLock, FiEye, FiEyeOff
} from 'react-icons/fi';

// --- Componente Auxiliar para Input con Icono ---
const InputField = ({ id, name, type = "text", label, value, onChange, placeholder, disabled, icon: Icon, children, error }) => (
    <div className="relative">
        <label htmlFor={id} className="block text-sm font-medium text-gray-700 mb-1.5"> {/* Aumentado mb */}
            {label}
        </label>
        <div className="relative">
            {Icon && <Icon className="absolute left-3.5 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none w-5 h-5" />}
            <input
                type={type}
                id={id}
                name={name}
                value={value}
                onChange={onChange}
                placeholder={placeholder}
                disabled={disabled}
                autoComplete={name === 'currentPassword' ? 'current-password' : name.includes('newPassword') ? 'new-password' : 'off'}
                // Clases de Tailwind para estilo elegante
                className={`
                    block w-full rounded-lg border
                    ${error ? 'border-red-500 ring-1 ring-red-200' : 'border-gray-300 focus:border-indigo-500'}
                    ${Icon ? 'pl-11' : 'pl-4'} ${children ? 'pr-11' : 'pr-4'} py-3 {/* Aumentado padding */}
                    text-gray-900 placeholder-gray-400
                    bg-gray-50 focus:bg-white
                    focus:outline-none focus:ring-1 focus:ring-indigo-500
                    transition duration-150 ease-in-out shadow-sm
                    disabled:cursor-not-allowed disabled:bg-gray-200 disabled:opacity-70
                    sm:text-sm
                `}
            />
            {/* Para el botón de mostrar/ocultar contraseña */}
            {children && (
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                    {children}
                </div>
            )}
        </div>
    </div>
);

// --- Componente Principal ---
function Settings() {
    const { user, token, isLoading, refreshProfile } = useAuth();
    const [formData, setFormData] = useState({ username: '', email: '', currentPassword: '', newPassword: '', confirmPassword: '' });
    const [message, setMessage] = useState('');
    const [error, setError] = useState({ field: null, message: '' }); // Error con campo específico
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showCurrentPass, setShowCurrentPass] = useState(false);
    const [showNewPass, setShowNewPass] = useState(false);
    const [showConfirmPass, setShowConfirmPass] = useState(false);
    const successTimeoutRef = useRef(null);

    // Rellenar datos iniciales
    useEffect(() => {
        if (user) setFormData(prev => ({ ...prev, username: user.username || '', email: user.email || '' }));
        return () => { if (successTimeoutRef.current) clearTimeout(successTimeoutRef.current); };
    }, [user]);

    const handleChange = (e) => {
        setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
        setMessage(''); setError({ field: null, message: '' }); // Limpiar errores
        if (successTimeoutRef.current) clearTimeout(successTimeoutRef.current);
    };

     // Función para mostrar error específico de campo
     const setFieldError = (field, message) => setError({ field, message });

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!token || !user) return;
        setError({ field: null, message: '' }); setMessage('');
        if (successTimeoutRef.current) clearTimeout(successTimeoutRef.current);

        // Validaciones más específicas
        const { username, email, currentPassword, newPassword, confirmPassword } = formData;
        if (newPassword || confirmPassword || currentPassword) {
            if (!currentPassword) { setFieldError('currentPassword', 'Ingresa tu contraseña actual para verificar cambios.'); return; }
            if (newPassword) {
                if (newPassword.length < 8) { setFieldError('newPassword', 'Mínimo 8 caracteres.'); return; }
                if (newPassword !== confirmPassword) { setFieldError('confirmPassword', 'Las nuevas contraseñas no coinciden.'); return; }
            } else if (confirmPassword) {
                 setFieldError('newPassword', 'Ingresa la nueva contraseña.'); return;
            }
        }
        if (!username.trim()) { setFieldError('username', 'El nombre de usuario no puede estar vacío.'); return; }
        if (!email.trim()) { setFieldError('email', 'El correo electrónico no puede estar vacío.'); return; }
        // Validación simple de formato email (puedes usar librerías como validator.js)
        if (!/\S+@\S+\.\S+/.test(email)) { setFieldError('email', 'Formato de correo inválido.'); return; }


        setIsSubmitting(true);
        const dataToSend = {};
        if (username && username !== user.username) dataToSend.username = username;
        if (email && email !== user.email) dataToSend.email = email;
        if (newPassword && currentPassword) {
            dataToSend.currentPassword = currentPassword;
            dataToSend.newPassword = newPassword;
        } else if (currentPassword && !newPassword && (dataToSend.username || dataToSend.email)) {
             // Decide si necesitas enviar currentPassword para otros cambios según tu backend
             // O lanza error:
             setFieldError('newPassword','Ingresaste la contraseña actual sin una nueva para cambiarla.');
             setIsSubmitting(false);
             return;
        }

        if (Object.keys(dataToSend).length === 0) {
            setMessage('No has realizado cambios para guardar.'); // Usar message para info
            setIsSubmitting(false);
            return;
        }

        try {
            const response = await fetch(`http://localhost:3001/users/me`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}`},
                body: JSON.stringify(dataToSend),
            });
            const result = await response.json();
            if (!response.ok) {
                // Mapeo de errores más específico
                const errorMsg = result.message || 'Error desconocido del servidor.';
                if (response.status === 401) { setFieldError('currentPassword', errorMsg); }
                else if (response.status === 409) { // Conflict (username/email)
                    if (errorMsg.toLowerCase().includes('username') || errorMsg.toLowerCase().includes('nombre')) { setFieldError('username', errorMsg); }
                    else if (errorMsg.toLowerCase().includes('email') || errorMsg.toLowerCase().includes('correo')) { setFieldError('email', errorMsg); }
                    else { setError({ field: null, message: errorMsg }); } // Error general de conflicto
                }
                else if (response.status === 400) { setError({ field: null, message: `Datos inválidos: ${errorMsg}` }); } // Error de validación general
                else { throw new Error(errorMsg); } // Otro error
                return; // Detener ejecución si hubo error de API manejado
            }

            setMessage('¡Perfil actualizado con éxito!'); // Éxito
            if(dataToSend.newPassword) { setFormData(prev => ({ ...prev, currentPassword: '', newPassword: '', confirmPassword: '' })); }

            successTimeoutRef.current = setTimeout(() => {
                setMessage('');
                if (refreshProfile) refreshProfile();
            }, 2500);

        } catch (err) { setError({ field: null, message: err.message || 'Ocurrió un error de conexión o al procesar la respuesta.' }); }
        finally { setIsSubmitting(false); }
    };

     // --- Renderizado ---
    if (isLoading && !user) return ( <div className="p-6"><Layout>Cargando...</Layout></div> );
    if (!user) return ( <div className="p-6"><Layout>Error al cargar datos.</Layout></div> );

    const alertVariants = { /* ... (sin cambios) ... */ };

    // Función para mostrar error debajo del input
    const renderFieldError = (fieldName) => {
        if (error.field === fieldName && error.message) {
            return <p className="mt-1.5 text-xs text-red-600">{error.message}</p>;
        }
        return null;
    };

    // Componente para el botón de mostrar/ocultar contraseña
    const PasswordToggleButton = ({ show, onClick, field }) => (
        <button type="button" onClick={onClick} className="absolute right-3 inset-y-0 flex items-center text-gray-500 hover:text-indigo-600" aria-label={`${show ? 'Ocultar' : 'Mostrar'} contraseña ${field}`}>
            {show ? <FiEyeOff size={18} /> : <FiEye size={18} />}
        </button>
    );


    return (
         <Layout>
            <div className="p-4 sm:p-8 max-w-4xl mx-auto"> {/* Ancho ajustado */}
                <motion.h2
                    className="text-3xl font-extrabold text-gray-900 mb-8 tracking-tight" // Tipografía mejorada
                    initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.1 }}>
                    Ajustes de Perfil
                </motion.h2>

                {/* Alerta General de Éxito */}
                <AnimatePresence>
                    {message && ( <motion.div key="success" layout variants={alertVariants} initial="hidden" animate="visible" exit="exit" className="flex items-center p-4 mb-6 text-sm text-emerald-800 bg-emerald-100 rounded-lg border border-emerald-300 overflow-hidden shadow-sm" role="alert" > <FiCheckCircle className="flex-shrink-0 inline w-5 h-5 mr-3" /> <span className="font-semibold">{message}</span> </motion.div> )}
                    {/* Alerta General de Error (si no es específico de campo) */}
                    {error.field === null && error.message && ( <motion.div key="general-error" layout variants={alertVariants} initial="hidden" animate="visible" exit="exit" className="flex items-center p-4 mb-6 text-sm text-red-800 bg-red-100 rounded-lg border border-red-300 overflow-hidden shadow-sm" role="alert" > <FiAlertTriangle className="flex-shrink-0 inline w-5 h-5 mr-3" /> <span className="font-semibold">{error.message}</span> </motion.div> )}
                </AnimatePresence>

                <div className="bg-white p-8 sm:p-10 rounded-xl shadow-lg border border-gray-200">
                    <form onSubmit={handleSubmit} className="space-y-10"> {/* Más espacio */}

                        {/* --- Sección Info Básica --- */}
                        <section className="space-y-6">
                             <h3 className="text-xl font-semibold text-gray-900 border-b border-gray-200 pb-3 mb-6">Información Básica</h3>
                             {/* Username */}
                             <div>
                                 <InputField id="username" name="username" label="Nombre de Usuario" value={formData.username} onChange={handleChange} placeholder="Tu nombre público" disabled={isSubmitting} icon={FiUser} error={error.field === 'username'}/>
                                 {renderFieldError('username')}
                             </div>
                             {/* Email */}
                              <div>
                                 <InputField id="email" name="email" type="email" label="Correo Electrónico" value={formData.email} onChange={handleChange} placeholder="tu@email.com" disabled={isSubmitting} icon={FiMail} error={error.field === 'email'}/>
                                 {renderFieldError('email')}
                                 <p className="mt-2 text-xs text-gray-500 flex items-center"><FiAlertTriangle size={14} className="mr-1 text-yellow-500"/> El cambio de email no está verificado.</p>
                             </div>
                        </section>

                        {/* --- Sección Contraseña --- */}
                        <section className="space-y-6">
                            <h3 className="text-xl font-semibold text-gray-900 border-b border-gray-200 pb-3 mb-6">Seguridad</h3>
                            {/* Contraseña Actual */}
                             <div>
                                 <InputField id="currentPassword" name="currentPassword" type={showCurrentPass ? "text" : "password"} label="Contraseña Actual" value={formData.currentPassword} onChange={handleChange} placeholder="Requerida para cambios" disabled={isSubmitting} icon={FiLock} error={error.field === 'currentPassword'} >
                                     <PasswordToggleButton show={showCurrentPass} onClick={() => setShowCurrentPass(!showCurrentPass)} field="actual"/>
                                 </InputField>
                                 {renderFieldError('currentPassword')}
                            </div>
                            {/* Nuevas Contraseñas (Grid) */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-5"> {/* Ajustado gap */}
                                {/* Nueva */}
                                <div>
                                     <InputField id="newPassword" name="newPassword" type={showNewPass ? "text" : "password"} label="Nueva Contraseña" value={formData.newPassword} onChange={handleChange} placeholder="Mínimo 8 caracteres" disabled={isSubmitting} icon={FiLock} error={error.field === 'newPassword' || error.field === 'confirmPassword'} >
                                         <PasswordToggleButton show={showNewPass} onClick={() => setShowNewPass(!showNewPass)} field="nueva"/>
                                     </InputField>
                                     {renderFieldError('newPassword')}
                                </div>
                                {/* Confirmar */}
                                <div>
                                     <InputField id="confirmPassword" name="confirmPassword" type={showConfirmPass ? "text" : "password"} label="Confirmar Nueva" value={formData.confirmPassword} onChange={handleChange} placeholder="Repite la nueva" disabled={isSubmitting} icon={FiLock} error={error.field === 'confirmPassword'} >
                                         <PasswordToggleButton show={showConfirmPass} onClick={() => setShowConfirmPass(!showConfirmPass)} field="confirmación"/>
                                     </InputField>
                                     {renderFieldError('confirmPassword')}
                                </div>
                            </div>
                         </section>

                        {/* Botón Guardar */}
                        <div className="flex justify-end pt-6 border-t border-gray-200">
                            <motion.button
                                type="submit"
                                className={`button-elegant disabled:opacity-50 disabled:cursor-not-allowed`}
                                disabled={isSubmitting}
                                whileHover={{ scale: isSubmitting ? 1 : 1.03 }} // Evita escala al estar submitting
                                whileTap={{ scale: isSubmitting ? 1 : 0.97 }}
                            >
                                {isSubmitting ? ( <> <FiLoader className="animate-spin mr-2 text-white" /> Procesando... </> ) : ( <> <FiSave className="mr-2"/> Guardar Cambios </> )}
                            </motion.button>
                        </div>
                    </form>
                </div>
            </div>

             {/* Definiciones de clases Tailwind (mover a CSS global si es extenso) */}
            <style jsx global>{`
                 .button-elegant {
                     display: inline-flex; align-items: center; justify-content: center;
                     padding: 0.75rem 1.5rem; /* Más padding */
                     background-image: linear-gradient(to right, #4f46e5, #6366f1); /* Gradiente Indigo */
                     color: white;
                     border-radius: 0.75rem; /* rounded-xl */
                     font-weight: 600; /* semibold */
                     letter-spacing: 0.025em;
                     box-shadow: 0 4px 6px -1px rgba(79, 70, 229, 0.2), 0 2px 4px -1px rgba(0, 0, 0, 0.06); /* Sombra suave */
                     transition: all 0.2s ease-in-out;
                     border: none;
                     cursor: pointer;
                 }
                 .button-elegant:hover {
                    background-image: linear-gradient(to right, #4338ca, #4f46e5); /* Gradiente más oscuro */
                    box-shadow: 0 10px 15px -3px rgba(79, 70, 229, 0.25), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
                 }
                 .button-elegant:focus {
                    outline: none;
                    box-shadow: 0 0 0 4px rgba(99, 102, 241, 0.4);
                 }
                 .button-elegant:active {
                      transform: scale(0.98);
                 }
            `}</style>
         </Layout>
    );
}

export default Settings;