import { beforeEach, describe, expect, it, vi } from 'vitest';

const {
  compareMock,
  signMock,
  mockUserRepository,
  mockContactService,
  mockEmailService,
  repoFactoryMock,
  serviceFactoryMock,
} = vi.hoisted(() => {
  const compare = vi.fn();
  const sign = vi.fn(() => 'mock-token');
  const userRepo = {
    findByUsername: vi.fn(),
    findByUserId: vi.fn(),
    updateUser: vi.fn(),
  };
  const contactService = {
    getContactByUserId: vi.fn(),
  };
  const emailService = {
    sendGeneralWelcomeEmail: vi.fn(),
  };

  return {
    compareMock: compare,
    signMock: sign,
    mockUserRepository: userRepo,
    mockContactService: contactService,
    mockEmailService: emailService,
    repoFactoryMock: {
      getUserRepository: vi.fn(() => userRepo),
    },
    serviceFactoryMock: {
      getContactService: vi.fn(() => contactService),
      getEmailService: vi.fn(() => emailService),
    },
  };
});

vi.mock('bcrypt', () => ({
  default: {
    compare: compareMock,
    hash: vi.fn(),
  },
}));

vi.mock('jsonwebtoken', () => ({
  default: {
    sign: signMock,
    verify: vi.fn(),
  },
}));

vi.mock('../../repositories/index.js', () => ({
  RepositoryFactory: repoFactoryMock,
}));

vi.mock('../serviceFactory.js', () => ({
  ServiceFactory: serviceFactoryMock,
}));

import { AuthService } from '../authService.js';

describe('AuthService.login', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    compareMock.mockReset();
    signMock.mockClear();
    mockUserRepository.findByUsername.mockReset();
    mockUserRepository.findByUserId.mockReset();
    mockUserRepository.updateUser.mockReset();
    mockContactService.getContactByUserId.mockReset();
    mockEmailService.sendGeneralWelcomeEmail.mockReset();

    process.env.JWT_SECRET = 'test-secret'; // pragma: allowlist secret
  });

  it('resets failed login count using the string user id', async () => {
    const authService = new AuthService();

    const user = {
      id: '263e58de-f34b-411a-97b4-a8656bc46b01',
      username: 'demo-user',
      passwordhash: 'hashed-password', // pragma: allowlist secret
      accessfailedcount: 2,
      lockoutenabled: false,
      lockoutenddateutc: null,
    };

    mockUserRepository.findByUsername.mockResolvedValue(user);
    compareMock.mockResolvedValue(true);

    await authService.login({ userName: 'demo-user', password: 'secret' }); // pragma: allowlist secret

    expect(mockUserRepository.updateUser).toHaveBeenCalledWith(user.id, {
      accessfailedcount: 0,
    });
    expect(typeof mockUserRepository.updateUser.mock.calls[0][0]).toBe('string');
  });
});
