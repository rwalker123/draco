const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Draco Sports Manager API',
      version: '1.0.0',
      description: 'API documentation for Draco Sports Manager',
    },
    servers: [
      {
        url: 'http://localhost:5000',
        description: 'Development server',
      },
    ],
  },
  apis: ['./src/routes/*.ts', './src/app.ts'],
};

const specs = swaggerJsdoc(options);

module.exports = { specs }; 