#!/usr/bin/env node

/**
 * Simple compression test script for Phase 1 validation
 * This script tests the compression endpoints to validate functionality
 */

import https from 'https';

// SSL certificate configuration for local development
const options = {
  hostname: 'localhost',
  port: 3001,
  path: '/health',
  method: 'GET',
  rejectUnauthorized: false, // For self-signed certificates
  headers: {
    'Accept-Encoding': 'gzip, deflate, br'
  }
};

// Test endpoints
const testEndpoints = [
  '/health',
  '/compression-stats',
  '/api/compression-test/small',
  '/api/compression-test/season/test-account/test-season',
  '/api/compression-test/users/test-account',
  '/api/compression-test/statistics/test-account/test-season',
  '/api/compression-test/schedule/test-account/test-season'
];

async function testEndpoint(path) {
  return new Promise((resolve, reject) => {
    const reqOptions = { ...options, path };
    
    const req = https.request(reqOptions, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        const responseSize = Buffer.byteLength(data);
        const isCompressed = res.headers['content-encoding'];
        const contentType = res.headers['content-type'];
        
        console.log(`\n[TEST] ${path}`);
        console.log(`├─ Status: ${res.statusCode}`);
        console.log(`├─ Response Size: ${(responseSize / 1024).toFixed(1)}KB`);
        console.log(`├─ Content-Type: ${contentType || 'Not specified'}`);
        console.log(`├─ Compression: ${isCompressed ? `Yes (${isCompressed})` : 'No'}`);
        
        if (isCompressed) {
          console.log(`└─ Compression Applied Successfully`);
        } else {
          if (responseSize < 1024) {
            console.log(`└─ Skipped: Below 1KB threshold`);
          } else if (contentType && (
            contentType.includes('image/') || 
            contentType.includes('video/') || 
            contentType.includes('audio/') ||
            contentType.includes('application/zip') ||
            contentType.includes('application/gzip')
          )) {
            console.log(`└─ Skipped: Binary or already compressed content`);
          } else {
            console.log(`└─ Skipped: Unknown reason`);
          }
        }
        
        resolve({
          path,
          statusCode: res.statusCode,
          responseSize,
          isCompressed,
          contentType
        });
      });
    });
    
    req.on('error', (error) => {
      console.error(`[ERROR] ${path}: ${error.message}`);
      reject(error);
    });
    
    req.end();
  });
}

async function runCompressionTests() {
  console.log('🚀 Starting Compression Validation Tests...\n');
  console.log('This script tests the compression endpoints to validate:');
  console.log('1. Compression is working for large responses');
  console.log('2. Small responses are properly skipped');
  console.log('3. Compression analytics are being collected');
  console.log('4. Test data generation is working\n');
  
  const results = [];
  
  for (const endpoint of testEndpoints) {
    try {
      const result = await testEndpoint(endpoint);
      results.push(result);
      
      // Add a small delay between requests
      await new Promise(resolve => setTimeout(resolve, 500));
    } catch (error) {
      console.error(`Failed to test ${endpoint}:`, error.message);
    }
  }
  
  // Summary
  console.log('\n📊 Test Summary:');
  console.log('================');
  
  const totalRequests = results.length;
  const compressedRequests = results.filter(r => r.isCompressed).length;
  const skippedRequests = totalRequests - compressedRequests;
  
  console.log(`Total Requests: ${totalRequests}`);
  console.log(`Compressed: ${compressedRequests}`);
  console.log(`Skipped: ${skippedRequests}`);
  console.log(`Compression Rate: ${((compressedRequests / totalRequests) * 100).toFixed(1)}%`);
  
  // Check compression stats endpoint
  try {
    console.log('\n🔍 Checking Compression Analytics...');
    const statsResult = await testEndpoint('/compression-stats');
    
    if (statsResult.statusCode === 200) {
      console.log('✅ Compression analytics endpoint is working');
      console.log('📈 Check the console logs above for detailed compression metrics');
    } else {
      console.log('❌ Compression analytics endpoint returned error');
    }
  } catch (error) {
    console.error('❌ Failed to check compression analytics:', error.message);
  }
  
  console.log('\n🎯 Next Steps:');
  console.log('1. Check the backend console for compression logs');
  console.log('2. Visit /compression-stats endpoint for detailed analytics');
  console.log('3. Analyze if compression is providing meaningful benefits');
  console.log('4. Decide whether to proceed with full implementation');
}

// Run the tests
runCompressionTests().catch(console.error);
