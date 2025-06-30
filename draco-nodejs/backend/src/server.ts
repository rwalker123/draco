import app from "./app";
const dotenv = require("dotenv");
const fs = require("fs");
const https = require("https");

// Load environment variables
dotenv.config();

const PORT = process.env.PORT || 3001;

if (process.env.NODE_ENV === "development") {
  const options = {
    key: fs.readFileSync("./certs/key.pem"),
    cert: fs.readFileSync("./certs/cert.pem"),
  };
  https.createServer(options, app).listen(PORT, () => {
    const host = process.env.HOST || "localhost";
    console.log(`HTTPS server running on https://${host}:${PORT}`);
    console.log(`📊 Environment: ${process.env.NODE_ENV || "development"}`);
    console.log(`🔗 Health check: https://${host}:${PORT}/health`);
  });
} else {
  const options = {
    key: fs.readFileSync("./certs/key.pem"),
    cert: fs.readFileSync("./certs/cert.pem"),
  };
  https.createServer(options, app).listen(PORT, () => {
    const host = process.env.HOST || "localhost";
    console.log(`🚀 Draco Sports Manager API server running on port ${PORT}`);
    console.log(`📊 Environment: ${process.env.NODE_ENV || "development"}`);
    console.log(`🔗 Health check: https://${host}:${PORT}/health`);
  });
}
