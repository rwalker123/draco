import { Request, Response, NextFunction } from 'express';
import * as httpMocks from 'node-mocks-http';
import { bigIntSerializer } from '../bigint-serializer';
import { vi, describe, it, expect, beforeEach } from 'vitest';

describe('bigIntSerializer middleware', () => {
  let req: httpMocks.MockRequest<Request>;
  let res: httpMocks.MockResponse<Response>;
  let next: any;

  beforeEach(() => {
    req = httpMocks.createRequest();
    res = httpMocks.createResponse();
    next = vi.fn();
  });

  it('should call next()', () => {
    bigIntSerializer(req as unknown as Request, res as unknown as Response, next as NextFunction);
    expect(next).toHaveBeenCalled();
  });

  it('should serialize top-level BigInt values in objects', () => {
    bigIntSerializer(req as unknown as Request, res as unknown as Response, next as NextFunction);
    const data = { id: BigInt(123), name: 'Test' };
    res.json(data);
    const output = res._getJSONData();
    expect(output).toEqual({ id: '123', name: 'Test' });
  });

  it('should serialize nested BigInt values', () => {
    bigIntSerializer(req as unknown as Request, res as unknown as Response, next as NextFunction);
    const data = { foo: { bar: BigInt(456) } };
    res.json(data);
    const output = res._getJSONData();
    expect(output).toEqual({ foo: { bar: '456' } });
  });

  it('should serialize BigInt values in arrays', () => {
    bigIntSerializer(req as unknown as Request, res as unknown as Response, next as NextFunction);
    const data = { arr: [1, BigInt(789), 3] };
    res.json(data);
    const output = res._getJSONData();
    expect(output).toEqual({ arr: [1, '789', 3] });
  });

  it('should handle null and undefined', () => {
    bigIntSerializer(req as unknown as Request, res as unknown as Response, next as NextFunction);
    expect(res.json(null)).toBeDefined();
    expect(res.json(undefined)).toBeDefined();
  });

  it('should not modify objects without BigInt', () => {
    bigIntSerializer(req as unknown as Request, res as unknown as Response, next as NextFunction);
    const data = { id: 1, name: 'Test' };
    res.json(data);
    const output = res._getJSONData();
    expect(output).toEqual({ id: 1, name: 'Test' });
  });
});
