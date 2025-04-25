// src/pages/Settings.jsx
import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import Layout from '../components/common/Sidebar'; // Asegúrate que la ruta sea correcta
import {
    FiCheckCircle, FiAlertTriangle, FiLoader, FiSave, FiUser,
    FiMail, FiLock, FiEye, FiEyeOff
} from 'react-icons/fi';

// --- Componente Auxiliar para Input con Icono (Adaptado para Dark Mode) ---
const InputField = ({ id, name, type = "text", label, value, onChange, placeholder, disabled, icon: Icon, children, error }) => (
    <div className="relative">
        <label htmlFor={id} className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5"> {/* Dark text */}
            {label}
        </label>
        <div className="relative">
            {Icon && <Icon className="absolute left-3.5 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 pointer-events-none w-5 h-5" />} {/* Dark icon */}
            <input
                type={type}
                id={id}
                name={name}
                value={value}
                onChange={onChange}
                placeholder={placeholder}
                disabled={disabled}
                autoComplete={name === 'currentPassword' ? 'current-password' : name.includes('newPassword') ? 'new-password' : 'off'}
                className={`
                    block w-full rounded-lg border
                    ${error
                        ? 'border-red-500 dark:border-red-400 ring-1 ring-red-200 dark:ring-red-400/30' // Dark error border/ring
                        : 'border-gray-300 dark:border-gray-600 focus:border-indigo-500 dark:focus:border-indigo-400' // Dark border & focus
                    }
                    ${Icon ? 'pl-11' : 'pl-4'} ${children ? 'pr-11' : 'pr-4'} py-3
                    text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 // Dark text & placeholder
                    bg-gray-50 dark:bg-gray-700 focus:bg-white dark:focus:bg-gray-700 // Dark bg & focus bg
                    focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:focus:ring-indigo-400 // Dark focus ring
                    transition duration-150 ease-in-out shadow-sm
                    disabled:cursor-not-allowed disabled:bg-gray-200 dark:disabled:bg-gray-600 disabled:opacity-70 dark:disabled:opacity-50 // Dark disabled
                    sm:text-sm
                `}
            />
            {children && (
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                    {children}
                </div>
            )}
        </div>
    </div>
);

