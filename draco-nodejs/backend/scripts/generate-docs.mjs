import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

// __dirname polyfill for ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function loadSpecs() {
  // Load compiled swagger specs from dist to avoid ts-node/ESM loader issues
  const distSpecsPath = path.resolve(__dirname, '../dist/src/config/swagger.js');
  const moduleUrl = pathToFileURL(distSpecsPath).href;
  const mod = await import(moduleUrl);
  return mod.specs;
}

async function generateStaticDocs() {
  try {
    console.log('🔧 Generating static API documentation...');

    const specs = await loadSpecs();

    // Create docs directory if it doesn't exist
    const docsDir = path.join(__dirname, '../docs');
    if (!fs.existsSync(docsDir)) {
      fs.mkdirSync(docsDir, { recursive: true });
    }

    const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Draco Sports Manager API Documentation</title>
    <link rel="stylesheet" type="text/css" href="https://unpkg.com/swagger-ui-dist@5.9.0/swagger-ui.css" />
    <style>
        html { box-sizing: border-box; overflow-y: scroll; }
        *, *:before, *:after { box-sizing: inherit; }
        body { margin:0; background: #fafafa; }
        .swagger-ui .topbar { display: none; }
        .swagger-ui .info .title { color: #3b4151; font-family: sans-serif; font-size: 36px; font-weight: 600; margin: 0; }
        .swagger-ui .info .description { color: #3b4151; font-family: sans-serif; font-size: 14px; margin: 0 0 20px 0; }
    </style>
    </head>
<body>
    <div id="swagger-ui"></div>
    <script src="https://unpkg.com/swagger-ui-dist@5.9.0/swagger-ui-bundle.js"></script>
    <script src="https://unpkg.com/swagger-ui-dist@5.9.0/swagger-ui-standalone-preset.js"></script>
    <script>
        window.onload = function() {
            const ui = SwaggerUIBundle({
                spec: ${JSON.stringify({})}, // placeholder, replaced below
                dom_id: '#swagger-ui',
                deepLinking: true,
                presets: [SwaggerUIBundle.presets.apis, SwaggerUIStandalonePreset],
                plugins: [SwaggerUIBundle.plugins.DownloadUrl],
                layout: 'StandaloneLayout',
                docExpansion: 'list',
                filter: true,
                showRequestHeaders: true,
                tryItOutEnabled: true
            });
        };
    </script>
</body>
</html>`;

    // Inject specs safely to avoid breaking out of script tag; write JSON separately
    const outputPath = path.join(docsDir, 'index.html');
    const jsonSpecPath = path.join(docsDir, 'swagger.json');
    fs.writeFileSync(jsonSpecPath, JSON.stringify(specs, null, 2));

    // Read back and inline via fetch to avoid giant inline JSON
    const htmlWithFetch = htmlContent.replace(
      'spec: {}',
      `url: './swagger.json'`
    );
    fs.writeFileSync(outputPath, htmlWithFetch);

    console.log('✅ Static documentation generated successfully!');
    console.log(`📁 Output HTML: ${outputPath}`);
    console.log(`📄 JSON spec: ${jsonSpecPath}`);
  } catch (error) {
    console.error('❌ Error generating documentation:', error);
    process.exit(1);
  }
}

generateStaticDocs();


