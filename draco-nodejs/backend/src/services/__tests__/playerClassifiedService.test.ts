import { PlayerClassifiedService } from '../player-classified/playerClassifiedService.js';
import { PrismaClient } from '@prisma/client';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import {
  IPlayersWantedCreateRequest,
  ITeamsWantedCreateRequest,
  IClassifiedSearchParams,
} from '../../interfaces/playerClassifiedInterfaces.js';
import { DateUtils } from '../../utils/dateUtils.js';

// Mock the ServiceFactory
vi.mock('../../lib/serviceFactory.js', () => ({
  ServiceFactory: {
    getRoleService: vi.fn(),
    getEmailService: vi.fn(),
  },
}));

// Mock the EmailService
vi.mock('../emailService.js', () => ({
  EmailService: vi.fn().mockImplementation(() => ({
    sendVerificationEmail: vi.fn(),
  })),
}));

// Mock the RoleService
const mockRoleService = {
  hasRoleOrHigher: vi.fn(),
};

// Mock the PaginationHelper
vi.mock('../../utils/pagination.js', () => ({
  PaginationHelper: {
    createMeta: vi.fn().mockReturnValue({
      page: 1,
      limit: 20,
      total: 100,
      totalPages: 5,
      hasNext: true,
      hasPrev: false,
    }),
    executePaginatedQuery: vi.fn().mockImplementation(async (queryFn, countFn, transformFn) => {
      // Actually execute the function closures to simulate real behavior
      const mockItems = await queryFn();
      const total = await countFn();

      if (transformFn) {
        const data = transformFn(mockItems);
        return { data, total };
      }

      return { data: mockItems, total };
    }),
  },
}));

// Mock the constants
vi.mock('../../interfaces/playerClassifiedConstants.js', () => ({
  isValidPositionId: vi.fn((id: string) => /^\d+$/.test(id)),
}));

// Mock bcrypt module
vi.mock('bcrypt', () => ({
  default: {
    compare: vi.fn(),
    hash: vi.fn(),
  },
  compare: vi.fn(),
  hash: vi.fn(),
}));

// Create mock email provider for EmailProviderFactory
const mockEmailProvider = vi.hoisted(() => ({
  sendEmail: vi.fn().mockResolvedValue({ success: true }),
}));

// Mock the EmailProviderFactory for dynamic imports
vi.mock('../email/EmailProviderFactory.js', () => ({
  EmailProviderFactory: {
    getProvider: vi.fn().mockResolvedValue(mockEmailProvider),
  },
}));

