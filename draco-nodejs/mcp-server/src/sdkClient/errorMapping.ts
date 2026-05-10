import { McpError, ErrorCode } from '@modelcontextprotocol/sdk/types.js';

interface SdkErrorShape {
  response?: {
    status?: number;
  };
  status?: number;
}

function extractStatus(err: unknown): number | undefined {
  if (err && typeof err === 'object') {
    const e = err as SdkErrorShape;
    return e.response?.status ?? e.status;
  }
  return undefined;
}

export function mapSdkError(err: unknown, opts: { tool: string }): never {
  const status = extractStatus(err);

  if (status === 401 || status === 403) {
    throw new McpError(
      ErrorCode.InvalidRequest,
      `You don't have access to this resource. Reconnect if your session has expired. (tool: ${opts.tool})`,
    );
  }

  if (status === 404) {
    throw new McpError(ErrorCode.InvalidParams, `Resource not found. (tool: ${opts.tool})`);
  }

  if (status !== undefined && status >= 500) {
    throw new McpError(
      ErrorCode.InternalError,
      `Draco API unavailable. Please try again. (tool: ${opts.tool})`,
    );
  }

  if (err instanceof McpError) {
    throw err;
  }

  throw new McpError(ErrorCode.InternalError, `An unexpected error occurred. (tool: ${opts.tool})`);
}
