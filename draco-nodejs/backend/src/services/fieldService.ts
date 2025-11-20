import { ValidationError, NotFoundError } from '../utils/customErrors.js';
import { RepositoryFactory } from '../repositories/repositoryFactory.js';
import { FieldResponseFormatter } from '../responseFormatters/index.js';
import { PaginationHelper } from '../utils/pagination.js';
import { FieldType, FieldsType, UpsertFieldType, PagingType } from '@draco/shared-schemas';
import { Prisma } from '#prisma/client';

const FIELD_SORT_FIELDS = [
  'name',
  'address',
  'city',
  'state',
  'shortname',
  'zipcode',
  'rainoutnumber',
  'latitude',
  'longitude',
  'id',
];

export class FieldService {
  private readonly fieldRepository = RepositoryFactory.getFieldRepository();

  private sanitizeOptionalString(value: string | null | undefined): string {
    if (typeof value !== 'string') {
      return '';
    }

    const trimmed = value.trim();

    return trimmed.length > 0 ? trimmed : '';
  }

  private sanitizeCoordinate(value: string | null | undefined): string {
    if (typeof value !== 'string') {
      return '';
    }

    const trimmed = value.trim();

    if (trimmed.length === 0) {
      return '';
    }

    const numeric = Number.parseFloat(trimmed);

    if (Number.isNaN(numeric)) {
      throw new ValidationError('Invalid coordinate value provided');
    }

    return numeric.toString();
  }

  async listFields(accountId: bigint, paging: PagingType): Promise<FieldsType> {
    const sortBy = PaginationHelper.validateSortField(paging.sortBy, FIELD_SORT_FIELDS);
    const orderBy = PaginationHelper.getPrismaOrderBy(sortBy, paging.sortOrder, {
      name: 'asc',
    }) as Prisma.availablefieldsOrderByWithRelationInput;

    const [fields, total] = await Promise.all([
      this.fieldRepository.findByAccount(accountId, {
        skip: paging.skip,
        take: paging.limit,
        orderBy,
      }),
      this.fieldRepository.countByAccount(accountId),
    ]);

    return FieldResponseFormatter.formatPagedFields(fields, paging.page, paging.limit, total);
  }

  async createField(accountId: bigint, fieldData: UpsertFieldType): Promise<FieldType> {
    const name = fieldData.name.trim();
    const existingField = await this.fieldRepository.findByName(accountId, name);

    if (existingField) {
      throw new ValidationError('A field with this name already exists for this account');
    }

    const shortName = fieldData.shortName.trim();
    const address = this.sanitizeOptionalString(fieldData.address);
    const city = this.sanitizeOptionalString(fieldData.city);
    const state = this.sanitizeOptionalString(fieldData.state);
    const zip = this.sanitizeOptionalString(fieldData.zip);
    const comment = this.sanitizeOptionalString(fieldData.comment);
    const directions = this.sanitizeOptionalString(fieldData.directions);
    const rainoutNumber = this.sanitizeOptionalString(fieldData.rainoutNumber);
    const latitude = this.sanitizeCoordinate(fieldData.latitude);
    const longitude = this.sanitizeCoordinate(fieldData.longitude);

    const newField = await this.fieldRepository.create({
      name,
      shortname: shortName.substring(0, 5),
      comment,
      address,
      city,
      state,
      zipcode: zip,
      directions,
      rainoutnumber: rainoutNumber,
      latitude,
      longitude,
      accounts: {
        connect: { id: accountId },
      },
    });

    return FieldResponseFormatter.formatField(newField);
  }

  async updateField(
    accountId: bigint,
    fieldId: bigint,
    fieldData: UpsertFieldType,
  ): Promise<FieldType> {
    const field = await this.fieldRepository.findAccountField(accountId, fieldId);

    if (!field) {
      throw new NotFoundError('Field not found');
    }

    const name = fieldData.name.trim();
    const duplicateField = await this.fieldRepository.findByNameExcludingId(
      accountId,
      name,
      fieldId,
    );

    if (duplicateField) {
      throw new ValidationError('A field with this name already exists for this account');
    }

    const shortName = fieldData.shortName.trim();
    const address = this.sanitizeOptionalString(fieldData.address);
    const city = this.sanitizeOptionalString(fieldData.city);
    const state = this.sanitizeOptionalString(fieldData.state);
    const zip = this.sanitizeOptionalString(fieldData.zip);
    const comment = this.sanitizeOptionalString(fieldData.comment);
    const directions = this.sanitizeOptionalString(fieldData.directions);
    const rainoutNumber = this.sanitizeOptionalString(fieldData.rainoutNumber);
    const latitude = this.sanitizeCoordinate(fieldData.latitude);
    const longitude = this.sanitizeCoordinate(fieldData.longitude);

    const updatedField = await this.fieldRepository.update(fieldId, {
      name,
      shortname: shortName.substring(0, 5),
      address,
      city,
      state,
      zipcode: zip,
      comment,
      directions,
      rainoutnumber: rainoutNumber,
      latitude,
      longitude,
    });

    return FieldResponseFormatter.formatField(updatedField);
  }

  async deleteField(accountId: bigint, fieldId: bigint): Promise<FieldType> {
    const field = await this.fieldRepository.findAccountField(accountId, fieldId);

    if (!field) {
      throw new NotFoundError('Field not found');
    }

    const fieldInUse = await this.fieldRepository.isFieldInUse(fieldId);

    if (fieldInUse) {
      throw new ValidationError('Cannot delete field because it is being used in scheduled games');
    }

    await this.fieldRepository.delete(fieldId);

    return FieldResponseFormatter.formatField(field);
  }
}
