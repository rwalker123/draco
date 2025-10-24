import { memberbusiness } from '@prisma/client';
import {
  CreateMemberBusinessType,
  MemberBusinessType,
  MEMBER_BUSINESS_ADDRESS_MAX_LENGTH,
  MEMBER_BUSINESS_DESCRIPTION_MAX_LENGTH,
  MEMBER_BUSINESS_EMAIL_MAX_LENGTH,
  MEMBER_BUSINESS_NAME_MAX_LENGTH,
  MEMBER_BUSINESS_PHONE_MAX_LENGTH,
  MEMBER_BUSINESS_WEBSITE_MAX_LENGTH,
} from '@draco/shared-schemas';
import {
  RepositoryFactory,
  IMemberBusinessRepository,
  IContactRepository,
  dbMemberBusiness,
} from '../repositories/index.js';
import { MemberBusinessResponseFormatter } from '../responseFormatters/index.js';
import { NotFoundError, ValidationError } from '../utils/customErrors.js';

type ListMemberBusinessOptions = {
  contactId?: bigint;
};

export class MemberBusinessService {
  private memberBusinessRepository: IMemberBusinessRepository;
  private contactRepository: IContactRepository;

  constructor() {
    this.memberBusinessRepository = RepositoryFactory.getMemberBusinessRepository();
    this.contactRepository = RepositoryFactory.getContactRepository();
  }

  async listMemberBusinesses(
    accountId: bigint,
    options: ListMemberBusinessOptions = {},
  ): Promise<MemberBusinessType[]> {
    if (options.contactId) {
      await this.ensureContact(accountId, options.contactId);
    }

    const memberBusinesses = await this.memberBusinessRepository.listByAccount(
      accountId,
      options.contactId,
    );

    return MemberBusinessResponseFormatter.formatMany(memberBusinesses);
  }

  async getMemberBusiness(
    accountId: bigint,
    memberBusinessId: bigint,
  ): Promise<MemberBusinessType> {
    const record = await this.requireMemberBusiness(accountId, memberBusinessId);
    return MemberBusinessResponseFormatter.format(record);
  }

  async createMemberBusiness(
    accountId: bigint,
    payload: CreateMemberBusinessType,
  ): Promise<MemberBusinessType> {
    const contactId = this.parseContactId(payload.contactId);
    await this.ensureContact(accountId, contactId);

    const writeData = this.buildWriteData(payload, contactId);
    const created = await this.memberBusinessRepository.create(writeData);
    const record = await this.memberBusinessRepository.findByIdForAccount(created.id, accountId);

    if (!record) {
      throw new NotFoundError('Member business not found');
    }

    return MemberBusinessResponseFormatter.format(record);
  }

  async updateMemberBusiness(
    accountId: bigint,
    memberBusinessId: bigint,
    payload: CreateMemberBusinessType,
  ): Promise<MemberBusinessType> {
    const contactId = this.parseContactId(payload.contactId);

    await this.ensureContact(accountId, contactId);
    await this.requireMemberBusiness(accountId, memberBusinessId);

    const writeData = this.buildWriteData(payload, contactId);
    await this.memberBusinessRepository.update(memberBusinessId, writeData);

    const updated = await this.memberBusinessRepository.findByIdForAccount(
      memberBusinessId,
      accountId,
    );

    if (!updated) {
      throw new NotFoundError('Member business not found');
    }

    return MemberBusinessResponseFormatter.format(updated);
  }

  async deleteMemberBusiness(accountId: bigint, memberBusinessId: bigint): Promise<void> {
    await this.requireMemberBusiness(accountId, memberBusinessId);
    await this.memberBusinessRepository.delete(memberBusinessId);
  }

  private async requireMemberBusiness(
    accountId: bigint,
    memberBusinessId: bigint,
  ): Promise<dbMemberBusiness> {
    const record = await this.memberBusinessRepository.findByIdForAccount(
      memberBusinessId,
      accountId,
    );

    if (!record) {
      throw new NotFoundError('Member business not found');
    }

    return record;
  }

  private async ensureContact(accountId: bigint, contactId: bigint): Promise<void> {
    const contact = await this.contactRepository.findContactInAccount(contactId, accountId);
    if (!contact) {
      throw new NotFoundError('Contact not found');
    }
  }

  private parseContactId(rawContactId: string): bigint {
    const trimmed = rawContactId?.trim();
    if (!trimmed) {
      throw new ValidationError('contactId is required');
    }

    try {
      return BigInt(trimmed);
    } catch (_error) {
      throw new ValidationError('contactId must be a valid identifier');
    }
  }

  private buildWriteData(
    payload: CreateMemberBusinessType,
    contactId: bigint,
  ): Partial<memberbusiness> {
    const name = this.sanitizeName(payload.name);

    return {
      contactid: contactId,
      name,
      streetaddress: this.sanitizeOptional(payload.streetAddress, {
        maxLength: MEMBER_BUSINESS_ADDRESS_MAX_LENGTH,
        fieldLabel: 'streetAddress',
      }),
      citystatezip: this.sanitizeOptional(payload.cityStateZip, {
        maxLength: MEMBER_BUSINESS_ADDRESS_MAX_LENGTH,
        fieldLabel: 'cityStateZip',
      }),
      description: this.sanitizeOptional(payload.description, {
        maxLength: MEMBER_BUSINESS_DESCRIPTION_MAX_LENGTH,
        fieldLabel: 'description',
      }),
      email: this.sanitizeOptional(payload.email, {
        maxLength: MEMBER_BUSINESS_EMAIL_MAX_LENGTH,
        fieldLabel: 'email',
      }),
      phone: this.sanitizeOptional(payload.phone, {
        maxLength: MEMBER_BUSINESS_PHONE_MAX_LENGTH,
        fieldLabel: 'phone',
      }),
      fax: this.sanitizeOptional(payload.fax, {
        maxLength: MEMBER_BUSINESS_PHONE_MAX_LENGTH,
        fieldLabel: 'fax',
      }),
      website: this.sanitizeOptional(payload.website, {
        maxLength: MEMBER_BUSINESS_WEBSITE_MAX_LENGTH,
        fieldLabel: 'website',
      }),
    } satisfies Partial<memberbusiness>;
  }

  private sanitizeName(value: string): string {
    const trimmed = value?.trim();
    if (!trimmed) {
      throw new ValidationError('name is required');
    }

    if (trimmed.length > MEMBER_BUSINESS_NAME_MAX_LENGTH) {
      throw new ValidationError(
        `name must be ${MEMBER_BUSINESS_NAME_MAX_LENGTH} characters or fewer`,
      );
    }

    return trimmed;
  }

  private sanitizeOptional(
    value: string | undefined,
    options?: { maxLength?: number; fieldLabel?: string },
  ): string {
    const trimmed = value?.trim();
    if (!trimmed) {
      return '';
    }

    if (options?.maxLength && trimmed.length > options.maxLength) {
      const label = options.fieldLabel ?? 'Field';
      throw new ValidationError(`${label} must be ${options.maxLength} characters or fewer`);
    }

    return trimmed;
  }
}
