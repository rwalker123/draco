# Draco Backend

## Local HTTPS Development with mkcert

To ensure secure communication between the frontend and backend during local development, the backend is configured to use HTTPS with a trusted, locally-generated certificate. This setup closely matches production and prevents mixed content issues.

### Why mkcert?
- **mkcert** allows you to generate locally-trusted SSL certificates for development, avoiding browser warnings and certificate errors.

### Setup Steps

1. **Install mkcert**
   - **macOS:**
     ```sh
     brew install mkcert
     ```
   - **Windows (with Chocolatey):**
     ```sh
     choco install mkcert
     ```
   - **Linux:**
     See [mkcert installation instructions](https://github.com/FiloSottile/mkcert#installation).

2. **Create a local CA (one-time):**
   ```sh
   mkcert -install
   ```

3. **Generate certificates for localhost:**
   ```sh
   mkcert localhost 127.0.0.1 ::1
   ```
   This will create two files:
   - `localhost+2.pem` (certificate)
   - `localhost+2-key.pem` (private key)

   Move these to a `certs/` folder in the backend directory:
   ```sh
   mkdir -p certs
   mv localhost+2.pem certs/cert.pem
   mv localhost+2-key.pem certs/key.pem
   ```

4. **Backend HTTPS Configuration:**
   The backend is set up to use these certificates for HTTPS in development mode. See the entry point (e.g., `src/server.ts`) for how the certs are loaded.

5. **Frontend Trust (NODE_EXTRA_CA_CERTS):**
   To allow the frontend (Next.js) to call the backend over HTTPS without certificate errors, set the following environment variable when running the frontend:
   ```sh
   export NODE_EXTRA_CA_CERTS="$(mkcert -CAROOT)/rootCA.pem"
   npm run dev
   ```
   This is already included in the `frontend-next/package.json` scripts for convenience.

---

## Additional Notes
- Only use these certificates for local development. Never use self-signed or mkcert-generated certs in production.
- If you encounter certificate errors, ensure mkcert's CA is installed and the cert paths are correct.

---

For more details, see the mkcert [GitHub page](https://github.com/FiloSottile/mkcert). 