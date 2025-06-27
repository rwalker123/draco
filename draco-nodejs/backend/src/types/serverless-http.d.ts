declare module "serverless-http" {
  import { Request, Response, NextFunction } from "express";
  import {
    APIGatewayProxyEvent,
    APIGatewayProxyResult,
    Context,
  } from "aws-lambda";

  interface ServerlessHandler {
    (
      event: APIGatewayProxyEvent,
      context: Context,
    ): Promise<APIGatewayProxyResult>;
  }

  function serverless(app: any): ServerlessHandler;

  export = serverless;
}
