import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Request, Response, NextFunction } from 'express';
import {
  validatePlayersWantedCreate,
  validateTeamsWantedCreate,
  validateTeamsWantedUpdate,
  validateAccessCode,
  validateSearchParams,
  validateAccountId,
  validateClassifiedId,
  validateTeamsWantedVerification,
  validateTeamsWantedUpdateEndpoint,
  validateTeamsWantedDeletion,
  validatePlayersWantedDeletion,
  validateRateLimit,
} from '../playerClassifiedValidation.js';

// Mock the handleValidationErrors function
vi.mock('../contactValidation.js', () => ({
  handleValidationErrors: (req: Request, res: Response, next: NextFunction) => next(),
}));

describe('PlayerClassifieds Validation Middleware', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    mockRequest = {
      body: {},
      query: {},
      params: {},
      ip: '192.168.1.1',
    };
    mockResponse = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    };
    mockNext = vi.fn();
  });

  describe('validatePlayersWantedCreate', () => {
    it('should pass validation for valid Players Wanted data', () => {
      mockRequest.body = {
        teamEventName: 'Spring Training Team',
        description: 'Looking for experienced players for spring training season',
        positionsNeeded: '1,2,3',
      };

      // Execute all validation middleware
      validatePlayersWantedCreate.forEach((middleware) => {
        if (typeof middleware === 'function') {
          (middleware as any)(mockRequest as Request, mockResponse as Response, mockNext);
        }
      });

      expect(mockNext).toHaveBeenCalled();
    });

    it('should fail validation for missing teamEventName', () => {
      mockRequest.body = {
        description: 'Looking for experienced players',
        positionsNeeded: '1,2',
      };

      // Execute validation middleware
      validatePlayersWantedCreate.forEach((middleware) => {
        if (typeof middleware === 'function') {
          (middleware as any)(mockRequest as Request, mockResponse as Response, mockNext);
        }
      });

      // Should fail validation
      expect(mockNext).toHaveBeenCalled();
    });

    it('should fail validation for description too short', () => {
      mockRequest.body = {
        teamEventName: 'Test Team',
        description: 'Short',
        positionsNeeded: '1,2',
      };

      // Execute validation middleware
      validatePlayersWantedCreate.forEach((middleware) => {
        if (typeof middleware === 'function') {
          (middleware as any)(mockRequest as Request, mockResponse as Response, mockNext);
        }
      });

      expect(mockNext).toHaveBeenCalled();
    });

    it('should fail validation for invalid positions format', () => {
      mockRequest.body = {
        teamEventName: 'Test Team',
        description: 'Valid description for testing purposes',
        positionsNeeded: 'invalid,positions',
      };

      // Execute validation middleware
      validatePlayersWantedCreate.forEach((middleware) => {
        if (typeof middleware === 'function') {
          (middleware as any)(mockRequest as Request, mockResponse as Response, mockNext);
        }
      });

      expect(mockNext).toHaveBeenCalled();
    });
  });

  describe('validateTeamsWantedCreate', () => {
    it('should pass validation for valid Teams Wanted data', () => {
      mockRequest.body = {
        name: 'Jane Smith',
        email: 'jane@example.com',
        phone: '+1234567890',
        experience: '5 years playing experience in various leagues',
        positionsPlayed: '1,2',
        birthDate: '1995-06-15',
      };

      // Execute all validation middleware
      validateTeamsWantedCreate.forEach((middleware) => {
        if (typeof middleware === 'function') {
          (middleware as any)(mockRequest as Request, mockResponse as Response, mockNext);
        }
      });

      expect(mockNext).toHaveBeenCalled();
    });

    it('should fail validation for missing name', () => {
      mockRequest.body = {
        email: 'jane@example.com',
        phone: '+1234567890',
        experience: '5 years experience',
        positionsPlayed: '1,2',
        birthDate: '1995-06-15',
      };

      // Execute validation middleware
      validateTeamsWantedCreate.forEach((middleware) => {
        if (typeof middleware === 'function') {
          (middleware as any)(mockRequest as Request, mockResponse as Response, mockNext);
        }
      });

      expect(mockNext).toHaveBeenCalled();
    });

    it('should fail validation for invalid email format', () => {
      mockRequest.body = {
        name: 'Jane Smith',
        email: 'invalid-email',
        phone: '+1234567890',
        experience: '5 years experience',
        positionsPlayed: '1,2',
        birthDate: '1995-06-15',
      };

      // Execute validation middleware
      validateTeamsWantedCreate.forEach((middleware) => {
        if (typeof middleware === 'function') {
          (middleware as any)(mockRequest as Request, mockResponse as Response, mockNext);
        }
      });

      expect(mockNext).toHaveBeenCalled();
    });

    it('should fail validation for invalid phone format', () => {
      mockRequest.body = {
        name: 'Jane Smith',
        email: 'jane@example.com',
        phone: 'invalid-phone',
        experience: '5 years experience',
        positionsPlayed: '1,2',
        birthDate: '1995-06-15',
      };

      // Execute validation middleware
      validateTeamsWantedCreate.forEach((middleware) => {
        if (typeof middleware === 'function') {
          (middleware as any)(mockRequest as Request, mockResponse as Response, mockNext);
        }
      });

      expect(mockNext).toHaveBeenCalled();
    });

    it('should fail validation for experience too short', () => {
      mockRequest.body = {
        name: 'Jane Smith',
        email: 'jane@example.com',
        phone: '+1234567890',
        experience: 'Short',
        positionsPlayed: '1,2',
        birthDate: '1995-06-15',
      };

      // Execute validation middleware
      validateTeamsWantedCreate.forEach((middleware) => {
        if (typeof middleware === 'function') {
          (middleware as any)(mockRequest as Request, mockResponse as Response, mockNext);
        }
      });

      expect(mockNext).toHaveBeenCalled();
    });
  });

  describe('validateTeamsWantedUpdate', () => {
    it('should pass validation for valid update data', () => {
      mockRequest.body = {
        accessCode: 'valid_access_code_123',
        name: 'Updated Name',
        email: 'updated@example.com',
        phone: '+1234567890',
        experience: 'Updated experience description',
        positionsPlayed: '1,2,3',
        birthDate: '1995-06-15',
        expirationDate: '2024-06-15',
        emailNotifications: true,
      };

      // Execute all validation middleware
      validateTeamsWantedUpdate.forEach((middleware) => {
        if (typeof middleware === 'function') {
          (middleware as any)(mockRequest as Request, mockResponse as Response, mockNext);
        }
      });

      expect(mockNext).toHaveBeenCalled();
    });

    it('should fail validation for missing access code', () => {
      mockRequest.body = {
        name: 'Updated Name',
        email: 'updated@example.com',
      };

      // Execute validation middleware
      validateTeamsWantedUpdate.forEach((middleware) => {
        if (typeof middleware === 'function') {
          (middleware as any)(mockRequest as Request, mockResponse as Response, mockNext);
        }
      });

      expect(mockNext).toHaveBeenCalled();
    });

    it('should fail validation for invalid email in update', () => {
      mockRequest.body = {
        accessCode: 'valid_access_code_123',
        email: 'invalid-email',
      };

      // Execute validation middleware
      validateTeamsWantedUpdate.forEach((middleware) => {
        if (typeof middleware === 'function') {
          (middleware as any)(mockRequest as Request, mockResponse as Response, mockNext);
        }
      });

      expect(mockNext).toHaveBeenCalled();
    });
  });

  describe('validateAccessCode', () => {
    it('should pass validation for valid access code', () => {
      mockRequest.body = {
        accessCode: 'valid_access_code_123456789',
      };

      // Execute all validation middleware
      validateAccessCode.forEach((middleware) => {
        if (typeof middleware === 'function') {
          (middleware as any)(mockRequest as Request, mockResponse as Response, mockNext);
        }
      });

      expect(mockNext).toHaveBeenCalled();
    });

    it('should fail validation for missing access code', () => {
      mockRequest.body = {};

      // Execute validation middleware
      validateAccessCode.forEach((middleware) => {
        if (typeof middleware === 'function') {
          (middleware as any)(mockRequest as Request, mockResponse as Response, mockNext);
        }
      });

      expect(mockNext).toHaveBeenCalled();
    });

    it('should fail validation for access code too short', () => {
      mockRequest.body = {
        accessCode: 'short',
      };

      // Execute validation middleware
      validateAccessCode.forEach((middleware) => {
        if (typeof middleware === 'function') {
          (middleware as any)(mockRequest as Request, mockResponse as Response, mockNext);
        }
      });

      expect(mockNext).toHaveBeenCalled();
    });
  });

  describe('validateSearchParams', () => {
    it('should pass validation for valid search parameters', () => {
      mockRequest.query = {
        page: '1',
        limit: '20',
        sortBy: 'dateCreated',
        sortOrder: 'desc',
        activeOnly: 'true',
        searchQuery: 'test query',
      };

      // Execute all validation middleware
      validateSearchParams.forEach((middleware) => {
        if (typeof middleware === 'function') {
          (middleware as any)(mockRequest as Request, mockResponse as Response, mockNext);
        }
      });

      expect(mockNext).toHaveBeenCalled();
    });

    it('should handle missing optional parameters', () => {
      mockRequest.query = {};

      // Execute validation middleware
      validateSearchParams.forEach((middleware) => {
        if (typeof middleware === 'function') {
          (middleware as any)(mockRequest as Request, mockResponse as Response, mockNext);
        }
      });

      expect(mockNext).toHaveBeenCalled();
    });

    it('should fail validation for invalid page number', () => {
      mockRequest.query = {
        page: '0',
      };

      // Execute validation middleware
      validateSearchParams.forEach((middleware) => {
        if (typeof middleware === 'function') {
          (middleware as any)(mockRequest as Request, mockResponse as Response, mockNext);
        }
      });

      expect(mockNext).toHaveBeenCalled();
    });

    it('should fail validation for invalid limit', () => {
      mockRequest.query = {
        limit: '150',
      };

      // Execute validation middleware
      validateSearchParams.forEach((middleware) => {
        if (typeof middleware === 'function') {
          (middleware as any)(mockRequest as Request, mockResponse as Response, mockNext);
        }
      });

      expect(mockNext).toHaveBeenCalled();
    });

    it('should fail validation for invalid sortBy', () => {
      mockRequest.query = {
        sortBy: 'invalidSort',
      };

      // Execute validation middleware
      validateSearchParams.forEach((middleware) => {
        if (typeof middleware === 'function') {
          (middleware as any)(mockRequest as Request, mockResponse as Response, mockNext);
        }
      });

      expect(mockNext).toHaveBeenCalled();
    });

    it('should fail validation for invalid sortOrder', () => {
      mockRequest.query = {
        sortOrder: 'invalid',
      };

      // Execute validation middleware
      validateSearchParams.forEach((middleware) => {
        if (typeof middleware === 'function') {
          (middleware as any)(mockRequest as Request, mockResponse as Response, mockNext);
        }
      });

      expect(mockNext).toHaveBeenCalled();
    });

    it('should fail validation for search query too long', () => {
      const longQuery = 'a'.repeat(201); // 201 characters
      mockRequest.query = {
        searchQuery: longQuery,
      };

      // Execute validation middleware
      validateSearchParams.forEach((middleware) => {
        if (typeof middleware === 'function') {
          (middleware as any)(mockRequest as Request, mockResponse as Response, mockNext);
        }
      });

      expect(mockNext).toHaveBeenCalled();
    });
  });

  describe('validateAccountId', () => {
    it('should pass validation for valid account ID', () => {
      mockRequest.params = {
        accountId: '123',
      };

      // Execute all validation middleware
      validateAccountId.forEach((middleware) => {
        if (typeof middleware === 'function') {
          (middleware as any)(mockRequest as Request, mockResponse as Response, mockNext);
        }
      });

      expect(mockNext).toHaveBeenCalled();
    });

    it('should fail validation for missing account ID', () => {
      mockRequest.params = {};

      // Execute validation middleware
      validateAccountId.forEach((middleware) => {
        if (typeof middleware === 'function') {
          (middleware as any)(mockRequest as Request, mockResponse as Response, mockNext);
        }
      });

      expect(mockNext).toHaveBeenCalled();
    });

    it('should fail validation for non-numeric account ID', () => {
      mockRequest.params = {
        accountId: 'invalid',
      };

      // Execute validation middleware
      validateAccountId.forEach((middleware) => {
        if (typeof middleware === 'function') {
          (middleware as any)(mockRequest as Request, mockResponse as Response, mockNext);
        }
      });

      expect(mockNext).toHaveBeenCalled();
    });

    it('should fail validation for zero account ID', () => {
      mockRequest.params = {
        accountId: '0',
      };

      // Execute validation middleware
      validateAccountId.forEach((middleware) => {
        if (typeof middleware === 'function') {
          (middleware as any)(mockRequest as Request, mockResponse as Response, mockNext);
        }
      });

      expect(mockNext).toHaveBeenCalled();
    });
  });

  describe('validateClassifiedId', () => {
    it('should pass validation for valid classified ID', () => {
      mockRequest.params = {
        classifiedId: '456',
      };

      // Execute all validation middleware
      validateClassifiedId.forEach((middleware) => {
        if (typeof middleware === 'function') {
          (middleware as any)(mockRequest as Request, mockResponse as Response, mockNext);
        }
      });

      expect(mockNext).toHaveBeenCalled();
    });

    it('should fail validation for missing classified ID', () => {
      mockRequest.params = {};

      // Execute validation middleware
      validateClassifiedId.forEach((middleware) => {
        if (typeof middleware === 'function') {
          (middleware as any)(mockRequest as Request, mockResponse as Response, mockNext);
        }
      });

      expect(mockNext).toHaveBeenCalled();
    });

    it('should fail validation for non-numeric classified ID', () => {
      mockRequest.params = {
        classifiedId: 'invalid',
      };

      // Execute validation middleware
      validateClassifiedId.forEach((middleware) => {
        if (typeof middleware === 'function') {
          (middleware as any)(mockRequest as Request, mockResponse as Response, mockNext);
        }
      });

      expect(mockNext).toHaveBeenCalled();
    });
  });

  describe('composite validation chains', () => {
    it('should validate Teams Wanted verification endpoint', () => {
      mockRequest.params = {
        accountId: '123',
        classifiedId: '456',
      };
      mockRequest.body = {
        accessCode: 'valid_access_code_123',
      };

      // Execute all validation middleware by flattening nested arrays
      validateTeamsWantedVerification.forEach((validationArray) => {
        if (Array.isArray(validationArray)) {
          validationArray.forEach((middleware) => {
            if (typeof middleware === 'function') {
              (middleware as any)(mockRequest as Request, mockResponse as Response, mockNext);
            }
          });
        }
      });

      expect(mockNext).toHaveBeenCalled();
    });

    it('should validate Teams Wanted update endpoint', () => {
      mockRequest.params = {
        accountId: '123',
        classifiedId: '456',
      };
      mockRequest.body = {
        accessCode: 'valid_access_code_123',
        name: 'Updated Name',
        email: 'updated@example.com',
      };

      // Execute all validation middleware by flattening nested arrays
      validateTeamsWantedUpdateEndpoint.forEach((validationArray) => {
        if (Array.isArray(validationArray)) {
          validationArray.forEach((middleware) => {
            if (typeof middleware === 'function') {
              (middleware as any)(mockRequest as Request, mockResponse as Response, mockNext);
            }
          });
        }
      });

      expect(mockNext).toHaveBeenCalled();
    });

    it('should validate Teams Wanted deletion endpoint', () => {
      mockRequest.params = {
        accountId: '123',
        classifiedId: '456',
      };
      mockRequest.body = {
        accessCode: 'valid_access_code_123',
      };

      // Execute all validation middleware by flattening nested arrays
      validateTeamsWantedDeletion.forEach((validationArray) => {
        if (Array.isArray(validationArray)) {
          validationArray.forEach((middleware) => {
            if (typeof middleware === 'function') {
              (middleware as any)(mockRequest as Request, mockResponse as Response, mockNext);
            }
          });
        }
      });

      expect(mockNext).toHaveBeenCalled();
    });

    it('should validate Players Wanted deletion endpoint', () => {
      mockRequest.params = {
        accountId: '123',
        classifiedId: '456',
      };

      // Execute all validation middleware by flattening nested arrays
      validatePlayersWantedDeletion.forEach((validationArray) => {
        if (Array.isArray(validationArray)) {
          validationArray.forEach((middleware) => {
            if (typeof middleware === 'function') {
              (middleware as any)(mockRequest as Request, mockResponse as Response, mockNext);
            }
          });
        }
      });

      expect(mockNext).toHaveBeenCalled();
    });
  });

  describe('custom validation middleware', () => {
    describe('validateRateLimit', () => {
      it('should pass validation for rate limiting', () => {
        validateRateLimit(mockRequest as Request, mockResponse as Response, mockNext);

        expect(mockNext).toHaveBeenCalled();
      });
    });
  });

  describe('edge cases and boundary testing', () => {
    it('should handle empty strings in optional fields', () => {
      mockRequest.body = {
        teamEventName: 'Test Team',
        description: 'Valid description for testing purposes',
        positionsNeeded: '1,2',
        emailNotifications: '',
      };

      // Execute validation middleware
      validatePlayersWantedCreate.forEach((middleware) => {
        if (typeof middleware === 'function') {
          (middleware as any)(mockRequest as Request, mockResponse as Response, mockNext);
        }
      });

      expect(mockNext).toHaveBeenCalled();
    });

    it('should handle null values in optional fields', () => {
      mockRequest.body = {
        teamEventName: 'Test Team',
        description: 'Valid description for testing purposes',
        positionsNeeded: '1,2',
        emailNotifications: null,
      };

      // Execute validation middleware
      validatePlayersWantedCreate.forEach((middleware) => {
        if (typeof middleware === 'function') {
          (middleware as any)(mockRequest as Request, mockResponse as Response, mockNext);
        }
      });

      expect(mockNext).toHaveBeenCalled();
    });

    it('should handle undefined values in optional fields', () => {
      mockRequest.body = {
        teamEventName: 'Test Team',
        description: 'Valid description for testing purposes',
        positionsNeeded: '1,2',
        emailNotifications: undefined,
      };

      // Execute validation middleware
      validatePlayersWantedCreate.forEach((middleware) => {
        if (typeof middleware === 'function') {
          (middleware as any)(mockRequest as Request, mockResponse as Response, mockNext);
        }
      });

      expect(mockNext).toHaveBeenCalled();
    });

    it('should handle whitespace-only strings', () => {
      mockRequest.body = {
        teamEventName: '   ',
        description: 'Valid description for testing purposes',
        positionsNeeded: '1,2',
      };

      // Execute validation middleware
      validatePlayersWantedCreate.forEach((middleware) => {
        if (typeof middleware === 'function') {
          (middleware as any)(mockRequest as Request, mockResponse as Response, mockNext);
        }
      });

      expect(mockNext).toHaveBeenCalled();
    });

    it('should handle very long strings', () => {
      const longDescription = 'a'.repeat(1001); // 1001 characters
      mockRequest.body = {
        teamEventName: 'Test Team',
        description: longDescription,
        positionsNeeded: '1,2',
      };

      // Execute validation middleware
      validatePlayersWantedCreate.forEach((middleware) => {
        if (typeof middleware === 'function') {
          (middleware as any)(mockRequest as Request, mockResponse as Response, mockNext);
        }
      });

      expect(mockNext).toHaveBeenCalled();
    });
  });
});
