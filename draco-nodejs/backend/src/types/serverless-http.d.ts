declare module 'serverless-http' {
  import { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from 'aws-lambda';
  import type { Application } from 'express';

  interface ServerlessHandler {
    (event: APIGatewayProxyEvent, context: Context): Promise<APIGatewayProxyResult>;
  }

  function serverless(app: Application): ServerlessHandler;

  export = serverless;
}
