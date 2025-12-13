export const facebookOAuthConfig = {
  appId: process.env.FACEBOOK_APP_ID ?? '',
  appSecret: process.env.FACEBOOK_APP_SECRET ?? '',
  callbackUrl: process.env.FACEBOOK_OAUTH_CALLBACK_URL ?? '',
  scopes: [
    'public_profile',
    'pages_show_list',
    'pages_manage_posts',
    'pages_read_engagement',
    'instagram_basic',
    'instagram_content_publish',
  ].join(','),
  resultUrlTemplate:
    process.env.FACEBOOK_RESULT_URL_TEMPLATE ??
    'http://localhost:3000/account/{accountId}/social-media?facebookAuth=',
};
