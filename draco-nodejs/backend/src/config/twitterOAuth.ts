const backendBase = (process.env.BACKEND_URL ?? 'https://localhost:3001').replace(/\/$/, '');
const frontendBase = (process.env.FRONTEND_URL ?? 'http://localhost:3000').replace(/\/$/, '');

export const twitterOAuthConfig = {
  callbackUrl:
    process.env.TWITTER_OAUTH_CALLBACK_URL ?? `${backendBase}/api/accounts/twitter/oauth/callback`,
  resultUrlTemplate:
    process.env.TWITTER_OAUTH_RESULT_URL ??
    `${frontendBase}/account/{accountId}/social-media?twitterAuth={status}`,
  scopes: 'tweet.read tweet.write users.read offline.access',
};
