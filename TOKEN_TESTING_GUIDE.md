# JWT Token Testing Guide

## Generate a Test Token

Use this code in your parent application (or Node.js console) to generate a test token:

```javascript
const jwt = require('jsonwebtoken');

// Generate a test token
const testToken = jwt.sign(
  {
    id: '12345',              // This will be the userId
    username: 'test.user',
    sessionId: 'session-abc-123'
  },
  'secret',                   // Must match JWT_SECRET in .env.local
  { expiresIn: '24h' }
);

console.log('Test Token:', testToken);
console.log('\nUse in iframe:');
console.log(`http://192.168.56.1:3001/itms/ai/agents?token=${testToken}`);
```

## Example Output

Running the above code will produce something like:
```
Test Token: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjEyMzQ1IiwidXNlcm5hbWUiOiJ0ZXN0LnVzZXIiLCJzZXNzaW9uSWQiOiJzZXNzaW9uLWFiYy0xMjMiLCJpYXQiOjE3MzMwMDAwMDAsImV4cCI6MTczMzA4NjQwMH0.Xr8j3kP9m5nL2wQ1vZ7yA6tB4cD8eF0gH1iJ2kK3lM4

Use in iframe:
http://192.168.56.1:3001/itms/ai/agents?token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

## Verify Token Locally

To verify the token is working correctly:

```javascript
const jwt = require('jsonwebtoken');

const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'; // Your token
const secret = 'secret';

try {
  const decoded = jwt.verify(token, secret);
  console.log('Token is valid!');
  console.log('User ID:', decoded.id);
  console.log('Username:', decoded.username);
  console.log('Session ID:', decoded.sessionId);
  console.log('Expires at:', new Date(decoded.exp * 1000));
} catch (error) {
  console.error('Token verification failed:', error.message);
}
```

## Testing in Browser

1. Open your parent application
2. Generate a token with a real user ID
3. Open iframe with token parameter:
   ```javascript
   const iframe = document.createElement('iframe');
   iframe.src = `http://192.168.56.1:3001/itms/ai/agents?token=${authToken}`;
   iframe.style.width = '100%';
   iframe.style.height = '100vh';
   iframe.style.border = 'none';
   document.body.appendChild(iframe);
   ```

4. In the AI Agent, check localStorage:
   - Open DevTools → Application → Local Storage
   - Should see `authToken` with your JWT

5. Test API calls:
   - View chat history
   - Create a chat
   - All requests should include `Authorization: Bearer <token>` header

## Troubleshooting

### Error: "Invalid token"
- Check JWT_SECRET matches between parent app and AI Agent
- Verify token is not expired
- Ensure token format is correct (3 parts separated by dots)

### Error: "Token has expired"
- Generate a new token
- Consider increasing expiration time in parent app

### Error: "Authentication token required"
- Token not being passed in URL
- Token not stored in localStorage
- Check if token parameter is being extracted correctly

## Security Notes

⚠️ **Important:**
- Never expose JWT_SECRET in client-side code
- Always use HTTPS in production
- Tokens should be generated server-side only
- Consider implementing token refresh mechanism for long sessions
