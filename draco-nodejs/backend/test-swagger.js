console.log('Testing Swagger module loading...');

try {
  console.log('1. Testing swagger-ui-express...');
  const { default: swaggerUi } = await import('swagger-ui-express');
  console.log('✅ swagger-ui-express loaded successfully:', !!swaggerUi);
  
  console.log('2. Testing swagger config...');
  const swaggerConfig = await import('./dist/src/config/swagger.js');
  console.log('✅ swagger config loaded successfully:', !!swaggerConfig.specs);
  
  console.log('3. Testing swagger-jsdoc...');
  const { default: swaggerJsdoc } = await import('swagger-jsdoc');
  console.log('✅ swagger-jsdoc loaded successfully:', !!swaggerJsdoc);
  
  console.log('All Swagger modules loaded successfully!');
} catch (error) {
  console.error('❌ Error loading Swagger modules:', error.message);
  console.error('Stack:', error.stack);
}