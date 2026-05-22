const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

const port = process.env.PORT || 3000;

const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'API Distribuidora',
      version: '1.0.0',
      description: 'Documentación interactiva de la API para la Distribuidora',
    },
    servers: [
      {
        url: `http://localhost:${port}`,
        description: 'Servidor local',
      },
    ],
  },
  apis: ['./docs/**/*.yaml', './docs/**/*.yml'], // Busca la documentación en los archivos YAML de la carpeta docs
};

const swaggerDocs = swaggerJsdoc(swaggerOptions);

module.exports = {
  swaggerUi,
  swaggerDocs
};
