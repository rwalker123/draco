import * as fs from 'fs';
import * as path from 'path';
const { specs } = require('../src/config/swagger');

const generateStaticDocs = async () => {
  try {
    console.log('🔧 Generating static API documentation...');
    
    // Create docs directory if it doesn't exist
    const docsDir = path.join(__dirname, '../docs');
    if (!fs.existsSync(docsDir)) {
      fs.mkdirSync(docsDir, { recursive: true });
    }
    
    // Generate the HTML content
    const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Draco Sports Manager API Documentation</title>
    <link rel="stylesheet" type="text/css" href="https://unpkg.com/swagger-ui-dist@5.9.0/swagger-ui.css" />
    <style>
        html {
            box-sizing: border-box;
            overflow: -moz-scrollbars-vertical;
            overflow-y: scroll;
        }
        *, *:before, *:after {
            box-sizing: inherit;
        }
        body {
            margin:0;
            background: #fafafa;
        }
        .swagger-ui .topbar {
            display: none;
        }
        .swagger-ui .info .title {
            color: #3b4151;
            font-family: sans-serif;
            font-size: 36px;
            font-weight: 600;
            margin: 0;
        }
        .swagger-ui .info .description {
            color: #3b4151;
            font-family: sans-serif;
            font-size: 14px;
            margin: 0 0 20px 0;
        }
    </style>
</head>
<body>
    <div id="swagger-ui"></div>
    <script src="https://unpkg.com/swagger-ui-dist@5.9.0/swagger-ui-bundle.js"></script>
    <script src="https://unpkg.com/swagger-ui-dist@5.9.0/swagger-ui-standalone-preset.js"></script>
    <script>
        window.onload = function() {
            const ui = SwaggerUIBundle({
                spec: ${JSON.stringify(specs, null, 2)},
                dom_id: '#swagger-ui',
                deepLinking: true,
                presets: [
                    SwaggerUIBundle.presets.apis,
                    SwaggerUIStandalonePreset
                ],
                plugins: [
                    SwaggerUIBundle.plugins.DownloadUrl
                ],
                layout: "StandaloneLayout",
                docExpansion: "list",
                filter: true,
                showRequestHeaders: true,
                tryItOutEnabled: true
            });
        };
    </script>
</body>
</html>`;
    
    // Write the HTML file
    const outputPath = path.join(docsDir, 'index.html');
    fs.writeFileSync(outputPath, htmlContent);
    
    console.log('✅ Static documentation generated successfully!');
    console.log(`📁 Output location: ${outputPath}`);
    console.log('🌐 You can serve this file from your website at /apidocs');
    
    // Also generate a JSON spec file for programmatic access
    const jsonSpecPath = path.join(docsDir, 'swagger.json');
    fs.writeFileSync(jsonSpecPath, JSON.stringify(specs, null, 2));
    console.log(`📄 JSON spec saved to: ${jsonSpecPath}`);
    
  } catch (error) {
    console.error('❌ Error generating documentation:', error);
    process.exit(1);
  }
};

// Run the generator
generateStaticDocs(); 