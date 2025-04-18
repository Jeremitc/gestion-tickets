import React from 'react';
import Layout from '../components/common/Sidebar'; // Asegúrate de que la ruta sea correcta
import { motion } from 'framer-motion';
function TicketList() {
  return (
    <Layout>
            <motion.h2
                className="text-2xl font-semibold text-gray-800 mb-6"
                 initial={{ opacity: 0, x: -50 }}
                 animate={{ opacity: 1, x: 0 }}
                 transition={{ duration: 0.5, delay: 0.1 }}
            >
                Configuración de la Cuenta
            </motion.h2>
            {/* Contenido específico de la página de configuración */}
            <div className="bg-white p-6 rounded-lg shadow-md">
                <p>Aquí irían los formularios y opciones de configuración...</p>
                {/* Por ejemplo: */}
                {/* <label>Email:</label> <input type="email" /> */}
                {/* <button>Guardar Cambios</button> */}
            </div>
        </Layout>
  )
}
export default TicketList;