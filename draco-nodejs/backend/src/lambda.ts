import {
  APIGatewayProxyEvent,
  APIGatewayProxyResult,
  Context,
} from "aws-lambda";
import serverless from "serverless-http";
import app from "./app";

// Wrap the Express app with serverless-http
const handler = serverless(app);

// Lambda handler function
export const lambdaHandler = async (
  event: APIGatewayProxyEvent,
  context: Context,
): Promise<APIGatewayProxyResult> => {
  // Add CORS headers for API Gateway
  const response = await handler(event, context);

  // Ensure response has the required APIGatewayProxyResult structure
  if (response && typeof response === "object" && "statusCode" in response) {
    return {
      statusCode: response.statusCode,
      body: response.body || "",
      headers: {
        ...(response.headers || {}),
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers":
          "Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token",
        "Access-Control-Allow-Methods": "GET,POST,PUT,DELETE,OPTIONS",
      },
    };
  }

  // Fallback response if the handler didn't return a proper response
  return {
    statusCode: 500,
    body: JSON.stringify({ error: "Internal server error" }),
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Headers":
        "Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token",
      "Access-Control-Allow-Methods": "GET,POST,PUT,DELETE,OPTIONS",
    },
  };
};

// Export the handler for Lambda
export { lambdaHandler as handler };
