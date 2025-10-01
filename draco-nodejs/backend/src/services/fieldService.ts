import { ValidationError, NotFoundError } from '../utils/customErrors.js';
import { RepositoryFactory } from '../repositories/repositoryFactory.js';
import { FieldResponseFormatter } from '../responseFormatters/index.js';
import { PaginationHelper } from '../utils/pagination.js';
import { FieldType, FieldsType, UpsertFieldType, PagingType } from '@draco/shared-schemas';
import { Prisma } from '@prisma/client';

const FIELD_SORT_FIELDS = ['name', 'address', 'id'];

export class FieldService {
  private readonly fieldRepository = RepositoryFactory.getFieldRepository();

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

    const address =
      typeof fieldData.address === 'string' && fieldData.address.length > 0
        ? fieldData.address
        : '';

    const newField = await this.fieldRepository.create({
      name,
      shortname: name.substring(0, 5),
      comment: '',
      address,
      city: '',
      state: '',
      zipcode: '',
      directions: '',
      rainoutnumber: '',
      latitude: '',
      longitude: '',
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

    const address =
      typeof fieldData.address === 'string' && fieldData.address.length > 0
        ? fieldData.address
        : null;

    const updatedField = await this.fieldRepository.update(fieldId, {
      name,
      address: address || '',
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
