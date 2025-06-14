import { Request, Response, NextFunction } from 'express';

// Middleware to handle BigInt serialization
export function bigIntSerializer(req: Request, res: Response, next: NextFunction) {
  // Store the original json method
  const originalJson = res.json;
  
  // Override the json method to handle BigInt values
  res.json = function(data: any) {
    const serializedData = serializeBigInts(data);
    return originalJson.call(this, serializedData);
  };
  
  next();
}

// Recursively serialize BigInt values to strings
function serializeBigInts(obj: any): any {
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
    const result: any = {};
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        result[key] = serializeBigInts(obj[key]);
      }
    }
    return result;
  }
  
  return obj;
} 