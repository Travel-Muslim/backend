const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');
const path = require('path');
const fs = require('fs');

function getRouteFiles() {
  const routesDir = path.join(__dirname, '../routes');
  
  try {
    if (fs.existsSync(routesDir)) {
      const files = fs.readdirSync(routesDir);
      const routeFiles = files
        .filter(file => file.endsWith('.js'))
        .map(file => path.join(routesDir, file));
      
      console.log(' Found route files:', routeFiles.length);
      routeFiles.forEach(f => console.log('   -', path.basename(f)));
      return routeFiles;
    } else {
      console.warn(' Routes directory not found:', routesDir);
      return [];
    }
  } catch (error) {
    console.error(' Error reading routes:', error.message);
    return [];
  }
}

const routeFiles = getRouteFiles();

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
  apis: routeFiles.length > 0 ? routeFiles : [
    './src/routes/*.js',
  ],
};

let specs;
try {
  specs = swaggerJsdoc(options);
  const endpointCount = Object.keys(specs.paths || {}).length;
  console.log('Swagger specs generated successfully');
  console.log('Total endpoints:', endpointCount);
  
  if (endpointCount === 0) {
    console.warn('⚠️ No endpoints found! Check JSDoc comments in routes.');
  }
} catch (error) {
  console.error('Swagger generation error:', error.message);
  
  specs = {
    openapi: '3.0.0',
    info: {
      title: 'Seleema Tour API',
      version: '1.0.0',
      description: 'API is running. Documentation generation failed. Check logs for details.',
    },
    servers: options.definition.servers,
    paths: {
      '/': {
        get: {
          tags: ['General'],
          summary: 'API Root',
          responses: {
            '200': { description: 'API information' }
          }
        }
      },
      '/health': {
        get: {
          tags: ['General'],
          summary: 'Health Check',
          responses: {
            '200': { description: 'System status' }
          }
        }
      }
    },
  };
}

module.exports = { swaggerUi, specs };