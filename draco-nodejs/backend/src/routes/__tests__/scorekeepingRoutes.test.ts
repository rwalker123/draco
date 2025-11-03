import { beforeAll, afterAll, describe, expect, it, vi } from 'vitest';
import express from 'express';
import http from 'node:http';
import request from 'supertest';
import { ServiceFactory } from '../../services/serviceFactory.js';

vi.mock('@draco/shared-schemas', () => ({}));

vi.mock('../../middleware/authMiddleware.js', () => ({
  authenticateToken: (_req: express.Request, _res: express.Response, next: express.NextFunction) => next(),
}));

let server: http.Server;
let agent: request.SuperAgentTest;
let scorekeepingRouter: express.Router;

beforeAll(async () => {
  vi.spyOn(ServiceFactory, 'getRouteProtection').mockReturnValue({
    enforceAccountBoundary: () => (_req: express.Request, _res: express.Response, next: express.NextFunction) => next(),
    requirePermission: () => (_req: express.Request, _res: express.Response, next: express.NextFunction) => next(),
  } as unknown as ReturnType<typeof ServiceFactory.getRouteProtection>);

  vi.spyOn(ServiceFactory, 'getAuthService').mockReturnValue({
    verifyToken: vi.fn().mockResolvedValue(undefined),
  } as unknown as ReturnType<typeof ServiceFactory.getAuthService>);

  const module = await import('../scorekeeping.js');
  scorekeepingRouter = module.default;

  const app = express();
  app.use(express.json());
  app.use('/api/accounts/:accountId/games', scorekeepingRouter);

  server = http.createServer(app);
  process.env.JWT_SECRET = 'test-secret';
  ServiceFactory.initializeScorekeeping(server);

  await new Promise<void>((resolve) => {
    server.listen(0, () => resolve());
  });

  agent = request.agent(server);
});

afterAll(async () => {
  await new Promise<void>((resolve, reject) => {
    server.close((error) => {
      if (error) {
        reject(error);
      } else {
        resolve();
      }
    });
  });
});

describe('scorekeeping routes', () => {
  const accountId = '123';
  const gameId = '456';

  const baseBody = {
    type: 'create',
    clientEventId: 'client-1',
    sequence: 1,
    audit: { userName: 'Tester', deviceId: 'device-1', timestamp: new Date().toISOString() },
    event: {
      id: 'client-1',
      clientEventId: 'client-1',
      sequence: 1,
      gameId,
      createdAt: new Date().toISOString(),
      createdBy: 'Tester',
      deviceId: 'device-1',
      notation: 'S7',
      summary: 'Single to left',
      input: { type: 'at_bat' },
      inning: 1,
      half: 'top',
      outsBefore: 0,
      outsAfter: 0,
      scoreAfter: { home: 0, away: 0 },
      basesAfter: { first: null, second: null, third: null },
    },
  };

  it('accepts create, update, and delete mutations', async () => {
    const createResponse = await agent
      .post(`/api/accounts/${accountId}/games/${gameId}/score-events`)
      .send(baseBody);

    expect(createResponse.status).toBe(201);
    const { serverEventId } = createResponse.body;
    expect(serverEventId).toBeDefined();

    const updateResponse = await agent
      .post(`/api/accounts/${accountId}/games/${gameId}/score-events`)
      .send({
        ...baseBody,
        type: 'update',
        sequence: 2,
        serverEventId,
        event: { ...baseBody.event, sequence: 2, summary: 'Updated summary' },
      });

    expect(updateResponse.status).toBe(200);
    expect(updateResponse.body.event.summary).toBe('Updated summary');

    const deleteResponse = await agent
      .post(`/api/accounts/${accountId}/games/${gameId}/score-events`)
      .send({
        type: 'delete',
        clientEventId: 'client-1',
        sequence: 2,
        serverEventId,
        audit: baseBody.audit,
      });

    expect(deleteResponse.status).toBe(200);
    expect(deleteResponse.body.event).toBeNull();
  });
});
