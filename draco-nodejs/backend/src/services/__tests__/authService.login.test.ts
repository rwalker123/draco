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
      securitystamp: 'test-stamp',
    };

    mockUserRepository.findByUsername.mockResolvedValue(user);
    compareMock.mockResolvedValue(true);

    await authService.login({ userName: 'demo-user', password: 'secret' }); // pragma: allowlist secret

    expect(mockUserRepository.updateUser).toHaveBeenCalledWith(user.id, {
      accessfailedcount: 0,
    });
    expect(typeof mockUserRepository.updateUser.mock.calls[0][0]).toBe('string');
  });

  it('normalizes username to lowercase for case-insensitive login', async () => {
    const authService = new AuthService();

    const user = {
      id: '263e58de-f34b-411a-97b4-a8656bc46b01',
      username: 'test@example.com',
      passwordhash: 'hashed-password', // pragma: allowlist secret
      accessfailedcount: 0,
      lockoutenabled: false,
      lockoutenddateutc: null,
      securitystamp: 'test-stamp',
    };

    mockUserRepository.findByUsername.mockResolvedValue(user);
    compareMock.mockResolvedValue(true);

    await authService.login({ userName: 'TEST@EXAMPLE.COM', password: 'secret' }); // pragma: allowlist secret

    expect(mockUserRepository.findByUsername).toHaveBeenCalledWith('test@example.com');
  });

  it('generates token with 24h expiry by default', async () => {
    const authService = new AuthService();

    const user = {
      id: '263e58de-f34b-411a-97b4-a8656bc46b01',
      username: 'test@example.com',
      passwordhash: 'hashed-password', // pragma: allowlist secret
      accessfailedcount: 0,
      lockoutenabled: false,
      lockoutenddateutc: null,
      securitystamp: 'test-stamp',
    };

    mockUserRepository.findByUsername.mockResolvedValue(user);
    compareMock.mockResolvedValue(true);

    await authService.login({ userName: 'test@example.com', password: 'secret' }); // pragma: allowlist secret

    expect(signMock).toHaveBeenCalledWith(
      { userId: user.id, username: user.username, securityStamp: 'test-stamp' },
      expect.any(String),
      { expiresIn: '24h' },
    );
  });

  it('generates token with 365d expiry when rememberMe is true', async () => {
    const authService = new AuthService();

    const user = {
      id: '263e58de-f34b-411a-97b4-a8656bc46b01',
      username: 'test@example.com',
      passwordhash: 'hashed-password', // pragma: allowlist secret
      accessfailedcount: 0,
      lockoutenabled: false,
      lockoutenddateutc: null,
      securitystamp: 'test-stamp',
    };

    mockUserRepository.findByUsername.mockResolvedValue(user);
    compareMock.mockResolvedValue(true);

    await authService.login({ userName: 'test@example.com', password: 'secret', rememberMe: true }); // pragma: allowlist secret

    expect(signMock).toHaveBeenCalledWith(
      { userId: user.id, username: user.username, securityStamp: 'test-stamp', rememberMe: true },
      expect.any(String),
      { expiresIn: '30d' },
    );
  });

  it('generates token with 24h expiry when rememberMe is false', async () => {
    const authService = new AuthService();

    const user = {
      id: '263e58de-f34b-411a-97b4-a8656bc46b01',
      username: 'test@example.com',
      passwordhash: 'hashed-password', // pragma: allowlist secret
      accessfailedcount: 0,
      lockoutenabled: false,
      lockoutenddateutc: null,
      securitystamp: 'test-stamp',
    };

    mockUserRepository.findByUsername.mockResolvedValue(user);
    compareMock.mockResolvedValue(true);

    await authService.login({
      userName: 'test@example.com',
      password: 'secret',
      rememberMe: false,
    }); // pragma: allowlist secret

    expect(signMock).toHaveBeenCalledWith(
      { userId: user.id, username: user.username, securityStamp: 'test-stamp' },
      expect.any(String),
      { expiresIn: '24h' },
    );
  });

  it('increments failed login count on wrong password', async () => {
    const authService = new AuthService();

    const user = {
      id: '263e58de-f34b-411a-97b4-a8656bc46b01',
      username: 'test@example.com',
      passwordhash: 'hashed-password', // pragma: allowlist secret
      accessfailedcount: 2,
      lockoutenabled: true,
      lockoutenddateutc: null,
    };

    mockUserRepository.findByUsername.mockResolvedValue(user);
    mockUserRepository.findByUserId.mockResolvedValue(user);
    compareMock.mockResolvedValue(false);

    await expect(
      authService.login({ userName: 'test@example.com', password: 'wrong' }), // pragma: allowlist secret
    ).rejects.toThrow('Invalid username or password');

    expect(mockUserRepository.updateUser).toHaveBeenCalledWith(user.id, {
      accessfailedcount: 3,
    });
  });

  it('locks account after 5 failed login attempts', async () => {
    const authService = new AuthService();

    const user = {
      id: '263e58de-f34b-411a-97b4-a8656bc46b01',
      username: 'test@example.com',
      passwordhash: 'hashed-password', // pragma: allowlist secret
      accessfailedcount: 4,
      lockoutenabled: true,
      lockoutenddateutc: null,
    };

    mockUserRepository.findByUsername.mockResolvedValue(user);
    mockUserRepository.findByUserId.mockResolvedValue(user);
    compareMock.mockResolvedValue(false);

    await expect(
      authService.login({ userName: 'test@example.com', password: 'wrong' }), // pragma: allowlist secret
    ).rejects.toThrow('Invalid username or password');

    expect(mockUserRepository.updateUser).toHaveBeenCalledWith(user.id, {
      accessfailedcount: 0,
      lockoutenddateutc: expect.any(Date),
    });

    const lockoutDate = mockUserRepository.updateUser.mock.calls[0][1].lockoutenddateutc as Date;
    const expectedMinTime = new Date(Date.now() + 14 * 60 * 1000);
    const expectedMaxTime = new Date(Date.now() + 16 * 60 * 1000);
    expect(lockoutDate.getTime()).toBeGreaterThan(expectedMinTime.getTime());
    expect(lockoutDate.getTime()).toBeLessThan(expectedMaxTime.getTime());
  });

  it('rejects login for a locked-out user', async () => {
    const authService = new AuthService();

    const futureDate = new Date();
    futureDate.setMinutes(futureDate.getMinutes() + 10);

    const user = {
      id: '263e58de-f34b-411a-97b4-a8656bc46b01',
      username: 'test@example.com',
      passwordhash: 'hashed-password', // pragma: allowlist secret
      accessfailedcount: 0,
      lockoutenabled: true,
      lockoutenddateutc: futureDate,
    };

    mockUserRepository.findByUsername.mockResolvedValue(user);

    await expect(
      authService.login({ userName: 'test@example.com', password: 'secret' }), // pragma: allowlist secret
    ).rejects.toThrow('Account is temporarily locked. Please try again later.');

    expect(compareMock).not.toHaveBeenCalled();
  });

  it('does not trigger lockout when lockoutenabled is false', async () => {
    const authService = new AuthService();

    const user = {
      id: '263e58de-f34b-411a-97b4-a8656bc46b01',
      username: 'test@example.com',
      passwordhash: 'hashed-password', // pragma: allowlist secret
      accessfailedcount: 4,
      lockoutenabled: false,
      lockoutenddateutc: null,
    };

    mockUserRepository.findByUsername.mockResolvedValue(user);
    mockUserRepository.findByUserId.mockResolvedValue(user);
    compareMock.mockResolvedValue(false);

    await expect(
      authService.login({ userName: 'test@example.com', password: 'wrong' }), // pragma: allowlist secret
    ).rejects.toThrow('Invalid username or password');

    expect(mockUserRepository.updateUser).toHaveBeenCalledWith(user.id, {
      accessfailedcount: 5,
    });
  });
});
