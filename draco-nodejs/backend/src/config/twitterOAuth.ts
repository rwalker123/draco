export const twitterOAuthConfig = {
  callbackUrl: process.env.TWITTER_OAUTH_CALLBACK_URL,
  resultUrlTemplate: process.env.TWITTER_OAUTH_RESULT_URL,
  scopes: 'tweet.read tweet.write users.read offline.access',
};
