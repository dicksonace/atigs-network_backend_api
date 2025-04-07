const path = require('path'); // Use the path module to resolve paths
const swaggerJSDoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'My API',
      version: '1.0.0',
      description: 'API documentation',
    },
  },
  apis: [path.join(__dirname, '../routes/*.js')], // Correctly resolve the path to your route files
};

const swaggerSpec = swaggerJSDoc(options);

function swaggerDocs(app) {
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec)); // Serve the Swagger UI at /api-docs
}

module.exports = swaggerDocs;
