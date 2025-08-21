/**
 * Utility for creating consistent OpenAPI documentation links
 * Provides links to both the interactive docs and the OpenAPI source file
 */

export const createOpenAPILink = (endpoint: string, lineNumber?: number) => {
  // Get configuration from environment or use defaults
  const port = process.env.PORT || 3001;
  const host = process.env.HOST || 'localhost';
  const protocol = process.env.NODE_ENV === 'development' ? 'https' : 'https';

  const baseUrl =
    process.env.NODE_ENV === 'production'
      ? process.env.API_BASE_URL || 'https://your-api.com/apidocs'
      : `${protocol}://${host}:${port}/apidocs`;

  const openAPISource =
    process.env.NODE_ENV === 'production'
      ? process.env.OPENAPI_SOURCE_URL || 'https://github.com/your-repo/blob/main/openapi.yaml'
      : `file://${process.cwd()}/openapi.yaml`;

  // Generate operation ID from endpoint path for deep linking
  const operationId = generateOperationId(endpoint);

  return {
    docs: operationId ? `${baseUrl}#/operations/PlayerClassifieds/${operationId}` : baseUrl,
    source: lineNumber ? `${openAPISource}#L${lineNumber}` : openAPISource,
  };
};

/**
 * Generate operation ID from endpoint path
 */
function generateOperationId(endpoint: string): string | null {
  // Map endpoint paths to operation IDs
  const operationMap: Record<string, string> = {
    '/api/accounts/{accountId}/player-classifieds/players-wanted': 'createPlayersWanted',
    '/api/accounts/{accountId}/player-classifieds/teams-wanted': 'createTeamsWanted',
    '/api/accounts/{accountId}/player-classifieds/players-wanted/{classifiedId}':
      'updatePlayersWanted',
    '/api/accounts/{accountId}/player-classifieds/teams-wanted/{classifiedId}': 'updateTeamsWanted',
    '/api/accounts/{accountId}/player-classifieds/teams-wanted/{classifiedId}/verify':
      'verifyTeamsWantedAccess',
    '/api/accounts/{accountId}/player-classifieds/positions': 'getBaseballPositions',
    '/api/accounts/{accountId}/player-classifieds/experience-levels': 'getExperienceLevels',
  };

  return operationMap[endpoint] || null;
}

/**
 * Creates a JSDoc comment with OpenAPI documentation links
 */
export const createDocComment = (endpoint: string, lineNumber?: number) => {
  const links = createOpenAPILink(endpoint, lineNumber);

  return `/**
 * @see {@link ${links.docs}|API Documentation}
 * @see {@link ${links.source}|OpenAPI Source}
 */`;
};
