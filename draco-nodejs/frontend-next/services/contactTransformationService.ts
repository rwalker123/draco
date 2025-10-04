import { ContactType, ContactRoleType, ContactDetailsType } from '@draco/shared-schemas';
import { ContactUpdateResponse } from '../types/userManagementTypeGuards';
import { getRoleDisplayName } from '../utils/roleUtils';

// todo: this file will eventually be replaced by a more generic response formatter or by using a library like zod for schema validation and transformation
/**
 * Contact Transformation Service
 * Centralized service for transforming contact data between backend and frontend formats
 * Follows DRY principles by providing shared transformation logic
 */
export class ContactTransformationService {
  /**
   * Transform backend contact data (with flexible field naming) to frontend Contact format
   * Handles both camelCase and lowercase field names from different backend endpoints
   */
  static transformBackendContact(backendContact: Record<string, unknown>): ContactType {
    return {
      id: (backendContact.id as string) || '',
      firstName: (backendContact.firstname as string) || (backendContact.firstName as string) || '',
      lastName: (backendContact.lastname as string) || (backendContact.lastName as string) || '',
      middleName:
        (backendContact.middleName as string) || (backendContact.middlename as string) || '',
      email: (backendContact.email as string) || '',
      userId: (backendContact.userId as string) || '',
      photoUrl: backendContact.photoUrl as string | undefined,
      contactDetails: this.transformContactDetails(backendContact),
      contactroles: (backendContact.contactroles as ContactRoleType[]) || [],
    };
  }

  /**
   * Transform ContactUpdateResponse (backend format) to Contact (frontend format)
   * Used for API responses from contact update/create operations
   */
  static transformContactUpdateResponse(response: ContactUpdateResponse): ContactType {
    return {
      id: response.id,
      firstName: response.firstname,
      lastName: response.lastname,
      middleName: response.middlename || '', // ✅ Use middlename from response
      email: response.email || '',
      userId: '', // Not provided in ContactUpdateResponse
      photoUrl: response.photoUrl || undefined,
      contactDetails: {
        phone1: response.phone1 || '',
        phone2: response.phone2 || '',
        phone3: response.phone3 || '',
        streetAddress: response.streetaddress || '',
        city: response.city || '',
        state: response.state || '',
        zip: response.zip || '',
        dateOfBirth: response.dateofbirth || '',
      },
      contactroles: [], // Not provided in ContactUpdateResponse
    };
  }

  /**
   * Transform Contact to User format
   * Shared transformation logic for converting Contact objects to User objects
   */
  static transformContactToUser(contact: ContactType) {
    const transformedRoles =
      contact.contactroles?.map((cr: ContactRoleType) => ({
        id: cr.id,
        roleId: cr.roleId,
        roleName: cr.roleName || getRoleDisplayName(cr.roleId),
        roleData: cr.roleData,
        contextName: cr.contextName,
      })) || [];

    return {
      id: contact.id,
      firstName: contact.firstName,
      lastName: contact.lastName,
      middleName: contact.middleName,
      email: contact.email,
      userId: contact.userId,
      photoUrl: contact.photoUrl,
      contactDetails: contact.contactDetails,
      roles: transformedRoles,
    };
  }

  /**
   * Helper method to transform contact details from backend format
   * Handles nested contact details from various backend response formats
   */
  private static transformContactDetails(
    backendContact: Record<string, unknown>,
  ): ContactDetailsType {
    // Handle case where contact details are nested in a contactDetails object
    const nestedDetails = backendContact.contactDetails as Record<string, unknown> | undefined;

    if (nestedDetails) {
      return {
        phone1: (nestedDetails.phone1 as string) || '',
        phone2: (nestedDetails.phone2 as string) || '',
        phone3: (nestedDetails.phone3 as string) || '',
        streetAddress: (nestedDetails.streetAddress as string) || '',
        city: (nestedDetails.city as string) || '',
        state: (nestedDetails.state as string) || '',
        zip: (nestedDetails.zip as string) || '',
        dateOfBirth: (nestedDetails.dateOfBirth as string) || '',
      };
    }

    // Handle case where contact details are at the top level
    return {
      phone1: (backendContact.phone1 as string) || '',
      phone2: (backendContact.phone2 as string) || '',
      phone3: (backendContact.phone3 as string) || '',
      streetAddress: (backendContact.streetAddress as string) || '',
      city: (backendContact.city as string) || '',
      state: (backendContact.state as string) || '',
      zip: (backendContact.zip as string) || '',
      dateOfBirth: (backendContact.dateOfBirth as string) || '',
      // ❌ Removed: middlename (moved to top-level middleName)
    };
  }
}
