import { describe, it, expect, beforeEach, afterEach, vi, Mocked } from 'vitest';
import validator from 'validator';
import { HallOfFameService } from '../hallOfFameService.js';
import { RepositoryFactory } from '../../repositories/repositoryFactory.js';
import { IHallOfFameRepository } from '../../repositories/interfaces/IHallOfFameRepository.js';
import { IContactRepository } from '../../repositories/interfaces/IContactRepository.js';
import { ValidationError } from '../../utils/customErrors.js';

describe('HallOfFameService', () => {
  let hallRepositoryMock: Mocked<IHallOfFameRepository>;
  let contactRepositoryMock: Mocked<IContactRepository>;
  let service: HallOfFameService;

  beforeEach(() => {
    hallRepositoryMock = {
      listClasses: vi.fn(),
      listMembersByYear: vi.fn(),
      getRandomMember: vi.fn(),
      findMemberById: vi.fn(),
      findMemberByContact: vi.fn(),
      createMember: vi.fn(),
      updateMember: vi.fn(),
      deleteMember: vi.fn(),
      findEligibleContacts: vi.fn(),
    } as Mocked<IHallOfFameRepository>;

    contactRepositoryMock = {
      findContactInAccount: vi.fn(),
    } as unknown as Mocked<IContactRepository>;

    vi.spyOn(RepositoryFactory, 'getHallOfFameRepository').mockReturnValue(hallRepositoryMock);
    vi.spyOn(RepositoryFactory, 'getContactRepository').mockReturnValue(contactRepositoryMock);

    service = new HallOfFameService();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('sanitizes biography HTML when creating a member', async () => {
    contactRepositoryMock.findContactInAccount.mockResolvedValue({
      id: 2n,
      firstname: 'Jane',
      lastname: 'Doe',
      middlename: 'A',
      email: null,
      phone1: null,
      phone2: null,
      phone3: null,
      streetaddress: null,
      city: null,
      state: null,
      zip: null,
      dateofbirth: new Date('2000-01-01'),
      creatoraccountid: 1n,
      userid: null,
    });
    hallRepositoryMock.findMemberByContact.mockResolvedValue(null);

    const rawBiography = '<script>alert("xss")</script><p>Bio</p>';

    hallRepositoryMock.createMember.mockImplementation(async (_accountId: bigint, data) => {
      return {
        id: 10n,
        accountid: 1n,
        contactid: data.contactId,
        yearinducted: data.yearInducted,
        bio: data.biographyHtml ?? '',
        contacts: {
          id: 2n,
          firstname: 'Jane',
          lastname: 'Doe',
          middlename: 'A',
          creatoraccountid: 1n,
        },
      };
    });

    const result = await service.createMember(1n, {
      contactId: '2',
      yearInducted: 2024,
      biographyHtml: rawBiography,
    });

    expect(hallRepositoryMock.createMember).toHaveBeenCalledWith(1n, {
      contactId: 2n,
      yearInducted: 2024,
      biographyHtml: rawBiography,
    });
    expect(result.biographyHtml).toBe(validator.escape(rawBiography));
  });

  it('throws when contact is already inducted', async () => {
    contactRepositoryMock.findContactInAccount.mockResolvedValue({
      id: 2n,
      firstname: 'Jane',
      lastname: 'Doe',
      middlename: 'A',
      email: null,
      phone1: null,
      phone2: null,
      phone3: null,
      streetaddress: null,
      city: null,
      state: null,
      zip: null,
      dateofbirth: new Date('2000-01-01'),
      creatoraccountid: 1n,
      userid: null,
    });
    hallRepositoryMock.findMemberByContact.mockResolvedValue({
      id: 5n,
      accountid: 1n,
      contactid: 2n,
      yearinducted: 2020,
      bio: '',
      contacts: {
        id: 2n,
        firstname: 'Jane',
        lastname: 'Doe',
        middlename: 'A',
        creatoraccountid: 1n,
      },
    });

    await expect(
      service.createMember(1n, {
        contactId: '2',
        yearInducted: 2024,
        biographyHtml: '<p>Bio</p>',
      }),
    ).rejects.toThrow(ValidationError);
  });
});
