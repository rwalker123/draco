/** @type {import('@hey-api/openapi-ts').UserConfig} */
const config = {
  client: '@hey-api/client-next',
  input: './openapi.json',
  output: {
    path: '../shared/shared-api-client/generated',
    tsConfigPath: 'off',
  },
};

export default config;
