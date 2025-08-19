console.log('Testing API documentation module loading...');

try {
  console.log('1. Testing swagger-ui-express...');
  const { default: swaggerUi } = await import('swagger-ui-express');
  console.log('✅ swagger-ui-express loaded successfully:', !!swaggerUi);
  
  console.log('2. Testing OpenAPI config...');
  const openApiConfig = await import('./dist/src/config/openapi.js');
  console.log('✅ OpenAPI config loaded successfully:', !!openApiConfig.specs);
  console.log('   - Paths:', Object.keys(openApiConfig.specs.paths || {}).length);
  console.log('   - Components:', Object.keys(openApiConfig.specs.components?.schemas || {}).length);
  
  console.log('All API documentation modules loaded successfully!');
} catch (error) {
  console.error('❌ Error loading Swagger modules:', error.message);
  console.error('Stack:', error.stack);
}