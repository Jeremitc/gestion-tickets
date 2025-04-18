import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link, useNavigate } from 'react-router-dom'; // Importa Link y useNavigate
import '../styles/global.css';

function Login() {
    // Estado para almacenar los valores del formulario
     const { login } = useAuth();
    const [formData, setFormData] = useState({
        emailOrUsername: '',
        password: ''
    });
    // Hook para navegar programáticamente después del login (opcional)
    const navigate = useNavigate();
    const [error, setError] = useState(''); // Estado para mensajes de error

    // Manejador para actualizar el estado cuando los inputs cambian
    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prevState => ({
            ...prevState,
            [name]: value
        }));
        // Limpiar error al empezar a escribir de nuevo
        if (error) setError('');
    };

    // Manejador para el envío del formulario
    const handleSubmit = async (e) => {
        e.preventDefault(); // Prevenir el comportamiento por defecto del formulario (recarga)
        setError(''); // Limpiar errores previos

        // Validación básica (puedes añadir más)
        if (!formData.emailOrUsername || !formData.password) {
            setError('Por favor, completa ambos campos.');
            return;
        }

        console.log('Datos a enviar:', formData);

        // --- Aquí iría la lógica para enviar los datos al backend ---
         try {
           const response = await fetch('http://localhost:3001/auth/login', { 
             method: 'POST',
             headers: {
               'Content-Type': 'application/json',
             },
             body: JSON.stringify(formData),
           });
        
           const result = await response.json();
        
           if (!response.ok) {
            // Use the message from the backend if available, otherwise a generic error
            throw new Error(result.message || `Error ${response.status}: ${response.statusText}`);
        }
        
           // Éxito: Guarda el token/session, redirige, etc.
           console.log('Login exitoso:', result.access_token);
           login(result.access_token);


               // Llama a la función de login del contexto

           alert(`Login Exitoso para ${result.user?.username || 'usuario'}`); // Muestra un mensaje de éxito (opcional)
           // Ejemplo de redirección a un dashboard:
           // localStorage.setItem('token', result.token); // Guarda el token si usas JWT
           // navigate('/dashboard');
           navigate('/dashboard');
         } catch (err) {
           console.error('Error en el login:', err);
           setError(err.message || 'Ocurrió un error. Inténtalo de nuevo.');
         }
   
        // --- Fin de la lógica de envío ---
        
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-100">
            <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
                <h2 className="text-2xl font-bold text-center text-gray-800 mb-6">
                    Iniciar Sesión
                </h2>

                {/* Mensaje de Error */}
                {error && (
                    <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
                        <span className="block sm:inline">{error}</span>
                    </div>
                )}

                <form onSubmit={handleSubmit}> {/* Añadido onSubmit */}
                    <div className="mb-4">
                        <label
                            htmlFor="emailOrUsername"
                            className="block text-gray-700 text-sm font-bold mb-2"
                        >
                            Correo Electrónico o Usuario
                        </label>
                        <input
                            type="text"
                            id="emailOrUsername"
                            name="emailOrUsername" // name es crucial para el handler
                            placeholder="tu.correo@ejemplo.com"
                            className={`w-full px-3 py-2 border ${error && !formData.emailOrUsername ? 'border-red-500' : 'border-gray-300'} rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                            value={formData.emailOrUsername} // Controlado por el estado
                            onChange={handleChange} // Manejador de cambio
                            // 'required' HTML5 es opcional si manejas la validación en JS
                        />
                    </div>

                    <div className="mb-6">
                        <label
                            htmlFor="password"
                            className="block text-gray-700 text-sm font-bold mb-2"
                        >
                            Contraseña
                        </label>
                        <input
                            type="password"
                            id="password"
                            name="password" // name es crucial para el handler
                            placeholder="••••••••"
                            className={`w-full px-3 py-2 border ${error && !formData.password ? 'border-red-500' : 'border-gray-300'} rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                            value={formData.password} // Controlado por el estado
                            onChange={handleChange} // Manejador de cambio
                            // 'required' HTML5 es opcional
                        />
                        {/* Usamos Link para la navegación interna */}
                        <Link
                            to="/forgot-password" // Cambia a tu ruta real
                            className="text-sm text-blue-500 hover:underline mt-2 inline-block"
                        >
                            ¿Olvidaste tu contraseña?
                        </Link>
                    </div>

                    <div className="mb-4">
                        <button
                            type="submit"
                            className="w-full bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition duration-150 ease-in-out"
                        >
                            Ingresar
                        </button>
                    </div>
                </form>

                <p className="text-center text-sm text-gray-600">
                    ¿No tienes una cuenta?{' '}
                    {/* Usamos Link para la navegación interna */}
                    <Link
                        to="/register" // Cambia a tu ruta real de registro
                        className="text-blue-500 hover:underline font-bold"
                    >
                        Regístrate aquí
                    </Link>
                </p>
            </div>
        </div>
    );
}

export default Login;