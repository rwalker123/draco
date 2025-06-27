# API Key Security Options for Frontend Applications

## Problem Statement
When using API keys in frontend web applications, the keys become exposed to users who can:
- View them in browser DevTools
- Extract them from network requests
- Find them in JavaScript bundle files
- Use them to make unlimited API calls

## Security Approaches

### 1. Origin/Referer Validation
**Description**: Check that requests come from authorized domains
```typescript
const allowedOrigins = [
  'https://yourdomain.com',
  'https://www.yourdomain.com',
  'http://localhost:3000' // development
];

const origin = req.get('origin') || req.get('referer');
if (!allowedOrigins.some(allowed => origin?.includes(allowed))) {
  return res.status(403).json({ error: 'Unauthorized origin' });
}
```
**Pros**: Simple, effective
**Cons**: Can be spoofed by malicious clients

### 2. CORS Configuration
**Description**: Browser-enforced origin restrictions
```typescript
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));
```
**Pros**: Browser-enforced, can't be bypassed by JavaScript
**Cons**: Only works for browser requests, not server-to-server

### 3. Custom App Signature Headers
**Description**: Require a custom header that only your frontend knows
```typescript
const appSignature = req.headers['x-app-signature'];
if (appSignature !== process.env.FRONTEND_APP_SIGNATURE) {
  return res.status(403).json({ error: 'Invalid app signature' });
}
```
**Pros**: Can be changed easily, not visible in network tab
**Cons**: Still visible in JavaScript code

### 4. Request Signing
**Description**: Frontend signs requests with a secret
```typescript
// Frontend
const timestamp = Date.now();
const signature = crypto.createHmac('sha256', SECRET)
  .update(`${timestamp}${requestBody}`)
  .digest('hex');

headers: {
  'x-timestamp': timestamp,
  'x-signature': signature
}
```
**Pros**: Very secure, can't be replayed
**Cons**: More complex to implement

### 5. Session-Based Rate Limiting
**Description**: Use server-side sessions instead of API keys
```typescript
// Frontend gets a session token after initial auth
// Backend validates session and tracks usage per session
```
**Pros**: No keys in frontend, can be revoked
**Cons**: More complex session management

### 6. IP Whitelisting
**Description**: Only allow requests from specific IP addresses
```typescript
const allowedIPs = ['your-frontend-server-ip'];
if (!allowedIPs.includes(req.ip)) {
  return res.status(403).json({ error: 'IP not allowed' });
}
```
**Pros**: Very secure
**Cons**: Doesn't work for client-side apps

### 7. Proxy Pattern
**Description**: Frontend calls your backend, backend calls external APIs
```
Frontend → Your Backend → External APIs
```
**Pros**: API keys stay on server
**Cons**: Additional server load, more complex architecture

## Recommended Approach for Frontend Apps

**Combine approaches 1 + 2 + 3:**
1. Keep CORS configuration (browser protection)
2. Add origin validation in middleware
3. Add custom app signature header

This provides multiple layers of protection while accepting that determined attackers could potentially bypass it.

## Alternative: Accept the Risk

For many applications, the risk of API key exposure is acceptable because:
- Rate limiting prevents abuse
- Usage tracking can detect unusual patterns
- Keys can be rotated if compromised
- Most users won't attempt to extract keys

## Implementation Notes

- All approaches can be implemented in the existing API key middleware
- Consider combining multiple approaches for defense in depth
- Monitor for unusual usage patterns regardless of approach chosen
- Have a plan for key rotation and incident response

## Future Considerations

- Evaluate if API keys are the right approach for frontend applications
- Consider session-based authentication for user-specific rate limiting
- Implement monitoring and alerting for suspicious activity
- Plan for key rotation and revocation procedures 