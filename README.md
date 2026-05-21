# Servidor de Distribuidora 🚀

Este proyecto es una API Web robusta construida con **Node.js**, **Express**, y **Sequelize** (utilizando una base de datos local **SQLite**). Está diseñado siguiendo una arquitectura limpia y modular en capas, lo que facilita el mantenimiento, la escalabilidad y las pruebas del software.

---

## 📂 Estructura del Proyecto y Responsabilidades

A continuación, se detalla la función de cada carpeta en la raíz del proyecto y las responsabilidades específicas de cada capa arquitectónica:

### 1. `routes/` (Rutas)
* **Responsabilidad**: **Punto de entrada de las peticiones HTTP.**
* **Función**: Se encarga únicamente de interceptar las solicitudes entrantes (ej. `GET /users/all`, `POST /users`), definir los endpoints del sistema y delegar la ejecución al controlador correspondiente.
* **Regla de oro**: Las rutas no contienen lógica de negocio ni manipulan la respuesta HTTP directamente; solo actúan como un mapa de navegación de la API.

### 2. `controllers/` (Controladores)
* **Responsabilidad**: **Gestión del ciclo de Solicitud-Respuesta (Request-Response).**
* **Función**: 
  * Recibe los datos enviados por el cliente (`req.params`, `req.query`, `req.body`).
  * Realiza validaciones superficiales de la solicitud.
  * Llama a la capa de servicios para procesar la lógica.
  * Retorna la respuesta HTTP adecuada con su respectivo código de estado (ej. `200 OK`, `201 Created`, `404 Not Found`, `500 Internal Server Error`).
* **Regla de oro**: Un controlador nunca realiza consultas directas a la base de datos ni procesa reglas complejas de negocio.

### 3. `services/` (Servicios)
* **Responsabilidad**: **Capa de Lógica de Negocio.**
* **Función**: Aquí reside el "cerebro" de la aplicación.
  * Realiza cálculos, aplica reglas de negocio, procesa datos y coordina flujos complejos.
  * Llama a los modelos para persistir u obtener información de la base de datos.
* **Regla de oro**: La capa de servicios es totalmente independiente del protocolo de comunicación. No sabe si la petición provino de una API REST (Express), de una cola de mensajería o de la terminal. Por lo tanto, **nunca** debe interactuar con los objetos `req` o `res` de Express.

### 4. `models/` (Modelos / Módulos de Datos)
* **Responsabilidad**: **Definición de Entidades y Acceso a Datos.**
* **Función**: Define la estructura y tipos de datos de las tablas en la base de datos utilizando Sequelize (ej. campos de la tabla `Users`, validaciones a nivel de base de datos, relaciones/asociaciones entre tablas).
* **Regla de oro**: Representa la fuente de la verdad de los datos de la aplicación.

### 5. `dtos/` (Data Transfer Objects - Objetos de Transferencia de Datos)
* **Responsabilidad**: **Contratos de Entrada y Salida.**
* **Función**: Aunque no esté físicamente como carpeta por defecto, es un patrón muy recomendable en arquitecturas limpias. Los DTOs se encargan de definir el formato de los datos que viajan entre el cliente y el servidor:
  * **Input DTO**: Define y valida qué campos exactos requiere el sistema para crear o actualizar una entidad (filtrando campos extra no deseados).
  * **Output DTO**: Modela la respuesta que se le devolverá al cliente, permitiendo ocultar información sensible (como contraseñas, tokens o campos internos de auditoría).

### 6. `config/` (Configuración)
* **Responsabilidad**: **Ajustes y Conexiones del Entorno.**
* **Función**: Centraliza la configuración de la base de datos (`config/db`), variables de entorno (`config/env`) y configuraciones de terceros.

### 7. `middlewares/` (Interceptores)
* **Responsabilidad**: **Procesamiento de peticiones intermedias.**
* **Función**: Funciones que se ejecutan antes de llegar al controlador (ej. verificación de tokens JWT, validación de schemas de datos, manejo global de errores, CORS).

---

## 🛠️ Comandos del Proyecto

Para facilitar el desarrollo, se configuraron los siguientes scripts en el proyecto:

### 1. Iniciar el Servidor de Desarrollo
Inicia la API Express y la base de datos SQLite en `http://localhost:3000`.
```bash
npm start
```

### 2. Cargar Datos Semilla (Seed)
Ejecuta el archivo `seed.sql` de manera segura para poblar la base de datos SQLite con datos de prueba iniciales (usuarios, etc.).
```bash
npm run seed
```

### 3. Visualizar Base de Datos en Consola
Muestra instantáneamente en tu terminal una tabla formateada con todos los usuarios cargados en SQLite.
```bash
node show-users.js
```
