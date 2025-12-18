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

  private static normalize(value?: string | null): string | null {
    if (!value) {
      return null;
    }

    const trimmed = value.trim();

    return trimmed.length > 0 ? trimmed : null;
  }

  static formatField(field: dbAvailableField): FieldType {
    return {
      id: field.id.toString(),
      name: field.name,
      hasLights: field.haslights,
      address: this.normalize(field.address),
      city: this.normalize(field.city),
      state: this.normalize(field.state),
      zip: this.normalize(field.zipcode),
      shortName: field.shortname,
      comment: this.normalize(field.comment),
      directions: this.normalize(field.directions),
      rainoutNumber: this.normalize(field.rainoutnumber),
      latitude: this.normalize(field.latitude),
      longitude: this.normalize(field.longitude),
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
