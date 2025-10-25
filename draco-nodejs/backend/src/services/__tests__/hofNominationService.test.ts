import { describe, it, expect, beforeEach, afterEach, vi, Mocked } from 'vitest';
import { HofNominationService } from '../hofNominationService.js';
import { RepositoryFactory } from '../../repositories/repositoryFactory.js';
import { IHofNominationRepository } from '../../repositories/interfaces/IHofNominationRepository.js';
import { IHofNominationSetupRepository } from '../../repositories/interfaces/IHofNominationSetupRepository.js';
import { ConflictError, NotFoundError } from '../../utils/customErrors.js';

describe('HofNominationService', () => {
  let nominationRepositoryMock: Mocked<IHofNominationRepository>;
  let setupRepositoryMock: Mocked<IHofNominationSetupRepository>;
  let service: HofNominationService;

  beforeEach(() => {
    nominationRepositoryMock = {
      create: vi.fn(),
      list: vi.fn(),
      delete: vi.fn(),
    } as Mocked<IHofNominationRepository>;

    setupRepositoryMock = {
      get: vi.fn(),
      upsert: vi.fn(),
    } as Mocked<IHofNominationSetupRepository>;

    vi.spyOn(RepositoryFactory, 'getHofNominationRepository').mockReturnValue(
      nominationRepositoryMock,
    );
    vi.spyOn(RepositoryFactory, 'getHofNominationSetupRepository').mockReturnValue(
      setupRepositoryMock,
    );

    service = new HofNominationService();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('throws conflict error when nominations are disabled', async () => {
    setupRepositoryMock.get.mockResolvedValue(null);

    await expect(
      service.submitNomination(1n, {
        nominator: 'Alice',
        phoneNumber: '(555) 111-2222',
        email: 'alice@example.com',
        nominee: 'Bob',
        reason: 'Great player',
      }),
    ).rejects.toThrow(ConflictError);

    expect(nominationRepositoryMock.create).not.toHaveBeenCalled();
  });

  it('deletes a nomination or throws when not found', async () => {
    nominationRepositoryMock.delete.mockResolvedValue(false);

    await expect(service.deleteNomination(1n, 5n)).rejects.toThrow(NotFoundError);

    nominationRepositoryMock.delete.mockResolvedValue(true);
    await expect(service.deleteNomination(1n, 5n)).resolves.toBeUndefined();
  });
});
