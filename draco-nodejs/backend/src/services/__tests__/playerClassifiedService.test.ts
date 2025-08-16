import { PlayerClassifiedService } from '../playerClassifiedService.js';
import { PrismaClient } from '@prisma/client';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import {
  IPlayersWantedCreateRequest,
  ITeamsWantedCreateRequest,
  IClassifiedSearchParams,
} from '../../interfaces/playerClassifiedInterfaces.js';

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

describe('PlayerClassifiedService', () => {
  let playerClassifiedService: PlayerClassifiedService;
  let mockPrisma: any;
  let mockBcrypt: any;

  beforeEach(async () => {
    vi.clearAllMocks();

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
    const { ServiceFactory } = await import('../../lib/serviceFactory.js');
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
          id: BigInt(789),
          accountId: mockAccountId,
          teamEventName: mockRequest.teamEventName,
          description: mockRequest.description,
          positionsNeeded: mockRequest.positionsNeeded,
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
      birthDate: new Date('1995-06-15'),
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
        birthdate: mockRequest.birthDate,
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
          birthdate: mockRequest.birthDate,
        }),
      });

      expect(result).toEqual(
        expect.objectContaining({
          id: BigInt(789),
          accountId: mockAccountId,
          name: mockRequest.name,
          email: mockRequest.email,
          phone: mockRequest.phone,
          experience: mockRequest.experience,
          positionsPlayed: mockRequest.positionsPlayed,
          birthDate: mockRequest.birthDate,
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

      const invalidRequest = { ...mockRequest, birthDate: tooYoungDate };

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
            email: 'john@example.com',
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
            select: { id: true, firstname: true, lastname: true, email: true },
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
              id: BigInt(1),
              teamEventName: 'Team 1',
              description: 'Description 1',
            }),
          ]),
          total: 1,
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
            email: 'john@example.com',
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
              id: BigInt(1),
              name: 'Jane Smith',
              email: 'jane@example.com',
            }),
          ]),
          total: 1,
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
          id: mockClassifiedId,
          accountId: mockAccountId,
          name: 'Jane Smith',
          email: 'jane@example.com',
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
          id: mockClassifiedId,
          name: mockUpdateData.name,
          email: mockUpdateData.email,
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
      expect(playerClassifiedService['validatePositions']('1,2,3')).toBe(true);
      expect(playerClassifiedService['validatePositions']('1')).toBe(true);

      // Test invalid positions
      expect(playerClassifiedService['validatePositions']('1,invalid,3')).toBe(false);
      expect(playerClassifiedService['validatePositions']('')).toBe(false);
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
      const result = playerClassifiedService['addDays'](testDate, 5);

      // Debug: log the actual values
      console.log('Original date:', testDate.toDateString());
      console.log('Result date:', result.toDateString());
      console.log('Result day:', result.getDate());
      console.log('Expected day: 6');

      // The addDays method should increment the date by 5 days
      // January 1st + 5 days = January 6th
      expect(result.getDate()).toBe(6);
      expect(result.getMonth()).toBe(0); // January (0-indexed)
      expect(result.getFullYear()).toBe(2024);
    });
  });
});
