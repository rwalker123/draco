console.log('Testing Swagger module loading...');

try {
  console.log('1. Testing swagger-ui-express...');
  const swaggerUi = require('swagger-ui-express');
  console.log('✅ swagger-ui-express loaded successfully');
  
  console.log('2. Testing swagger config...');
  const swaggerConfig = require('./dist/config/swagger');
  console.log('✅ swagger config loaded successfully:', !!swaggerConfig.specs);
  
  console.log('3. Testing swagger-jsdoc...');
  const swaggerJsdoc = require('swagger-jsdoc');
  console.log('✅ swagger-jsdoc loaded successfully');
  
  console.log('All Swagger modules loaded successfully!');
} catch (error) {
  console.error('❌ Error loading Swagger modules:', error.message);
  console.error('Stack:', error.stack);
} 