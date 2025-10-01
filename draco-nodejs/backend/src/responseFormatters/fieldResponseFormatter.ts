import { FieldsType, FieldType, PaginationWithTotalType } from '@draco/shared-schemas';
import { dbAvailableField } from '../repositories/types/dbTypes.js';

export class FieldResponseFormatter {
  private static buildPagination(
    page: number,
    limit: number,
    total: number,
  ): PaginationWithTotalType {
    const totalPages = Math.ceil(total / limit);

    return {
      page,
      limit,
      total,
      hasNext: page < totalPages,
      hasPrev: page > 1,
    };
  }

  static formatField(field: dbAvailableField): FieldType {
    return {
      id: field.id.toString(),
      name: field.name,
      address: field.address ?? null,
      city: field.city ?? null,
      state: field.state ?? null,
      zip: field.zipcode ?? null,
      shortName: field.shortname,
    };
  }

  static formatFields(fields: dbAvailableField[]): FieldType[] {
    return fields.map((field) => this.formatField(field));
  }

  static formatPagedFields(
    fields: dbAvailableField[],
    page: number,
    limit: number,
    total: number,
  ): FieldsType {
    return {
      fields: this.formatFields(fields),
      pagination: this.buildPagination(page, limit, total),
    };
  }
}