// --- Componente Principal (Adaptado para Dark Mode) ---
function Settings() {
    const { user, token, isLoading, refreshProfile } = useAuth();
    const [formData, setFormData] = useState({ username: '', email: '', currentPassword: '', newPassword: '', confirmPassword: '' });
    const [message, setMessage] = useState('');
    const [error, setError] = useState({ field: null, message: '' });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showCurrentPass, setShowCurrentPass] = useState(false);
    const [showNewPass, setShowNewPass] = useState(false);
    const [showConfirmPass, setShowConfirmPass] = useState(false);
    const successTimeoutRef = useRef(null);

    useEffect(() => {
        if (user) setFormData(prev => ({ ...prev, username: user.username || '', email: user.email || '' }));
        return () => { if (successTimeoutRef.current) clearTimeout(successTimeoutRef.current); };
    }, [user]);

    const handleChange = (e) => {
        setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
        setMessage(''); setError({ field: null, message: '' });
        if (successTimeoutRef.current) clearTimeout(successTimeoutRef.current);
    };

     const setFieldError = (field, message) => setError({ field, message });

    const handleSubmit = async (e) => {
        e.preventDefault();
        // ... (lógica de validación y submit sin cambios visuales directos) ...
        if (!token || !user) return;
        setError({ field: null, message: '' }); setMessage('');
        if (successTimeoutRef.current) clearTimeout(successTimeoutRef.current);

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
        if (!/\S+@\S+\.\S+/.test(email)) { setFieldError('email', 'Formato de correo inválido.'); return; }

        setIsSubmitting(true);
        const dataToSend = {};
        if (username && username !== user.username) dataToSend.username = username;
        if (email && email !== user.email) dataToSend.email = email;
        if (newPassword && currentPassword) {
            dataToSend.currentPassword = currentPassword;
            dataToSend.newPassword = newPassword;
        } else if (currentPassword && !newPassword && (dataToSend.username || dataToSend.email)) {
             setFieldError('newPassword','Ingresaste la contraseña actual sin una nueva para cambiarla.');
             setIsSubmitting(false);
             return;
        }

        if (Object.keys(dataToSend).length === 0) {
            setMessage('No has realizado cambios para guardar.');
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
                const errorMsg = result.message || 'Error desconocido del servidor.';
                if (response.status === 401) { setFieldError('currentPassword', errorMsg); }
                else if (response.status === 409) {
                    if (errorMsg.toLowerCase().includes('username') || errorMsg.toLowerCase().includes('nombre')) { setFieldError('username', errorMsg); }
                    else if (errorMsg.toLowerCase().includes('email') || errorMsg.toLowerCase().includes('correo')) { setFieldError('email', errorMsg); }
                    else { setError({ field: null, message: errorMsg }); }
                }
                else if (response.status === 400) { setError({ field: null, message: `Datos inválidos: ${errorMsg}` }); }
                else { throw new Error(errorMsg); }
                return;
            }

            setMessage('¡Perfil actualizado con éxito!');
            if(dataToSend.newPassword) { setFormData(prev => ({ ...prev, currentPassword: '', newPassword: '', confirmPassword: '' })); }

            successTimeoutRef.current = setTimeout(() => {
                setMessage('');
                if (refreshProfile) refreshProfile();
            }, 2500);

        } catch (err) { setError({ field: null, message: err.message || 'Ocurrió un error de conexión o al procesar la respuesta.' }); }
        finally { setIsSubmitting(false); }
    };

    if (isLoading && !user) return ( <Layout><div className="p-6 text-gray-600 dark:text-gray-300">Cargando...</div></Layout> ); // Dark text for loading
    if (!user) return ( <Layout><div className="p-6 text-red-600 dark:text-red-400">Error al cargar datos.</div></Layout> ); // Dark text for error

    const alertVariants = {
        hidden: { opacity: 0, y: -10, scale: 0.95 },
        visible: { opacity: 1, y: 0, scale: 1 },
        exit: { opacity: 0, y: -10, scale: 0.95 }
    };

    const renderFieldError = (fieldName) => {
        if (error.field === fieldName && error.message) {
            // Dark text for field errors
            return <p className="mt-1.5 text-xs text-red-600 dark:text-red-400">{error.message}</p>;
        }
        return null;
    };

    const PasswordToggleButton = ({ show, onClick, field }) => (
        // Dark text for password toggle button
        <button type="button" onClick={onClick} className="absolute right-3 inset-y-0 flex items-center text-gray-500 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400" aria-label={`${show ? 'Ocultar' : 'Mostrar'} contraseña ${field}`}>
            {show ? <FiEyeOff size={18} /> : <FiEye size={18} />}
        </button>
    );

    return (
         <Layout>
            {/* Padding adjusted for consistency, no specific dark mode needed here unless Layout doesn't handle main bg */}
            <div className="p-4 sm:p-8 max-w-4xl mx-auto">
                <motion.h2
                    // Dark text for main heading
                    className="text-3xl font-extrabold text-gray-900 dark:text-gray-100 mb-8 tracking-tight"
                    initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.1 }}>
                    Ajustes de Perfil
                </motion.h2>

                <AnimatePresence>
                    {/* Success Alert with Dark Mode styles */}
                    {message && (
                        <motion.div key="success" layout variants={alertVariants} initial="hidden" animate="visible" exit="exit"
                            className="flex items-center p-4 mb-6 text-sm text-emerald-800 bg-emerald-100 dark:bg-emerald-900/60 dark:text-emerald-200 rounded-lg border border-emerald-300 dark:border-emerald-700 overflow-hidden shadow-sm"
                            role="alert">
                                <FiCheckCircle className="flex-shrink-0 inline w-5 h-5 mr-3" />
                                <span className="font-semibold">{message}</span>
                        </motion.div>
                    )}
                    {/* General Error Alert with Dark Mode styles */}
                    {error.field === null && error.message && (
                         <motion.div key="general-error" layout variants={alertVariants} initial="hidden" animate="visible" exit="exit"
                            className="flex items-center p-4 mb-6 text-sm text-red-800 bg-red-100 dark:bg-red-900/60 dark:text-red-200 rounded-lg border border-red-300 dark:border-red-700 overflow-hidden shadow-sm"
                            role="alert">
                                <FiAlertTriangle className="flex-shrink-0 inline w-5 h-5 mr-3" />
                                <span className="font-semibold">{error.message}</span>
                         </motion.div>
                    )}
                </AnimatePresence>

                {/* Card Container with Dark Mode styles */}
                <div className="bg-white dark:bg-gray-800 p-8 sm:p-10 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700">
                    <form onSubmit={handleSubmit} className="space-y-10">

                        <section className="space-y-6">
                            {/* Section Heading with Dark Mode styles */}
                             <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-200 border-b border-gray-200 dark:border-gray-600 pb-3 mb-6">Información Básica</h3>
                             <div>
                                 <InputField id="username" name="username" label="Nombre de Usuario" value={formData.username} onChange={handleChange} placeholder="Tu nombre público" disabled={isSubmitting} icon={FiUser} error={error.field === 'username'}/>
                                 {renderFieldError('username')}
                             </div>
                              <div>
                                 <InputField id="email" name="email" type="email" label="Correo Electrónico" value={formData.email} onChange={handleChange} placeholder="tu@email.com" disabled={isSubmitting} icon={FiMail} error={error.field === 'email'}/>
                                 {renderFieldError('email')}
                                 {/* Helper text with Dark Mode styles */}
                                 <p className="mt-2 text-xs text-gray-500 dark:text-gray-400 flex items-center">
                                     <FiAlertTriangle size={14} className="mr-1 text-yellow-500 dark:text-yellow-400"/> {/* Dark icon color */}
                                     El cambio de email no está verificado.
                                 </p>
                             </div>
                        </section>

                        <section className="space-y-6">
                             {/* Section Heading with Dark Mode styles */}
                            <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-200 border-b border-gray-200 dark:border-gray-600 pb-3 mb-6">Seguridad</h3>
                             <div>
                                 <InputField id="currentPassword" name="currentPassword" type={showCurrentPass ? "text" : "password"} label="Contraseña Actual" value={formData.currentPassword} onChange={handleChange} placeholder="Requerida para cambios" disabled={isSubmitting} icon={FiLock} error={error.field === 'currentPassword'} >
                                     <PasswordToggleButton show={showCurrentPass} onClick={() => setShowCurrentPass(!showCurrentPass)} field="actual"/>
                                 </InputField>
                                 {renderFieldError('currentPassword')}
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-5">
                                <div>
                                     <InputField id="newPassword" name="newPassword" type={showNewPass ? "text" : "password"} label="Nueva Contraseña" value={formData.newPassword} onChange={handleChange} placeholder="Mínimo 8 caracteres" disabled={isSubmitting} icon={FiLock} error={error.field === 'newPassword' || error.field === 'confirmPassword'} >
                                         <PasswordToggleButton show={showNewPass} onClick={() => setShowNewPass(!showNewPass)} field="nueva"/>
                                     </InputField>
                                     {renderFieldError('newPassword')}
                                </div>
                                <div>
                                     <InputField id="confirmPassword" name="confirmPassword" type={showConfirmPass ? "text" : "password"} label="Confirmar Nueva" value={formData.confirmPassword} onChange={handleChange} placeholder="Repite la nueva" disabled={isSubmitting} icon={FiLock} error={error.field === 'confirmPassword'} >
                                         <PasswordToggleButton show={showConfirmPass} onClick={() => setShowConfirmPass(!showConfirmPass)} field="confirmación"/>
                                     </InputField>
                                     {renderFieldError('confirmPassword')}
                                </div>
                            </div>
                         </section>

                        {/* Button container with Dark Mode border */}
                        <div className="flex justify-end pt-6 border-t border-gray-200 dark:border-gray-600">
                           {/* ---- Button using Tailwind classes ---- */}
                            <motion.button
                                type="submit"
                                className={`
                                    inline-flex items-center justify-center px-6 py-3 /* Padding */
                                    bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-700 hover:to-indigo-600 /* Gradient */
                                    dark:from-indigo-500 dark:to-indigo-400 dark:hover:from-indigo-600 dark:hover:to-indigo-500 /* Dark Gradient */
                                    text-white font-semibold tracking-wide /* Text */
                                    rounded-xl /* Shape */
                                    shadow-md hover:shadow-lg /* Shadow */
                                    focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:focus:ring-offset-gray-800 /* Focus Ring */
                                    transition duration-150 ease-in-out
                                    disabled:opacity-50 disabled:cursor-not-allowed
                                `}
                                disabled={isSubmitting}
                                whileHover={{ scale: isSubmitting ? 1 : 1.03 }}
                                whileTap={{ scale: isSubmitting ? 1 : 0.97 }}
                            >
                                {isSubmitting ? (
                                    <> <FiLoader className="animate-spin mr-2" /> Procesando... </> // text-white applied by button
                                ) : (
                                    <> <FiSave className="mr-2"/> Guardar Cambios </> // text-white applied by button
                                )}
                            </motion.button>
                        </div>
                    </form>
                </div>
            </div>

            {/* Eliminamos el bloque <style jsx global> ya que hemos aplicado estilos con Tailwind directamente al botón */}
            {/* <style jsx global>{` ... `}</style> */}
         </Layout>
    );
}

export default Settings;