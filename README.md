# 🎫 Proyecto de Gestión de Tickets

Bienvenido al repositorio del **Proyecto de Gestión de Tickets**, una aplicación diseñada para administrar y gestionar incidencias mediante tickets de manera sencilla y eficiente.

Este proyecto fue desarrollado por un grupo de estudiantes, con una arquitectura modular basada en **React Vanilla Puro** para el frontend y **Express.js** para el backend.

---

## 📌 Integrantes del Proyecto

- 🎨 Jeremi Matias Toscano Cardenas  
- 📊 Zenaida Lucero Escriba  
- 🔧 Jordan Vasquez Acala  
- 🛠️ Guilmer  
- 🖥️ Sofía  

---

## 📐 Modelo de Arquitectura

El proyecto está dividido en dos aplicaciones completamente independientes:

- **Frontend** → Desarrollado en **React Vanilla Puro**
- **Backend** → Desarrollado en **Express.js**

Ambas aplicaciones se comunican a través de una API REST.

---

## ⚙️ Variables de Entorno

Para que la aplicación backend funcione correctamente, debes crear un archivo `.env` en la raíz del proyecto backend con el siguiente contenido:

```bash
DATABASE_URL="mysql://root:@localhost:3306/gestion-tickets"
PORT=3001
JWT_SECRET=TU_CLAVE_JWT_GENERADA_POR_TI
JWT_EXPIRATION_TIME=3600s
GEMINI_API_KEY=TU_API_KEY
```

- Puedes obtener tu API Key de Gemini en 👉 [Google AI Studio](https://aistudio.google.com/prompts/new_chat)

---

## 🗄️ Base de Datos

### 📦 Instalación de Dependencias

Primero, instala las dependencias en el backend:

```bash
npm install
```

### 📌 Configuración con Prisma

Tienes **dos formas** de configurar la base de datos:

### 🔸 Opción 1: Usar el archivo SQL

- Ejecuta manualmente el archivo `u_migrations.sql` en tu servidor MySQL.
- Este archivo contiene la definición de la base de datos y la tabla de tickets.

### 🔸 Opción 2: Usar Prisma Migrate y Seed

Ejecuta los siguientes comandos en la raíz del backend:

```bash
npx prisma migrate dev && npm run prisma:seed
```

Esto creará las migraciones necesarias y poblará los datos iniciales.

---

## 🔐 Hashing de Contraseñas

En el archivo `hashing.js` se encuentra definida la función para encriptar contraseñas usando la librería `bcryptjs`.

Cada contraseña de usuario debe ser hasheada antes de almacenarse en la base de datos.

---

## 👤 Añadir Usuarios Manualmente

Actualmente, para agregar usuarios debes:

1. Hashear la contraseña con la función de `hashing.js`.
2. Insertar manualmente los valores correspondientes en la base de datos, incluyendo la contraseña encriptada.

---

## 🖥️ Frontend

Para levantar la aplicación frontend:

```bash
npm install && npm start
```

Esto instalará todas las dependencias y levantará el servidor de desarrollo de React.

---

## 📁 Estructura del Proyecto

```plaintext
├── backend/
│   ├── prisma/
│   ├── src/
│   ├── .env
│   ├── package.json
│   └── ...
└── frontend/
    ├── src/
    ├── public/
    ├── package.json
    └── ...
```

---

## 📌 Notas Adicionales

- Este proyecto está diseñado para ser modular y escalable.
- La clave JWT (`JWT_SECRET`) debe protegerse y generarse de forma segura en entornos de producción.
- La integración con la API de Gemini permitirá incorporar inteligencia artificial para mejorar la gestión de tickets en versiones futuras.

---

## 📣 Créditos

Proyecto realizado como parte de un trabajo académico colaborativo.  
Agradecemos a todos los integrantes por su esfuerzo y dedicación.

---

## 📝 Licencia

Este proyecto es de uso **académico**. Para cualquier uso comercial o de distribución, se deberá consultar previamente con los autores.

---

## 🚀 ¡Gracias por visitar este repositorio!
