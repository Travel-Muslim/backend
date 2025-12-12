const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');
const path = require('path');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Seleema Tour API',
      version: '1.0.0',
      description: 'API Documentation untuk Seleema Tour Platform - Muslimah Travel',
      contact: {
        name: 'API Support',
        email: 'support@seleematour.com'
      },
    },
    servers: [
      {
        url: 'http://localhost:3000', 
        description: 'Development server',
      },
      {
        url: 'https://seleema-tour-api.vercel.app',
        description: 'Production server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Enter your JWT token from login response'
        },
      },
    },
    security: [
      {
        bearerAuth: [],
      },
    ],
  },
  apis: [
    './src/routes/*.js',
    '../src/routes/*.js',
    path.join(__dirname, '../routes/*.js'),
  ],
};

let specs;
try {
  specs = swaggerJsdoc(options);
  console.log(' Swagger specs generated successfully');
  console.log(' Total endpoints:', Object.keys(specs.paths || {}).length);
} catch (error) {
  console.error(' Swagger generation error:', error.message);
  specs = {
    openapi: '3.0.0',
    info: {
      title: 'Seleema Tour API',
      version: '1.0.0',
      description: 'API is running. Documentation generation failed. Please check route JSDoc comments.',
    },
    servers: options.definition.servers,
    paths: {},
  };
}

module.exports = { swaggerUi, specs };