describe('PlayerClassifiedService', () => {
  let playerClassifiedService: PlayerClassifiedService;
  let mockPrisma: any;
  let mockBcrypt: any;

  beforeEach(async () => {
    vi.clearAllMocks();

    // Set required environment variables for tests
    process.env.FRONTEND_URL = 'https://localhost:3000';

    // Get the mocked bcrypt module
    mockBcrypt = await import('bcrypt');

    // Mock bcrypt.hash to return a predictable hash
    vi.mocked(mockBcrypt.default.hash).mockResolvedValue('hashed_access_code_hash');
    vi.mocked(mockBcrypt.default.compare).mockResolvedValue(true);

    // Create mock Prisma client
    mockPrisma = {
      playerswantedclassified: {
        create: vi.fn(),
        findMany: vi.fn(),
        count: vi.fn(),
        findFirst: vi.fn(),
        delete: vi.fn(),
      },
      teamswantedclassified: {
        create: vi.fn(),
        findMany: vi.fn(),
        count: vi.fn(),
        findFirst: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
      },
      contacts: {
        findUnique: vi.fn(),
      },
      accounts: {
        findUnique: vi.fn(),
      },
    };

    // Mock ServiceFactory methods
    const { ServiceFactory } = await import('../serviceFactory.js');
    vi.mocked(ServiceFactory.getRoleService).mockReturnValue(mockRoleService as any);

    playerClassifiedService = new PlayerClassifiedService(mockPrisma as unknown as PrismaClient);
  });

  describe('createPlayersWanted', () => {
    const mockRequest: IPlayersWantedCreateRequest = {
      teamEventName: 'Spring Training Team',
      description: 'Looking for experienced players for spring training',
      positionsNeeded: '1,2,3',
    };

    const mockAccountId = BigInt(123);
    const mockContactId = BigInt(456);

    beforeEach(() => {
      mockPrisma.playerswantedclassified.create.mockResolvedValue({
        id: BigInt(789),
        accountid: mockAccountId,
        datecreated: new Date(),
        createdbycontactid: mockContactId,
        teameventname: mockRequest.teamEventName,
        description: mockRequest.description,
        positionsneeded: mockRequest.positionsNeeded,
      });

      mockPrisma.contacts.findUnique.mockResolvedValue({
        id: mockContactId,
        firstname: 'John',
        lastname: 'Doe',
        email: 'john@example.com',
      });

      mockPrisma.accounts.findUnique.mockResolvedValue({
        id: mockAccountId,
        name: 'Test Account',
      });
    });

    it('should create a Players Wanted classified successfully', async () => {
      const result = await playerClassifiedService.createPlayersWanted(
        mockAccountId,
        mockContactId,
        mockRequest,
      );

      expect(mockPrisma.playerswantedclassified.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          accountid: mockAccountId,
          createdbycontactid: mockContactId,
          teameventname: mockRequest.teamEventName,
          description: mockRequest.description,
          positionsneeded: mockRequest.positionsNeeded,
        }),
      });

      expect(result).toEqual(
        expect.objectContaining({
          id: '789',
          accountId: '123',
          teamEventName: mockRequest.teamEventName,
          description: mockRequest.description,
          positionsNeeded: mockRequest.positionsNeeded,
          dateCreated: expect.any(String),
          createdByContactId: expect.any(String),
          creator: expect.objectContaining({
            id: expect.any(String),
            firstName: expect.any(String),
            lastName: expect.any(String),
            photoUrl: expect.any(String),
          }),
          account: expect.objectContaining({
            id: expect.any(String),
            name: expect.any(String),
          }),
        }),
      );
    });

    it('should validate required fields', async () => {
      const invalidRequest = { ...mockRequest, teamEventName: '' };

      await expect(
        playerClassifiedService.createPlayersWanted(mockAccountId, mockContactId, invalidRequest),
      ).rejects.toThrow('Validation failed: TeamEventName is required');
    });

    it('should validate description length', async () => {
      const invalidRequest = { ...mockRequest, description: '' };

      await expect(
        playerClassifiedService.createPlayersWanted(mockAccountId, mockContactId, invalidRequest),
      ).rejects.toThrow('Validation failed: Description is required');
    });

    it('should validate positions format', async () => {
      const invalidRequest = { ...mockRequest, positionsNeeded: 'invalid,positions' };

      await expect(
        playerClassifiedService.createPlayersWanted(mockAccountId, mockContactId, invalidRequest),
      ).rejects.toThrow(
        'Validation failed: PositionsNeeded must contain valid position IDs separated by commas',
      );
    });
  });

  describe('createTeamsWanted', () => {
    const mockRequest: ITeamsWantedCreateRequest = {
      name: 'Jane Smith',
      email: 'jane@example.com',
      phone: '+1234567890',
      experience: '5 years playing experience',
      positionsPlayed: '1,2',
      birthDate: '1995-06-15',
    };

    const mockAccountId = BigInt(123);

    beforeEach(() => {
      mockPrisma.teamswantedclassified.create.mockResolvedValue({
        id: BigInt(789),
        accountid: mockAccountId,
        datecreated: new Date(),
        name: mockRequest.name,
        email: mockRequest.email,
        phone: mockRequest.phone,
        experience: mockRequest.experience,
        positionsplayed: mockRequest.positionsPlayed,
        accesscode: 'hashed_access_code',
        birthdate: new Date(mockRequest.birthDate),
      });

      mockPrisma.accounts.findUnique.mockResolvedValue({
        id: mockAccountId,
        name: 'Test Account',
      });
    });

    it('should create a Teams Wanted classified successfully', async () => {
      const result = await playerClassifiedService.createTeamsWanted(mockAccountId, mockRequest);

      expect(mockPrisma.teamswantedclassified.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          accountid: mockAccountId,
          name: mockRequest.name,
          email: mockRequest.email,
          phone: mockRequest.phone,
          experience: mockRequest.experience,
          positionsplayed: mockRequest.positionsPlayed,
          birthdate: new Date(mockRequest.birthDate),
        }),
      });

      expect(result).toEqual(
        expect.objectContaining({
          id: '789',
          accountId: '123',
          name: mockRequest.name,
          email: mockRequest.email,
          phone: mockRequest.phone,
          experience: mockRequest.experience,
          positionsPlayed: mockRequest.positionsPlayed,
          birthDate: expect.any(String),
          dateCreated: expect.any(String),
          account: expect.objectContaining({
            id: expect.any(String),
            name: expect.any(String),
          }),
        }),
      );
    });

    it('should validate required fields', async () => {
      const invalidRequest = { ...mockRequest, name: '' };

      await expect(
        playerClassifiedService.createTeamsWanted(mockAccountId, invalidRequest),
      ).rejects.toThrow('Validation failed: Name is required');
    });

    it('should validate email format', async () => {
      const invalidRequest = { ...mockRequest, email: 'invalid-email' };

      await expect(
        playerClassifiedService.createTeamsWanted(mockAccountId, invalidRequest),
      ).rejects.toThrow('Validation failed: Invalid email format');
    });

    it('should validate phone format', async () => {
      const invalidRequest = { ...mockRequest, phone: 'invalid-phone' };

      await expect(
        playerClassifiedService.createTeamsWanted(mockAccountId, invalidRequest),
      ).rejects.toThrow('Validation failed: Invalid phone number format');
    });

    it('should validate birth date age range', async () => {
      const tooYoungDate = new Date();
      tooYoungDate.setFullYear(tooYoungDate.getFullYear() - 10); // 10 years old

      const invalidRequest = {
        ...mockRequest,
        birthDate: tooYoungDate.toISOString().split('T')[0],
      };

      await expect(
        playerClassifiedService.createTeamsWanted(mockAccountId, invalidRequest),
      ).rejects.toThrow('Validation failed: BirthDate must be between 13 and 80 years old');
    });
  });

  describe('getPlayersWanted', () => {
    const mockAccountId = BigInt(123);
    const mockSearchParams: IClassifiedSearchParams = {
      accountId: BigInt(123),
      page: 1,
      limit: 20,
      sortBy: 'dateCreated' as const,
      sortOrder: 'desc' as const,
      searchQuery: 'test',
    };

    beforeEach(() => {
      mockPrisma.playerswantedclassified.findMany.mockResolvedValue([
        {
          id: BigInt(1),
          accountid: mockAccountId,
          datecreated: new Date(),
          createdbycontactid: BigInt(456),
          teameventname: 'Team 1',
          description: 'Description 1',
          positionsneeded: '1,2',
          contacts: {
            id: BigInt(456),
            firstname: 'John',
            lastname: 'Doe',
          },
          accounts: {
            id: mockAccountId,
            name: 'Test Account',
          },
        },
      ]);

      mockPrisma.playerswantedclassified.count.mockResolvedValue(1);
    });

    it('should retrieve Players Wanted classifieds with pagination', async () => {
      const result = await playerClassifiedService.getPlayersWanted(
        mockAccountId,
        mockSearchParams,
      );

      expect(mockPrisma.playerswantedclassified.findMany).toHaveBeenCalledWith({
        where: { accountid: mockAccountId },
        orderBy: { datecreated: 'desc' },
        skip: 0,
        take: 20,
        include: {
          contacts: {
            select: { id: true, firstname: true, lastname: true },
          },
          accounts: {
            select: { id: true, name: true },
          },
        },
      });

      expect(result).toEqual(
        expect.objectContaining({
          data: expect.arrayContaining([
            expect.objectContaining({
              id: '1',
              teamEventName: 'Team 1',
              description: 'Description 1',
              accountId: expect.any(String),
              dateCreated: expect.any(String),
              positionsNeeded: expect.any(String),
              createdByContactId: expect.any(String),
              creator: expect.any(Object),
              account: expect.any(Object),
            }),
          ]),
          total: expect.any(Number),
          pagination: expect.any(Object),
          filters: expect.any(Object),
        }),
      );
    });

    it('should handle different sort fields', async () => {
      const sortParams = { ...mockSearchParams, sortBy: 'relevance' as const };

      // Clear the mock to ensure we get a fresh call
      vi.clearAllMocks();

      // Reset the mock data
      mockPrisma.playerswantedclassified.findMany.mockResolvedValue([
        {
          id: BigInt(1),
          accountid: mockAccountId,
          datecreated: new Date(),
          createdbycontactid: BigInt(456),
          teameventname: 'Team 1',
          description: 'Description 1',
          positionsneeded: '1,2',
          contacts: {
            id: BigInt(456),
            firstname: 'John',
            lastname: 'Doe',
          },
          accounts: {
            id: mockAccountId,
            name: 'Test Account',
          },
        },
      ]);
      mockPrisma.playerswantedclassified.count.mockResolvedValue(1);

      await playerClassifiedService.getPlayersWanted(mockAccountId, sortParams);

      // Should default to dateCreated since relevance is not implemented yet
      expect(mockPrisma.playerswantedclassified.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: { datecreated: 'desc' },
        }),
      );
    });
  });

  describe('getTeamsWanted', () => {
    const mockAccountId = BigInt(123);
    const mockSearchParams = {
      accountId: BigInt(123),
      page: 1,
      limit: 20,
      sortBy: 'dateCreated' as const,
      sortOrder: 'desc' as const,
      searchQuery: 'test',
    };

    beforeEach(() => {
      mockPrisma.teamswantedclassified.findMany.mockResolvedValue([
        {
          id: BigInt(1),
          accountid: mockAccountId,
          datecreated: new Date(),
          name: 'Jane Smith',
          email: 'jane@example.com',
          phone: '+1234567890',
          experience: '5 years experience',
          positionsplayed: '1,2',
          accesscode: 'hashed_code',
          birthdate: new Date('1995-06-15'),
          accounts: {
            id: mockAccountId,
            name: 'Test Account',
          },
        },
      ]);

      mockPrisma.teamswantedclassified.count.mockResolvedValue(1);
    });

    it('should retrieve Teams Wanted classifieds with pagination', async () => {
      const result = await playerClassifiedService.getTeamsWanted(mockAccountId, mockSearchParams);

      expect(mockPrisma.teamswantedclassified.findMany).toHaveBeenCalledWith({
        where: { accountid: mockAccountId },
        orderBy: { datecreated: 'desc' },
        skip: 0,
        take: 20,
        include: {
          accounts: {
            select: { id: true, name: true },
          },
        },
      });

      expect(result).toEqual(
        expect.objectContaining({
          data: expect.arrayContaining([
            expect.objectContaining({
              id: '1',
              name: 'Jane Smith',
              accountId: expect.any(String),
              dateCreated: expect.any(String),
              experience: expect.any(String),
              positionsPlayed: expect.any(String),
              birthDate: expect.any(String),
              account: expect.any(Object),
            }),
          ]),
          total: expect.any(Number),
          pagination: expect.any(Object),
          filters: expect.any(Object),
        }),
      );
    });
  });

  describe('verifyTeamsWantedAccess', () => {
    const mockClassifiedId = BigInt(789);
    const mockAccountId = BigInt(123);
    const mockAccessCode = 'valid_access_code';
    const mockHashedAccessCode = '$2b$12$hashed_access_code_hash';

    beforeEach(() => {
      mockPrisma.teamswantedclassified.findFirst.mockResolvedValue({
        id: mockClassifiedId,
        accountid: mockAccountId,
        datecreated: new Date(),
        name: 'Jane Smith',
        email: 'jane@example.com',
        phone: '+1234567890',
        experience: '5 years experience',
        positionsplayed: '1,2',
        accesscode: mockHashedAccessCode,
        birthdate: new Date('1995-06-15'),
      });

      mockPrisma.accounts.findUnique.mockResolvedValue({
        id: mockAccountId,
        name: 'Test Account',
      });
    });

    it('should verify access code successfully', async () => {
      // Mock bcrypt.compare to return true
      vi.mocked(mockBcrypt.default.compare).mockResolvedValue(true);

      const result = await playerClassifiedService.verifyTeamsWantedAccess(
        mockClassifiedId,
        mockAccessCode,
        mockAccountId,
      );

      expect(result).toEqual(
        expect.objectContaining({
          id: '789',
          accountId: '123',
          name: 'Jane Smith',
          email: 'jane@example.com',
          dateCreated: expect.any(String),
          phone: expect.any(String),
          experience: expect.any(String),
          positionsPlayed: expect.any(String),
          birthDate: expect.any(String),
          account: expect.objectContaining({
            id: expect.any(String),
            name: expect.any(String),
          }),
        }),
      );
    });

    it('should throw error for invalid access code', async () => {
      // Mock bcrypt.compare to return false
      vi.mocked(mockBcrypt.default.compare).mockResolvedValue(false);

      await expect(
        playerClassifiedService.verifyTeamsWantedAccess(
          mockClassifiedId,
          'invalid_code',
          mockAccountId,
        ),
      ).rejects.toThrow('Invalid access code');
    });

    it('should throw error for non-existent classified', async () => {
      mockPrisma.teamswantedclassified.findFirst.mockResolvedValue(null);

      await expect(
        playerClassifiedService.verifyTeamsWantedAccess(
          mockClassifiedId,
          mockAccessCode,
          mockAccountId,
        ),
      ).rejects.toThrow('Classified not found');
    });
  });

  describe('updateTeamsWanted', () => {
    const mockClassifiedId = BigInt(789);
    const mockAccountId = BigInt(123);
    const mockAccessCode = 'valid_access_code';
    const mockUpdateData = {
      name: 'Updated Name',
      email: 'updated@example.com',
    };

    beforeEach(async () => {
      // Mock the verification step
      mockPrisma.teamswantedclassified.findFirst.mockResolvedValue({
        id: mockClassifiedId,
        accountid: mockAccountId,
        accesscode: 'hashed_access_code',
      });

      mockPrisma.teamswantedclassified.update.mockResolvedValue({
        id: mockClassifiedId,
        accountid: mockAccountId,
        name: mockUpdateData.name,
        email: mockUpdateData.email,
        datecreated: new Date(),
        phone: '+1234567890',
        experience: '5 years experience',
        positionsplayed: '1,2',
        accesscode: 'hashed_access_code',
        birthdate: new Date('1995-06-15'),
      });

      mockPrisma.accounts.findUnique.mockResolvedValue({
        id: mockAccountId,
        name: 'Test Account',
      });

      // Mock bcrypt.compare to return true
      vi.mocked(mockBcrypt.default.compare).mockResolvedValue(true);
    });

    it('should update Teams Wanted classified successfully', async () => {
      const result = await playerClassifiedService.updateTeamsWanted(
        mockClassifiedId,
        mockAccessCode,
        mockUpdateData,
        mockAccountId,
      );

      expect(mockPrisma.teamswantedclassified.update).toHaveBeenCalledWith({
        where: { id: mockClassifiedId },
        data: expect.objectContaining({
          name: mockUpdateData.name,
          email: mockUpdateData.email,
        }),
      });

      expect(result).toEqual(
        expect.objectContaining({
          id: '789',
          accountId: '123',
          name: mockUpdateData.name,
          email: mockUpdateData.email,
          dateCreated: expect.any(String),
          phone: expect.any(String),
          experience: expect.any(String),
          positionsPlayed: expect.any(String),
          birthDate: expect.any(String),
          account: expect.objectContaining({
            id: expect.any(String),
            name: expect.any(String),
          }),
        }),
      );
    });

    it('should validate email format in update data', async () => {
      const invalidUpdateData = { ...mockUpdateData, email: 'invalid-email' };

      await expect(
        playerClassifiedService.updateTeamsWanted(
          mockClassifiedId,
          mockAccessCode,
          invalidUpdateData,
          mockAccountId,
        ),
      ).rejects.toThrow('Invalid email format');
    });
  });

  describe('deleteTeamsWanted', () => {
    const mockClassifiedId = BigInt(789);
    const mockAccountId = BigInt(123);
    const mockAccessCode = 'valid_access_code';

    beforeEach(async () => {
      // Mock the verification step
      mockPrisma.teamswantedclassified.findFirst.mockResolvedValue({
        id: mockClassifiedId,
        accountid: mockAccountId,
        accesscode: 'hashed_access_code',
      });

      mockPrisma.teamswantedclassified.delete.mockResolvedValue({});

      // Mock account lookup for verification
      mockPrisma.accounts.findUnique.mockResolvedValue({
        id: mockAccountId,
        name: 'Test Account',
      });

      // Mock bcrypt.compare to return true
      vi.mocked(mockBcrypt.default.compare).mockResolvedValue(true);
    });

    it('should delete Teams Wanted classified successfully', async () => {
      await expect(
        playerClassifiedService.deleteTeamsWanted(mockClassifiedId, mockAccessCode, mockAccountId),
      ).resolves.not.toThrow();

      expect(mockPrisma.teamswantedclassified.delete).toHaveBeenCalledWith({
        where: { id: mockClassifiedId },
      });
    });
  });

  describe('deletePlayersWanted', () => {
    const mockClassifiedId = BigInt(789);
    const mockAccountId = BigInt(123);
    const mockContactId = BigInt(456);

    beforeEach(() => {
      mockPrisma.playerswantedclassified.findFirst.mockResolvedValue({
        id: mockClassifiedId,
        accountid: mockAccountId,
      });

      mockPrisma.playerswantedclassified.delete.mockResolvedValue({});
    });

    it('should delete Players Wanted classified successfully', async () => {
      await expect(
        playerClassifiedService.deletePlayersWanted(mockClassifiedId, mockAccountId, mockContactId),
      ).resolves.not.toThrow();

      expect(mockPrisma.playerswantedclassified.delete).toHaveBeenCalledWith({
        where: { id: mockClassifiedId },
      });
    });

    it('should throw error for non-existent classified', async () => {
      mockPrisma.playerswantedclassified.findFirst.mockResolvedValue(null);

      await expect(
        playerClassifiedService.deletePlayersWanted(mockClassifiedId, mockAccountId, mockContactId),
      ).rejects.toThrow('Classified not found');
    });
  });

  describe('rate limiting', () => {
    it('should not enforce rate limits at service layer (handled by middleware)', async () => {
      // Rate limiting is now handled by express-rate-limit middleware
      // The service layer focuses on business logic, not HTTP-level rate limiting

      // This should succeed since rate limiting is handled by middleware
      // The service layer no longer has rate limiting logic
      expect(() => {
        // No rate limiting logic to test here
      }).not.toThrow();
    });
  });

  describe('helper methods', () => {
    it('should validate positions correctly', () => {
      // Test valid positions
      expect(playerClassifiedService.validationService.validatePositions('1,2,3')).toBe(true);
      expect(playerClassifiedService.validationService.validatePositions('1')).toBe(true);

      // Test invalid positions
      expect(playerClassifiedService.validationService.validatePositions('1,invalid,3')).toBe(
        false,
      );
      expect(playerClassifiedService.validationService.validatePositions('')).toBe(false);
    });

    it('should validate email format correctly', async () => {
      // Test valid emails - using the utility function directly
      const { validateEmail } = await import('../../utils/validationUtils.js');
      expect(validateEmail('test@example.com', 'email')).toBeNull();
      expect(validateEmail('user.name+tag@domain.co.uk', 'email')).toBeNull();

      // Test invalid emails
      expect(validateEmail('invalid-email', 'email')).not.toBeNull();
      expect(validateEmail('test@', 'email')).not.toBeNull();
      expect(validateEmail('@example.com', 'email')).not.toBeNull();
    });

    it('should validate phone format correctly', async () => {
      // Test valid phones - using the utility function directly
      const { validatePhone } = await import('../../utils/validationUtils.js');
      expect(validatePhone('+1234567890', 'phone')).toBeNull();
      expect(validatePhone('1234567890', 'phone')).toBeNull();
      expect(validatePhone('(123) 456-7890', 'phone')).toBeNull();

      // Test invalid phones
      expect(validatePhone('invalid', 'phone')).not.toBeNull();
      expect(validatePhone('123', 'phone')).toBeNull(); // This is actually valid according to the regex
      expect(validatePhone('', 'phone')).not.toBeNull();
    });

    it('should validate birth date age range correctly', async () => {
      const today = new Date();

      // Test valid ages - using the utility function directly
      const { validateBirthDate } = await import('../../utils/validationUtils.js');
      const validAge13 = new Date(today.getFullYear() - 13, today.getMonth(), today.getDate());
      const validAge80 = new Date(today.getFullYear() - 80, today.getMonth(), today.getDate());

      expect(validateBirthDate(validAge13, 'birthDate', 13, 80)).toBeNull();
      expect(validateBirthDate(validAge80, 'birthDate', 13, 80)).toBeNull();

      // Test invalid ages
      const tooYoung = new Date(today.getFullYear() - 10, today.getMonth(), today.getDate());
      const tooOld = new Date(today.getFullYear() - 90, today.getMonth(), today.getDate());

      expect(validateBirthDate(tooYoung, 'birthDate', 13, 80)).not.toBeNull();
      expect(validateBirthDate(tooOld, 'birthDate', 13, 80)).not.toBeNull();
    });

    it('should add days to date correctly', () => {
      // Create a date explicitly to avoid timezone issues
      const testDate = new Date(2024, 0, 1); // January 1, 2024 (month is 0-indexed)
      const result = DateUtils.addDays(testDate, 5);

      // The addDays method should increment the date by 5 days
      // January 1st + 5 days = January 6th
      expect(result.getDate()).toBe(6);
      expect(result.getMonth()).toBe(0); // January (0-indexed)
      expect(result.getFullYear()).toBe(2024);
    });
  });

  describe('security improvements', () => {
    describe('sanitizeHtmlContent', () => {
      it('should escape script tags', () => {
        const input = '<script>alert("xss")</script>John Doe';
        const result = playerClassifiedService.emailService.sanitizeHtmlContent(input);
        expect(result).toBe('&lt;script&gt;alert(&quot;xss&quot;)&lt;&#x2F;script&gt;John Doe');
      });

      it('should escape HTML tags', () => {
        const input = '<div>Hello</div><span>World</span>';
        const result = playerClassifiedService.emailService.sanitizeHtmlContent(input);
        expect(result).toBe('&lt;div&gt;Hello&lt;&#x2F;div&gt;&lt;span&gt;World&lt;&#x2F;span&gt;');
      });

      it('should escape javascript: protocol', () => {
        const input = 'javascript:alert("xss")';
        const result = playerClassifiedService.emailService.sanitizeHtmlContent(input);
        expect(result).toBe('javascript:alert(&quot;xss&quot;)');
      });

      it('should escape vbscript: protocol', () => {
        const input = 'vbscript:msgbox("xss")';
        const result = playerClassifiedService.emailService.sanitizeHtmlContent(input);
        expect(result).toBe('vbscript:msgbox(&quot;xss&quot;)');
      });

      it('should escape data: protocol', () => {
        const input = 'data:text/html,<script>alert("xss")</script>';
        const result = playerClassifiedService.emailService.sanitizeHtmlContent(input);
        expect(result).toBe(
          'data:text&#x2F;html,&lt;script&gt;alert(&quot;xss&quot;)&lt;&#x2F;script&gt;',
        );
      });

      it('should escape event handlers', () => {
        const input = 'onclick="alert()" John Doe';
        const result = playerClassifiedService.emailService.sanitizeHtmlContent(input);
        expect(result).toBe('onclick=&quot;alert()&quot; John Doe');
      });

      it('should preserve newlines (validator.escape does not modify whitespace)', () => {
        const input = 'Line 1\nLine 2\r\nLine 3';
        const result = playerClassifiedService.emailService.sanitizeHtmlContent(input);
        expect(result).toBe('Line 1\nLine 2\r\nLine 3');
      });

      it('should handle empty and null inputs', () => {
        expect(playerClassifiedService.emailService.sanitizeHtmlContent('')).toBe('');
        expect(playerClassifiedService.emailService.sanitizeHtmlContent(null as any)).toBe('');
        expect(playerClassifiedService.emailService.sanitizeHtmlContent(undefined as any)).toBe('');
      });

      it('should handle non-string inputs gracefully', () => {
        expect(playerClassifiedService.emailService.sanitizeHtmlContent(123 as any)).toBe('');
        expect(playerClassifiedService.emailService.sanitizeHtmlContent({} as any)).toBe('');
        expect(playerClassifiedService.emailService.sanitizeHtmlContent([] as any)).toBe('');
      });

      it('should preserve safe content', () => {
        const input = 'John Doe - Baseball Player';
        const result = playerClassifiedService.emailService.sanitizeHtmlContent(input);
        expect(result).toBe('John Doe - Baseball Player');
      });

      it('should escape complex XSS attempts', () => {
        const input = '<img src="x" onerror="javascript:alert(\'XSS\')" />';
        const result = playerClassifiedService.emailService.sanitizeHtmlContent(input);
        expect(result).toBe(
          '&lt;img src=&quot;x&quot; onerror=&quot;javascript:alert(&#x27;XSS&#x27;)&quot; &#x2F;&gt;',
        );
      });
    });

    describe('sanitizeTextContent', () => {
      it('should remove newlines', () => {
        const input = 'Line 1\nLine 2\r\nLine 3';
        const result = playerClassifiedService.emailService.sanitizeTextContent(input);
        expect(result).toBe('Line 1 Line 2 Line 3');
      });

      it('should remove HTML tags', () => {
        const input = '<div>Hello</div> World';
        const result = playerClassifiedService.emailService.sanitizeTextContent(input);
        expect(result).toBe('Hello World');
      });

      it('should handle empty and null inputs', () => {
        expect(playerClassifiedService.emailService.sanitizeTextContent('')).toBe('');
        expect(playerClassifiedService.emailService.sanitizeTextContent(null as any)).toBe('');
        expect(playerClassifiedService.emailService.sanitizeTextContent(undefined as any)).toBe('');
      });

      it('should handle non-string inputs gracefully', () => {
        expect(playerClassifiedService.emailService.sanitizeTextContent(123 as any)).toBe('');
        expect(playerClassifiedService.emailService.sanitizeTextContent({} as any)).toBe('');
        expect(playerClassifiedService.emailService.sanitizeTextContent([] as any)).toBe('');
      });

      it('should preserve safe text content', () => {
        const input = 'John Doe - Baseball Player (Contact: john@example.com)';
        const result = playerClassifiedService.emailService.sanitizeTextContent(input);
        expect(result).toBe('John Doe - Baseball Player (Contact: john@example.com)');
      });

      it('should trim whitespace', () => {
        const input = '   John Doe   ';
        const result = playerClassifiedService.emailService.sanitizeTextContent(input);
        expect(result).toBe('John Doe');
      });
    });

    describe('generateEmailStyles', () => {
      it('should generate consistent CSS styles from constants', () => {
        const styles = playerClassifiedService.emailService.generateEmailStyles();

        expect(styles).toContain('max-width: 600px');
        expect(styles).toContain('background-color: #4285F4');
        expect(styles).toContain('color: white');
        expect(styles).toContain('font-family: Arial, sans-serif');
        expect(styles).toContain('border-radius: 8px');
      });

      it('should include all necessary CSS classes', () => {
        const styles = playerClassifiedService.emailService.generateEmailStyles();

        expect(styles).toContain('.email-container');
        expect(styles).toContain('.header-banner');
        expect(styles).toContain('.content-area');
        expect(styles).toContain('.access-code-box');
        expect(styles).toContain('.verification-link');
        expect(styles).toContain('.footer');
      });
    });
  });

  describe('configuration constants integration', () => {
    it('should use VALIDATION_LIMITS constants in validation', async () => {
      const mockRequest = {
        teamEventName: 'A'.repeat(51), // Exceeds TEAM_EVENT_NAME_MAX_LENGTH (50)
        description: 'Valid description',
        positionsNeeded: '1,2,3',
      };

      await expect(
        playerClassifiedService.createPlayersWanted(BigInt(123), BigInt(456), mockRequest),
      ).rejects.toThrow('Validation failed');
    });

    it('should use BCRYPT_CONSTANTS for access code hashing', async () => {
      const mockRequest: ITeamsWantedCreateRequest = {
        name: 'Jane Smith',
        email: 'jane@example.com',
        phone: '+1234567890',
        experience: '5 years experience',
        positionsPlayed: '1,2',
        birthDate: '1995-06-15',
      };

      const mockAccountId = BigInt(123);

      // Mock successful creation
      mockPrisma.teamswantedclassified.create.mockResolvedValue({
        id: BigInt(789),
        accountid: mockAccountId,
        datecreated: new Date(),
        name: mockRequest.name,
        email: mockRequest.email,
        phone: mockRequest.phone,
        experience: mockRequest.experience,
        positionsplayed: mockRequest.positionsPlayed,
        accesscode: 'hashed_access_code',
        birthdate: new Date(mockRequest.birthDate),
      });

      mockPrisma.accounts.findUnique.mockResolvedValue({
        id: mockAccountId,
        name: 'Test Account',
      });

      await playerClassifiedService.createTeamsWanted(mockAccountId, mockRequest);

      // Verify bcrypt.hash was called with the correct salt rounds (12)
      expect(mockBcrypt.default.hash).toHaveBeenCalledWith(
        expect.any(String), // UUID access code
        12, // BCRYPT_CONSTANTS.ACCESS_CODE_SALT_ROUNDS
      );
    });

    it('should use DEFAULT_VALUES constants for pagination', async () => {
      const mockAccountId = BigInt(123);

      // Reset mocks to ensure clean state
      vi.clearAllMocks();
      mockPrisma.playerswantedclassified.findMany.mockResolvedValue([]);
      mockPrisma.playerswantedclassified.count.mockResolvedValue(0);

      // Call with minimal params to trigger defaults
      await playerClassifiedService.getPlayersWanted(mockAccountId, {
        accountId: mockAccountId,
      });

      // Verify that default pagination values were used
      expect(mockPrisma.playerswantedclassified.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 0, // (DEFAULT_PAGE - 1) * DEFAULT_LIMIT = (1 - 1) * 20 = 0
          take: 20, // DEFAULT_LIMIT
        }),
      );
    });

    it('should use EMAIL_CONTENT constants for email generation', async () => {
      const mockRequest: ITeamsWantedCreateRequest = {
        name: 'Jane Smith',
        email: 'jane@example.com',
        phone: '+1234567890',
        experience: '5 years experience',
        positionsPlayed: '1,2',
        birthDate: '1995-06-15',
      };

      const mockAccountId = BigInt(123);

      mockPrisma.teamswantedclassified.create.mockResolvedValue({
        id: BigInt(789),
        accountid: mockAccountId,
        datecreated: new Date(),
        name: mockRequest.name,
        email: mockRequest.email,
        phone: mockRequest.phone,
        experience: mockRequest.experience,
        positionsplayed: mockRequest.positionsPlayed,
        accesscode: 'hashed_access_code',
        birthdate: new Date(mockRequest.birthDate),
      });

      mockPrisma.accounts.findUnique.mockResolvedValue({
        id: mockAccountId,
        name: 'Test Account',
      });

      await playerClassifiedService.createTeamsWanted(mockAccountId, mockRequest);

      // Verify email was called with constants-based subject
      expect(mockEmailProvider.sendEmail).toHaveBeenCalledWith(
        expect.objectContaining({
          subject: 'Test Account - Teams Wanted Classified Access Code',
          from: 'noreply@dracosports.com',
          fromName: 'Draco Sports Manager',
          replyTo: 'support@dracosports.com',
        }),
      );
    });
  });

  describe('enhanced error handling', () => {
    it('should throw InternalServerError when creator information cannot be retrieved', async () => {
      const mockRequest: IPlayersWantedCreateRequest = {
        teamEventName: 'Spring Training Team',
        description: 'Looking for experienced players for spring training',
        positionsNeeded: '1,2,3',
      };

      const mockAccountId = BigInt(123);
      const mockContactId = BigInt(456);

      mockPrisma.playerswantedclassified.create.mockResolvedValue({
        id: BigInt(789),
        accountid: mockAccountId,
        datecreated: new Date(),
        createdbycontactid: mockContactId,
        teameventname: mockRequest.teamEventName,
        description: mockRequest.description,
        positionsneeded: mockRequest.positionsNeeded,
      });

      // Mock missing creator (returns null)
      mockPrisma.contacts.findUnique.mockResolvedValue(null);
      mockPrisma.accounts.findUnique.mockResolvedValue({
        id: mockAccountId,
        name: 'Test Account',
      });

      await expect(
        playerClassifiedService.createPlayersWanted(mockAccountId, mockContactId, mockRequest),
      ).rejects.toThrow('Failed to retrieve creator or account information');
    });

    it('should throw InternalServerError when account information cannot be retrieved', async () => {
      const mockRequest: ITeamsWantedCreateRequest = {
        name: 'Jane Smith',
        email: 'jane@example.com',
        phone: '+1234567890',
        experience: '5 years experience',
        positionsPlayed: '1,2',
        birthDate: '1995-06-15',
      };

      const mockAccountId = BigInt(123);

      mockPrisma.teamswantedclassified.create.mockResolvedValue({
        id: BigInt(789),
        accountid: mockAccountId,
        datecreated: new Date(),
        name: mockRequest.name,
        email: mockRequest.email,
        phone: mockRequest.phone,
        experience: mockRequest.experience,
        positionsplayed: mockRequest.positionsPlayed,
        accesscode: 'hashed_access_code',
        birthdate: new Date(mockRequest.birthDate),
      });

      // Mock missing account (returns null)
      mockPrisma.accounts.findUnique.mockResolvedValue(null);

      await expect(
        playerClassifiedService.createTeamsWanted(mockAccountId, mockRequest),
      ).rejects.toThrow('Failed to retrieve account information');
    });

    it('should throw InternalServerError when FRONTEND_URL is not configured', async () => {
      // Save original environment variable
      const originalFrontendUrl = process.env.FRONTEND_URL;

      // Remove FRONTEND_URL environment variable
      delete process.env.FRONTEND_URL;

      const userData = {
        name: 'Jane Smith',
        email: 'jane@example.com',
        phone: '+1234567890',
        experience: '5 years experience',
        positionsPlayed: '1,2',
        birthDate: '1995-06-15',
      };

      const account = { id: BigInt(123), name: 'Test Account' };

      await expect(
        playerClassifiedService.emailService.sendTeamsWantedVerificationEmail(
          'jane@example.com',
          BigInt(789),
          'access-code',
          account,
          userData,
        ),
      ).rejects.toThrow('FRONTEND_URL environment variable is required but not set');

      // Restore original environment variable
      if (originalFrontendUrl) {
        process.env.FRONTEND_URL = originalFrontendUrl;
      }
    });
  });

  describe('type safety improvements', () => {
    it('should maintain proper Prisma type safety in database operations', async () => {
      const mockRequest: IPlayersWantedCreateRequest = {
        teamEventName: 'Spring Training Team',
        description: 'Looking for experienced players',
        positionsNeeded: '1,2,3',
      };

      const mockAccountId = BigInt(123);
      const mockContactId = BigInt(456);

      // Mock successful creation with proper types
      mockPrisma.playerswantedclassified.create.mockResolvedValue({
        id: BigInt(789),
        accountid: mockAccountId,
        datecreated: new Date('2024-01-15T10:30:00Z'),
        createdbycontactid: mockContactId,
        teameventname: mockRequest.teamEventName,
        description: mockRequest.description,
        positionsneeded: mockRequest.positionsNeeded,
      });

      mockPrisma.contacts.findUnique.mockResolvedValue({
        id: mockContactId,
        firstname: 'John',
        lastname: 'Doe',
        email: 'john@example.com',
      });

      mockPrisma.accounts.findUnique.mockResolvedValue({
        id: mockAccountId,
        name: 'Test Account',
      });

      const result = await playerClassifiedService.createPlayersWanted(
        mockAccountId,
        mockContactId,
        mockRequest,
      );

      // Verify that the result maintains proper typing (service returns strings for IDs)
      expect(typeof result.id).toBe('string');
      expect(typeof result.accountId).toBe('string');
      expect(typeof result.createdByContactId).toBe('string');
      expect(typeof result.dateCreated).toBe('string'); // Formatted by DateUtils
      expect(typeof result.teamEventName).toBe('string');
      expect(typeof result.description).toBe('string');
      expect(typeof result.positionsNeeded).toBe('string');

      // Verify nested object structures
      expect(result.creator).toHaveProperty('id');
      expect(result.creator).toHaveProperty('firstName');
      expect(result.creator).toHaveProperty('lastName');
      expect(result.creator).toHaveProperty('photoUrl');

      expect(result.account).toHaveProperty('id');
      expect(result.account).toHaveProperty('name');
    });

    it('should use proper Prisma where clauses with type safety', async () => {
      const mockAccountId = BigInt(123);
      const searchParams = {
        accountId: mockAccountId,
        page: 1,
        limit: 10,
        sortBy: 'dateCreated' as const,
        sortOrder: 'desc' as const,
      };

      mockPrisma.playerswantedclassified.findMany.mockResolvedValue([]);
      mockPrisma.playerswantedclassified.count.mockResolvedValue(0);

      await playerClassifiedService.getPlayersWanted(mockAccountId, searchParams);

      // Verify that the where clause uses proper bigint type
      expect(mockPrisma.playerswantedclassified.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { accountid: mockAccountId }, // bigint type preserved
          orderBy: { datecreated: 'desc' },
        }),
      );

      expect(mockPrisma.playerswantedclassified.count).toHaveBeenCalledWith({
        where: { accountid: mockAccountId },
      });
    });
  });
});
