import { Request, Response, NextFunction } from 'express';

// Middleware to handle BigInt serialization
export function bigIntSerializer(req: Request, res: Response, next: NextFunction) {
  // Store the original json method
  const originalJson = res.json;

  // Override the json method to handle BigInt values
  res.json = function (data: unknown) {
    const serializedData = serializeBigInts(data);
    return originalJson.call(this, serializedData);
  };

  next();
}

// Recursively serialize BigInt values to strings
function serializeBigInts(obj: unknown): unknown {
  if (obj === null || obj === undefined) {
    return obj;
  }

  if (typeof obj === 'bigint') {
    return obj.toString();
  }

  if (Array.isArray(obj)) {
    return obj.map(serializeBigInts);
  }

  if (typeof obj === 'object') {
    const result: Record<string, unknown> = {};
    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        result[key] = serializeBigInts((obj as Record<string, unknown>)[key]);
      }
    }
    return result;
  }

  return obj;
}
