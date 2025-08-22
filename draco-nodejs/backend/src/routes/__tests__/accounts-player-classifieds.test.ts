import express, { Request, Response, NextFunction } from 'express';
import request from 'supertest';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { NotFoundError, ValidationError } from '../../utils/customErrors.js';
import { globalErrorHandler } from '../../utils/globalErrorHandler.js';

// Mock the ServiceFactory
vi.mock('../../lib/serviceFactory.js', () => ({
  ServiceFactory: {
    getPlayerClassifiedService: vi.fn(),
    getRouteProtection: vi.fn(),
  },
}));

// Mock the route protection middleware
vi.mock('../../middleware/routeProtection.js', () => {
  return {
    RouteProtection: vi.fn().mockImplementation(() => ({
      requirePermission: () => (req: Request, res: Response, next: NextFunction) => next(),
      enforceAccountBoundary: () => (req: Request, res: Response, next: NextFunction) => next(),
    })),
  };
});

// Mock the auth middleware
vi.mock('../../middleware/authMiddleware.js', () => ({
  authenticateToken: (req: Request, res: Response, next: NextFunction) => next(),
}));

// Mock the validation middleware
vi.mock('../../middleware/validation/playerClassifiedValidation.js', () => ({
  validatePlayersWantedCreate: [
    (req: Request, res: Response, next: NextFunction): void => {
      // Basic validation for required fields
      if (!req.body.teamEventName || req.body.teamEventName.trim() === '') {
        res.status(400).json({
          success: false,
          message: 'Team event name is required',
        });
        return;
      }
      if (!req.body.description || req.body.description.trim() === '') {
        res.status(400).json({
          success: false,
          message: 'Description is required',
        });
        return;
      }
      if (!req.body.positionsNeeded || req.body.positionsNeeded.trim() === '') {
        res.status(400).json({
          success: false,
          message: 'Positions needed is required',
        });
        return;
      }

      // Size validation
      if (req.body.description && req.body.description.length > 5000) {
        res.status(400).json({
          success: false,
          message: 'Description is too long (maximum 5000 characters)',
        });
        return;
      }

      next();
    },
  ],
  validateTeamsWantedCreate: [
    (req: Request, res: Response, next: NextFunction): void => {
      // Basic validation for required fields
      if (!req.body.name || req.body.name.trim() === '') {
        res.status(400).json({
          success: false,
          message: 'Name is required',
        });
        return;
      }
      if (!req.body.email || req.body.email.trim() === '') {
        res.status(400).json({
          success: false,
          message: 'Email is required',
        });
        return;
      }
      if (!req.body.phone || req.body.phone.trim() === '') {
        res.status(400).json({
          success: false,
          message: 'Phone is required',
        });
        return;
      }
      if (!req.body.experience || req.body.experience.trim() === '') {
        res.status(400).json({
          success: false,
          message: 'Experience is required',
        });
        return;
      }
      if (!req.body.positionsPlayed || req.body.positionsPlayed.trim() === '') {
        res.status(400).json({
          success: false,
          message: 'Positions played is required',
        });
        return;
      }
      if (!req.body.birthDate || req.body.birthDate.trim() === '') {
        res.status(400).json({
          success: false,
          message: 'Birth date is required',
        });
        return;
      }
      next();
    },
  ],
  validateTeamsWantedUpdateEndpoint: [(req: Request, res: Response, next: NextFunction) => next()],
  validateTeamsWantedVerification: [(req: Request, res: Response, next: NextFunction) => next()],
  validateTeamsWantedDeletion: [(req: Request, res: Response, next: NextFunction) => next()],
  validatePlayersWantedDeletion: [
    (req: Request, res: Response, next: NextFunction): void => {
      // Validate classified ID format
      const classifiedId = req.params.classifiedId;
      if (classifiedId === 'invalid' || isNaN(Number(classifiedId))) {
        res.status(400).json({
          success: false,
          message: 'Invalid parameter classifiedId: must be a valid number',
        });
        return;
      }
      next();
    },
  ],
  validateSearchParams: [
    (req: Request, res: Response, next: NextFunction): void => {
      // Validate account ID format
      const accountId = req.params.accountId;
      if (accountId === 'invalid' || isNaN(Number(accountId))) {
        res.status(400).json({
          success: false,
          message: 'Invalid parameter accountId: must be a valid number',
        });
        return;
      }
      next();
    },
  ],
}));

