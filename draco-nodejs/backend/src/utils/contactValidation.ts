/**
 * Contact validation utilities for registration processes
 */
import prisma from '../lib/prisma.js';

export type ValidationType = 'streetAddress' | 'dateOfBirth';

export interface ContactValidationInput {
  firstName: string;
  middleName?: string;
  lastName: string;
  validationType: ValidationType;
  streetAddress?: string;
  dateOfBirth?: string; // ISO date string
}

export interface ContactValidationResult {
  success: boolean;
  contact?: {
    id: bigint;
    firstname: string;
    lastname: string;
    middlename: string;
    email: string | null;
    streetaddress: string | null;
    dateofbirth: Date;
    userid: string | null;
  };
  error?: string;
  statusCode?: number;
}

export class ContactValidationService {
  /**
   * Find and validate a contact for registration
   * @param accountId - Account ID to search within
   * @param input - Contact validation input
   * @returns Validation result with contact if found
   */
  static async findAndValidateContact(
    accountId: bigint,
    input: ContactValidationInput,
  ): Promise<ContactValidationResult> {
    const { firstName, middleName, lastName, validationType, streetAddress, dateOfBirth } = input;

    // Validate required fields
    if (!firstName || !lastName) {
      return {
        success: false,
        error: 'First name and last name are required',
        statusCode: 400,
      };
    }

    if (
      validationType === 'streetAddress' &&
      (!streetAddress || streetAddress.trim().length === 0)
    ) {
      return {
        success: false,
        error: 'Street address is required for validation',
        statusCode: 400,
      };
    }

    if (validationType === 'dateOfBirth' && (!dateOfBirth || dateOfBirth.trim().length === 0)) {
      return {
        success: false,
        error: 'Date of birth is required for validation',
        statusCode: 400,
      };
    }

    // Build base query for name matching
    const whereClause: {
      creatoraccountid: bigint;
      userid: null;
      firstname: { equals: string; mode: 'insensitive' };
      lastname: { equals: string; mode: 'insensitive' };
      middlename?: { equals: string; mode: 'insensitive' };
      streetaddress?: { equals: string; mode: 'insensitive' };
      dateofbirth?: Date;
    } = {
      creatoraccountid: accountId,
      userid: null, // Must not be already linked
      firstname: { equals: firstName.trim(), mode: 'insensitive' },
      lastname: { equals: lastName.trim(), mode: 'insensitive' },
    };

    // Add middle name if provided
    if (middleName && middleName.trim().length > 0) {
      whereClause.middlename = { equals: middleName.trim(), mode: 'insensitive' };
    }

    // Add validation field based on type
    if (validationType === 'streetAddress') {
      whereClause.streetaddress = {
        equals: streetAddress!.trim(),
        mode: 'insensitive',
      };
    } else if (validationType === 'dateOfBirth') {
      try {
        const parsedDate = new Date(dateOfBirth!);
        if (isNaN(parsedDate.getTime())) {
          return {
            success: false,
            error: 'Invalid date of birth format',
            statusCode: 400,
          };
        }
        whereClause.dateofbirth = parsedDate;
      } catch (error) {
        return {
          success: false,
          error: 'Invalid date of birth format',
          statusCode: 400,
        };
      }
    }

    try {
      const candidates = await prisma.contacts.findMany({
        where: whereClause,
      });

      if (candidates.length === 0) {
        return {
          success: false,
          error:
            'No contact found matching your information. Please verify your details or contact the administrator.',
          statusCode: 404,
        };
      }

      if (candidates.length > 1) {
        return {
          success: false,
          error: 'Multiple contacts found. Please contact administrator.',
          statusCode: 404,
        };
      }

      const contact = candidates[0];

      // Double-check that contact is not already linked
      if (contact.userid) {
        return {
          success: false,
          error: 'This contact is already registered to another user.',
          statusCode: 409,
        };
      }

      return {
        success: true,
        contact,
      };
    } catch (error) {
      console.error('Error finding contact:', error);
      return {
        success: false,
        error: 'Database error occurred while validating contact',
        statusCode: 500,
      };
    }
  }
}