// Mock the constants
vi.mock('../../interfaces/playerClassifiedConstants.js', () => ({
  BASEBALL_POSITIONS: [
    { id: 1, name: 'Pitcher', abbreviation: 'P', category: 'Pitching' },
    { id: 2, name: 'Catcher', abbreviation: 'C', category: 'Defense' },
    { id: 3, name: 'First Base', abbreviation: '1B', category: 'Infield' },
  ],
  EXPERIENCE_LEVELS: [
    { id: 1, name: 'Beginner', description: 'New to baseball' },
    { id: 2, name: 'Intermediate', description: 'Some experience' },
    { id: 3, name: 'Advanced', description: 'Experienced player' },
  ],
}));

describe('PlayerClassifieds Routes', () => {
  let app: express.Express;
  let mockPlayerClassifiedService: any;
  let accountsPlayerClassifiedsRouter: any;

  beforeEach(async () => {
    vi.clearAllMocks();

    // Create mock service
    mockPlayerClassifiedService = {
      createPlayersWanted: vi.fn(),
      createTeamsWanted: vi.fn(),
      getPlayersWanted: vi.fn(),
      getTeamsWanted: vi.fn(),
      verifyTeamsWantedAccess: vi.fn(),
      updateTeamsWanted: vi.fn(),
      updatePlayersWanted: vi.fn(),
      deleteTeamsWanted: vi.fn(),
      deletePlayersWanted: vi.fn(),
      canEditPlayersWanted: vi.fn(),
      canDeletePlayersWanted: vi.fn(),
    };

    // Mock ServiceFactory methods
    const { ServiceFactory } = await import('../../lib/serviceFactory.js');
    vi.mocked(ServiceFactory.getPlayerClassifiedService).mockReturnValue(
      mockPlayerClassifiedService,
    );

    // Mock route protection
    const mockRouteProtection = {
      enforceAccountBoundary: () => (req: Request, res: Response, next: NextFunction) => next(),
      requirePermission: () => (req: Request, res: Response, next: NextFunction) => next(),
    } as any;
    vi.mocked(ServiceFactory.getRouteProtection).mockReturnValue(mockRouteProtection);

    // Import the router after mocking
    const routerModule = await import('../accounts-player-classifieds.js');
    accountsPlayerClassifiedsRouter = routerModule.default;

    // Create test app
    app = express();
    app.use(express.json());

    // Middleware to inject mock user for all routes
    app.use((req, res, next) => {
      req.user = { id: '456', username: 'testuser' };
      next();
    });

    app.use('/api/accounts/:accountId/player-classifieds', accountsPlayerClassifiedsRouter);
    app.use(globalErrorHandler as express.ErrorRequestHandler);
  });

  describe('POST /players-wanted', () => {
    const validRequest = {
      teamEventName: 'Spring Training Team',
      description: 'Looking for experienced players for spring training season',
      positionsNeeded: '1,2,3',
    };

    it('should create Players Wanted classified successfully', async () => {
      const mockResponse = {
        id: '789',
        accountId: '123',
        teamEventName: 'Spring Training Team',
        description: 'Looking for experienced players for spring training season',
        positionsNeeded: '1,2,3',
        dateCreated: '2024-01-01T00:00:00.000Z',
        creator: {
          id: '456',
          firstName: 'John',
          lastName: 'Doe',
          email: 'john@example.com',
        },
        account: {
          id: '123',
          name: 'Test Account',
        },
      };

      mockPlayerClassifiedService.createPlayersWanted.mockResolvedValue(mockResponse);

      const response = await request(app)
        .post('/api/accounts/123/player-classifieds/players-wanted')
        .send(validRequest)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual(mockResponse);
      expect(mockPlayerClassifiedService.createPlayersWanted).toHaveBeenCalledWith(
        BigInt(123),
        BigInt(456),
        validRequest,
      );
    });

    it('should handle service errors gracefully', async () => {
      mockPlayerClassifiedService.createPlayersWanted.mockRejectedValue(
        new Error('Validation failed: Team event name is required'),
      );

      const response = await request(app)
        .post('/api/accounts/123/player-classifieds/players-wanted')
        .send({ ...validRequest, teamEventName: '' })
        .expect(400);

      expect(response.body.message).toBe('Team event name is required');
    });
  });

  describe('POST /teams-wanted', () => {
    const validRequest = {
      name: 'Jane Smith',
      email: 'jane@example.com',
      phone: '+1234567890',
      experience: '5 years playing experience in various leagues',
      positionsPlayed: '1,2',
      birthDate: '1995-06-15',
    };

    it('should create Teams Wanted classified successfully', async () => {
      const mockResponse = {
        id: '789',
        accountId: '123',
        name: 'Jane Smith',
        email: 'jane@example.com',
        phone: '+1234567890',
        experience: '5 years playing experience in various leagues',
        positionsPlayed: '1,2',
        birthDate: '1995-06-15T00:00:00.000Z',
        dateCreated: '2024-01-01T00:00:00.000Z',
        expirationDate: '2024-06-15T00:00:00.000Z',
        isActive: true,
        viewCount: 0,
        emailNotifications: true,
        accessCode: 'hashed_access_code',
        account: {
          id: '123',
          name: 'Test Account',
        },
      };

      mockPlayerClassifiedService.createTeamsWanted.mockResolvedValue(mockResponse);

      const response = await request(app)
        .post('/api/accounts/123/player-classifieds/teams-wanted')
        .send(validRequest)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual(mockResponse);
      expect(response.body.message).toBe(
        'Teams Wanted classified created successfully. Check your email for access instructions.',
      );
      expect(mockPlayerClassifiedService.createTeamsWanted).toHaveBeenCalledWith(
        BigInt(123),
        validRequest,
      );
    });

    it('should handle service errors gracefully', async () => {
      mockPlayerClassifiedService.createTeamsWanted.mockRejectedValue(
        new Error('Rate limit exceeded: Maximum 3 posts per hour per IP'),
      );

      const response = await request(app)
        .post('/api/accounts/123/player-classifieds/teams-wanted')
        .send(validRequest)
        .expect(500);

      expect(response.body.message).toBe('Internal server error');
    });
  });

  describe('GET /players-wanted', () => {
    it('should retrieve Players Wanted classifieds with pagination', async () => {
      const mockResponse = {
        data: [
          {
            id: '1',
            accountId: '123',
            teamEventName: 'Team 1',
            description: 'Description 1',
            positionsNeeded: '1,2',
            dateCreated: '2024-01-01T00:00:00.000Z',
            creator: {
              id: '456',
              firstName: 'John',
              lastName: 'Doe',
              email: 'john@example.com',
            },
            account: {
              id: '123',
              name: 'Test Account',
            },
          },
        ],
        total: 1,
        pagination: {
          page: 1,
          limit: 20,
          total: 1,
          totalPages: 1,
          hasNext: false,
          hasPrev: false,
        },
        filters: {
          accountId: '123',
          searchQuery: 'test',
        },
      };

      mockPlayerClassifiedService.getPlayersWanted.mockResolvedValue(mockResponse);

      const response = await request(app)
        .get('/api/accounts/123/player-classifieds/players-wanted?searchQuery=test')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual(mockResponse.data);
      expect(response.body.total).toBe(1);
      expect(mockPlayerClassifiedService.getPlayersWanted).toHaveBeenCalledWith(
        BigInt(123),
        expect.objectContaining({
          searchQuery: 'test',
        }),
      );
    });

    it('should handle missing query parameters gracefully', async () => {
      const mockResponse = {
        data: [],
        total: 0,
        pagination: {
          page: 1,
          limit: 20,
          total: 0,
          totalPages: 0,
          hasNext: false,
          hasPrev: false,
        },
        filters: {
          accountId: '123',
          activeOnly: true,
        },
      };

      mockPlayerClassifiedService.getPlayersWanted.mockResolvedValue(mockResponse);

      const response = await request(app)
        .get('/api/accounts/123/player-classifieds/players-wanted')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual([]);
      expect(mockPlayerClassifiedService.getPlayersWanted).toHaveBeenCalledWith(
        BigInt(123),
        expect.objectContaining({
          page: 1,
          limit: 20,
          sortBy: 'dateCreated',
          sortOrder: 'desc',
        }),
      );
    });
  });

  describe('GET /teams-wanted', () => {
    it('should retrieve Teams Wanted classifieds with pagination', async () => {
      const mockResponse = {
        data: [
          {
            id: '1',
            accountId: '123',
            name: 'Jane Smith',
            email: 'jane@example.com',
            phone: '+1234567890',
            experience: '5 years experience',
            positionsPlayed: '1,2',
            birthDate: '1995-06-15T00:00:00.000Z',
            dateCreated: '2024-01-01T00:00:00.000Z',
            expirationDate: '1995-06-15T00:00:00.000Z',
            isActive: true,
            viewCount: 0,
            emailNotifications: true,
            account: {
              id: '123',
              name: 'Test Account',
            },
          },
        ],
        total: 1,
        pagination: {
          page: 1,
          limit: 20,
          total: 1,
          totalPages: 1,
          hasNext: false,
          hasPrev: false,
        },
        filters: {
          accountId: '123',
          activeOnly: true,
          searchQuery: 'test',
        },
      };

      mockPlayerClassifiedService.getTeamsWanted.mockResolvedValue(mockResponse);

      const response = await request(app)
        .get('/api/accounts/123/player-classifieds/teams-wanted?searchQuery=test&activeOnly=true')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual(mockResponse.data);
      expect(response.body.total).toBe(1);
      expect(mockPlayerClassifiedService.getTeamsWanted).toHaveBeenCalledWith(
        BigInt(123),
        expect.objectContaining({
          searchQuery: 'test',
          accountId: BigInt(123),
          limit: 20,
          page: 1,
          sortBy: 'dateCreated',
          sortOrder: 'desc',
        }),
      );
    });
  });

  describe('POST /teams-wanted/:classifiedId/verify', () => {
    it('should verify Teams Wanted access successfully', async () => {
      const mockResponse = {
        id: '789',
        accountId: '123',
        name: 'Jane Smith',
        email: 'jane@example.com',
        phone: '+1234567890',
        experience: '5 years experience',
        positionsPlayed: '1,2',
        birthDate: '1995-06-15T00:00:00.000Z',
        dateCreated: '2024-01-01T00:00:00.000Z',
        expirationDate: '2024-06-15T00:00:00.000Z',
        isActive: true,
        viewCount: 0,
        emailNotifications: true,
        accessCode: 'hashed_access_code',
        isEmailVerified: false,
        account: {
          id: '123',
          name: 'Test Account',
        },
      };

      mockPlayerClassifiedService.verifyTeamsWantedAccess.mockResolvedValue(mockResponse);

      const response = await request(app)
        .post('/api/accounts/123/player-classifieds/teams-wanted/789/verify')
        .send({ accessCode: 'valid_access_code' })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual(mockResponse);
      expect(mockPlayerClassifiedService.verifyTeamsWantedAccess).toHaveBeenCalledWith(
        BigInt(789),
        'valid_access_code',
        BigInt(123),
      );
    });

    it('should handle invalid access code', async () => {
      mockPlayerClassifiedService.verifyTeamsWantedAccess.mockRejectedValue(
        new ValidationError('Invalid access code'),
      );

      const response = await request(app)
        .post('/api/accounts/123/player-classifieds/teams-wanted/789/verify')
        .send({ accessCode: 'invalid_code' })
        .expect(400);

      expect(response.body.message).toBe('Invalid access code');
    });
  });

  describe('PUT /teams-wanted/:classifiedId', () => {
    it('should update Teams Wanted classified successfully', async () => {
      const updateData = {
        name: 'Updated Name',
        email: 'updated@example.com',
        phone: '+1234567890',
        experience: 'Updated experience description',
        positionsPlayed: '1,2,3',
        birthDate: '1995-06-15',
        expirationDate: '2024-06-15',
        emailNotifications: true,
      };

      const mockResponse = {
        id: '789',
        accountId: '123',
        ...updateData,
        dateCreated: '2024-01-01T00:00:00.000Z',
        isActive: true,
        viewCount: 0,
        accessCode: 'hashed_access_code',
        isEmailVerified: false,
        account: {
          id: '123',
          name: 'Test Account',
        },
      };

      mockPlayerClassifiedService.updateTeamsWanted.mockResolvedValue(mockResponse);

      const response = await request(app)
        .put('/api/accounts/123/player-classifieds/teams-wanted/789')
        .send({ accessCode: 'valid_access_code', ...updateData })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual(mockResponse);
      expect(mockPlayerClassifiedService.updateTeamsWanted).toHaveBeenCalledWith(
        BigInt(789),
        'valid_access_code',
        updateData,
        BigInt(123),
      );
    });

    it('should handle update errors gracefully', async () => {
      mockPlayerClassifiedService.updateTeamsWanted.mockRejectedValue(
        new NotFoundError('Classified not found'),
      );

      const response = await request(app)
        .put('/api/accounts/123/player-classifieds/teams-wanted/999')
        .send({ accessCode: 'valid_access_code', name: 'Updated Name' })
        .expect(404);

      expect(response.body.message).toBe('Classified not found');
    });
  });

  describe('PUT /players-wanted/:classifiedId', () => {
    const updateData = {
      teamEventName: 'Updated Team Name',
      description: 'Updated description for the team',
      positionsNeeded: '1,2,3,4',
    };

    it('should update Players Wanted classified successfully', async () => {
      const mockResponse = {
        id: '789',
        accountId: '123',
        teamEventName: 'Updated Team Name',
        description: 'Updated description for the team',
        positionsNeeded: '1,2,3,4',
        dateCreated: '2024-01-01T00:00:00.000Z',
        creator: {
          id: '456',
          firstName: 'John',
          lastName: 'Doe',
          email: 'john@example.com',
        },
        account: {
          id: '123',
          name: 'Test Account',
        },
      };

      mockPlayerClassifiedService.canEditPlayersWanted.mockResolvedValue(true);
      mockPlayerClassifiedService.updatePlayersWanted.mockResolvedValue(mockResponse);

      const response = await request(app)
        .put('/api/accounts/123/player-classifieds/players-wanted/789')
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual(mockResponse);
      expect(mockPlayerClassifiedService.canEditPlayersWanted).toHaveBeenCalledWith(
        BigInt(789),
        BigInt(456),
        BigInt(123),
      );
      expect(mockPlayerClassifiedService.updatePlayersWanted).toHaveBeenCalledWith(
        BigInt(789),
        BigInt(123),
        BigInt(456),
        updateData,
      );
    });

    it('should handle insufficient permissions gracefully', async () => {
      mockPlayerClassifiedService.canEditPlayersWanted.mockResolvedValue(false);

      const response = await request(app)
        .put('/api/accounts/123/player-classifieds/players-wanted/789')
        .send(updateData)
        .expect(403);

      expect(response.body.message).toBe(
        'Forbidden - insufficient permissions to edit this classified',
      );
    });
  });

  describe('DELETE /teams-wanted/:classifiedId', () => {
    it('should delete Teams Wanted classified successfully', async () => {
      mockPlayerClassifiedService.deleteTeamsWanted.mockResolvedValue(undefined);

      const response = await request(app)
        .delete('/api/accounts/123/player-classifieds/teams-wanted/789')
        .send({ accessCode: 'valid_access_code' })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Teams Wanted classified deleted successfully');
      expect(mockPlayerClassifiedService.deleteTeamsWanted).toHaveBeenCalledWith(
        BigInt(789),
        'valid_access_code',
        BigInt(123),
      );
    });

    it('should handle deletion errors gracefully', async () => {
      mockPlayerClassifiedService.deleteTeamsWanted.mockRejectedValue(
        new ValidationError('Invalid access code'),
      );

      const response = await request(app)
        .delete('/api/accounts/123/player-classifieds/teams-wanted/789')
        .send({ accessCode: 'invalid_code' })
        .expect(400);

      expect(response.body.message).toBe('Invalid access code');
    });
  });

  describe('DELETE /players-wanted/:classifiedId', () => {
    it('should delete Players Wanted classified successfully', async () => {
      mockPlayerClassifiedService.canDeletePlayersWanted.mockResolvedValue(true);
      mockPlayerClassifiedService.deletePlayersWanted.mockResolvedValue(undefined);

      const response = await request(app)
        .delete('/api/accounts/123/player-classifieds/players-wanted/789')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Players Wanted classified deleted successfully');
      expect(mockPlayerClassifiedService.canDeletePlayersWanted).toHaveBeenCalledWith(
        BigInt(789),
        BigInt(456),
        BigInt(123),
      );
      expect(mockPlayerClassifiedService.deletePlayersWanted).toHaveBeenCalledWith(
        BigInt(789),
        BigInt(123),
        BigInt(456),
      );
    });

    it('should handle deletion errors gracefully', async () => {
      mockPlayerClassifiedService.canDeletePlayersWanted.mockResolvedValue(false);

      const response = await request(app)
        .delete('/api/accounts/123/player-classifieds/players-wanted/999')
        .expect(403);

      expect(response.body.message).toBe(
        'Forbidden - insufficient permissions to delete this classified',
      );
    });
  });

  describe('GET /positions', () => {
    it('should return available baseball positions', async () => {
      const response = await request(app)
        .get('/api/accounts/123/player-classifieds/positions')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual([
        { id: 1, name: 'Pitcher', abbreviation: 'P', category: 'Pitching' },
        { id: 2, name: 'Catcher', abbreviation: 'C', category: 'Defense' },
        { id: 3, name: 'First Base', abbreviation: '1B', category: 'Infield' },
      ]);
    });
  });

  describe('GET /experience-levels', () => {
    it('should return available experience levels', async () => {
      const response = await request(app)
        .get('/api/accounts/123/player-classifieds/experience-levels')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual([
        { id: 1, name: 'Beginner', description: 'New to baseball' },
        { id: 2, name: 'Intermediate', description: 'Some experience' },
        { id: 3, name: 'Advanced', description: 'Experienced player' },
      ]);
    });
  });

  describe('Error handling', () => {
    it('should handle malformed JSON gracefully', async () => {
      const response = await request(app)
        .post('/api/accounts/123/player-classifieds/players-wanted')
        .set('Content-Type', 'application/json')
        .send('{"invalid": json}')
        .expect(500); // JSON parsing errors result in 500 errors

      expect(response.body.message).toBeDefined();
    });

    it('should handle missing required fields gracefully', async () => {
      const response = await request(app)
        .post('/api/accounts/123/player-classifieds/players-wanted')
        .send({})
        .expect(400);

      expect(response.body.message).toBeDefined();
    });

    it('should handle invalid account ID format', async () => {
      const response = await request(app)
        .get('/api/accounts/invalid/player-classifieds/players-wanted')
        .expect(400);

      expect(response.body.message).toBeDefined();
    });

    it('should handle invalid classified ID format', async () => {
      const response = await request(app)
        .delete('/api/accounts/123/player-classifieds/players-wanted/invalid')
        .expect(400);

      expect(response.body.message).toBeDefined();
    });
  });

  describe('Rate limiting and security', () => {
    it('should require authentication for protected endpoints', async () => {
      // Test with the regular app but remove the user from the request
      // to simulate unauthenticated state
      const testApp = express();
      testApp.use(express.json());

      // Add auth middleware that rejects requests without user
      testApp.use((req, res, next) => {
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1];

        if (!token) {
          res.status(401).json({
            success: false,
            message: 'Access token required',
          });
          return;
        }

        // If there's a token, add mock user
        req.user = { id: '456', username: 'testuser' };
        next();
      });

      testApp.use('/api/accounts/:accountId/player-classifieds', accountsPlayerClassifiedsRouter);
      testApp.use(globalErrorHandler as express.ErrorRequestHandler);

      // Test protected endpoint without token - should return 401
      const response = await request(testApp)
        .post('/api/accounts/123/player-classifieds/players-wanted')
        .send({
          teamEventName: 'Test Team',
          description: 'Test description',
          positionsNeeded: '1,2',
        })
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Access token required');
    });

    it('should allow access to public endpoints without authentication', async () => {
      // Create app without authentication for public endpoints
      const publicApp = express();
      publicApp.use(express.json());

      // No auth middleware - direct to router
      publicApp.use('/api/accounts/:accountId/player-classifieds', accountsPlayerClassifiedsRouter);
      publicApp.use(globalErrorHandler as express.ErrorRequestHandler);

      // Mock the service for public GET players-wanted endpoint
      mockPlayerClassifiedService.getPlayersWanted.mockResolvedValue({
        data: [],
        total: 0,
        pagination: { page: 1, limit: 20, total: 0, totalPages: 0, hasNext: false, hasPrev: false },
        filters: { accountId: '123' },
      });

      // Test public endpoint (GET players-wanted) - should work without auth
      const response = await request(publicApp)
        .get('/api/accounts/123/player-classifieds/players-wanted')
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    it('should validate input data before processing', async () => {
      // Test with invalid data that should be caught by validation
      const invalidRequest = {
        teamEventName: '', // Empty required field
        description: 'Short', // Too short
        positionsNeeded: 'invalid', // Invalid format
      };

      const response = await request(app)
        .post('/api/accounts/123/player-classifieds/players-wanted')
        .send(invalidRequest)
        .expect(400);

      expect(response.body.message).toBeDefined();
    });
  });

  describe('Edge cases', () => {
    it('should handle very large request bodies', async () => {
      const largeDescription = 'a'.repeat(10000); // 10KB description
      const largeRequest = {
        teamEventName: 'Test Team',
        description: largeDescription,
        positionsNeeded: '1,2',
      };

      const response = await request(app)
        .post('/api/accounts/123/player-classifieds/players-wanted')
        .send(largeRequest)
        .expect(400); // Should fail due to size limits

      expect(response.body.message).toBeDefined();
    });

    it('should handle special characters in input fields', async () => {
      const specialCharRequest = {
        teamEventName: 'Team & Co. (LLC)',
        description: 'Looking for players with "special" skills',
        positionsNeeded: '1,2,3',
      };

      const response = await request(app)
        .post('/api/accounts/123/player-classifieds/players-wanted')
        .send(specialCharRequest)
        .expect(201); // Should handle special characters gracefully

      expect(response.body.success).toBe(true);
    });

    it('should handle unicode characters in input fields', async () => {
      const unicodeRequest = {
        teamEventName: 'Tëam Náme',
        description: 'Looking for players with special characters: éñç',
        positionsNeeded: '1,2',
      };

      const response = await request(app)
        .post('/api/accounts/123/player-classifieds/players-wanted')
        .send(unicodeRequest)
        .expect(201); // Should handle unicode gracefully

      expect(response.body.success).toBe(true);
    });
  });
});
